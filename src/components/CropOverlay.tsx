import { useState, useRef, useCallback, useEffect } from 'react';
import { isOpenCVReady } from '../utils/documentDetector';

declare const cv: any;

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
  onApply: (rect: { x: number; y: number; w: number; h: number }) => void;
  onCancel: () => void;
}

type Point = { x: number; y: number };

export default function CropOverlay({ containerRef, onApply, onCancel }: Props) {
  const [points, setPoints] = useState<Point[]>([]);
  const dragging = useRef<number | null>(null);
  const canUsePerspective = isOpenCVReady();

  useEffect(() => {
    if (!containerRef.current) return;
    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) return;
    const cRect = canvas.getBoundingClientRect();
    const pRect = containerRef.current.getBoundingClientRect();
    const offX = cRect.left - pRect.left;
    const offY = cRect.top - pRect.top;
    const w = cRect.width;
    const h = cRect.height;
    // Default: 4 corners at image edges
    const inset = 0;
    setPoints([
      { x: offX + w * inset, y: offY + h * inset },
      { x: offX + w * (1 - inset), y: offY + h * inset },
      { x: offX + w * (1 - inset), y: offY + h * (1 - inset) },
      { x: offX + w * inset, y: offY + h * (1 - inset) },
    ]);
  }, [containerRef]);

  const handlePointerDown = useCallback((idx: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = idx;
  }, []);

  // idx 0-3 = corners, 4-7 = edge midpoints (top, right, bottom, left)
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragging.current === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const clampX = Math.max(0, Math.min(rect.width, x));
    const clampY = Math.max(0, Math.min(rect.height, y));

    setPoints((prev) => {
      const next = [...prev];
      const idx = dragging.current!;
      if (idx < 4) {
        // Corner drag
        next[idx] = { x: clampX, y: clampY };
      } else {
        // Edge midpoint drag — move both corners of that edge
        const edgeIdx = idx - 4; // 0=top, 1=right, 2=bottom, 3=left
        const edges = [[0,1],[1,2],[2,3],[3,0]];
        const [a, b] = edges[edgeIdx];
        const dx = clampX - (prev[a].x + prev[b].x) / 2;
        const dy = clampY - (prev[a].y + prev[b].y) / 2;
        if (edgeIdx === 0 || edgeIdx === 2) {
          // Top/bottom edge: move vertically
          next[a] = { x: prev[a].x, y: prev[a].y + dy };
          next[b] = { x: prev[b].x, y: prev[b].y + dy };
        } else {
          // Left/right edge: move horizontally
          next[a] = { x: prev[a].x + dx, y: prev[a].y };
          next[b] = { x: prev[b].x + dx, y: prev[b].y };
        }
      }
      return next;
    });
  }, [containerRef]);

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  const handleApply = () => {
    if (!containerRef.current) return;
    const canvas = containerRef.current.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const cRect = canvas.getBoundingClientRect();
    const pRect = containerRef.current.getBoundingClientRect();
    const offX = cRect.left - pRect.left;
    const offY = cRect.top - pRect.top;
    const scaleX = canvas.width / cRect.width;
    const scaleY = canvas.height / cRect.height;

    // Convert display points to canvas pixel coords
    const canvasPoints: [number, number][] = points.map((p) => [
      (p.x - offX) * scaleX,
      (p.y - offY) * scaleY,
    ]);

    if (canUsePerspective) {
      // Use OpenCV perspective transform
      try {
        const src = cv.imread(canvas);
        const [tl, tr, br, bl] = canvasPoints;
        const wT = Math.hypot(tr[0] - tl[0], tr[1] - tl[1]);
        const wB = Math.hypot(br[0] - bl[0], br[1] - bl[1]);
        const maxW = Math.round(Math.max(wT, wB));
        const hL = Math.hypot(bl[0] - tl[0], bl[1] - tl[1]);
        const hR = Math.hypot(br[0] - tr[0], br[1] - tr[1]);
        const maxH = Math.round(Math.max(hL, hR));
        const srcPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
          tl[0], tl[1], tr[0], tr[1], br[0], br[1], bl[0], bl[1],
        ]);
        const dstPts = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0, 0, maxW, 0, maxW, maxH, 0, maxH,
        ]);
        const M = cv.getPerspectiveTransform(srcPts, dstPts);
        const dst = new cv.Mat();
        cv.warpPerspective(src, dst, M, new cv.Size(maxW, maxH));
        const outCanvas = document.createElement('canvas');
        outCanvas.width = maxW;
        outCanvas.height = maxH;
        cv.imshow(outCanvas, dst);
        src.delete(); dst.delete(); M.delete(); srcPts.delete(); dstPts.delete();

        // Convert to blob and pass back as a crop result
        outCanvas.toBlob((blob) => {
          if (!blob) return;
          // Emit a special crop rect that signals perspective crop was done
          // We pass the blob URL through a custom event on the container
          const url = URL.createObjectURL(blob);
          const event = new CustomEvent('perspectiveCrop', { detail: { url, w: maxW, h: maxH } });
          containerRef.current?.dispatchEvent(event);
        }, 'image/png');
        return;
      } catch (e) {
        console.error('Perspective crop failed, falling back:', e);
      }
    }

    // Fallback: simple rectangular crop using bounding box
    const xs = canvasPoints.map((p) => p[0]);
    const ys = canvasPoints.map((p) => p[1]);
    const minX = Math.max(0, Math.min(...xs));
    const minY = Math.max(0, Math.min(...ys));
    const maxX = Math.min(canvas.width, Math.max(...xs));
    const maxY = Math.min(canvas.height, Math.max(...ys));
    onApply({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
  };

  if (points.length < 4) return null;

  return (
    <div
      className="crop-container"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Dimmed area outside polygon */}
      <svg className="crop-dim-svg" width="100%" height="100%">
        <defs>
          <mask id="cropMask">
            <rect width="100%" height="100%" fill="white" />
            <polygon points={points.map((p) => `${p.x},${p.y}`).join(' ')} fill="black" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#cropMask)" />
      </svg>

      {/* Polygon border with grid */}
      <svg className="crop-lines-svg" width="100%" height="100%">
        <polygon
          points={points.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke="#fff"
          strokeWidth="2"
        />
        {/* Grid lines: thirds */}
        {[1, 2].map((i) => {
          const t = i / 3;
          const left = { x: points[0].x + (points[3].x - points[0].x) * t, y: points[0].y + (points[3].y - points[0].y) * t };
          const right = { x: points[1].x + (points[2].x - points[1].x) * t, y: points[1].y + (points[2].y - points[1].y) * t };
          const top = { x: points[0].x + (points[1].x - points[0].x) * t, y: points[0].y + (points[1].y - points[0].y) * t };
          const bottom = { x: points[3].x + (points[2].x - points[3].x) * t, y: points[3].y + (points[2].y - points[3].y) * t };
          return (
            <g key={i}>
              <line x1={left.x} y1={left.y} x2={right.x} y2={right.y} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <line x1={top.x} y1={top.y} x2={bottom.x} y2={bottom.y} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
            </g>
          );
        })}
      </svg>

      {/* Corner handles */}
      {points.map((p, i) => (
        <div
          key={i}
          className="crop-corner-handle"
          style={{ left: p.x, top: p.y }}
          onPointerDown={(e) => handlePointerDown(i, e)}
        />
      ))}

      {/* Edge midpoint handles */}
      {[[0,1],[1,2],[2,3],[3,0]].map(([a, b], i) => (
        <div
          key={`mid-${i}`}
          className="crop-edge-handle"
          style={{
            left: (points[a].x + points[b].x) / 2,
            top: (points[a].y + points[b].y) / 2,
          }}
          onPointerDown={(e) => handlePointerDown(i + 4, e)}
        />
      ))}

      {/* Action buttons */}
      <div className="crop-actions">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={handleApply}>
          Apply
        </button>
      </div>
    </div>
  );
}
