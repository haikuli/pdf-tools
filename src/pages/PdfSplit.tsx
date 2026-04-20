import { useState } from 'react';

interface Props {
  onBack: () => void;
}

type Step = 'select-pdf' | 'split' | 'progress' | 'done';
type SplitMode = 'select' | 'range';

interface PdfFile { id: string; name: string; size: string; pages: number; thumbType: string; }

const MOCK_PDFS: PdfFile[] = [
  { id: 'p1', name: 'Invoice_2026.pdf', size: '2.3 MB', pages: 12, thumbType: 'invoice' },
  { id: 'p2', name: 'Contract_signed.pdf', size: '856 KB', pages: 8, thumbType: 'contract' },
  { id: 'p3', name: 'Presentation.pdf', size: '5.1 MB', pages: 24, thumbType: 'presentation' },
  { id: 'p4', name: 'Tax_Report_2025.pdf', size: '1.2 MB', pages: 6, thumbType: 'document' },
  { id: 'p5', name: 'Meeting_Notes.pdf', size: '340 KB', pages: 4, thumbType: 'document' },
  { id: 'p6', name: 'User_Manual.pdf', size: '8.7 MB', pages: 48, thumbType: 'document' },
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

interface RangeItem { id: number; from: string; to: string; }
let rangeId = 0;

export default function PdfSplit({ onBack }: Props) {
  const [step, setStep] = useState<Step>('select-pdf');
  const [selectedPdf, setSelectedPdf] = useState<PdfFile | null>(null);
  const [mode, setMode] = useState<SplitMode>('select');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeItems, setRangeItems] = useState<RangeItem[]>([{ id: ++rangeId, from: '1', to: '5' }]);
  const [keepRemaining, setKeepRemaining] = useState(true);
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

  const addRange = () => {
    // Auto-suggest next range
    const lastItem = rangeItems[rangeItems.length - 1];
    const lastTo = parseInt(lastItem?.to) || 0;
    const nextFrom = Math.min(lastTo + 1, totalPages);
    const nextTo = Math.min(nextFrom + 4, totalPages);
    setRangeItems(prev => [...prev, { id: ++rangeId, from: String(nextFrom), to: String(nextTo) }]);
  };

  const removeRange = (id: number) => {
    setRangeItems(prev => prev.filter(r => r.id !== id));
  };

  const updateRange = (id: number, field: 'from' | 'to', value: string) => {
    setRangeItems(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  // Validate ranges
  const validRanges = rangeItems.filter(r => {
    const from = parseInt(r.from);
    const to = parseInt(r.to);
    return !isNaN(from) && !isNaN(to) && from >= 1 && to >= from && to <= totalPages;
  }).map(r => ({ from: parseInt(r.from), to: parseInt(r.to) }));

  const canSplit = () => {
    if (mode === 'select') return selectedPages.size > 0;
    return validRanges.length > 0;
  };

  const getResultFiles = (): { name: string; desc: string }[] => {
    if (!selectedPdf) return [];
    const baseName = selectedPdf.name.replace('.pdf', '');
    if (mode === 'select') {
      const pages = Array.from(selectedPages).sort((a, b) => a - b);
      if (pages.length <= 3) return [{ name: `${baseName}_p${pages.join('-')}.pdf`, desc: `pages ${pages.join(', ')}` }];
      return [{ name: `${baseName}_p${pages[0]}-${pages[pages.length - 1]}.pdf`, desc: `${pages.length} pages` }];
    }
    // Range mode: each valid range becomes a file
    const files: { name: string; desc: string }[] = validRanges.map((r, i) => {
      const name = r.from === r.to
        ? `${baseName}_p${r.from}.pdf`
        : (validRanges.length === 1 && !keepRemaining ? `${baseName}_p${r.from}-${r.to}.pdf` : `${baseName}_part${i + 1}.pdf`);
      const desc = r.from === r.to ? `page ${r.from}` : `pages ${r.from}-${r.to}`;
      return { name, desc };
    });
    // Add remaining pages file
    if (keepRemaining && validRanges.length > 0) {
      const coveredPages = new Set<number>();
      for (const r of validRanges) {
        for (let i = r.from; i <= r.to; i++) coveredPages.add(i);
      }
      const remaining = Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => !coveredPages.has(p));
      if (remaining.length > 0) {
        files.push({ name: `${baseName}_remaining.pdf`, desc: `${remaining.length} remaining pages` });
      }
    }
    return files;
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

  // Select PDF
  if (step === 'select-pdf') {
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={onBack}>←</button>
          <h1 className="topbar-title">Split PDF</h1>
        </header>
        <p style={{ padding: '12px 16px 4px', fontSize: 13, color: 'var(--text2)' }}>Select a PDF</p>
        <div className="file-list">
          {MOCK_PDFS.map((f) => (
            <div key={f.id} className="file-item" onClick={() => { setSelectedPdf(f); setSelectedPages(new Set()); setRangeItems([{ id: ++rangeId, from: '1', to: String(Math.min(f.pages, 5)) }]); setStep('split'); }}>
              <PdfThumb type={f.thumbType} />
              <div className="file-info">
                <span className="file-name">{f.name}</span>
                <span className="file-meta">{f.size} · {f.pages} pages</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Split page
  if (step === 'split') {
    const resultFiles = getResultFiles();
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={() => setStep('select-pdf')}>←</button>
          <h1 className="topbar-title">Split PDF</h1>
          {mode === 'select' && (
            <label className="select-all" onClick={toggleAll}>
              <span className={`checkbox ${allSelected ? 'checked' : ''}`}>{allSelected ? '✓' : ''}</span>
              <span>All</span>
            </label>
          )}
        </header>

        {/* Mode tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 16px', flexShrink: 0 }}>
          <button className={`toggle-btn ${mode === 'select' ? 'active' : ''}`} onClick={() => setMode('select')} style={{ flex: 1 }}>Select Pages</button>
          <button className={`toggle-btn ${mode === 'range' ? 'active' : ''}`} onClick={() => setMode('range')} style={{ flex: 1 }}>By Page Range</button>
        </div>

        {mode === 'select' && (
          <div className="pages-grid">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <div key={p} className={`page-thumb ${selectedPages.has(p) ? 'selected' : ''}`} onClick={() => togglePage(p)}>
                <div className="page-thumb-inner" style={{ overflow: 'hidden' }}>
                  <img src={`https://picsum.photos/seed/split${selectedPdf?.id}p${p}/200/280`} alt={`Page ${p}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {selectedPages.has(p) && <span className="thumb-order">{Array.from(selectedPages).sort((a,b)=>a-b).indexOf(p) + 1}</span>}
                <span className="page-thumb-num">{p}</span>
              </div>
            ))}
          </div>
        )}

        {mode === 'range' && (
          <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', minHeight: 0 }}>
            <p style={{ fontSize: 12, color: 'var(--text2)' }}>
              Each range creates a separate PDF. Total: {totalPages} pages
            </p>
            {rangeItems.map((item, idx) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text2)', minWidth: 20 }}>{idx + 1}.</span>
                <input
                  className="name-input"
                  style={{ marginBottom: 0, flex: 1, padding: '8px 12px', fontSize: 14 }}
                  type="number"
                  min={1}
                  max={totalPages}
                  placeholder="From"
                  value={item.from}
                  onChange={(e) => updateRange(item.id, 'from', e.target.value)}
                />
                <span style={{ color: 'var(--text2)' }}>—</span>
                <input
                  className="name-input"
                  style={{ marginBottom: 0, flex: 1, padding: '8px 12px', fontSize: 14 }}
                  type="number"
                  min={1}
                  max={totalPages}
                  placeholder="To"
                  value={item.to}
                  onChange={(e) => updateRange(item.id, 'to', e.target.value)}
                />
                {rangeItems.length > 1 && (
                  <button className="btn-icon" style={{ fontSize: 16, padding: '4px' }} onClick={() => removeRange(item.id)}>✕</button>
                )}
              </div>
            ))}
            <button className="btn-secondary" style={{ alignSelf: 'flex-start', padding: '8px 16px', fontSize: 13 }} onClick={addRange}>
              + Add Range
            </button>
            <label className="toggle-switch-wrap" onClick={() => setKeepRemaining(!keepRemaining)}>
              <div className={`toggle-switch ${keepRemaining ? 'on' : ''}`}><div className="toggle-knob" /></div>
              <span style={{ fontSize: 13, color: 'var(--text)' }}>Keep remaining pages as a file</span>
            </label>
            {validRanges.length > 0 && (
              <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12, marginTop: 4 }}>
                <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Will create {getResultFiles().length} file{getResultFiles().length > 1 ? 's' : ''}:</p>
                {getResultFiles().map((f, i) => (
                  <p key={i} style={{ fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>
                    📄 {f.name} <span style={{ color: 'var(--text2)', fontSize: 11 }}>({f.desc})</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="bottom-bar" style={{ flexDirection: 'column', gap: 8 }}>
          <button className="btn-primary btn-confirm-full" disabled={!canSplit()} onClick={startSplit}>
            {mode === 'select'
              ? `Extract (${selectedPages.size} page${selectedPages.size > 1 ? 's' : ''})`
              : `Split (${resultFiles.length} file${resultFiles.length > 1 ? 's' : ''})`
            }
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
          <p className="progress-label">{progress >= 100 ? 'Done!' : 'Processing...'}</p>
        </div>
      </div>
    );
  }

  // Done
  const resultFiles = getResultFiles();
  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={onBack}>←</button>
        <h1 className="topbar-title">Complete</h1>
      </header>
      <div className="done-card" style={{ flex: 1, justifyContent: 'center' }}>
        <div className="done-check">✓</div>
        <p className="done-success">{resultFiles.length > 1 ? 'Split' : 'Extracted'} successfully!</p>
        <div style={{ width: '100%', padding: '8px 16px', maxHeight: 120, overflowY: 'auto' }}>
          {resultFiles.map((f, i) => (
            <p key={i} className="pdf-name" style={{ fontSize: 13, marginBottom: 4 }}>{f.name}</p>
          ))}
        </div>
        <p className="pdf-meta">Pictures/MXPlayer/PDF/</p>
        <div className="done-actions">
          <button className="btn-primary btn-lg" onClick={onBack}>Share</button>
          <button className="btn-secondary btn-lg" onClick={() => setShowPreview(true)}>Open</button>
        </div>
      </div>
      {showPreview && (
        <div className="dialog-overlay" style={{ zIndex: 150 }}>
          <div className="dialog" style={{ maxWidth: 380 }}>
            <h2>Files</h2>
            <div style={{ maxHeight: 200, overflowY: 'auto', margin: '12px 0' }}>
              {resultFiles.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <span style={{ fontSize: 13 }}>{f.name}</span>
                </div>
              ))}
            </div>
            <div className="dialog-actions">
              <button className="btn-primary" onClick={() => { setShowPreview(false); onBack(); }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
