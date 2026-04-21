import { useState, useRef, useEffect, useCallback } from 'react';
import type { ImageItem, PageSize, PageOrientation, FillMode, Margin } from '../types';
import CropOverlay from '../components/CropOverlay';

interface Props {
  images: ImageItem[];
  currentIndex: number;
  setCurrentIndex: (i: number) => void;
  updateImage: (id: string, patch: Partial<ImageItem>) => void;
  removeImage: (id: string) => void;
  addImages: (files: File[]) => void;
  onDone: () => void;
  onBack: () => void;
  onQuit?: () => void;
  onRetake?: () => void;
  onAddImage?: () => void;
  onScan?: () => void;
  onReorder?: () => void;
  pageSize?: PageSize;
  setPageSize?: (s: PageSize) => void;
  pageOrientation?: PageOrientation;
  setPageOrientation?: (o: PageOrientation) => void;
  defaultFillMode?: FillMode;
  defaultMargin?: Margin;
  onDefaultsChange?: (defaults: { fillMode?: FillMode; margin?: Margin }) => void;
}

export default function ImageEditor({
  images, currentIndex, setCurrentIndex,
  updateImage, removeImage, addImages, onDone, onBack, onQuit, onRetake: _onRetake, onAddImage, onScan, onReorder,
  pageSize, setPageSize, pageOrientation, setPageOrientation, defaultFillMode = 'fit', defaultMargin = 'None', onDefaultsChange,
}: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState('original');
  const [applyToAll, setApplyToAll] = useState(false);
  const [showLayoutSheet, setShowLayoutSheet] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [applyOptionsToAll, setApplyOptionsToAll] = useState(false);

  const closeAllSheets = () => { setShowFilter(false); setShowLayoutSheet(false); setShowOptionsSheet(false); setShowAddSheet(false); };
  const cameraRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const thumbScrollRef = useRef<HTMLDivElement>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const img = images[currentIndex];

  // Auto-scroll thumbnail into view
  useEffect(() => {
    if (!thumbScrollRef.current) return;
    const active = thumbScrollRef.current.children[currentIndex] as HTMLElement;
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentIndex]);

  const drawImage = useCallback(() => {
    if (!img || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const image = new Image();
    if (img.url.startsWith('http')) image.crossOrigin = 'anonymous';
    image.onload = () => {
      const rot = img.rotation % 360;
      const swap = rot === 90 || rot === 270;
      canvas.width = swap ? image.height : image.width;
      canvas.height = swap ? image.width : image.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(image, -image.width / 2, -image.height / 2);
      ctx.restore();
      try {
        setPreviewUrl(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        // tainted canvas (cross-origin), use original url as fallback
        setPreviewUrl(img.url);
      }
    };
    image.src = img.url;
  }, [img]);

  useEffect(() => { drawImage(); }, [drawImage]);

  if (!img) { onBack(); return null; }

  // Per-image values with global defaults
  const fillMode = img.fillMode ?? defaultFillMode;
  const margin = img.margin ?? defaultMargin;

  const setFillMode = (f: FillMode) => {
    updateImage(img.id, { fillMode: f });
    if (applyOptionsToAll) {
      images.forEach((i) => i.id !== img.id && updateImage(i.id, { fillMode: f }));
      onDefaultsChange?.({ fillMode: f });
    }
  };
  const setMargin = (m: Margin) => {
    updateImage(img.id, { margin: m });
    if (applyOptionsToAll) {
      images.forEach((i) => i.id !== img.id && updateImage(i.id, { margin: m }));
      onDefaultsChange?.({ margin: m });
    }
  };

  const handleRotate = () => {
    updateImage(img.id, { rotation: (img.rotation + 90) % 360 });
  };

  const handleRemove = () => setShowConfirm(true);
  const confirmRemove = () => {
    setShowConfirm(false);
    removeImage(img.id);
    if (currentIndex >= images.length - 1) setCurrentIndex(Math.max(0, currentIndex - 1));
    if (images.length <= 1) onBack();
  };

  const handleCameraFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length) addImages(files);
    e.target.value = '';
  };

  const handleCropApply = (cropRect: { x: number; y: number; w: number; h: number }) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    const newCanvas = document.createElement('canvas');
    newCanvas.width = cropRect.w;
    newCanvas.height = cropRect.h;
    newCanvas.getContext('2d')!.putImageData(imageData, 0, 0);
    newCanvas.toBlob((blob) => {
      if (!blob) return;
      const newUrl = URL.createObjectURL(blob);
      updateImage(img.id, { url: newUrl, width: cropRect.w, height: cropRect.h, rotation: 0 });
      setCropping(false);
    }, 'image/png');
  };

  // Handle perspective crop from OpenCV
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.url) {
        updateImage(img.id, { url: detail.url, width: detail.w, height: detail.h, rotation: 0 });
        setCropping(false);
      }
    };
    el.addEventListener('perspectiveCrop', handler);
    return () => el.removeEventListener('perspectiveCrop', handler);
  });

  // PDF page preview dimensions
  const showPageFrame = !!pageSize && pageSize !== 'Auto' && !cropping;
  const marginPx = margin === 'Large' ? 24 : margin === 'Small' ? 12 : 0;
  const isLandscape = pageOrientation === 'landscape';
  const pageAspects: Record<string, number> = {
    A4: 595.28 / 841.89, Letter: 612 / 792, Legal: 612 / 1008,
  };
  const rawAspect = pageSize ? (pageAspects[pageSize] || 1) : 1;
  const pageAspect = isLandscape && pageSize !== 'Auto' ? 1 / rawAspect : rawAspect;

  const filterStyle = activeFilter === 'magic' ? 'contrast(1.3) brightness(1.1) saturate(0.4)' :
    activeFilter === 'gray' ? 'grayscale(1) contrast(1.2)' :
    activeFilter === 'bw' ? 'grayscale(1) contrast(3) brightness(1.3)' :
    activeFilter === 'color' ? 'contrast(1.2) saturate(1.5) brightness(1.05)' : 'none';

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={() => onQuit ? setShowQuitDialog(true) : onBack()}>←</button>
        <h1 className="topbar-title">Edit</h1>
        <button className="btn-primary" onClick={onDone}>Done</button>
      </header>

      <div className="editor-canvas-wrap" ref={wrapRef}>
        {/* Canvas always in DOM for crop; hidden when page frame preview is ready */}
        <canvas
          ref={canvasRef}
          className="editor-canvas"
          style={{
            filter: filterStyle,
            ...((showPageFrame && previewUrl) ? { position: 'absolute' as const, opacity: 0, pointerEvents: 'none' as const } : {}),
            ...((!showPageFrame && marginPx > 0 && previewUrl && !cropping) ? { position: 'absolute' as const, opacity: 0, pointerEvents: 'none' as const } : {}),
          }}
        />

        {/* Fit mode with margin: show image with inner padding */}
        {!showPageFrame && marginPx > 0 && !cropping && previewUrl && (
          <div style={{ position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '100%', maxHeight: '100%' }}>
            <div style={{ background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.15)', padding: marginPx, display: 'inline-flex' }}>
              <img
                src={previewUrl}
                alt=""
                style={{ maxWidth: `calc(75vw - ${marginPx * 2}px)`, maxHeight: `calc(60vh - ${marginPx * 2}px)`, objectFit: 'contain', filter: filterStyle, display: 'block' }}
              />
            </div>
          </div>
        )}

        {/* Page frame preview */}
        {showPageFrame && previewUrl && (
          <div className="editor-page-frame" style={{ aspectRatio: `${pageAspect}` }}>
            <img
              src={previewUrl}
              alt=""
              className="editor-page-img"
              style={{
                filter: filterStyle,
                position: 'absolute',
                top: marginPx,
                left: marginPx,
                right: marginPx,
                bottom: marginPx,
                width: `calc(100% - ${marginPx * 2}px)`,
                height: `calc(100% - ${marginPx * 2}px)`,
                objectFit: fillMode === 'fill' ? 'cover' : fillMode === 'stretch' ? 'fill' : 'contain',
              }}
            />
          </div>
        )}

        {cropping && (
          <CropOverlay
            containerRef={wrapRef}
            onApply={handleCropApply}
            onCancel={() => setCropping(false)}
          />
        )}
      </div>

      <div className="editor-nav-row">
        <div className="editor-nav-center">
          <button className="page-arrow" onClick={() => setCurrentIndex(currentIndex - 1)} disabled={currentIndex === 0 || cropping}>‹</button>
          <span className="editor-page-indicator">{currentIndex + 1} / {images.length}</span>
          <button className="page-arrow" onClick={() => setCurrentIndex(currentIndex + 1)} disabled={currentIndex >= images.length - 1 || cropping}>›</button>
        </div>
      </div>

      <div className="editor-thumb-strip">
        <div className="editor-thumb-scroll" ref={thumbScrollRef}>
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`editor-thumb ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => !cropping && setCurrentIndex(idx)}
            >
              <img src={img.url} alt="" style={img.rotation ? { transform: `rotate(${img.rotation}deg)` } : undefined} />
              <span className="editor-thumb-num">{idx + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {(showFilter || showLayoutSheet || showOptionsSheet) && (
        <div className="editor-sheet-backdrop" onClick={() => { setShowFilter(false); setShowLayoutSheet(false); setShowOptionsSheet(false); }} />
      )}

      <div style={{ position: 'relative', flexShrink: 0 }}>
        {/* Filter sheet */}
        {showFilter && (
          <div className="editor-sheet">
            <h2 style={{ marginBottom: 12 }}>Choose Filter</h2>
            <div className="filter-sheet-options">
              {([
                ['original', 'Original', 'none'],
                ['magic', 'Auto', 'contrast(1.3) brightness(1.1) saturate(0.4)'],
                ['gray', 'Grayscale', 'grayscale(1) contrast(1.2)'],
                ['bw', 'B&W', 'grayscale(1) contrast(3) brightness(1.3)'],
                ['color', 'Color+', 'contrast(1.2) saturate(1.5) brightness(1.05)'],
              ] as const).map(([key, label, css]) => (
                <button
                  key={key}
                  className={`filter-sheet-option ${activeFilter === key ? 'active' : ''}`}
                  onClick={() => setActiveFilter(key)}
                >
                  <img src={img.url} alt={label} className="filter-sheet-thumb" style={{ filter: css }} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
            {images.length > 1 && (
              <label className="select-all" style={{ marginTop: 12 }} onClick={() => setApplyToAll(!applyToAll)}>
                <span className={`checkbox ${applyToAll ? 'checked' : ''}`}>{applyToAll ? '✓' : ''}</span>
                <span>Apply to all images</span>
              </label>
            )}
          </div>
        )}

        {/* Page Size sheet */}
        {showLayoutSheet && setPageSize && (
          <div className="editor-sheet">
            <h2 style={{ marginBottom: 8 }}>Page Size</h2>
            <div className="filter-sheet-options">
              {(() => {
                const sizes: [string, string, string][] = [
                  ['A4', 'A4', '210×297'],
                  ['Letter', 'Letter', '8.5×11'],
                  ['Legal', 'Legal', '8.5×14'],
                ];
                const aspects: Record<string, number> = {
                  A4: 595.28 / 841.89, Letter: 612 / 792, Legal: 612 / 1008,
                };
                // Heights in mm (longer dimension) for proportional display
                const heights: Record<string, number> = {
                  A4: 297, Letter: 279, Legal: 356,
                };
                const maxH = 356; // Legal = tallest
                const items: { key: string; orient: 'portrait' | 'landscape' | null; label: string; desc: string; aspect: number; h: number }[] = [
                  { key: 'Auto', orient: null, label: 'Fit', desc: 'Auto', aspect: 0, h: 44 },
                ];
                for (const [key, label] of sizes) {
                  const a = aspects[key];
                  const h = Math.round((heights[key] / maxH) * 52);
                  items.push({ key, orient: 'portrait', label, desc: 'Portrait', aspect: a, h });
                  items.push({ key, orient: 'landscape', label, desc: 'Landscape', aspect: 1 / a, h: Math.round(h * a) });
                }
                return items.map((it) => {
                  const isActive = it.key === 'Auto'
                    ? pageSize === 'Auto'
                    : pageSize === it.key && pageOrientation === it.orient;
                  return (
                    <button
                      key={`${it.key}-${it.orient || 'fit'}`}
                      className={`filter-sheet-option ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setPageSize(it.key as PageSize);
                        if (it.orient && setPageOrientation) setPageOrientation(it.orient);
                      }}
                    >
                      <span>{it.label}</span>
                      <span className="pagesize-desc">{it.desc}</span>
                    </button>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Options sheet — Fill / Margin / Align (per image) */}
        {showOptionsSheet && (
          <div className="editor-sheet">
            <h2 style={{ marginBottom: 12 }}>Placement</h2>
            <div className="layout-compact-row">
              <div className="layout-option-group">
                <span className="layout-option-label">Margin</span>
                <div className="layout-toggle">
                  {(['None', 'Small', 'Large'] as const).map((m) => (
                    <button key={m} className={`toggle-btn ${margin === m ? 'active' : ''}`} onClick={() => setMargin(m)}>{m}</button>
                  ))}
                </div>
              </div>
              <div className={`layout-option-group ${pageSize === 'Auto' ? 'layout-disabled' : ''}`}>
                <span className="layout-option-label">Fill</span>
                <div className="layout-toggle">
                  <button className={`toggle-btn ${pageSize !== 'Auto' && fillMode === 'fit' ? 'active' : ''}`} onClick={() => pageSize !== 'Auto' && setFillMode('fit')} disabled={pageSize === 'Auto'}>Fit</button>
                  <button className={`toggle-btn ${pageSize !== 'Auto' && fillMode === 'fill' ? 'active' : ''}`} onClick={() => pageSize !== 'Auto' && setFillMode('fill')} disabled={pageSize === 'Auto'}>Fill</button>
                  <button className={`toggle-btn ${pageSize !== 'Auto' && fillMode === 'stretch' ? 'active' : ''}`} onClick={() => pageSize !== 'Auto' && setFillMode('stretch')} disabled={pageSize === 'Auto'}>Stretch</button>
                </div>
              </div>
            </div>
            {images.length > 1 && (
              <label className="select-all" style={{ marginTop: 10, justifyContent: 'center' }} onClick={() => {
                const newVal = !applyOptionsToAll;
                setApplyOptionsToAll(newVal);
                if (newVal) {
                  images.forEach((i) => i.id !== img.id && updateImage(i.id, { fillMode, margin }));
                  onDefaultsChange?.({ fillMode, margin });
                }
              }}>
                <span className={`checkbox ${applyOptionsToAll ? 'checked' : ''}`}>{applyOptionsToAll ? '✓' : ''}</span>
                <span>Apply to all images</span>
              </label>
            )}
          </div>
        )}

        <div className="bottom-bar editor-bar">
          <button className="bar-btn" onClick={() => { closeAllSheets(); handleRotate(); }} disabled={cropping}>
            <span className="bar-icon">↻</span><span>Rotate</span>
          </button>
          <button className={`bar-btn ${cropping ? 'bar-btn-active' : ''}`} onClick={() => { closeAllSheets(); setCropping(!cropping); }}>
            <span className="bar-icon">✂</span><span>Crop</span>
          </button>
          <button className="bar-btn" onClick={() => { if (showFilter) { closeAllSheets(); } else { closeAllSheets(); setShowFilter(true); } }} disabled={cropping}>
            <span className="bar-icon">🎨</span><span>Filter</span>
          </button>
          <button className="bar-btn" onClick={() => { closeAllSheets(); handleRemove(); }} disabled={cropping}>
            <span className="bar-icon">🗑</span><span>Delete</span>
          </button>
          {onReorder && images.length > 1 && (
            <button className="bar-btn" onClick={() => { closeAllSheets(); onReorder(); }} disabled={cropping}>
              <span className="bar-icon">⇅</span><span>Reorder</span>
            </button>
          )}
          {(onAddImage || onScan) && (
            <button className="bar-btn" onClick={() => { if (showAddSheet) { closeAllSheets(); } else { closeAllSheets(); setShowAddSheet(true); } }} disabled={cropping}>
              <span className="bar-icon">＋</span><span>Add</span>
            </button>
          )}
          {setPageSize && (
            <button className="bar-btn" onClick={() => { if (showLayoutSheet) { closeAllSheets(); } else { closeAllSheets(); setShowLayoutSheet(true); } }} disabled={cropping}>
              <span className="bar-icon"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="1" width="14" height="18" rx="1.5"/><line x1="6" y1="5" x2="14" y2="5"/><line x1="6" y1="8" x2="14" y2="8"/><line x1="6" y1="11" x2="10" y2="11"/></svg></span><span>Page Size</span>
            </button>
          )}
          {setPageSize && (
            <button className="bar-btn" onClick={() => { if (showOptionsSheet) { closeAllSheets(); } else { closeAllSheets(); setShowOptionsSheet(true); } }} disabled={cropping}>
              <span className="bar-icon"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="16" height="16" rx="2"/><line x1="10" y1="6" x2="10" y2="14"/><line x1="6" y1="10" x2="14" y2="10"/><polyline points="8,7 10,5 12,7"/><polyline points="8,13 10,15 12,13"/></svg></span><span>Placement</span>
            </button>
          )}
        </div>
      </div>

      {showAddSheet && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowAddSheet(false)} />
          <div className="bottom-sheet">
            <h2>Add Image</h2>
            <div style={{display:'flex',gap:12,marginBottom:12}}>
              {onAddImage && (
                <button className="add-card" style={{flex:1,maxHeight:'none',aspectRatio:'auto',padding:'16px 12px'}} onClick={() => { setShowAddSheet(false); onAddImage(); }}>
                  <span className="add-icon">🖼</span>
                  <span>Album</span>
                </button>
              )}
              {onScan && (
                <button className="add-card" style={{flex:1,maxHeight:'none',aspectRatio:'auto',padding:'16px 12px'}} onClick={() => { setShowAddSheet(false); onScan(); }}>
                  <span className="add-icon">📷</span>
                  <span>Camera</span>
                </button>
              )}
            </div>
            <button className="btn-text" style={{width:'100%',textAlign:'center'}} onClick={() => setShowAddSheet(false)}>Cancel</button>
          </div>
        </>
      )}

      {showConfirm && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Remove Image?</h2>
            <p>This image will be removed from your selection.</p>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmRemove}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {showQuitDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Quit?</h2>
            <p>Your current progress will be lost. Are you sure you want to quit?</p>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setShowQuitDialog(false)}>Cancel</button>
              <button className="btn-danger" onClick={() => { setShowQuitDialog(false); (onQuit || onBack)(); }}>Quit</button>
            </div>
          </div>
        </div>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleCameraFile} />
    </div>
  );
}
