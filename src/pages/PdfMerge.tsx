import { useState, useRef } from 'react';

interface Props {
  onBack: () => void;
}

type Step = 'select' | 'order' | 'progress' | 'done';

interface MergeFile { id: string; name: string; size: string; }

const MOCK = [
  { id: 'm1', name: 'Report_Q1.pdf', size: '1.2 MB' },
  { id: 'm2', name: 'Report_Q2.pdf', size: '980 KB' },
  { id: 'm3', name: 'Summary.pdf', size: '340 KB' },
];

export default function PdfMerge({ onBack }: Props) {
  const [step, setStep] = useState<Step>('select');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<MergeFile[]>([]);
  const [progress, setProgress] = useState(0);
  const [pdfName, setPdfName] = useState('Merged_20241215');
  const [showName, setShowName] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const toggleSelect = (id: string) => {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const confirmSelect = () => {
    setFiles(MOCK.filter((f) => selected.has(f.id)));
    setStep('order');
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      setFiles((prev) => {
        const arr = [...prev];
        const [moved] = arr.splice(dragItem.current!, 1);
        arr.splice(dragOver.current!, 0, moved);
        return arr;
      });
    }
    dragItem.current = null;
    dragOver.current = null;
  };

  const startMerge = () => {
    setShowName(false);
    setStep('progress');
    let p = 0;
    const timer = setInterval(() => {
      p += 20;
      setProgress(Math.min(p, 100));
      if (p >= 100) { clearInterval(timer); setTimeout(() => setStep('done'), 500); }
    }, 200);
  };

  if (step === 'select') {
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={onBack}>←</button>
          <h1 className="topbar-title">Merge PDF</h1>
          <button className="btn-primary" disabled={selected.size < 2} onClick={confirmSelect}>Next ({selected.size})</button>
        </header>
        <div className="file-list">
          {MOCK.map((f) => (
            <div key={f.id} className={`file-item ${selected.has(f.id) ? 'file-selected' : ''}`} onClick={() => toggleSelect(f.id)}>
              <span className={`checkbox ${selected.has(f.id) ? 'checked' : ''}`}>{selected.has(f.id) ? '✓' : ''}</span>
              <div className="file-thumb">📄</div>
              <div className="file-info">
                <span className="file-name">{f.name}</span>
                <span className="file-meta">{f.size}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (step === 'order') {
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={() => setStep('select')}>←</button>
          <h1 className="topbar-title">Reorder Files</h1>
          <button className="btn-primary" onClick={() => setShowName(true)}>Merge</button>
        </header>
        <p className="grid-hint" style={{ padding: '12px 16px' }}>Drag to reorder</p>
        <div className="file-list">
          {files.map((f, idx) => (
            <div key={f.id} className="file-item" draggable
              onDragStart={() => { dragItem.current = idx; }}
              onDragEnter={() => { dragOver.current = idx; }}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              <span className="card-index" style={{ position: 'static', background: 'var(--primary)', marginRight: 8 }}>{idx + 1}</span>
              <div className="file-thumb">📄</div>
              <div className="file-info">
                <span className="file-name">{f.name}</span>
                <span className="file-meta">{f.size}</span>
              </div>
              <button className="btn-icon" onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}>✕</button>
            </div>
          ))}
        </div>
        {showName && (
          <>
            <div className="sheet-backdrop" onClick={() => setShowName(false)} />
            <div className="bottom-sheet">
              <h2>Name Your PDF</h2>
              <input type="text" className="name-input" value={pdfName} onChange={(e) => setPdfName(e.target.value)} autoFocus />
              <div className="dialog-actions">
                <button className="btn-secondary" onClick={() => setShowName(false)}>Cancel</button>
                <button className="btn-primary" disabled={!pdfName.trim()} onClick={startMerge}>Merge</button>
              </div>
            </div>
          </>
        )}
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
          <p className="progress-label">Merging...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={onBack}>←</button>
        <h1 className="topbar-title">Merged</h1>
      </header>
      <div className="done-card" style={{ flex: 1, justifyContent: 'center' }}>
        <div className="done-check">✓</div>
        <p className="done-success">Merge successfully!</p>
        <p className="pdf-name">{pdfName}.pdf</p>
        <p className="pdf-meta">Documents/</p>
        <div className="done-actions">
          <button className="btn-primary btn-lg">Share</button>
          <button className="btn-secondary btn-lg">Open</button>
        </div>
      </div>
    </div>
  );
}
