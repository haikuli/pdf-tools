import { useRef, useState, useEffect, useCallback } from 'react';

interface CapturedImage { id: string; url: string; }
interface Props { onDone: (images: CapturedImage[]) => void; onBack: () => void; }

let camId = 0;

export default function SimpleCamera({ onDone, onBack }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [captured, setCaptured] = useState<CapturedImage[]>([]);

  const startCamera = useCallback(() => {
    setCameraReady(false);
    setCameraDenied(false);
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
    }).then((s) => {
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCameraReady(true);
    }).catch(() => { setCameraReady(false); setCameraDenied(true); });
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  }, []);

  const toggleFlash = () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) { const nf = !flashOn; track.applyConstraints({ advanced: [{ torch: nf } as any] }).catch(() => {}); setFlashOn(nf); }
  };

  useEffect(() => { startCamera(); return () => stopCamera(); }, [startCamera, stopCamera]);

  const handleCapture = () => {
    if (!videoRef.current) return;
    const v = videoRef.current;
    const c = document.createElement('canvas');
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d')!.drawImage(v, 0, 0);
    c.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setCaptured((prev) => [...prev, { id: `cam-${++camId}`, url }]);
    }, 'image/jpeg', 0.92);
  };

  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    files.forEach((f) => {
      const url = URL.createObjectURL(f);
      setCaptured((prev) => [...prev, { id: `cam-${++camId}`, url }]);
    });
    e.target.value = '';
  };

  const [showQuitDialog, setShowQuitDialog] = useState(false);

  const handleBack = () => {
    if (captured.length > 0) {
      setShowQuitDialog(true);
    } else {
      stopCamera(); onBack();
    }
  };
  const confirmQuit = () => { setShowQuitDialog(false); stopCamera(); onBack(); };
  const handleNext = () => { stopCamera(); onDone(captured); };

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={handleBack}>←</button>
        <div style={{flex:1}} />
        <button className="btn-icon" onClick={() => setShowGrid(!showGrid)}>{showGrid ? '▦' : '▣'}</button>
        <button className="btn-icon" onClick={toggleFlash}>{flashOn ? '⚡' : '🔦'}</button>
      </header>
      <div className="scan-capture-body">
        <div className="camera-preview">
          <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
          {cameraDenied && (
            <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,color:'#fff',padding:24,textAlign:'center'}}>
              <span style={{fontSize:32}}>📷</span>
              <p style={{fontSize:14,fontWeight:600}}>Camera access denied</p>
              <p style={{fontSize:12,color:'rgba(255,255,255,0.6)'}}>Please enable camera permission in your browser or device settings, then try again.</p>
              <button className="btn-primary" style={{marginTop:8}} onClick={startCamera}>Retry</button>
            </div>
          )}
          {showGrid && <div className="camera-grid"><div className="grid-h" style={{top:'33.3%'}} /><div className="grid-h" style={{top:'66.6%'}} /><div className="grid-v" style={{left:'33.3%'}} /><div className="grid-v" style={{left:'66.6%'}} /></div>}
        </div>
        <div className="scan-bottom-row">
          <div className="scan-thumbs">
            {captured.length === 0 ? (
              <button className="scan-btn-secondary" onClick={() => galleryRef.current?.click()}>Album</button>
            ) : (
              <>
                {captured.slice(-3).map((img) => (
                  <div key={img.id} className="scan-thumb-item"><img src={img.url} alt="" /></div>
                ))}
                <span className="scan-thumb-num">{captured.length}</span>
              </>
            )}
          </div>
          <button className="scan-btn-capture" onClick={handleCapture} disabled={!cameraReady}>
            <span className="capture-ring" />
          </button>
          {captured.length > 0 ? (
            <button className="scan-next-btn" onClick={handleNext}>Next ({captured.length})</button>
          ) : (<div style={{width:72}} />)}
        </div>
      </div>
      <input ref={galleryRef} type="file" accept="image/*" multiple hidden onChange={handleGallery} />
      {showQuitDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Discard photos?</h2>
            <p>Your captured photos will not be saved.</p>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setShowQuitDialog(false)}>Cancel</button>
              <button className="btn-danger" onClick={confirmQuit}>Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
