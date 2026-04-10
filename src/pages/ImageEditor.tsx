import { useState, useRef, useEffect, useCallback } from 'react';
import type { ImageItem, PageSize, PageOrientation, FillMode, Alignment, Margin, WatermarkConfig, SignatureItem } from '../types';
import CropOverlay from '../components/CropOverlay';
import SignaturePad from '../components/SignaturePad';

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
  defaultAlignment?: Alignment;
  defaultMargin?: Margin;
  watermark?: WatermarkConfig;
  setWatermark?: (w: WatermarkConfig) => void;
  signatures?: SignatureItem[];
  setSignatures?: (s: SignatureItem[] | ((prev: SignatureItem[]) => SignatureItem[])) => void;
  onDefaultsChange?: (defaults: { fillMode?: FillMode; alignment?: Alignment; margin?: Margin }) => void;
}

export default function ImageEditor({
  images, currentIndex, setCurrentIndex,
  updateImage, removeImage, addImages, onDone, onBack, onQuit, onRetake, onAddImage, onScan, onReorder,
  pageSize, setPageSize, pageOrientation, setPageOrientation, defaultFillMode = 'fit', defaultAlignment = 'center', defaultMargin = 'None', watermark, setWatermark, signatures: signaturesProp, setSignatures: setSignaturesProp, onDefaultsChange,
}: Props) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilter, setActiveFilter] = useState('original');
  const [applyToAll, setApplyToAll] = useState(false);
  const [showLayoutSheet, setShowLayoutSheet] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [showWatermarkSheet, setShowWatermarkSheet] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const signatures = signaturesProp || [];
  const setSignatures = setSignaturesProp || (() => {});
  const [applyOptionsToAll, setApplyOptionsToAll] = useState(false);

  const closeAllSheets = () => { setShowFilter(false); setShowLayoutSheet(false); setShowOptionsSheet(false); setShowWatermarkSheet(false); setShowAddSheet(false); };
  const [multiSelect, setMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
  const alignment = img.alignment ?? defaultAlignment;
  const margin = img.margin ?? defaultMargin;

  const setFillMode = (f: FillMode) => {
    updateImage(img.id, { fillMode: f });
    if (applyOptionsToAll) {
      images.forEach((i) => i.id !== img.id && updateImage(i.id, { fillMode: f }));
      onDefaultsChange?.({ fillMode: f });
    }
  };
  const setAlignment = (a: Alignment) => {
    updateImage(img.id, { alignment: a });
    if (applyOptionsToAll) {
      images.forEach((i) => i.id !== img.id && updateImage(i.id, { alignment: a }));
      onDefaultsChange?.({ alignment: a });
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

  const handleRetake = () => onRetake ? onRetake() : cameraRef.current?.click();

  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const [showMultiDeleteConfirm, setShowMultiDeleteConfirm] = useState(false);

  const handleMultiDelete = () => {
    setShowMultiDeleteConfirm(true);
  };

  const confirmMultiDelete = () => {
    setShowMultiDeleteConfirm(false);
    const remaining = images.length - selectedIds.size;
    selectedIds.forEach((id) => removeImage(id));
    setSelectedIds(new Set());
    setMultiSelect(false);
    if (remaining <= 0) onBack();
    else if (currentIndex >= remaining) setCurrentIndex(remaining - 1);
  };

  const handleMultiRotate = () => {
    selectedIds.forEach((id) => {
      const image = images.find((i) => i.id === id);
      if (image) updateImage(id, { rotation: (image.rotation + 90) % 360 });
    });
  };

  let sigIdCounter = useRef(0);
  const handleSignatureConfirm = (dataUrl: string) => {
    setShowSignaturePad(false);
    setSignatures((prev) => [...prev, {
      id: `sig-${++sigIdCounter.current}`,
      url: dataUrl,
      x: 60, y: 75,
      width: 25,
      pageIndex: currentIndex,
    }]);
  };

  const removeSignature = (id: string) => setSignatures((prev) => prev.filter((s) => s.id !== id));

  const handleSigDrag = useCallback((id: string, e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const wrap = wrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const onMove = (ev: PointerEvent) => {
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top) / rect.height) * 100;
      setSignatures((prev) => prev.map((s) => s.id === id ? { ...s, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : s));
    };
    const onUp = () => { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, []);

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
  const showMarginFrame = !showPageFrame && !!margin && margin !== 'None' && !cropping;
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
          }}
        />

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
                objectPosition: fillMode === 'fit'
                  ? isLandscape
                    ? (alignment === 'top' ? 'left center' : alignment === 'bottom' ? 'right center' : 'center center')
                    : (alignment === 'top' ? 'center top' : alignment === 'bottom' ? 'center bottom' : 'center center')
                  : 'center center',
              }}
            />
          </div>
        )}

        {watermark?.enabled && watermark.text && !cropping && (
          watermark.mode === 'tile' ? (
            <div className="watermark-overlay watermark-tile" style={{
              color: watermark.color,
              opacity: watermark.opacity,
              fontSize: watermark.fontSize * 0.3,
              transform: `rotate(${watermark.angle}deg)`,
            }}>
              {Array.from({ length: 40 }, (_, i) => (
                <span key={i} className="watermark-tile-item">{watermark.text}</span>
              ))}
            </div>
          ) : (
            <div className="watermark-overlay" style={{
              fontSize: watermark.fontSize * 0.4,
              color: watermark.color,
              opacity: watermark.opacity,
              transform: `rotate(${watermark.angle}deg)`,
            }}>
              {watermark.text}
            </div>
          )
        )}

        {/* Signatures on current page */}
        {!cropping && signatures.filter((s) => s.pageIndex === currentIndex).map((sig) => (
          <div
            key={sig.id}
            className="signature-on-page"
            style={{ left: `${sig.x}%`, top: `${sig.y}%`, width: `${sig.width}%`, transform: 'translate(-50%, -50%)' }}
            onPointerDown={(e) => handleSigDrag(sig.id, e)}
          >
            <img src={sig.url} alt="signature" style={{ width: '100%' }} />
            <button className="sig-delete" onClick={(e) => { e.stopPropagation(); removeSignature(sig.id); }}>✕</button>
          </div>
        ))}

        {cropping && (
          <CropOverlay
            containerRef={wrapRef}
            onApply={handleCropApply}
            onCancel={() => setCropping(false)}
          />
        )}
      </div>

      <div className="editor-nav-row">
        {multiSelect ? (
          <>
            <span className="editor-page-indicator" style={{ color: 'var(--primary)', flex: 1 }}>{selectedIds.size} selected</span>
            <label className="select-all" style={{ margin: 0 }} onClick={() => {
              if (selectedIds.size === images.length) setSelectedIds(new Set());
              else setSelectedIds(new Set(images.map((i) => i.id)));
            }}>
              <span className={`checkbox ${selectedIds.size === images.length ? 'checked' : ''}`}>{selectedIds.size === images.length ? '✓' : ''}</span>
              <span style={{ fontSize: 12 }}>All</span>
            </label>
            <button className="btn-icon" style={{ fontSize: 14, padding: '2px 6px' }} onClick={() => { setMultiSelect(false); setSelectedIds(new Set()); }}>✕</button>
          </>
        ) : (
          <>
            <div className="editor-nav-center">
              <button className="page-arrow" onClick={() => setCurrentIndex(currentIndex - 1)} disabled={currentIndex === 0 || cropping}>‹</button>
              <span className="editor-page-indicator">{currentIndex + 1} / {images.length}</span>
              <button className="page-arrow" onClick={() => setCurrentIndex(currentIndex + 1)} disabled={currentIndex >= images.length - 1 || cropping}>›</button>
            </div>
            {images.length > 1 && (
              <button className="thumb-select-btn" onClick={() => setMultiSelect(true)}>✓</button>
            )}
          </>
        )}
      </div>

      <div className="editor-thumb-strip">
        <div className="editor-thumb-scroll" ref={thumbScrollRef}>
          {images.map((img, idx) => (
            <div
              key={img.id}
              className={`editor-thumb ${!multiSelect && idx === currentIndex ? 'active' : ''} ${multiSelect && selectedIds.has(img.id) ? 'selected' : ''}`}
              onClick={() => {
                if (multiSelect) { toggleSelectId(img.id); }
                else if (!cropping) { setCurrentIndex(idx); }
              }}
            >
              <img src={img.url} alt="" style={img.rotation ? { transform: `rotate(${img.rotation}deg)` } : undefined} />
              {multiSelect && (
                <span className={`thumb-check ${selectedIds.has(img.id) ? 'checked' : ''}`}>{selectedIds.has(img.id) ? '✓' : ''}</span>
              )}
              <span className="editor-thumb-num">{idx + 1}</span>
            </div>
          ))}
        </div>
      </div>

      {(showFilter || showLayoutSheet || showOptionsSheet || showWatermarkSheet) && (
        <div className="editor-sheet-backdrop" onClick={() => { setShowFilter(false); setShowLayoutSheet(false); setShowOptionsSheet(false); setShowWatermarkSheet(false); }} />
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
                for (const [key, label, desc] of sizes) {
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
              <div className={`layout-option-group ${pageSize === 'Auto' || fillMode !== 'fit' ? 'layout-disabled' : ''}`}>
                <span className="layout-option-label">Align</span>
                <div className="layout-toggle">
                  <button className={`toggle-btn ${pageSize !== 'Auto' && fillMode === 'fit' && alignment === 'top' ? 'active' : ''}`} onClick={() => pageSize !== 'Auto' && fillMode === 'fit' && setAlignment('top')} disabled={pageSize === 'Auto' || fillMode !== 'fit'}>{isLandscape ? 'Left' : 'Top'}</button>
                  <button className={`toggle-btn ${pageSize !== 'Auto' && fillMode === 'fit' && alignment === 'center' ? 'active' : ''}`} onClick={() => pageSize !== 'Auto' && fillMode === 'fit' && setAlignment('center')} disabled={pageSize === 'Auto' || fillMode !== 'fit'}>Center</button>
                  <button className={`toggle-btn ${pageSize !== 'Auto' && fillMode === 'fit' && alignment === 'bottom' ? 'active' : ''}`} onClick={() => pageSize !== 'Auto' && fillMode === 'fit' && setAlignment('bottom')} disabled={pageSize === 'Auto' || fillMode !== 'fit'}>{isLandscape ? 'Right' : 'Bottom'}</button>
                </div>
              </div>
            </div>
            {images.length > 1 && (
              <label className="select-all" style={{ marginTop: 10, justifyContent: 'center' }} onClick={() => {
                const newVal = !applyOptionsToAll;
                setApplyOptionsToAll(newVal);
                if (newVal) {
                  images.forEach((i) => i.id !== img.id && updateImage(i.id, { fillMode, alignment, margin }));
                  onDefaultsChange?.({ fillMode, alignment, margin });
                }
              }}>
                <span className={`checkbox ${applyOptionsToAll ? 'checked' : ''}`}>{applyOptionsToAll ? '✓' : ''}</span>
                <span>Apply to all images</span>
              </label>
            )}
          </div>
        )}

        {/* Watermark sheet */}
        {showWatermarkSheet && watermark && setWatermark && (
          <div className="editor-sheet">
            <h2 style={{ marginBottom: 12 }}>Watermark</h2>
            <div className="layout-compact-row">
              <div className="layout-option-group">
                <span className="layout-option-label">Enable</span>
                <div className="layout-toggle">
                  <button className={`toggle-btn ${watermark.enabled ? 'active' : ''}`} onClick={() => setWatermark({ ...watermark, enabled: true })}>On</button>
                  <button className={`toggle-btn ${!watermark.enabled ? 'active' : ''}`} onClick={() => setWatermark({ ...watermark, enabled: false })}>Off</button>
                </div>
              </div>
              <div className={`layout-option-group ${!watermark.enabled ? 'layout-disabled' : ''}`}>
                <span className="layout-option-label">Mode</span>
                <div className="layout-toggle">
                  <button className={`toggle-btn ${watermark.mode === 'single' ? 'active' : ''}`} onClick={() => watermark.enabled && setWatermark({ ...watermark, mode: 'single' })} disabled={!watermark.enabled}>Single</button>
                  <button className={`toggle-btn ${watermark.mode === 'tile' ? 'active' : ''}`} onClick={() => watermark.enabled && setWatermark({ ...watermark, mode: 'tile' })} disabled={!watermark.enabled}>Tile</button>
                </div>
              </div>
              <div className={`layout-option-group ${!watermark.enabled ? 'layout-disabled' : ''}`}>
                <span className="layout-option-label">Text</span>
                <input
                  type="text"
                  className="watermark-input"
                  value={watermark.text}
                  onChange={(e) => setWatermark({ ...watermark, text: e.target.value })}
                  placeholder="e.g. CONFIDENTIAL"
                  disabled={!watermark.enabled}
                />
              </div>
              <div className={`layout-option-group ${!watermark.enabled ? 'layout-disabled' : ''}`}>
                <span className="layout-option-label">Size</span>
                <input type="range" min="16" max="120" value={watermark.fontSize} onChange={(e) => setWatermark({ ...watermark, fontSize: Number(e.target.value) })} disabled={!watermark.enabled} style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--text2)', minWidth: 28, textAlign: 'right' }}>{watermark.fontSize}</span>
              </div>
              <div className={`layout-option-group ${!watermark.enabled ? 'layout-disabled' : ''}`}>
                <span className="layout-option-label">Opacity</span>
                <input type="range" min="0.05" max="0.5" step="0.05" value={watermark.opacity} onChange={(e) => setWatermark({ ...watermark, opacity: Number(e.target.value) })} disabled={!watermark.enabled} style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--text2)', minWidth: 28, textAlign: 'right' }}>{Math.round(watermark.opacity * 100)}%</span>
              </div>
              <div className={`layout-option-group ${!watermark.enabled ? 'layout-disabled' : ''}`}>
                <span className="layout-option-label">Angle</span>
                <input type="range" min="-90" max="90" value={watermark.angle} onChange={(e) => setWatermark({ ...watermark, angle: Number(e.target.value) })} disabled={!watermark.enabled} style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: 'var(--text2)', minWidth: 28, textAlign: 'right' }}>{watermark.angle}°</span>
              </div>
              <div className={`layout-option-group ${!watermark.enabled ? 'layout-disabled' : ''}`}>
                <span className="layout-option-label">Color</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['#000000', '#FF0000', '#0000FF', '#888888', '#FFFFFF'].map((c) => (
                    <button key={c} className={`watermark-color ${watermark.color === c ? 'active' : ''}`} style={{ background: c }} onClick={() => watermark.enabled && setWatermark({ ...watermark, color: c })} disabled={!watermark.enabled} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bottom-bar editor-bar">
          <button className="bar-btn" onClick={() => { closeAllSheets(); multiSelect ? handleMultiRotate() : handleRotate(); }} disabled={cropping || (multiSelect && selectedIds.size === 0)}>
            <span className="bar-icon">↻</span><span>Rotate</span>
          </button>
          <button className={`bar-btn ${cropping ? 'bar-btn-active' : ''}`} onClick={() => { closeAllSheets(); setCropping(!cropping); }} disabled={multiSelect}>
            <span className="bar-icon">✂</span><span>Crop</span>
          </button>
          <button className="bar-btn" onClick={() => { if (showFilter) { closeAllSheets(); } else { closeAllSheets(); setShowFilter(true); } }} disabled={cropping || multiSelect}>
            <span className="bar-icon">🎨</span><span>Filter</span>
          </button>
          <button className="bar-btn" onClick={() => { closeAllSheets(); multiSelect ? handleMultiDelete() : handleRemove(); }} disabled={cropping || (multiSelect && selectedIds.size === 0)}>
            <span className="bar-icon">🗑</span><span>Delete</span>
          </button>
          {onReorder && images.length > 1 && (
            <button className="bar-btn" onClick={() => { closeAllSheets(); onReorder(); }} disabled={cropping || multiSelect}>
              <span className="bar-icon">⇅</span><span>Reorder</span>
            </button>
          )}
          {(onAddImage || onScan) && (
            <button className="bar-btn" onClick={() => { if (showAddSheet) { closeAllSheets(); } else { closeAllSheets(); setShowAddSheet(true); } }} disabled={cropping || multiSelect}>
              <span className="bar-icon">＋</span><span>Add</span>
            </button>
          )}
          {setPageSize && (
            <button className="bar-btn" onClick={() => { if (showLayoutSheet) { closeAllSheets(); } else { closeAllSheets(); setShowLayoutSheet(true); } }} disabled={cropping || multiSelect}>
              <span className="bar-icon"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="1" width="14" height="18" rx="1.5"/><line x1="6" y1="5" x2="14" y2="5"/><line x1="6" y1="8" x2="14" y2="8"/><line x1="6" y1="11" x2="10" y2="11"/></svg></span><span>Page Size</span>
            </button>
          )}
          {setPageSize && (
            <button className="bar-btn" onClick={() => { if (showOptionsSheet) { closeAllSheets(); } else { closeAllSheets(); setShowOptionsSheet(true); } }} disabled={cropping || multiSelect}>
              <span className="bar-icon"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="16" height="16" rx="2"/><line x1="10" y1="6" x2="10" y2="14"/><line x1="6" y1="10" x2="14" y2="10"/><polyline points="8,7 10,5 12,7"/><polyline points="8,13 10,15 12,13"/></svg></span><span>Placement</span>
            </button>
          )}
          {setWatermark && (
            <button className="bar-btn" onClick={() => { if (showWatermarkSheet) { closeAllSheets(); } else { closeAllSheets(); setShowWatermarkSheet(true); } }} disabled={cropping || multiSelect}>
              <span className="bar-icon"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 2 C10 2 8 6 8 9 C8 11.2 8.9 12 10 12 C11.1 12 12 11.2 12 9 C12 6 10 2 10 2Z"/><line x1="4" y1="15" x2="16" y2="15"/><line x1="6" y1="18" x2="14" y2="18"/></svg></span><span>Watermark</span>
            </button>
          )}
          <button className="bar-btn" onClick={() => { closeAllSheets(); setShowSignaturePad(true); }} disabled={cropping || multiSelect}>
            <span className="bar-icon"><svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 15 C5 12 8 10 11 13 C13 15 15 11 18 9"/><line x1="2" y1="18" x2="18" y2="18"/></svg></span><span>Sign</span>
          </button>
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

      {showMultiDeleteConfirm && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Remove {selectedIds.size} Images?</h2>
            <p>The selected images will be removed from your selection.</p>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setShowMultiDeleteConfirm(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmMultiDelete}>Remove</button>
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

      {showSignaturePad && (
        <SignaturePad
          onConfirm={handleSignatureConfirm}
          onCancel={() => setShowSignaturePad(false)}
        />
      )}
    </div>
  );
}
