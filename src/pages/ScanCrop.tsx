import { useState, useRef, useCallback } from 'react';
import type { ImageItem } from '../types';

interface Props {
  image: ImageItem;
  onApply: () => void;
  onBack: () => void;
}

interface Point { x: number; y: number; }

export default function ScanCrop({ image, onApply, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [points, setPoints] = useState<Point[]>([
    { x: 10, y: 10 },
    { x: 90, y: 10 },
    { x: 90, y: 90 },
    { x: 10, y: 90 },
  ]);
  const dragging = useRef<number | null>(null);

  const handlePointerDown = useCallback((idx: number, e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragging.current = idx;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragging.current === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPoints((prev) => {
      const next = [...prev];
      next[dragging.current!] = {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
      return next;
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  const polygonPath = points.map((p) => `${p.x}% ${p.y}%`).join(', ');

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={onBack}>←</button>
        <h1 className="topbar-title">Adjust Corners</h1>
        <button className="btn-primary" onClick={onApply}>Apply</button>
      </header>

      <div
        className="scan-crop-body"
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <img src={image.url} alt="scan" className="scan-crop-img" />
        {/* Dimmed overlay with polygon cutout */}
        <div
          className="scan-crop-overlay"
          style={{ clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ${polygonPath}, ${points[0].x}% ${points[0].y}%)` }}
        />
        {/* Border lines */}
        <svg className="scan-crop-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon
            points={points.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#6c5ce7"
            strokeWidth="0.5"
          />
        </svg>
        {/* Draggable corner points */}
        {points.map((p, i) => (
          <div
            key={i}
            className="scan-crop-point"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            onPointerDown={(e) => handlePointerDown(i, e)}
          />
        ))}
      </div>
    </div>
  );
}
