import { useState } from 'react';

interface Props {
  onBack: () => void;
}

type Step = 'level' | 'progress' | 'done';
type Level = 'small' | 'medium' | 'large';

const LEVELS: { key: Level; label: string; desc: string }[] = [
  { key: 'small', label: 'Small Size', desc: 'Low quality · Maximum compression' },
  { key: 'medium', label: 'Medium Size', desc: 'Good quality · Balanced' },
  { key: 'large', label: 'Large Size', desc: 'Best quality · Minimal compression' },
];

export default function PdfCompress({ onBack }: Props) {
  const [step, setStep] = useState<Step>('level');
  const [level, setLevel] = useState<Level>('medium');
  const [progress, setProgress] = useState(0);

  const startCompress = () => {
    setStep('progress');
    let p = 0;
    const timer = setInterval(() => {
      p += 12;
      setProgress(Math.min(p, 100));
      if (p >= 100) { clearInterval(timer); setTimeout(() => setStep('done'), 500); }
    }, 200);
  };

  if (step === 'level') {
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={onBack}>←</button>
          <h1 className="topbar-title">Compress PDF</h1>
        </header>
        <div className="compress-body">
          <div className="compress-file-info">
            <span className="file-thumb">📄</span>
            <div>
              <p className="file-name">Document.pdf</p>
              <p className="file-meta">5.2 MB · Documents/</p>
            </div>
          </div>
          <p className="mode-label">Compression Level</p>
          {LEVELS.map((l) => (
            <button key={l.key} className={`compress-option ${level === l.key ? 'active' : ''}`} onClick={() => setLevel(l.key)}>
              <span className="compress-radio">{level === l.key ? '●' : '○'}</span>
              <div>
                <span className="compress-option-title">{l.label}</span>
                <span className="compress-option-desc">{l.desc}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="bottom-bar">
          <button className="btn-primary btn-confirm-full" onClick={startCompress}>Compress</button>
        </div>
      </div>
    );
  }

  if (step === 'progress') {
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
          <p className="progress-label">Compressing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={onBack}>←</button>
        <h1 className="topbar-title">Compressed</h1>
      </header>
      <div className="done-card" style={{ flex: 1, justifyContent: 'center' }}>
        <div className="done-check">✓</div>
        <p className="done-success">Reduced by 62%</p>
        <p className="pdf-meta">5.2 MB → 2.0 MB</p>
        <p className="pdf-name">Document_compressed.pdf</p>
        <p className="pdf-meta">Documents/</p>
        <div className="done-actions">
          <button className="btn-primary btn-lg">Open</button>
          <button className="btn-secondary btn-lg">Share</button>
        </div>
      </div>
    </div>
  );
}
