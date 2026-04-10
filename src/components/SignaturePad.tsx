import { useRef, useState, useCallback } from 'react';

interface Props {
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

const FONTS = [
  { name: 'Elegant', css: "'Dancing Script', cursive" },
  { name: 'Casual', css: "'Caveat', cursive" },
  { name: 'Formal', css: "'Great Vibes', cursive" },
  { name: 'Classic', css: "'Sacramento', cursive" },
  { name: 'Relaxed', css: "'Indie Flower', cursive" },
];

type Tab = 'draw' | 'type';

export default function SignaturePad({ onConfirm, onCancel }: Props) {
  const [tab, setTab] = useState<Tab>('draw');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [color, setColor] = useState('#000000');
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Type tab state
  const [typedName, setTypedName] = useState('');
  const [fontIdx, setFontIdx] = useState(0);

  const getPos = (e: React.PointerEvent): { x: number; y: number } => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDrawing(true);
    setHasDrawn(true);
    lastPos.current = getPos(e);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawing || !canvasRef.current || !lastPos.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }, [drawing, color]);

  const handlePointerUp = useCallback(() => {
    setDrawing(false);
    lastPos.current = null;
  }, []);

  const handleClear = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawn(false);
  };

  const trimCanvas = (canvas: HTMLCanvasElement): string | null => {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;
    let minX = width, minY = height, maxX = 0, maxY = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] > 0) {
          minX = Math.min(minX, x); minY = Math.min(minY, y);
          maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
        }
      }
    }
    if (maxX <= minX || maxY <= minY) return null;
    const pad = 10;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(width, maxX + pad); maxY = Math.min(height, maxY + pad);
    const trimmed = document.createElement('canvas');
    trimmed.width = maxX - minX; trimmed.height = maxY - minY;
    trimmed.getContext('2d')!.drawImage(canvas, minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
    return trimmed.toDataURL('image/png');
  };

  const handleDrawConfirm = () => {
    if (!canvasRef.current) return;
    const url = trimCanvas(canvasRef.current);
    if (url) onConfirm(url);
  };

  const handleTypeConfirm = () => {
    if (!typedName.trim()) return;
    const canvas = document.createElement('canvas');
    const fontSize = 64;
    const font = FONTS[fontIdx].css;
    canvas.width = 600; canvas.height = 120;
    const ctx = canvas.getContext('2d')!;
    ctx.font = `${fontSize}px ${font}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, 20, canvas.height / 2);
    const url = trimCanvas(canvas);
    if (url) onConfirm(url);
  };

  const initCanvas = useCallback((el: HTMLCanvasElement | null) => {
    if (!el) return;
    (canvasRef as any).current = el;
    const rect = el.getBoundingClientRect();
    el.width = rect.width * 2; el.height = rect.height * 2;
    el.getContext('2d')!.scale(2, 2);
  }, []);

  const canConfirm = tab === 'draw' ? hasDrawn : typedName.trim().length > 0;

  return (
    <div className="dialog-overlay" style={{ zIndex: 200 }}>
      <div className="signature-pad-dialog">
        <div className="sig-tabs">
          <button className={`sig-tab ${tab === 'draw' ? 'active' : ''}`} onClick={() => setTab('draw')}>Draw</button>
          <button className={`sig-tab ${tab === 'type' ? 'active' : ''}`} onClick={() => setTab('type')}>Type</button>
        </div>

        {tab === 'draw' && (
          <>
            <canvas
              ref={initCanvas}
              className="signature-canvas"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
            <div className="signature-colors">
              {['#000000', '#0000FF', '#FF0000'].map((c) => (
                <button key={c} className={`watermark-color ${color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
              ))}
              <button className="btn-text" style={{ marginLeft: 'auto' }} onClick={handleClear}>Clear</button>
            </div>
          </>
        )}

        {tab === 'type' && (
          <>
            <input
              type="text"
              className="watermark-input"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Your name"
              autoFocus
              style={{ marginBottom: 10 }}
            />
            <div className="sig-type-preview" style={{ fontFamily: FONTS[fontIdx].css, color }}>
              {typedName || 'Preview'}
            </div>
            <div className="sig-font-options">
              {FONTS.map((f, i) => (
                <button key={f.name} className={`sig-font-btn ${fontIdx === i ? 'active' : ''}`} style={{ fontFamily: f.css }} onClick={() => setFontIdx(i)}>
                  {typedName || 'Abc'}
                </button>
              ))}
            </div>
            <div className="signature-colors" style={{ marginTop: 8 }}>
              {['#000000', '#0000FF', '#FF0000'].map((c) => (
                <button key={c} className={`watermark-color ${color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </>
        )}

        <div className="dialog-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn-primary" disabled={!canConfirm} onClick={tab === 'draw' ? handleDrawConfirm : handleTypeConfirm}>Done</button>
        </div>
      </div>
    </div>
  );
}
