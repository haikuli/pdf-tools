import { useState } from 'react';

interface Props {
  onBack: () => void;
}

type Step = 'pages' | 'confirm' | 'progress' | 'done';

interface SplitTask { id: number; pages: number[]; name: string; }

const MOCK_PAGES = Array.from({ length: 8 }, (_, i) => i + 1);

export default function PdfSplit({ onBack }: Props) {
  const [step, setStep] = useState<Step>('pages');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [tasks, setTasks] = useState<SplitTask[]>([]);
  const [progress, setProgress] = useState(0);

  const togglePage = (p: number) => {
    setSelectedPages((prev) => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
  };

  const addTask = () => {
    if (selectedPages.size === 0) return;
    const pages = Array.from(selectedPages).sort((a, b) => a - b);
    const name = `Split_Document_${tasks.length + 1}`;
    setTasks((prev) => [...prev, { id: Date.now(), pages, name }]);
    setSelectedPages(new Set());
  };

  const removeTask = (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const startSplit = () => {
    setStep('progress');
    let p = 0;
    const timer = setInterval(() => {
      p += 15;
      setProgress(Math.min(p, 100));
      if (p >= 100) { clearInterval(timer); setTimeout(() => setStep('done'), 500); }
    }, 200);
  };

  if (step === 'pages') {
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={onBack}>←</button>
          <h1 className="topbar-title">Split PDF</h1>
          <button className="btn-primary" disabled={selectedPages.size === 0} onClick={() => { addTask(); setStep('confirm'); }}>
            Continue
          </button>
        </header>
        <p className="grid-hint" style={{ padding: '12px 16px 4px' }}>Select pages to extract</p>
        <div className="pages-grid">
          {MOCK_PAGES.map((p) => (
            <div key={p} className={`page-thumb ${selectedPages.has(p) ? 'selected' : ''}`} onClick={() => togglePage(p)}>
              <div className="page-thumb-inner"><span>Page {p}</span></div>
              {selectedPages.has(p) && <span className="thumb-check">✓</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={() => setStep('pages')}>←</button>
          <h1 className="topbar-title">Split Tasks</h1>
          <button className="btn-primary" disabled={tasks.length === 0} onClick={startSplit}>
            Split ({tasks.length})
          </button>
        </header>
        <div className="file-list" style={{ flex: 1 }}>
          {tasks.map((t) => (
            <div key={t.id} className="file-item">
              <div className="file-thumb">📄</div>
              <div className="file-info">
                <input className="split-name-input" value={t.name}
                  onChange={(e) => setTasks((prev) => prev.map((x) => x.id === t.id ? { ...x, name: e.target.value } : x))} />
                <span className="file-meta">Pages: {t.pages.join(', ')}</span>
              </div>
              <button className="btn-icon" onClick={() => removeTask(t.id)}>✕</button>
            </div>
          ))}
        </div>
        <div className="bottom-bar">
          <button className="btn-secondary" onClick={() => setStep('pages')}>+ Add more pages</button>
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
          <p className="progress-label">Splitting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={onBack}>←</button>
        <h1 className="topbar-title">Split Complete</h1>
      </header>
      <div className="done-card" style={{ flex: 1, justifyContent: 'center' }}>
        <div className="done-check">✓</div>
        <p className="done-success">Split successfully!</p>
        <p className="pdf-meta">{tasks.length} file(s) created</p>
        {tasks.map((t) => (
          <p key={t.id} className="pdf-name">{t.name}.pdf</p>
        ))}
        <div className="done-actions">
          <button className="btn-primary btn-lg">Open</button>
          <button className="btn-secondary btn-lg">Share</button>
        </div>
      </div>
    </div>
  );
}
