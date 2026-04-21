import { useState } from 'react';

interface Props {
  onBack: () => void;
}

type Step = 'select-pdf' | 'select-pages' | 'progress' | 'done';

interface PdfFile { id: string; name: string; size: string; pages: number; thumbType: string; date: string; }

const MOCK_PDFS: PdfFile[] = [
  { id: 'p1', name: 'Invoice_2026.pdf', size: '2.3 MB', pages: 12, thumbType: 'invoice', date: 'Mar 15, 2026' },
  { id: 'p2', name: 'Contract_signed.pdf', size: '856 KB', pages: 8, thumbType: 'contract', date: 'Mar 10, 2026' },
  { id: 'p3', name: 'Presentation.pdf', size: '5.1 MB', pages: 24, thumbType: 'presentation', date: 'Feb 28, 2026' },
  { id: 'p4', name: 'Tax_Report_2025.pdf', size: '1.2 MB', pages: 6, thumbType: 'document', date: 'Feb 14, 2026' },
  { id: 'p5', name: 'Meeting_Notes.pdf', size: '340 KB', pages: 4, thumbType: 'document', date: 'Jan 22, 2026' },
  { id: 'p6', name: 'User_Manual.pdf', size: '8.7 MB', pages: 48, thumbType: 'document', date: 'Jan 5, 2026' },
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
  return (
    <div className="file-thumb">
      <div className="ft-title" />
      <div className="ft-line" style={{width:'95%'}} /><div className="ft-line" style={{width:'80%'}} />
      <div className="ft-line" style={{width:'90%'}} /><div className="ft-line" style={{width:'70%'}} />
      <div className="ft-line" style={{width:'85%'}} /><div className="ft-line" style={{width:'60%'}} />
    </div>
  );
}

export default function PdfSplit({ onBack }: Props) {
  const [step, setStep] = useState<Step>('select-pdf');
  const [selectedPdf, setSelectedPdf] = useState<PdfFile | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const totalPages = selectedPdf?.pages || 0;

  const togglePage = (p: number) => {
    setSelectedPages(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
  };

  const allSelected = selectedPages.size === totalPages;
  const toggleAll = () => {
    if (allSelected) setSelectedPages(new Set());
    else setSelectedPages(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));
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

  const getFileName = () => {
    if (!selectedPdf) return '';
    const baseName = selectedPdf.name.replace('.pdf', '');
    const pages = Array.from(selectedPages).sort((a, b) => a - b);
    if (pages.length <= 3) return `${baseName}_p${pages.join('-')}.pdf`;
    return `${baseName}_p${pages[0]}-${pages[pages.length - 1]}.pdf`;
  };

  // Select PDF
  if (step === 'select-pdf') {
    const filtered = MOCK_PDFS.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={onBack}>←</button>
          <h1 className="topbar-title">Extract PDF</h1>
        </header>
        <div style={{ padding: '8px 16px', flexShrink: 0 }}>
          <input className="name-input" style={{ marginBottom: 0, padding: '8px 12px', fontSize: 13 }} placeholder="Search files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="file-list">
          {filtered.map((f) => (
            <div key={f.id} className="file-item" onClick={() => { setSelectedPdf(f); setSelectedPages(new Set()); setStep('select-pages'); }}>
              <PdfThumb type={f.thumbType} />
              <div className="file-info">
                <span className="file-name">{f.name}</span>
                <span className="file-meta">{f.size} · {f.pages} pages · {f.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Select pages
  if (step === 'select-pages') {
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={() => setStep('select-pdf')}>←</button>
          <h1 className="topbar-title">Select Pages</h1>
          <label className="select-all" onClick={toggleAll}>
            <span className={`checkbox ${allSelected ? 'checked' : ''}`}>{allSelected ? '✓' : ''}</span>
            <span>All</span>
          </label>
        </header>
        {/* Page grid */}
        <div className="pages-grid">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <div key={p} className={`page-thumb ${selectedPages.has(p) ? 'selected' : ''}`} onClick={() => togglePage(p)}>
              <div className="page-thumb-inner" style={{ overflow: 'hidden' }}>
                <img src={`https://picsum.photos/seed/split${selectedPdf?.id}p${p}/200/280`} alt={`Page ${p}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {selectedPages.has(p) && <span className="thumb-check checked" style={{top:4,right:4,left:'auto',width:20,height:20,borderRadius:'50%',fontSize:11}}>✓</span>}
              <span className="page-thumb-num">{p}</span>
            </div>
          ))}
        </div>
        <div className="bottom-bar" style={{ flexDirection: 'column', gap: 8 }}>
          <button className="btn-primary btn-confirm-full" disabled={selectedPages.size === 0} onClick={startSplit}>
            Extract ({selectedPages.size} page{selectedPages.size > 1 ? 's' : ''})
          </button>
        </div>
      </div>
    );
  }

  // Progress
  if (step === 'progress') {
    return (
      <div className="page center-page">
        <div className="progress-wrap">
          <div className="progress-ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" className="ring-bg" />
              <circle cx="60" cy="60" r="52" className={progress >= 100 ? 'ring-done' : 'ring-fg'} strokeDasharray={`${(progress / 100) * 327} 327`} />
            </svg>
            <span className="progress-text">{progress >= 100 ? '✓' : `${progress}%`}</span>
          </div>
          <p className="progress-label">{progress >= 100 ? 'Done!' : 'Extracting...'}</p>
        </div>
      </div>
    );
  }

  // Done
  const fileName = getFileName();
  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={onBack}>←</button>
        <h1 className="topbar-title">Extract PDF</h1>
      </header>
      <div className="done-card" style={{ flex: 1, justifyContent: 'center' }}>
        <div className="done-check">✓</div>
        <p className="done-success">Extracted successfully!</p>
        <p className="pdf-name">{fileName}</p>
        <p className="pdf-meta">Pictures/MXPlayer/PDF/</p>
        <div className="done-actions">
          <button className="btn-primary btn-lg" onClick={onBack}>Share</button>
          <button className="btn-secondary btn-lg" onClick={() => setShowPreview(true)}>Open</button>
        </div>
      </div>
      {showPreview && (
        <div className="dialog-overlay" style={{ zIndex: 150 }}>
          <div className="dialog" style={{ maxWidth: 380 }}>
            <h2>{fileName}</h2>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>{selectedPages.size} pages extracted</p>
            <div className="dialog-actions" style={{ marginTop: 16 }}>
              <button className="btn-primary" onClick={() => { setShowPreview(false); onBack(); }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
