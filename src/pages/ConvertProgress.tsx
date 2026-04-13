import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import type { ImageItem, PageSize, PageOrientation, FillMode, Margin } from '../types';

interface Props {
  images: ImageItem[];
  pageSize: PageSize;
  pageOrientation: PageOrientation;
  defaultFillMode: FillMode;
  defaultMargin: Margin;
  pdfName: string;
  onComplete: (blob: Blob) => void;
  onCancel?: () => void;
  cancelTitle?: string;
  cancelMessage?: string;
}

function getPageDimensions(size: PageSize): [number, number] {
  switch (size) {
    case 'A4': return [595.28, 841.89];
    case 'Letter': return [612, 792];
    case 'Legal': return [612, 1008];
    default: return [0, 0]; // Auto
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const timeout = setTimeout(() => reject(new Error('Image load timeout')), 10000);
    img.onload = () => { clearTimeout(timeout); resolve(img); };
    img.onerror = () => { clearTimeout(timeout); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

function getRotatedCanvas(img: HTMLImageElement, rotation: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const rot = rotation % 360;
  const swap = rot === 90 || rot === 270;
  canvas.width = swap ? img.height : img.width;
  canvas.height = swap ? img.width : img.height;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  return canvas;
}

export default function ConvertProgress({ images, pageSize, pageOrientation, defaultFillMode, defaultMargin, pdfName, onComplete, onCancel, cancelTitle, cancelMessage }: Props) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [showCancel, setShowCancel] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function generate() {
      const isAuto = pageSize === 'Auto';
      const [stdW, stdH] = getPageDimensions(pageSize);

      // Pre-load all images
      const loaded: { canvas: HTMLCanvasElement; dataUrl: string }[] = [];
      for (let i = 0; i < images.length; i++) {
        if (cancelled) return;
        try {
          const img = await loadImage(images[i].url);
          const canvas = getRotatedCanvas(img, images[i].rotation);
          loaded.push({ canvas, dataUrl: canvas.toDataURL('image/jpeg', 0.92) });
        } catch {
          // skip
        }
        setProgress(Math.round(((i + 1) / images.length) * 50));
      }

      if (loaded.length === 0 || cancelled) return;

      // Auto: unify page width = max image width across all images
      const autoPageW = Math.max(...loaded.map((l) => l.canvas.width));

      let doc: jsPDF | null = null;

      for (let i = 0; i < loaded.length; i++) {
        if (cancelled) return;
        const { canvas, dataUrl } = loaded[i];
        const cw = canvas.width;
        const ch = canvas.height;

        if (isAuto) {
          const imgMargin = images[i]?.margin ?? defaultMargin;
          const marginPt = imgMargin === 'Large' ? 36 : imgMargin === 'Small' ? 18 : 0;
          // Auto: unified width + margin support
          const scale = autoPageW / cw;
          const imgW = autoPageW;
          const imgH = Math.round(ch * scale);
          const pageW = imgW + marginPt * 2;
          const pageH = imgH + marginPt * 2;
          const shorter = Math.min(pageW, pageH);
          const longer = Math.max(pageW, pageH);
          const orient = pageW >= pageH ? 'landscape' : 'portrait';

          if (!doc) {
            doc = new jsPDF({ orientation: orient, unit: 'pt', format: [shorter, longer] });
          } else {
            doc.addPage([shorter, longer], orient);
          }
          doc.addImage(dataUrl, 'JPEG', marginPt, marginPt, imgW, imgH);
        } else {
          // Fixed page size — per-image layout settings
          const imgFillMode = images[i]?.fillMode ?? defaultFillMode;
          const imgMargin = images[i]?.margin ?? defaultMargin;
          const marginPt = imgMargin === 'Large' ? 36 : imgMargin === 'Small' ? 18 : 0;

          // Fixed page size with orientation support
          const [dimW, dimH] = getPageDimensions(pageSize);
          const shorter = Math.min(dimW, dimH);
          const longer = Math.max(dimW, dimH);
          const orient = pageOrientation === 'landscape' ? 'landscape' : 'portrait';
          const pw = orient === 'landscape' ? longer : shorter;
          const ph = orient === 'landscape' ? shorter : longer;

          if (!doc) {
            doc = new jsPDF({ orientation: orient, unit: 'pt', format: [shorter, longer] });
          } else {
            doc.addPage([shorter, longer], orient);
          }

          const availW = pw - marginPt * 2;
          const availH = ph - marginPt * 2;
          const scale = imgFillMode === 'fill'
            ? Math.max(availW / cw, availH / ch)
            : imgFillMode === 'stretch' ? 1 : Math.min(availW / cw, availH / ch);
          const imgW = imgFillMode === 'stretch' ? availW : cw * scale;
          const imgH = imgFillMode === 'stretch' ? availH : ch * scale;
          const x = marginPt + (availW - imgW) / 2;
          const y = marginPt + (availH - imgH) / 2;
          doc.addImage(dataUrl, 'JPEG', x, y, imgW, imgH);
        }

        setProgress(50 + Math.round(((i + 1) / loaded.length) * 50));
      }

      if (!cancelled && doc) {
        const blob = doc.output('blob');
        setDone(true);
        setTimeout(() => {
          if (!cancelled) onComplete(blob);
        }, 800);
      }
    }

    generate();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page center-page">
      {onCancel && !done && (
        <header className="topbar" style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'transparent', borderBottom: 'none' }}>
          <button className="btn-icon" onClick={() => setShowCancel(true)}>←</button>
        </header>
      )}
      <div className="progress-wrap">
        <div className="progress-ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" className="ring-bg" />
            <circle
              cx="60" cy="60" r="52"
              className={done ? 'ring-done' : 'ring-fg'}
              strokeDasharray={`${(progress / 100) * 327} 327`}
            />
          </svg>
          <span className="progress-text">{done ? '✓' : `${progress}%`}</span>
        </div>
        <p className="progress-label">
          {done ? 'Done!' : `Creating "${pdfName}.pdf"...`}
        </p>
      </div>
      {showCancel && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>{cancelTitle || 'Quit converting?'}</h2>
            <p>{cancelMessage || 'Are you sure you want to quit and discard the changes?'}</p>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setShowCancel(false)}>Cancel</button>
              <button className="btn-danger" onClick={onCancel}>Quit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
