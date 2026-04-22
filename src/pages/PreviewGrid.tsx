import { useState, useCallback } from 'react';
import type { ImageItem, PageSize, PageOrientation } from '../types';

const filterToCSS = (f?: string) =>
  f === 'magic' ? 'contrast(1.3) brightness(1.1) saturate(0.4)' :
  f === 'gray' ? 'grayscale(1) contrast(1.2)' :
  f === 'bw' ? 'grayscale(1) contrast(3) brightness(1.3)' :
  f === 'color' ? 'contrast(1.2) saturate(1.5) brightness(1.05)' : 'none';

// When rotated 90/270, swap the page aspect ratio for the container
const isSwapped = (rotation?: number) => {
  if (!rotation) return false;
  const r = rotation % 360;
  return r === 90 || r === 270;
};

interface Props {
  images: ImageItem[];
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  onConvert: (name: string) => void;
  onBack: () => void;
  title?: string;
  onTakePhoto?: () => void;
  pageSize?: PageSize;
  pageOrientation?: PageOrientation;
}

export default function PreviewGrid({
  images,
  onConvert, onBack, title, onTakePhoto, pageSize, pageOrientation,
}: Props) {
  const [showNameSheet, setShowNameSheet] = useState(false);
  const [pdfName, setPdfName] = useState('my-document');
  const [missingDialog, setMissingDialog] = useState<{ missing: number; remaining: number } | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const sanitizeName = (name: string) => name.replace(/[/\\:*?"<>|]/g, '_').trim();

  const preCheck = useCallback(() => {
    const missing = 0;
    if (missing > 0) {
      setMissingDialog({ missing, remaining: images.length - missing });
    } else {
      setShowNameSheet(true);
    }
  }, [images.length]);

  const hasPageFrame = !!pageSize && pageSize !== 'Auto';
  const pageAspects: Record<string, number> = {
    A4: 595.28 / 841.89, Letter: 612 / 792, Legal: 612 / 1008,
  };
  const rawAspect = pageSize ? (pageAspects[pageSize] || 1) : 1;
  const pAspect = pageOrientation === 'landscape' && hasPageFrame ? 1 / rawAspect : rawAspect;

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={onBack}>←</button>
        <h1 className="topbar-title">{title || 'Preview'}{images.length > 0 && ` (${images.length})`}</h1>
        <button className="btn-icon" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
          {viewMode === 'grid' ? '☰' : '▦'}
        </button>
      </header>

      {viewMode === 'grid' ? (
        <div className="preview-grid">
          {images.length === 0 && (
            <p style={{width:'100%',textAlign:'center',color:'var(--text2)',padding:'40px 0',fontSize:14}}>No images yet. Add some to get started.</p>
          )}
          {images.map((img, idx) => {
            const swapped = isSwapped(img.rotation);
            const containerAspect = hasPageFrame ? (swapped ? 1 / pAspect : pAspect) : undefined;
            return (
            <div key={img.id} className={`preview-card ${hasPageFrame ? 'preview-card-paged' : ''}`} style={hasPageFrame ? { aspectRatio: `${containerAspect}`, background: '#fff' } : undefined}>
              <img src={img.url} alt={img.name} style={{
                ...(img.rotation ? {transform: `rotate(${img.rotation}deg)`, ...(swapped ? {maxWidth: '100%', maxHeight: '100%'} : {})} : {}),
                ...(hasPageFrame ? { objectFit: 'contain' as const, width: '100%', height: '100%' } : {}),
                filter: filterToCSS(img.filter),
              }} />
              <span className="card-index">{idx + 1}</span>
            </div>
            );
          })}
          {onTakePhoto && (
            <button className="add-card preview-add-card" onClick={onTakePhoto}>
              <span className="add-icon">📷</span>
              <span>Scan</span>
            </button>
          )}
        </div>
      ) : (
        <div className="preview-list">
          {images.length === 0 && (
            <p style={{textAlign:'center',color:'var(--text2)',padding:'40px 0',fontSize:14}}>No images yet. Add some to get started.</p>
          )}
          {images.map((img, idx) => {
            const swapped = isSwapped(img.rotation);
            const containerAspect = hasPageFrame ? (swapped ? 1 / pAspect : pAspect) : undefined;
            return (
            <div key={img.id} className="preview-list-item" style={hasPageFrame ? { aspectRatio: `${containerAspect}` } : undefined}>
              <div className={`preview-list-img-wrap ${hasPageFrame ? 'preview-list-paged' : ''}`} style={hasPageFrame ? { background: '#fff' } : undefined}>
                <img src={img.url} alt={img.name} style={{
                  ...(img.rotation ? {transform: `rotate(${img.rotation}deg)`} : {}),
                  ...(hasPageFrame ? { objectFit: 'contain' as const } : {}),
                  filter: filterToCSS(img.filter),
                }} />
              </div>
              <span className="preview-list-page-num">{idx + 1}</span>
            </div>
            );
          })}
        </div>
      )}

      <div className="bottom-bar" style={{ flexDirection: 'column', gap: 8 }}>
        <button className="btn-primary btn-confirm-full" onClick={preCheck} disabled={images.length === 0}>Convert</button>
      </div>

      {/* Missing images dialog */}
      {missingDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Missing Images Detected</h2>
            <p>
              {missingDialog.missing} of your selected images are no longer available.
              Do you want to proceed with the remaining {missingDialog.remaining} images?
            </p>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setMissingDialog(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => { setMissingDialog(null); setShowNameSheet(true); }}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Name & settings bottom sheet */}
      {showNameSheet && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowNameSheet(false)} />
          <div className="bottom-sheet">
            <h2>Convert to PDF</h2>
            <div className="bar-group" style={{marginBottom:16}}>
              <label className="bar-label">File Name</label>
              <input
                type="text"
                className="folder-dropdown"
                style={{flex:1}}
                value={pdfName}
                onChange={(e) => setPdfName(e.target.value)}
                placeholder="Enter file name"
                autoFocus
                ref={(el) => { if (el) setTimeout(() => el.focus(), 100); }}
                inputMode="text"
                enterKeyHint="done"
                onKeyDown={(e) => { if (e.key === 'Enter' && pdfName.trim()) onConvert(sanitizeName(pdfName)); }}
              />
            </div>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setShowNameSheet(false)}>Cancel</button>
              <button className="btn-primary" disabled={!pdfName.trim()} onClick={() => onConvert(sanitizeName(pdfName))}>Convert</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
