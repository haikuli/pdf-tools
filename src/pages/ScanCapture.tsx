import { useRef, useState, useEffect, useCallback } from 'react';
import { detectDocument, cropPerspective, isOpenCVReady } from '../utils/documentDetector';
import type { DetectedRect } from '../utils/documentDetector';

interface CapturedImage { id: string; url: string; }
interface Props { onDone: (images: CapturedImage[]) => void; onBack: () => void; onSwitchToIdCard?: () => void; }

let scanId = 0;

export default function ScanCapture({ onDone, onBack, onSwitchToIdCard }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const animRef = useRef<number>(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [captured, setCaptured] = useState<CapturedImage[]>([]);
  const [cvReady, setCvReady] = useState(false);
  const detectedRef = useRef<DetectedRect | null>(null);

  // Poll for OpenCV readiness
  useEffect(() => {
    const check = setInterval(() => {
      if (isOpenCVReady()) { setCvReady(true); clearInterval(check); }
    }, 500);
    return () => clearInterval(check);
  }, []);

  const startCamera = useCallback(() => {
    setCameraReady(false);
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
    }).then((s) => {
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCameraReady(true);
    }).catch(() => setCameraReady(false));
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
  }, []);

  const toggleFlash = () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) { const nf = !flashOn; track.applyConstraints({ advanced: [{ torch: nf } as any] }).catch(() => {}); setFlashOn(nf); }
  };

  useEffect(() => { startCamera(); return () => stopCamera(); }, [startCamera, stopCamera]);

  // Detection loop - run every 200ms instead of every frame
  useEffect(() => {
    if (!cameraReady || !cvReady) return;
    let running = true;
    const loop = () => {
      if (!running) return;
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const rect = detectDocument(videoRef.current);
        detectedRef.current = rect;
        drawOverlay(rect);
      }
      setTimeout(() => { if (running) animRef.current = requestAnimationFrame(loop); }, 150);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(animRef.current); };
  }, [cameraReady, cvReady]);

  const drawOverlay = (rect: DetectedRect | null) => {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!rect) return;
    // Scale video coords to display coords
    const sx = canvas.width / video.videoWidth;
    const sy = canvas.height / video.videoHeight;
    ctx.beginPath();
    ctx.moveTo(rect.points[0][0] * sx, rect.points[0][1] * sy);
    for (let i = 1; i < 4; i++) ctx.lineTo(rect.points[i][0] * sx, rect.points[i][1] * sy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(108, 92, 231, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#6c5ce7';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Corner dots
    for (const p of rect.points) {
      ctx.beginPath();
      ctx.arc(p[0] * sx, p[1] * sy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#6c5ce7';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const rect = detectedRef.current;
    let dataUrl: string | null = null;
    if (rect) {
      dataUrl = cropPerspective(videoRef.current, rect.points);
    }
    if (!dataUrl) {
      // Fallback: full frame
      const v = videoRef.current;
      const c = document.createElement('canvas');
      c.width = v.videoWidth; c.height = v.videoHeight;
      c.getContext('2d')!.drawImage(v, 0, 0);
      dataUrl = c.toDataURL('image/jpeg', 0.92);
    }
    fetch(dataUrl).then(r => r.blob()).then(blob => {
      const url = URL.createObjectURL(blob);
      setCaptured((prev) => [...prev, { id: `scan-${++scanId}`, url }]);
    });
  };

  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    files.forEach((f) => {
      const url = URL.createObjectURL(f);
      setCaptured((prev) => [...prev, { id: `scan-${++scanId}`, url }]);
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
        <h1 className="topbar-title">Scan</h1>
        <button className="btn-icon" onClick={() => setShowGrid(!showGrid)}>{showGrid ? "▦" : "▣"}</button>
        <button className="btn-icon" onClick={toggleFlash}>{flashOn ? "⚡" : "🔦"}</button>
        {!cvReady && <span style={{fontSize:11,color:'var(--text2)'}}>Loading CV...</span>}
      </header>
      <div className="scan-capture-body">
        <div className="camera-preview">
          <video ref={videoRef} autoPlay playsInline muted className="camera-video" />
          <canvas ref={overlayRef} className="detection-overlay" />
          {showGrid && <div className="camera-grid"><div className="grid-h" style={{top:"33.3%"}} /><div className="grid-h" style={{top:"66.6%"}} /><div className="grid-v" style={{left:"33.3%"}} /><div className="grid-v" style={{left:"66.6%"}} /></div>}
        </div>
        {onSwitchToIdCard && (
          <div className="scan-mode-tabs">
            <span className="scan-mode-tab active">Scan</span>
            <span className="scan-mode-tab" onClick={() => { stopCamera(); onSwitchToIdCard(); }}>ID Card</span>
          </div>
        )}
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
