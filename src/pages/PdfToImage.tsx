import { useState } from 'react';

interface Props {
  onBack: () => void;
  defaultMode?: 'individual' | 'long';
}

type Step = 'mode' | 'pages' | 'converting' | 'done';
type OutputMode = 'individual' | 'long';
type OutputFormat = 'JPEG' | 'PNG';

const MOCK_PAGES = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, selected: true }));

export default function PdfToImage({ onBack, defaultMode }: Props) {
  const [step, setStep] = useState<Step>('mode');
  const [mode, setMode] = useState<OutputMode>(defaultMode || 'individual');
  const [format, setFormat] = useState<OutputFormat>('JPEG');
  const [pages, setPages] = useState(MOCK_PAGES);
  const [progress, setProgress] = useState(0);

  const togglePage = (id: number) => {
    setPages((prev) => prev.map((p) => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const startConvert = () => {
    setStep('converting');
    let p = 0;
    const timer = setInterval(() => {
      p += 15;
      setProgress(Math.min(p, 100));
      if (p >= 100) { clearInterval(timer); setTimeout(() => setStep('done'), 500); }
    }, 200);
  };

  if (step === 'mode') {
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={onBack}>←</button>
          <h1 className="topbar-title">PDF to Image</h1>
        </header>
        <div className="mode-body">
          <p className="mode-label">Output Mode</p>
          <div className="mode-cards">
            <button className={`mode-card ${mode === 'individual' ? 'active' : ''}`} onClick={() => setMode('individual')}>
              <span className="mode-icon">🖼</span>
              <span>Individual Images</span>
            </button>
            <button className={`mode-card ${mode === 'long' ? 'active' : ''}`} onClick={() => setMode('long')}>
              <span className="mode-icon">📜</span>
              <span>Long Image</span>
            </button>
          </div>
          <p className="mode-label">Output Format</p>
          <div className="toggle-group" style={{ padding: '0 16px' }}>
            {(['JPEG', 'PNG'] as OutputFormat[]).map((f) => (
              <button key={f} className={`toggle-btn ${format === f ? 'active' : ''}`} onClick={() => setFormat(f)}>{f}</button>
            ))}
          </div>
        </div>
        <div className="bottom-bar">
          <button className="btn-primary btn-confirm-full" onClick={() => setStep('pages')}>Next</button>
        </div>
      </div>
    );
  }

  if (step === 'pages') {
    const selectedCount = pages.filter((p) => p.selected).length;
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={() => setStep('mode')}>←</button>
          <h1 className="topbar-title">Select Pages</h1>
          <button className="btn-primary" disabled={selectedCount === 0} onClick={startConvert}>
            Convert ({selectedCount})
          </button>
        </header>
        <div className="pages-grid">
          {pages.map((p) => (
            <div key={p.id} className={`page-thumb ${p.selected ? 'selected' : ''}`} onClick={() => togglePage(p.id)}>
              <div className="page-thumb-inner">
                <span>Page {p.id}</span>
              </div>
              {p.selected && <span className="thumb-check">✓</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'converting') {
    return (
      <div className="page center-page">
        <div className="progress-wrap">
          <div className="progress-ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" className="ring-bg" />
              <circle cx="60" cy="60" r="52" className="ring-fg" strokeDasharray={`${(progress / 100) * 327} 327`} />
            </svg>
            <span className="progress-text">{progress}%</span>
          </div>
          <p className="progress-label">Converting...</p>
        </div>
      </div>
    );
  }

  // Done
  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={onBack}>←</button>
        <h1 className="topbar-title">Conversion Complete</h1>
      </header>
      <div className="done-card" style={{ flex: 1, justifyContent: 'center' }}>
        <div className="done-check">✓</div>
        <p className="done-success">Convert successfully!</p>
        <p className="pdf-meta">{pages.filter((p) => p.selected).length} images exported as {format}</p>
        <div className="done-actions">
          <button className="btn-primary btn-lg">Share</button>
          <button className="btn-secondary btn-lg">Save to Album</button>
        </div>
      </div>
    </div>
  );
}
