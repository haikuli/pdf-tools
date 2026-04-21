import { useState, useRef } from 'react';

interface Props {
  onBack: () => void;
}

type Step = 'select' | 'order' | 'progress' | 'done';

interface MergeFile { id: string; name: string; size: string; date: string; thumbType: string; }

const MOCK: MergeFile[] = [
  { id: 'm1', name: 'Report_Q1.pdf', size: '1.2 MB', date: 'Mar 12, 2026', thumbType: 'document' },
  { id: 'm2', name: 'Report_Q2.pdf', size: '980 KB', date: 'Feb 20, 2026', thumbType: 'document' },
  { id: 'm3', name: 'Summary.pdf', size: '340 KB', date: 'Jan 15, 2026', thumbType: 'document' },
  { id: 'm4', name: 'Invoice_2026.pdf', size: '2.3 MB', date: 'Mar 15, 2026', thumbType: 'invoice' },
  { id: 'm5', name: 'Contract_signed.pdf', size: '856 KB', date: 'Mar 10, 2026', thumbType: 'contract' },
  { id: 'm6', name: 'Presentation.pdf', size: '5.1 MB', date: 'Feb 28, 2026', thumbType: 'presentation' },
  { id: 'm7', name: 'Project_Plan_Q1.pdf', size: '3.4 MB', date: 'Dec 1, 2025', thumbType: 'resume' },
  { id: 'm8', name: 'Meeting_Notes.pdf', size: '340 KB', date: 'Jan 22, 2026', thumbType: 'document' },
];

function PdfThumb({ type }: { type: string }) {
  if (type === 'invoice') return (
    <div className="file-thumb">
      <div className="ft-title" /><div className="ft-line" style={{width:'100%',height:1,background:'#ccc'}} />
      <div className="ft-row"><div /><div /><div /></div>
      <div className="ft-row"><div style={{background:'#f5f5f5'}} /><div style={{background:'#f5f5f5'}} /><div style={{background:'#f5f5f5'}} /></div>
      <div className="ft-row"><div /><div /><div /></div>
      <div className="ft-line" style={{width:'40%',marginTop:2}} />
    </div>
  );
  if (type === 'contract') return (
    <div className="file-thumb">
      <div className="ft-title" style={{width:'50%'}} />
      <div className="ft-line" style={{width:'95%'}} /><div className="ft-line" style={{width:'85%'}} />
      <div className="ft-line" style={{width:'90%'}} /><div className="ft-line" style={{width:'75%'}} />
      <div style={{marginTop:'auto',height:8,borderTop:'1px dashed #ccc',display:'flex',alignItems:'flex-end'}}>
        <div style={{width:'40%',height:4,background:'#d0d0d0',borderRadius:2}} />
      </div>
    </div>
  );
  if (type === 'presentation') return (
    <div className="file-thumb">
      <div className="ft-block" style={{width:'100%',height:20,background:'#e8e0ff'}} />
      <div className="ft-title" style={{width:'70%',marginTop:2}} />
      <div className="ft-line" style={{width:'50%'}} />
    </div>
  );
  if (type === 'resume') return (
    <div className="file-thumb">
      <div style={{width:14,height:14,borderRadius:7,background:'#e8e8e8',alignSelf:'center',marginBottom:2}} />
      <div className="ft-title" style={{width:'70%',alignSelf:'center'}} />
      <div className="ft-line" style={{width:'90%'}} /><div className="ft-line" style={{width:'80%'}} />
      <div className="ft-line" style={{width:'85%'}} />
    </div>
  );
  return (
    <div className="file-thumb">
      <div className="ft-title" />
      <div className="ft-line" style={{width:'95%'}} /><div className="ft-line" style={{width:'80%'}} />
      <div className="ft-line" style={{width:'90%'}} /><div className="ft-line" style={{width:'70%'}} />
      <div className="ft-line" style={{width:'85%'}} /><div className="ft-line" style={{width:'60%'}} />
    </div>
  );
}

export default function PdfMerge({ onBack }: Props) {
  const [step, setStep] = useState<Step>('select');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
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
    const filtered = MOCK.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={onBack}>←</button>
          <h1 className="topbar-title">Merge PDF</h1>
          <button className="btn-primary" disabled={selected.size < 2} onClick={confirmSelect}>Next ({selected.size})</button>
        </header>
        <div style={{ padding: '8px 16px', flexShrink: 0 }}>
          <input className="name-input" style={{ marginBottom: 0, padding: '8px 12px', fontSize: 13 }} placeholder="Search files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="file-list">
          {filtered.map((f) => (
            <div key={f.id} className={`file-item ${selected.has(f.id) ? 'file-selected' : ''}`} onClick={() => toggleSelect(f.id)}>
              <span className={`checkbox ${selected.has(f.id) ? 'checked' : ''}`}>{selected.has(f.id) ? '✓' : ''}</span>
              <PdfThumb type={f.thumbType} />
              <div className="file-info">
                <span className="file-name">{f.name}</span>
                <span className="file-meta">{f.size} · {f.date}</span>
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
          <h1 className="topbar-title">Merge PDF</h1>
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
              <button className="btn-icon" style={{ width: 24, height: 24, borderRadius: '50%', background: '#e74c3c', color: '#fff', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, border: 'none', flexShrink: 0 }} onClick={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}>−</button>
              <PdfThumb type={f.thumbType} />
              <div className="file-info">
                <span className="file-name">{f.name}</span>
                <span className="file-meta">{f.size}</span>
              </div>
              <span style={{ cursor: 'grab', fontSize: 18, color: 'var(--text2)', flexShrink: 0, padding: '0 4px' }}>☰</span>
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
