import { useState, useRef, useEffect, useCallback } from 'react';
import CropOverlay from '../components/CropOverlay';
import { ALL_MOCK_IMAGES } from './ImagePicker';

interface Props { onComplete: (f: string, b: string | null) => void; onBack: () => void; onSwitchToScan?: () => void; }
type Mode = 'id-card' | 'passport' | 'single';
type Step = 'notice' | 'mode-select' | 'shoot' | 'album-pick' | 'preview' | 'adjust' | 'naming' | 'progress' | 'done';
type Side = 'front' | 'back';

export default function IdCardScan({ onComplete: _onComplete, onBack, onSwitchToScan }: Props) {
  const [step, setStep] = useState<Step>('mode-select');
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(true);
  const [mode, setMode] = useState<Mode>('id-card');
  const [modeConfirmed, setModeConfirmed] = useState(false);
  const [side, setSide] = useState<Side>('front');
  const [frontUrl, setFrontUrl] = useState<string|null>(null);
  const [backUrl, setBackUrl] = useState<string|null>(null);
  const [adjustIdx, setAdjustIdx] = useState<0|1>(0);
  const [rots, setRots] = useState([0,0]);
  const [flashOn, setFlashOn] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [filter, setFilter] = useState<'original'|'bw'|'gray'|'magic'>('original');
  const [showSheet, setShowSheet] = useState<null|'retake'|'crop'|'filter'>(null);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const adjustCanvasRef = useRef<HTMLCanvasElement>(null);
  const adjustWrapRef = useRef<HTMLDivElement>(null);
  const [pdfName, setPdfName] = useState(()=>`IDCard_${new Date().toISOString().slice(0,10).replace(/-/g,'')}`);
  const [progress, setProgress] = useState(0);
  const [showDonePreview, setShowDonePreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream|null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [camReady, setCamReady] = useState(false);
  const [sideToast, setSideToast] = useState<string | null>(null);
  const touchStartX = useRef(0);
  const [retaking, setRetaking] = useState(false);

  // Album picker state for 2-image selection
  const [albumSelected, setAlbumSelected] = useState<string[]>([]);
  const [albumFolder, setAlbumFolder] = useState<string>('All Photos');

  const needsTwoImages = mode === 'id-card';

  // Mock album images grouped by folder
  const albumFolders = ['All Photos', 'Camera', 'Screenshots', 'Downloads', 'Favorites'];
  const albumImages = ALL_MOCK_IMAGES.filter(img => {
    if (albumFolder === 'All Photos') return true;
    const prefix = albumFolder === 'Camera' ? 'cam' : albumFolder === 'Screenshots' ? 'ss' : albumFolder === 'Downloads' ? 'dl' : 'fav';
    return img.id.startsWith(prefix);
  });

  const startCam = useCallback(()=>{setCamReady(false);navigator.mediaDevices.getUserMedia({video:{facingMode:'environment',width:{ideal:1920},height:{ideal:1080}}}).then(s=>{streamRef.current=s;if(videoRef.current)videoRef.current.srcObject=s;setCamReady(true);}).catch(()=>setCamReady(false));},[]);
  const stopCam = useCallback(()=>{if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}},[]);
  const toggleFlash = useCallback(()=>{if(!streamRef.current)return;const t=streamRef.current.getVideoTracks()[0];if(t){const n=!flashOn;t.applyConstraints({advanced:[{torch:n}as any]}).catch(()=>{});setFlashOn(n);}},[flashOn]);

  useEffect(()=>{if(step==='mode-select'||step==='shoot')startCam();else stopCam();return()=>stopCam();},[step,startCam,stopCam]);

  // Adjust image drawing
  const adjustUrl = adjustIdx===0 ? frontUrl : backUrl;
  useEffect(() => {
    if (step !== 'adjust' || !adjustUrl || !adjustCanvasRef.current) return;
    setCanvasReady(false);
    const canvas = adjustCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const image = new Image();
    if (adjustUrl.startsWith('http')) image.crossOrigin = 'anonymous';
    image.onload = () => {
      const rot = rots[adjustIdx] % 360;
      const swap = rot === 90 || rot === 270;
      canvas.width = swap ? image.height : image.width;
      canvas.height = swap ? image.width : image.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(image, -image.width / 2, -image.height / 2);
      ctx.restore();
      setCanvasReady(true);
    };
    image.src = adjustUrl;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, adjustUrl, adjustIdx, rots[adjustIdx]]);

  // Handle perspective crop from adjust
  useEffect(() => {
    if (step !== 'adjust') return;
    const el = adjustWrapRef.current;
    if (!el) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.url) {
        if (adjustIdx === 0) setFrontUrl(detail.url); else setBackUrl(detail.url);
        setRots(p => { const n = [...p]; n[adjustIdx] = 0; return n; });
        setCropping(false);
      }
    };
    el.addEventListener('perspectiveCrop', handler);
    return () => el.removeEventListener('perspectiveCrop', handler);
  });

  const capture=()=>{
    if(!videoRef.current)return;
    const v=videoRef.current;
    const vw=v.videoWidth, vh=v.videoHeight;
    const full=document.createElement('canvas');
    full.width=vw; full.height=vh;
    full.getContext('2d')!.drawImage(v,0,0);
    const isP=mode==='passport';
    const fL=isP?0.08:0.05, fR=isP?0.08:0.05;
    const fW=1-fL-fR;
    let cropX=Math.round(vw*fL), cropW=Math.round(vw*fW), cropY:number, cropH:number;
    if(isP){
      cropY=Math.round(vh*0.1); cropH=Math.round(vh*0.8);
    }else{
      cropH=Math.round(cropW/1.586);
      cropY=Math.round((vh-cropH)/2);
    }
    cropX=Math.max(0,cropX); cropY=Math.max(0,cropY);
    cropW=Math.min(cropW,vw-cropX); cropH=Math.min(cropH,vh-cropY);
    const out=document.createElement('canvas');
    out.width=cropW; out.height=cropH;
    out.getContext('2d')!.drawImage(full,cropX,cropY,cropW,cropH,0,0,cropW,cropH);
    out.toBlob(b=>{
      if(!b)return;const u=URL.createObjectURL(b);
      if(mode==='passport'){
        const halfH=Math.round(cropH/2);
        const topC=document.createElement('canvas');
        topC.width=cropW;topC.height=halfH;
        topC.getContext('2d')!.drawImage(out,0,0,cropW,halfH,0,0,cropW,halfH);
        const botC=document.createElement('canvas');
        botC.width=cropW;botC.height=halfH;
        botC.getContext('2d')!.drawImage(out,0,halfH,cropW,halfH,0,0,cropW,halfH);
        topC.toBlob(tb=>{
          if(!tb)return;
          const topUrl=URL.createObjectURL(tb);
          setFrontUrl(topUrl);
          botC.toBlob(bb=>{
            if(!bb)return;
            const botUrl=URL.createObjectURL(bb);
            setBackUrl(botUrl);
            setStep('preview');
          },'image/jpeg',0.92);
        },'image/jpeg',0.92);
        return;
      }
      if(side==='front'){setFrontUrl(u);if(mode==='single'||retaking){setRetaking(false);setStep('preview');}else{setSide('back');setSideToast('Front side captured! Now scan the back side.');setTimeout(()=>setSideToast(null),2500);}}
      else{setBackUrl(u);setRetaking(false);setStep('preview');}
    },'image/jpeg',0.92);
  };

  // Single-file gallery handler (for single mode or retake)
  const handleGallery=(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const u=URL.createObjectURL(f);if(side==='front'){setFrontUrl(u);if(mode==='single'||retaking){setRetaking(false);setStep('preview');}else{setSide('back');setSideToast('Front side captured! Now scan the back side.');setTimeout(()=>setSideToast(null),2500);}}else{setBackUrl(u);setRetaking(false);setStep('preview');}e.target.value='';};

  const toggleAlbumSelect = (id: string) => {
    setAlbumSelected(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      const maxSelect = needsTwoImages ? 2 : 1;
      if (prev.length >= maxSelect) return prev;
      return [...prev, id];
    });
  };

  const confirmAlbumPick = () => {
    const requiredCount = needsTwoImages ? 2 : 1;
    if (albumSelected.length !== requiredCount) return;
    const img0 = ALL_MOCK_IMAGES.find(i => i.id === albumSelected[0]);
    if (needsTwoImages) {
      const img1 = ALL_MOCK_IMAGES.find(i => i.id === albumSelected[1]);
      if (img0) setFrontUrl(img0.url);
      if (img1) setBackUrl(img1.url);
    } else {
      // Passport & Single: 1 image
      if (img0) setFrontUrl(img0.url);
      setBackUrl(null);
    }
    setAlbumSelected([]);
    setStep('preview');
  };

  const goBack=()=>{stopCam();onBack();};
  const rotate=()=>setRots(p=>{const n=[...p];n[adjustIdx]=(n[adjustIdx]+90)%360;return n;});
  const flt=filter==='bw'?'grayscale(1) contrast(2)':filter==='gray'?'grayscale(1)':filter==='magic'?'contrast(1.3) brightness(1.1) saturate(0.3)':'none';

  // Handle back from shoot page
  const handleShootBack = () => {
    // If front is captured (mid-capture for 2-sided modes), warn user
    if (frontUrl && !retaking && mode !== 'single') {
      setShowQuitDialog(true);
    } else {
      setStep('mode-select'); setModeConfirmed(false);
    }
  };

  // ===== MODE SELECT PAGE =====
  if(step==='mode-select')return(
    <div className="page">
      <header className="topbar"><button className="btn-icon" onClick={goBack}>←</button><h1 className="topbar-title"></h1><button className="btn-icon" onClick={()=>setShowGrid(!showGrid)}>{showGrid?'▦':'▣'}</button><button className="btn-icon" onClick={toggleFlash}>{flashOn?'⚡':'🔦'}</button></header>
      <div className="scan-capture-body">
        <div className="camera-preview">
          <video ref={videoRef} autoPlay playsInline muted className="camera-video"/>
          {showGrid && <div className="camera-grid"><div className="grid-h" style={{top:'33.3%'}} /><div className="grid-h" style={{top:'66.6%'}} /><div className="grid-v" style={{left:'33.3%'}} /><div className="grid-v" style={{left:'66.6%'}} /></div>}
          <div className="idcard-overlay-card">
            {mode==='id-card'&&<div className="guide-pdf-preview">
              <div className="mock-id-card">
                <div className="mock-id-photo" />
                <div className="mock-id-info"><div className="mock-id-line" style={{width:'70%'}} /><div className="mock-id-line" style={{width:'50%'}} /><div className="mock-id-line" style={{width:'60%'}} /></div>
                <div className="mock-id-barcode" />
              </div>
              <div className="mock-id-card">
                <div className="mock-id-lines-full"><div className="mock-id-line" style={{width:'90%'}} /><div className="mock-id-line" style={{width:'80%'}} /><div className="mock-id-line" style={{width:'85%'}} /><div className="mock-id-line" style={{width:'70%'}} /></div>
                <div className="mock-id-barcode" />
              </div>
            </div>}
            {mode==='passport'&&<div className="guide-pdf-preview">
              <div className="mock-passport">
                <div className="mock-pp-header" />
                <div className="mock-pp-body">
                  <div className="mock-pp-photo" />
                  <div className="mock-pp-info"><div className="mock-id-line" style={{width:'90%'}} /><div className="mock-id-line" style={{width:'70%'}} /><div className="mock-id-line" style={{width:'80%'}} /><div className="mock-id-line" style={{width:'60%'}} /></div>
                </div>
                <div className="mock-pp-mrz"><div className="mock-id-line" style={{width:'100%',height:3}} /><div className="mock-id-line" style={{width:'100%',height:3}} /></div>
              </div>
            </div>}
            {mode==='single'&&<div className="guide-pdf-preview">
              <div className="mock-id-card">
                <div className="mock-id-photo" />
                <div className="mock-id-info"><div className="mock-id-line" style={{width:'70%'}} /><div className="mock-id-line" style={{width:'50%'}} /><div className="mock-id-line" style={{width:'60%'}} /></div>
                <div className="mock-id-barcode" />
              </div>
            </div>}
          </div>
          <div className="idcard-guide-overlay-bottom">
            <div className="idcard-mode-tabs">
              {([['id-card','ID Card'],['passport','Passport'],['single','Single Side']]as const).map(([k,l])=>(
                <button key={k} className={`idcard-mode-tab ${mode===k?'active':''}`} onClick={()=>{setMode(k);setSide('front');setFrontUrl(null);setBackUrl(null);}}>{l}</button>
              ))}
            </div>
            <button className="btn-primary" style={{width:'80%',padding:14,fontSize:16,borderRadius:24}} onClick={()=>{setModeConfirmed(true);setSide('front');setFrontUrl(null);setBackUrl(null);setStep('shoot');}}>Start Scan</button>
          </div>
        </div>
        {onSwitchToScan && (
          <div className="scan-mode-tabs">
            <span className="scan-mode-tab" onClick={() => { stopCam(); onSwitchToScan(); }}>Scan</span>
            <span className="scan-mode-tab active">ID Card</span>
          </div>
        )}
        <div className="scan-capture-actions">
          <button className="scan-btn-secondary" disabled={!modeConfirmed} style={{opacity:modeConfirmed?1:0.4}} onClick={()=>galleryRef.current?.click()}>Album</button>
          <button className="scan-btn-capture" disabled={!modeConfirmed} style={{opacity:modeConfirmed?1:0.4}} onClick={()=>{setSide('front');setFrontUrl(null);setBackUrl(null);setStep('shoot');}}><span className="capture-ring"/></button>
          <div style={{width:64}}/>
        </div>
        <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handleGallery}/>
      </div>
      {showPrivacyNotice && (
        <div className="dialog-overlay" style={{ zIndex: 150 }}>
          <div className="dialog">
            <h2>Privacy Notice</h2>
            <p>Your ID card images are processed entirely on your device. No images are uploaded.</p>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={goBack}>Cancel</button>
              <button className="btn-primary" onClick={() => setShowPrivacyNotice(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ===== SHOOT PAGE =====
  if(step==='shoot'){
    const isP=mode==='passport';
    return(
      <div className="page">
        <header className="topbar"><button className="btn-icon" onClick={handleShootBack}>←</button><h1 className="topbar-title">{mode==='passport'?'Passport':mode==='single'?'Single Side':side==='front'?'Front Side':'Back Side'}</h1><button className="btn-icon" onClick={()=>setShowGrid(!showGrid)}>{showGrid?'▦':'▣'}</button><button className="btn-icon" onClick={toggleFlash}>{flashOn?'⚡':'🔦'}</button></header>
        <div className="scan-capture-body">
          <div className="camera-preview">
            <video ref={videoRef} autoPlay playsInline muted className="camera-video"/>
            {showGrid && <div className="camera-grid"><div className="grid-h" style={{top:'33.3%'}} /><div className="grid-h" style={{top:'66.6%'}} /><div className="grid-v" style={{left:'33.3%'}} /><div className="grid-v" style={{left:'66.6%'}} /></div>}
            {!isP&&<div className="idcard-frame"><div className="viewfinder-corner vf-tl"/><div className="viewfinder-corner vf-tr"/><div className="viewfinder-corner vf-bl"/><div className="viewfinder-corner vf-br"/></div>}
            {isP&&<div className="passport-frame-overlay"><div className="passport-half"><span className="passport-label">Previous Page</span></div><div className="passport-divider"/><div className="passport-half"><span className="passport-label">Next Page</span></div></div>}
          </div>
          <div className="scan-capture-actions">
            <button className="scan-btn-secondary" onClick={()=>{
              if (retaking) {
                // Retake uses single file picker
                galleryRef.current?.click();
              } else if (needsTwoImages && !frontUrl) {
                // First pick for 2-image mode: go to album picker
                setAlbumSelected([]);
                setAlbumFolder('All Photos');
                setStep('album-pick');
              } else if (!needsTwoImages) {
                // Single mode: also go to mock album picker (1 image)
                setAlbumSelected([]);
                setAlbumFolder('All Photos');
                setStep('album-pick');
              } else {
                // Already have front, picking back via single file
                galleryRef.current?.click();
              }
            }}>Album</button>
            <button className="scan-btn-capture" onClick={capture} disabled={!camReady}><span className="capture-ring"/></button>
            <div style={{width:64}}/>
          </div>
        </div>
        <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handleGallery}/>
        {sideToast && <div className="picker-toast">{sideToast}</div>}
        {showQuitDialog && (
          <div className="dialog-overlay">
            <div className="dialog">
              <h2>Discard photo?</h2>
              <p>Your captured front side photo will not be saved.</p>
              <div className="dialog-actions">
                <button className="btn-secondary" onClick={() => setShowQuitDialog(false)}>Cancel</button>
                <button className="btn-danger" onClick={() => { setShowQuitDialog(false); setFrontUrl(null); setBackUrl(null); setSide('front'); setModeConfirmed(false); setStep('mode-select'); }}>Discard</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== ALBUM PICKER (mock 2-image selection) =====
  if(step==='album-pick'){
    const requiredCount = needsTwoImages ? 2 : 1;
    return(
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={()=>{setAlbumSelected([]);setStep('shoot');}}>←</button>
          <h1 className="topbar-title">Select {requiredCount === 2 ? '2 Images' : 'Image'}</h1>
        </header>
        <div className="folder-dropdown-wrap">
          <select className="folder-dropdown" value={albumFolder} onChange={e=>setAlbumFolder(e.target.value)}>
            {albumFolders.map(f=><option key={f} value={f}>{f}</option>)}
          </select>
          <span className="dropdown-arrow">▾</span>
        </div>
        <div className="picker-grid">
          {albumImages.map((img) => {
            const selIdx = albumSelected.indexOf(img.id);
            const isSelected = selIdx !== -1;
            return (
              <div key={img.id} className={`picker-thumb ${isSelected ? 'selected' : ''}`} onClick={()=>toggleAlbumSelect(img.id)}>
                <img src={img.url} alt={img.name} />
                {isSelected && (
                  <div className="thumb-order">{selIdx + 1}</div>
                )}
              </div>
            );
          })}
        </div>
        <div className="bottom-bar" style={{flexDirection:'column',gap:8}}>
          {albumSelected.length > 0 && requiredCount === 2 && (
            <div style={{display:'flex',gap:12,alignItems:'center',width:'100%',justifyContent:'center'}}>
              {albumSelected.map((imgId, i) => {
                const img = ALL_MOCK_IMAGES.find(m=>m.id===imgId);
                return img ? (
                  <div key={i} style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:12,color:'var(--text2)'}}>{i===0?'Front':'Back'}</span>
                    <div style={{width:40,height:40,borderRadius:6,overflow:'hidden',border:'2px solid var(--primary)'}}>
                      <img src={img.url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          )}
          <button
            className="btn-primary btn-confirm-full"
            disabled={albumSelected.length !== requiredCount}
            onClick={confirmAlbumPick}
          >
            Confirm ({albumSelected.length}/{requiredCount})
          </button>
        </div>
      </div>
    );
  }

  // ===== PREVIEW =====
  if(step==='preview')return(
    <div className="page">
      <header className="topbar"><button className="btn-icon" onClick={()=>setShowQuitDialog(true)}>←</button><h1 className="topbar-title">Preview</h1></header>
      <div className="idcard-a4-page"><div className="idcard-a4-inner">
        {frontUrl&&<img src={frontUrl} alt="F" style={{transform:`rotate(${rots[0]}deg)`,filter:flt}}/>}
        {backUrl&&<img src={backUrl} alt="B" style={{transform:`rotate(${rots[1]}deg)`,filter:flt}}/>}
      </div></div>
      <div className="bottom-bar editor-bar">
        <button className="bar-btn" onClick={()=>{setAdjustIdx(0);setStep('adjust');}}><span className="bar-icon">✏️</span><span>Edit</span></button>
        <button className="bar-btn" onClick={()=>setShowSheet('filter')}><span className="bar-icon">🎨</span><span>Filter</span></button>
        <button className="btn-primary" style={{marginLeft:'auto'}} onClick={()=>setStep('naming')}>Convert</button>
      </div>
      {showSheet==='filter'&&<><div className="sheet-backdrop" onClick={()=>setShowSheet(null)}/><div className="bottom-sheet"><h2>Choose Filter</h2><div className="filter-sheet-options">
        {([['original','Original'],['magic','Magic'],['gray','Grayscale'],['bw','B&W']]as const).map(([k,l])=>(
          <button key={k} className={`filter-sheet-option ${filter===k?'active':''}`} onClick={()=>{setFilter(k);setShowSheet(null);}}>
            {frontUrl&&<img src={frontUrl} className="filter-sheet-thumb" style={{filter:k==='bw'?'grayscale(1) contrast(2)':k==='gray'?'grayscale(1)':k==='magic'?'contrast(1.3) brightness(1.1) saturate(0.3)':'none'}}/>}
            <span>{l}</span></button>
        ))}
      </div></div></>}
      {showQuitDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Quit?</h2>
            <p>Your current progress will be lost. Are you sure you want to quit?</p>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setShowQuitDialog(false)}>Cancel</button>
              <button className="btn-danger" onClick={() => { setShowQuitDialog(false); goBack(); }}>Quit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ===== NAMING =====
  if(step==='naming')return(
    <div className="page center-page"><div className="sheet-backdrop" onClick={()=>setStep('preview')}/><div className="bottom-sheet"><h2>Name Your PDF</h2>
      <input type="text" className="name-input" value={pdfName} onChange={e=>setPdfName(e.target.value)} autoFocus/>
      <div className="dialog-actions"><button className="btn-secondary" onClick={()=>setStep('preview')}>Cancel</button>
        <button className="btn-primary" disabled={!pdfName.trim()} onClick={()=>{setStep('progress');let p=0;const t=setInterval(()=>{p+=20;setProgress(Math.min(p,100));if(p>=100){clearInterval(t);setTimeout(()=>setStep('done'),600);}},200);}}>Convert</button>
      </div></div></div>
  );

  // ===== PROGRESS =====
  if(step==='progress')return(
    <div className="page center-page"><div className="progress-wrap"><div className="progress-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" className="ring-bg"/><circle cx="60" cy="60" r="52" className={progress>=100?'ring-done':'ring-fg'} strokeDasharray={`${(progress/100)*327} 327`}/></svg><span className="progress-text">{progress>=100?'✓':`${progress}%`}</span></div><p className="progress-label">{progress>=100?'Done!':'Creating PDF...'}</p></div></div>
  );

  // ===== DONE =====
  if(step==='done'){
    if(showDonePreview){
      return(
        <div className="page">
          <header className="topbar"><button className="btn-icon" onClick={()=>setShowDonePreview(false)}>←</button><h1 className="topbar-title">{pdfName}.pdf</h1></header>
          <div style={{flex:1,overflowY:'auto',background:'#f5f5f5',padding:16,display:'flex',flexDirection:'column',alignItems:'center',gap:16}}>
            {frontUrl&&<div style={{width:'85%',aspectRatio:'3/4',borderRadius:4,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.15)',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}><img src={frontUrl} alt="Front" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}}/></div>}
            {backUrl&&<div style={{width:'85%',aspectRatio:'3/4',borderRadius:4,overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.15)',background:'#fff',display:'flex',alignItems:'center',justifyContent:'center'}}><img src={backUrl} alt="Back" style={{maxWidth:'100%',maxHeight:'100%',objectFit:'contain'}}/></div>}
          </div>
        </div>
      );
    }
    return(
      <div className="page"><header className="topbar"><button className="btn-icon" onClick={onBack}>←</button><h1 className="topbar-title">PDF Converted</h1></header>
        <div className="done-card" style={{flex:1,justifyContent:'center'}}><div className="done-check">✓</div><p className="done-success">Converted successfully!</p><div className="pdf-preview"><img src="https://picsum.photos/seed/idcarddone/140/180" alt="PDF" className="pdf-thumb" /></div><p className="pdf-name">{pdfName}.pdf</p><p className="pdf-meta">Documents/MXPlayer/PDF/</p>
          <div className="done-actions"><button className="btn-primary btn-lg" onClick={onBack}>Share</button><button className="btn-secondary btn-lg" onClick={()=>setShowDonePreview(true)}>Open</button></div></div></div>
    );
  }

  // ===== ADJUST (Edit) =====
  const images = [frontUrl, backUrl].filter(Boolean) as string[];
  const handleSwipe = (dir: 'left' | 'right') => {
    if (dir === 'left' && adjustIdx === 0 && images.length > 1) setAdjustIdx(1);
    if (dir === 'right' && adjustIdx === 1) setAdjustIdx(0);
  };

  const handleAdjustCrop = (cropRect: { x: number; y: number; w: number; h: number }) => {
    if (!adjustCanvasRef.current) return;
    const canvas = adjustCanvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(cropRect.x, cropRect.y, cropRect.w, cropRect.h);
    const newCanvas = document.createElement('canvas');
    newCanvas.width = cropRect.w;
    newCanvas.height = cropRect.h;
    newCanvas.getContext('2d')!.putImageData(imageData, 0, 0);
    newCanvas.toBlob((blob) => {
      if (!blob) return;
      const newUrl = URL.createObjectURL(blob);
      if (adjustIdx === 0) setFrontUrl(newUrl); else setBackUrl(newUrl);
      setRots(p => { const n = [...p]; n[adjustIdx] = 0; return n; });
      setCropping(false);
    }, 'image/png');
  };

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (cropping) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) handleSwipe('left');
    else if (dx > 50) handleSwipe('right');
  };

  return(
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={()=>{setCropping(false);setStep('preview');}}>←</button>
        <h1 className="topbar-title">Edit</h1>
        <button className="btn-primary" onClick={()=>{setCropping(false);setStep('preview');}}>Done</button>
      </header>
      <div className="editor-canvas-wrap" ref={adjustWrapRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div className="editor-image-container">
          <canvas ref={adjustCanvasRef} className="editor-canvas" />
        </div>
        {cropping && (
          <CropOverlay
            containerRef={adjustWrapRef}
            onApply={handleAdjustCrop}
            onCancel={() => setCropping(false)}
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="editor-nav-row">
          <div className="editor-nav-center">
            <button className="page-arrow" disabled={adjustIdx===0} onClick={()=>setAdjustIdx(0)}>‹</button>
            <span className="editor-page-indicator">{adjustIdx + 1}/{images.length}</span>
            <button className="page-arrow" disabled={adjustIdx>=images.length-1} onClick={()=>setAdjustIdx(1)}>›</button>
          </div>
        </div>
      )}
      <div className="bottom-bar editor-bar">
        <button className="bar-btn" onClick={rotate} disabled={cropping}>
          <span className="bar-icon">↻</span><span>Rotate</span>
        </button>
        <button className={`bar-btn ${cropping ? 'bar-btn-active' : ''}`} onClick={() => setCropping(!cropping)} disabled={!canvasReady}>
          <span className="bar-icon">✂</span><span>Crop</span>
        </button>
        <button className="bar-btn" onClick={()=>{setCropping(false);setRetaking(true);setSide(adjustIdx===0?'front':'back');setStep('shoot');}} disabled={cropping}>
          <span className="bar-icon">📷</span><span>Retake</span>
        </button>
      </div>
    </div>
  );
}
