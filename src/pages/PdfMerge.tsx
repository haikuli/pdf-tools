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
  const [showPreview, setShowPreview] = useState(false);
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
    const allSelected = filtered.length > 0 && filtered.every(f => selected.has(f.id));
    const toggleAll = () => {
      if (allSelected) setSelected(new Set());
      else setSelected(new Set(filtered.map(f => f.id)));
    };
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={onBack}>←</button>
          <h1 className="topbar-title">Select Files</h1>
          <label className="select-all" onClick={toggleAll}>
            <span className={`checkbox ${allSelected ? 'checked' : ''}`}>{allSelected ? '✓' : ''}</span>
            <span>All</span>
          </label>
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
        <div className="bottom-bar" style={{ flexDirection: 'column', gap: 8 }}>
          <button className="btn-primary btn-confirm-full" disabled={selected.size < 2} onClick={confirmSelect}>
            Next ({selected.size})
          </button>
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
              <button className="btn-icon" style={{ width: 24, height: 24, borderRadius: '50%', background: '#e74c3c', color: '#fff', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, border: 'none', flexShrink: 0 }} onClick={() => { setFiles((prev) => prev.filter((x) => x.id !== f.id)); setSelected((prev) => { const n = new Set(prev); n.delete(f.id); return n; }); }}>−</button>
              <PdfThumb type={f.thumbType} />
              <div className="file-info">
                <span className="file-name">{f.name}</span>
                <span className="file-meta">{f.size}</span>
              </div>
              <span style={{ cursor: 'grab', fontSize: 18, color: 'var(--text2)', flexShrink: 0, padding: '0 4px' }}>☰</span>
            </div>
          ))}
          <div className="file-item" style={{ cursor: 'pointer', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: 8, opacity: 0.7 }} onClick={() => setStep('select')}>
            <span style={{ fontSize: 22, color: 'var(--primary)', marginRight: 8 }}>+</span>
            <span style={{ fontSize: 14, color: 'var(--primary)' }}>Add PDF</span>
          </div>
        </div>
        <div className="bottom-bar" style={{ flexDirection: 'column', gap: 8 }}>
          <button className="btn-primary btn-confirm-full" onClick={() => setShowName(true)} disabled={files.length < 2}>Merge ({files.length})</button>
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

  if (showPreview) {
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={() => setShowPreview(false)}>←</button>
          <h1 className="topbar-title">{pdfName}.pdf</h1>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', background: '#f5f5f5', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          {[1, 2, 3].map((p) => (
            <div key={p} style={{ width: '85%', aspectRatio: '3/4', borderRadius: 4, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              <img src={`https://picsum.photos/seed/mergeview${p}/400/560`} alt={`Page ${p}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={onBack}>←</button>
        <h1 className="topbar-title">PDF Merged</h1>
      </header>
      <div className="done-card" style={{ flex: 1, justifyContent: 'center' }}>
        <div className="done-check">✓</div>
        <p className="done-success">Merged successfully!</p>
        <div className="pdf-preview"><img src="https://picsum.photos/seed/mergedone/140/180" alt="PDF" className="pdf-thumb" /></div>
        <p className="pdf-name">{pdfName}.pdf</p>
        <p className="pdf-meta">Documents/</p>
        <div className="done-actions">
          <button className="btn-primary btn-lg">Share</button>
          <button className="btn-secondary btn-lg" onClick={() => setShowPreview(true)}>Open</button>
        </div>
      </div>
    </div>
  );
}
