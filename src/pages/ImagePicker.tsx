import { useRef, useState, useMemo } from 'react';
import type { ImageItem } from '../types';
import { ImageToPdfIcon, ScanToPdfIcon, IdCardIcon, PdfToImageIcon } from '../components/ToolIcons';

interface Props {
  images: ImageItem[];
  addImages: (files: File[]) => void;
  removeImage: (id: string) => void;
  onConfirm: (selectedIds: Set<string>) => void;
  loading?: boolean;
  onBack?: () => void;
  onCamera?: () => void;
  autoCrop?: boolean;
  onAutoCropChange?: (v: boolean) => void;
}

type FolderName = 'All Photos' | 'Camera' | 'Screenshots' | 'Downloads' | 'Favorites';
const FOLDERS: FolderName[] = ['All Photos', 'Camera', 'Screenshots', 'Downloads', 'Favorites'];

// Aspect ratios: [w, h]
const RATIOS: Record<string, [number, number][]> = {
  Camera: [[400,300],[300,400],[400,400],[350,250],[250,350],[400,300],[300,400],[350,450],[450,300],[400,300],[300,400],[400,300],[350,250],[250,350],[300,400],[400,300],[350,450],[450,300],[400,400],[300,400]],
  Screenshots: [[390,844],[390,844],[390,844],[390,844],[390,844],[1024,768],[1024,768],[390,844],[390,844],[1024,768],[390,844],[390,844],[1024,768],[390,844],[390,844]],
  Downloads: [[800,600],[600,800],[1200,630],[400,400],[800,450],[600,900],[1000,700],[500,500],[700,400],[800,600],[600,800],[1200,630],[400,400],[800,450],[600,900]],
  Favorites: [[400,300],[300,400],[400,400],[350,250],[400,300],[300,400],[350,450],[400,300],[300,400],[400,400]],
};

function buildMockImages(folder: FolderName): ImageItem[] {
  const prefix = folder === 'Camera' ? 'cam' : folder === 'Screenshots' ? 'ss' : folder === 'Downloads' ? 'dl' : folder === 'Favorites' ? 'fav' : 'all';
  const ratios = RATIOS[folder] || [];
  const count = folder === 'Camera' ? 20 : folder === 'Screenshots' ? 15 : folder === 'Downloads' ? 15 : folder === 'Favorites' ? 10 : 0;
  return Array.from({ length: count }, (_, i) => {
    const [w, h] = ratios[i % ratios.length] || [300, 400];
    return {
      id: `${prefix}-${i + 1}`,
      file: new File([], `${prefix}_${i + 1}.jpg`),
      url: `https://picsum.photos/seed/${prefix}${i + 1}/${w}/${h}`,
      name: `${prefix}_${i + 1}.jpg`,
      rotation: 0,
      width: w,
      height: h,
    };
  });
}

const FOLDER_IMAGES: Record<FolderName, ImageItem[]> = {
  Camera: buildMockImages('Camera'),
  Screenshots: buildMockImages('Screenshots'),
  Downloads: buildMockImages('Downloads'),
  Favorites: buildMockImages('Favorites'),
  'All Photos': [],
};
// All Photos = combined
FOLDER_IMAGES['All Photos'] = [...FOLDER_IMAGES.Camera, ...FOLDER_IMAGES.Screenshots, ...FOLDER_IMAGES.Downloads, ...FOLDER_IMAGES.Favorites];

export const ALL_MOCK_IMAGES = FOLDER_IMAGES['All Photos'];

export default function ImagePicker({ addImages, onConfirm, loading, onBack, onCamera, autoCrop: autoCropProp, onAutoCropChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [folder, setFolder] = useState<FolderName>('All Photos');
  const [selected, setSelected] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  const [autoCrop, setAutoCropLocal] = useState(autoCropProp ?? true);
  const setAutoCrop = (v: boolean) => { setAutoCropLocal(v); onAutoCropChange?.(v); };
  const [showCropSheet, setShowCropSheet] = useState(false);
  const [rememberChoice, setRememberChoice] = useState(false);
  const [showSettingsHelp, setShowSettingsHelp] = useState(false);
  const touchStartX = useRef<number>(0);

  // Swipe multi-select
  const [swiping, setSwiping] = useState(false);
  const swipeMode = useRef<'select' | 'deselect'>('select');
  const swipedIds = useRef<Set<string>>(new Set());
  const swipeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Onboarding guide
  const [showGuide, setShowGuide] = useState(() => {
    try { return !localStorage.getItem('picker_guide_seen'); } catch { return true; }
  });
  const [guideStep, setGuideStep] = useState(0);
  const guideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissGuide = () => {
    setShowGuide(false);
    setGuideHighlight(new Set());
    if (guideTimerRef.current) clearInterval(guideTimerRef.current);
    try { localStorage.setItem('picker_guide_seen', '1'); } catch {}
  };
  const [guideHighlight, setGuideHighlight] = useState<Set<number>>(new Set());

  // Animate guide: sequentially highlight images 0,1,2,3
  if (showGuide && !guideTimerRef.current) {
    let step = 0;
    guideTimerRef.current = setInterval(() => {
      step++;
      if (step <= 4) {
        setGuideHighlight(new Set(Array.from({ length: step }, (_, i) => i)));
        setGuideStep(step);
      } else if (step === 7) {
        // Reset cycle
        setGuideHighlight(new Set());
        setGuideStep(0);
        step = 0;
      }
    }, 500);
  }

  const getImageIdFromTouch = (x: number, y: number): string | null => {
    const el = document.elementFromPoint(x, y);
    if (!el) return null;
    const thumb = el.closest('.picker-thumb') as HTMLElement | null;
    if (!thumb) return null;
    const idx = thumb.dataset.idx;
    if (idx !== undefined) return displayImages[parseInt(idx)]?.id || null;
    return null;
  };

  const handleGridTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const id = getImageIdFromTouch(touch.clientX, touch.clientY);
    if (!id) return;
    // Start a long-press timer for swipe mode
    swipeTimer.current = setTimeout(() => {
      setSwiping(true);
      swipeMode.current = selected.includes(id) ? 'deselect' : 'select';
      swipedIds.current = new Set([id]);
      if (swipeMode.current === 'select' && !selected.includes(id)) {
        setSelected(prev => [...prev, id]);
      } else if (swipeMode.current === 'deselect' && selected.includes(id)) {
        setSelected(prev => prev.filter(i => i !== id));
      }
    }, 300);
  };

  const handleGridTouchMove = (e: React.TouchEvent) => {
    if (swipeTimer.current && !swiping) {
      clearTimeout(swipeTimer.current);
      swipeTimer.current = null;
      return;
    }
    if (!swiping) return;
    const touch = e.touches[0];
    const id = getImageIdFromTouch(touch.clientX, touch.clientY);
    if (!id || swipedIds.current.has(id)) return;
    swipedIds.current.add(id);
    if (swipeMode.current === 'select' && !selected.includes(id)) {
      if (selected.length >= MAX_IMAGES) { setShowLimitDialog(true); return; }
      setSelected(prev => [...prev, id]);
    } else if (swipeMode.current === 'deselect' && selected.includes(id)) {
      setSelected(prev => prev.filter(i => i !== id));
    }
  };

  const handleGridTouchEnd = () => {
    if (swipeTimer.current) { clearTimeout(swipeTimer.current); swipeTimer.current = null; }
    setSwiping(false);
    swipedIds.current = new Set();
  };

  const displayImages = useMemo(() => FOLDER_IMAGES[folder], [folder]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    if (files.length) addImages(files);
    e.target.value = '';
  };

  const MAX_IMAGES = 100;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= MAX_IMAGES) {
        setShowLimitDialog(true);
        return prev;
      }
      return [...prev, id];
    });
  };

  const isAllSelected = displayImages.length > 0 && displayImages.every((img) => selected.includes(img.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelected((prev) => prev.filter((id) => !displayImages.some((img) => img.id === id)));
    } else {
      const newIds = displayImages.map((img) => img.id).filter((id) => !selected.includes(id));
      if (selected.length + newIds.length > MAX_IMAGES) {
        setShowLimitDialog(true);
        return;
      }
      setSelected((prev) => [...prev, ...newIds]);
    }
  };

  const getOrder = (id: string): number => {
    const idx = selected.indexOf(id);
    return idx === -1 ? -1 : idx + 1;
  };

  return (
    <div className="page">
      <header className="topbar">
        {onBack && <button className="btn-icon" onClick={onBack}>←</button>}
        <h1 className="topbar-title">Select Images</h1>
        <label className="select-all" onClick={toggleSelectAll}>
          <span className={`checkbox ${isAllSelected ? 'checked' : ''}`}>
            {isAllSelected ? '✓' : ''}
          </span>
          <span>All</span>
        </label>
      </header>

      <div className="folder-dropdown-wrap">
        <select
          className="folder-dropdown"
          value={folder}
          onChange={(e) => setFolder(e.target.value as FolderName)}
        >
          {FOLDERS.map((f) => (
            <option key={f} value={f}>{f} ({FOLDER_IMAGES[f].length})</option>
          ))}
        </select>
        <span className="dropdown-arrow">▾</span>
      </div>

      <div className="picker-grid" ref={gridRef} onTouchStart={handleGridTouchStart} onTouchMove={handleGridTouchMove} onTouchEnd={handleGridTouchEnd}>
        {onCamera && (
          <button className="add-card" onClick={onCamera}>
            <span className="add-icon">📷</span>
            <span>Camera</span>
          </button>
        )}

        {displayImages.map((img, idx) => {
          const order = getOrder(img.id);
          const guideOrder = showGuide && guideHighlight.has(idx) ? idx + 1 : 0;
          return (
            <div
              key={img.id}
              data-idx={idx}
              className={`picker-thumb ${order > 0 || guideOrder > 0 ? 'selected' : ''}`}
              onClick={() => { if (!swiping) toggleSelect(img.id); }}
            >
              <img src={img.url} alt={img.name} />
              <button className="picker-preview-btn" onClick={(e) => { e.stopPropagation(); setPreviewIndex(idx); }}>⤢</button>
              {guideOrder > 0 && !order && <span className="thumb-order">{guideOrder}</span>}
              {order > 0 && <span className="thumb-order">{order}</span>}
            </div>
          );
        })}
      </div>

      {/* Bottom confirm bar */}
      {selected.length > 0 && (
        <div className="bottom-bar" style={{flexDirection:'column',gap:8,position:'absolute',bottom:0,left:0,right:0,zIndex:10}}>
          <div className="picker-selected-strip">
            {selected.map((id) => {
              const img = displayImages.find((i) => i.id === id) || FOLDER_IMAGES['All Photos'].find((i) => i.id === id);
              if (!img) return null;
              return (
                <div key={id} className="picker-selected-thumb">
                  <img src={img.url} alt={img.name} />
                  <button className="picker-selected-remove" onClick={() => toggleSelect(id)}>✕</button>
                </div>
              );
            })}
          </div>
          <button
            className="btn-primary btn-confirm-full"
            onClick={() => setShowCropSheet(true)}
          >
            Confirm ({selected.length})
          </button>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <p>Loading images...</p>
        </div>
      )}

      {previewIndex !== null && displayImages[previewIndex] && (
        <div className="image-preview-overlay">
          <header className="topbar" style={{background:'transparent',borderBottom:'none',position:'absolute',top:0,left:0,right:0,zIndex:3}}>
            <button className="btn-icon" style={{color:'#fff'}} onClick={() => setPreviewIndex(null)}>←</button>
            <h1 className="topbar-title" style={{color:'#fff'}}>All images</h1>
            <label className="select-all" onClick={() => toggleSelect(displayImages[previewIndex].id)}>
              <span className={`checkbox ${selected.includes(displayImages[previewIndex].id) ? 'checked' : ''}`}>
                {selected.includes(displayImages[previewIndex].id) ? '✓' : ''}
              </span>
            </label>
          </header>
          <div
            style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',width:'100%',padding:16}}
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const diff = e.changedTouches[0].clientX - touchStartX.current;
              if (diff > 60 && previewIndex > 0) setPreviewIndex(previewIndex - 1);
              else if (diff < -60 && previewIndex < displayImages.length - 1) setPreviewIndex(previewIndex + 1);
            }}
          >
            <img src={displayImages[previewIndex].url} alt="Preview" className="image-preview-full" />
          </div>
          {selected.length > 0 && (
            <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:3,background:'rgba(0,0,0,0.6)',padding:'8px 12px 12px'}}>
              <div className="picker-selected-strip" style={{marginBottom:8}}>
                {selected.map((id) => {
                  const img = displayImages.find((i) => i.id === id) || ALL_MOCK_IMAGES.find((i) => i.id === id);
                  if (!img) return null;
                  return (
                    <div key={id} className="picker-selected-thumb" onClick={() => { const i = displayImages.findIndex((x) => x.id === id); if (i >= 0) setPreviewIndex(i); }}>
                      <img src={img.url} alt={img.name} />
                      <button className="picker-selected-remove" onClick={(e) => { e.stopPropagation(); toggleSelect(id); }}>✕</button>
                    </div>
                  );
                })}
              </div>
              <button className="btn-primary btn-confirm-full" onClick={() => { setPreviewIndex(null); onConfirm(new Set(selected)); }}>
                Confirm ({selected.length})
              </button>
            </div>
          )}
        </div>
      )}

      {showCropSheet && (
        <>
          <div className="sheet-backdrop" onClick={() => setShowCropSheet(false)} />
          <div className="bottom-sheet">
            <h2>Import Options</h2>
            <div style={{display:'flex',gap:12,marginBottom:16}}>
              <button
                style={{
                  flex:1,padding:12,borderRadius:'var(--radius)',border:'2px solid',
                  borderColor: !autoCrop ? 'var(--primary)' : 'var(--border)',
                  background: !autoCrop ? 'rgba(108,92,231,0.1)' : 'var(--surface2)',
                  cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:8
                }}
                onClick={() => setAutoCrop(false)}
              >
                <div style={{width:'100%',aspectRatio:'4/3',background:'#e8e8e8',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative'}}>
                  <div style={{width:'100%',height:'100%',background:'linear-gradient(180deg, #87CEEB 40%, #228B22 40%, #228B22 70%, #8B4513 70%)',position:'relative'}}>
                    <div style={{position:'absolute',top:'15%',left:'20%',width:20,height:20,borderRadius:'50%',background:'#FFD700'}} />
                  </div>
                </div>
                <span style={{fontSize:13,color: !autoCrop ? 'var(--primary)' : 'var(--text2)',fontWeight:500}}>Original</span>
                <span style={{fontSize:10,color:'var(--text2)'}}>Keep as is</span>
              </button>
              <button
                style={{
                  flex:1,padding:12,borderRadius:'var(--radius)',border:'2px solid',
                  borderColor: autoCrop ? 'var(--primary)' : 'var(--border)',
                  background: autoCrop ? 'rgba(108,92,231,0.1)' : 'var(--surface2)',
                  cursor:'pointer',display:'flex',flexDirection:'column',alignItems:'center',gap:8
                }}
                onClick={() => setAutoCrop(true)}
              >
                <div style={{width:'100%',aspectRatio:'4/3',background:'#e8e8e8',borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative'}}>
                  <div style={{width:'100%',height:'100%',background:'linear-gradient(135deg, #666 0%, #888 100%)',position:'relative',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <div style={{width:'60%',height:'75%',background:'#fff',borderRadius:2,boxShadow:'0 1px 4px rgba(0,0,0,0.3)',border:'2px solid var(--primary)'}} />
                    <div style={{position:'absolute',top:'10%',left:'18%',width:8,height:8,borderTop:'2px solid var(--primary)',borderLeft:'2px solid var(--primary)'}} />
                    <div style={{position:'absolute',top:'10%',right:'18%',width:8,height:8,borderTop:'2px solid var(--primary)',borderRight:'2px solid var(--primary)'}} />
                    <div style={{position:'absolute',bottom:'12%',left:'18%',width:8,height:8,borderBottom:'2px solid var(--primary)',borderLeft:'2px solid var(--primary)'}} />
                    <div style={{position:'absolute',bottom:'12%',right:'18%',width:8,height:8,borderBottom:'2px solid var(--primary)',borderRight:'2px solid var(--primary)'}} />
                  </div>
                </div>
                <span style={{fontSize:13,color: autoCrop ? 'var(--primary)' : 'var(--text2)',fontWeight:500}}>Auto Crop</span>
                <span style={{fontSize:10,color:'var(--text2)'}}>Detect edges</span>
              </button>
            </div>
            <label className="select-all" style={{marginBottom:8,justifyContent:'center'}} onClick={() => setRememberChoice(!rememberChoice)}>
              <span className={`checkbox ${rememberChoice ? 'checked' : ''}`}>{rememberChoice ? '✓' : ''}</span>
              <span style={{fontSize:12,color:'var(--text2)'}}>Remember my choice</span>
            </label>
            {rememberChoice && (
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:4,marginBottom:12}}>
                <p style={{fontSize:10,color:'var(--text2)',margin:0,opacity:0.7}}>Change anytime in Settings</p>
                <button className="settings-help-btn" onClick={(e) => { e.stopPropagation(); setShowSettingsHelp(true); }}>?</button>
              </div>
            )}
            <button className="btn-primary btn-confirm-full" onClick={() => { setShowCropSheet(false); onConfirm(new Set(selected)); }}>
              Continue
            </button>
          </div>
        </>
      )}

      {showLimitDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Limit Reached</h2>
            <p>You can select up to {MAX_IMAGES} images at a time.</p>
            <div className="dialog-actions">
              <button className="btn-primary" onClick={() => setShowLimitDialog(false)}>OK</button>
            </div>
          </div>
        </div>
      )}

      {showSettingsHelp && (
        <div className="dialog-overlay" style={{ zIndex: 150 }} onClick={() => setShowSettingsHelp(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 300 }}>
            <h2>Where to find Settings</h2>
            <div style={{ margin: '12px 0', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 16, color: 'var(--text2)' }}>←</span>
                <span style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>PDF Tools</span>
                <span style={{ fontSize: 14, color: 'var(--text2)' }}>🔍</span>
                <span className="settings-help-highlight">⚙</span>
              </div>
              <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-around' }}>
                {[
                  { icon: <ImageToPdfIcon />, label: 'Image to PDF' },
                  { icon: <ScanToPdfIcon />, label: 'Scan' },
                  { icon: <IdCardIcon />, label: 'ID Card' },
                  { icon: <PdfToImageIcon />, label: 'PDF to Image' },
                ].map((t) => (
                  <div key={t.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ transform: 'scale(0.6)', transformOrigin: 'center' }}>{t.icon}</div>
                    <span style={{ fontSize: 8, color: 'var(--text2)', textAlign: 'center', maxWidth: 48 }}>{t.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="dialog-actions">
              <button className="btn-primary" onClick={() => setShowSettingsHelp(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}

      {/* Swipe multi-select onboarding guide */}
      {showGuide && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }} onClick={dismissGuide}>
          {/* Hand animation on the grid area */}
          <div style={{
            position: 'absolute', top: 155, left: 24,
            fontSize: 28, pointerEvents: 'none', zIndex: 201,
            transform: `translateX(${guideStep * 30}%)`,
            transition: 'transform 0.4s ease-out',
          }}>👆</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 80 }} onClick={(e) => e.stopPropagation()}>
            <p style={{ color: '#fff', fontSize: 16, fontWeight: 600, textAlign: 'center' }}>Swipe to select multiple</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center', padding: '0 32px' }}>Long press and drag across images to quickly select or deselect</p>
            <button className="btn-primary" style={{ padding: '10px 32px', marginTop: 8 }} onClick={dismissGuide}>Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}
