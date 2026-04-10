declare const cv: any;

export interface DetectedRect {
  points: [number, number][];
}

export function isOpenCVReady(): boolean {
  try { return typeof cv !== 'undefined' && typeof cv.Mat === 'function'; }
  catch { return false; }
}

const PW = 240; // very small for speed
let prevPoints: [number, number][] | null = null;
let stableCount = 0;

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function smoothPoints(newPts: [number, number][], alpha: number): [number, number][] {
  if (!prevPoints) return newPts;
  return newPts.map((p, i) => [
    lerp(prevPoints![i][0], p[0], alpha),
    lerp(prevPoints![i][1], p[1], alpha),
  ] as [number, number]);
}

function isConvex(pts: [number, number][]): boolean {
  const n = pts.length;
  let sign = 0;
  for (let i = 0; i < n; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % n];
    const [x3, y3] = pts[(i + 2) % n];
    const cross = (x2 - x1) * (y3 - y2) - (y2 - y1) * (x3 - x2);
    if (cross !== 0) {
      if (sign === 0) sign = cross > 0 ? 1 : -1;
      else if ((cross > 0 ? 1 : -1) !== sign) return false;
    }
  }
  return true;
}

function minAngle(pts: [number, number][]): number {
  let minA = Infinity;
  for (let i = 0; i < 4; i++) {
    const a = pts[i], b = pts[(i + 1) % 4], c = pts[(i + 2) % 4];
    const v1 = [a[0] - b[0], a[1] - b[1]];
    const v2 = [c[0] - b[0], c[1] - b[1]];
    const dot = v1[0] * v2[0] + v1[1] * v2[1];
    const m1 = Math.hypot(v1[0], v1[1]);
    const m2 = Math.hypot(v2[0], v2[1]);
    if (m1 > 0 && m2 > 0) {
      const angle = Math.acos(Math.min(1, Math.max(-1, dot / (m1 * m2)))) * 180 / Math.PI;
      minA = Math.min(minA, angle);
    }
  }
  return minA;
}

export function detectDocument(videoEl: HTMLVideoElement): DetectedRect | null {
  if (!isOpenCVReady() || videoEl.videoWidth === 0) return null;
  let src: any = null;
  try {
    const vw = videoEl.videoWidth, vh = videoEl.videoHeight;
    const scale = PW / vw;
    const ph = Math.round(vh * scale);
    const canvas = document.createElement('canvas');
    canvas.width = PW; canvas.height = ph;
    canvas.getContext('2d')!.drawImage(videoEl, 0, 0, PW, ph);
    src = cv.imread(canvas);

    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // Adaptive threshold + morphology for better edge detection
    const thresh = new cv.Mat();
    cv.adaptiveThreshold(gray, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
    const edges = new cv.Mat();
    cv.Canny(gray, edges, 20, 60);
    const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    cv.dilate(edges, edges, kernel);
    cv.dilate(edges, edges, kernel);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    let bestRect: DetectedRect | null = null;
    let maxArea = (src.rows * src.cols) * 0.04;

    // Collect all candidates, pick best
    const candidates: { pts: [number, number][]; area: number }[] = [];

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const peri = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(contour, approx, 0.05 * peri, true);
      if (approx.rows === 4) {
        const area = Math.abs(cv.contourArea(approx));
        if (area > maxArea) {
          const pts: [number, number][] = [];
          for (let j = 0; j < 4; j++) {
            pts.push([approx.data32S[j * 2] / scale, approx.data32S[j * 2 + 1] / scale]);
          }
          const sorted = sortCorners(pts);
          // Quality checks
          if (isConvex(sorted) && minAngle(sorted) > 40) {
            candidates.push({ pts: sorted, area });
          }
        }
      }
      approx.delete();
    }

    // Pick largest valid candidate
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.area - a.area);
      const best = candidates[0];
      const smoothed = smoothPoints(best.pts, 0.4);
      prevPoints = smoothed;
      stableCount++;
      bestRect = { points: smoothed };
    } else {
      stableCount = 0;
      // Fade out smoothly
      if (prevPoints && stableCount < 3) {
        bestRect = { points: prevPoints };
      } else {
        prevPoints = null;
      }
    }

    gray.delete(); thresh.delete(); edges.delete();
    kernel.delete(); contours.delete(); hierarchy.delete(); src.delete();
    return bestRect;
  } catch (e) { console.error('CV:', e); if (src) src.delete(); return null; }
}

function sortCorners(pts: [number, number][]): [number, number][] {
  // Center point
  const cx = pts.reduce((s, p) => s + p[0], 0) / 4;
  const cy = pts.reduce((s, p) => s + p[1], 0) / 4;
  // Sort by angle from center
  const withAngle = pts.map(p => ({ p, a: Math.atan2(p[1] - cy, p[0] - cx) }));
  withAngle.sort((a, b) => a.a - b.a);
  // Find top-left (smallest x+y sum)
  let tlIdx = 0;
  let minSum = Infinity;
  for (let i = 0; i < 4; i++) {
    const s = withAngle[i].p[0] + withAngle[i].p[1];
    if (s < minSum) { minSum = s; tlIdx = i; }
  }
  // Rotate so TL is first
  const result: [number, number][] = [];
  for (let i = 0; i < 4; i++) {
    result.push(withAngle[(tlIdx + i) % 4].p);
  }
  return result;
}

export function cropPerspective(videoEl: HTMLVideoElement, points: [number, number][]): string | null {
  if (!isOpenCVReady()) return null;
  let src: any = null;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth; canvas.height = videoEl.videoHeight;
    canvas.getContext('2d')!.drawImage(videoEl, 0, 0);
    src = cv.imread(canvas);
    const [tl, tr, br, bl] = points;
    const wT = Math.hypot(tr[0]-tl[0], tr[1]-tl[1]);
    const wB = Math.hypot(br[0]-bl[0], br[1]-bl[1]);
    const maxW = Math.round(Math.max(wT, wB));
    const hL = Math.hypot(bl[0]-tl[0], bl[1]-tl[1]);
    const hR = Math.hypot(br[0]-tr[0], br[1]-tr[1]);
    const maxH = Math.round(Math.max(hL, hR));
    const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [tl[0],tl[1],tr[0],tr[1],br[0],br[1],bl[0],bl[1]]);
    const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [0,0,maxW,0,maxW,maxH,0,maxH]);
    const M = cv.getPerspectiveTransform(srcPts, dstPts);
    const dst = new cv.Mat();
    cv.warpPerspective(src, dst, M, new cv.Size(maxW, maxH));
    const out = document.createElement('canvas');
    out.width = maxW; out.height = maxH;
    cv.imshow(out, dst);
    src.delete(); dst.delete(); M.delete(); srcPts.delete(); dstPts.delete();
    return out.toDataURL('image/jpeg', 0.92);
  } catch (e) { console.error('CV crop:', e); if (src) src.delete(); return null; }
}
