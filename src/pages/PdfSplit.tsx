import { useState } from 'react';

interface Props {
  onBack: () => void;
}

type Step = 'select-pdf' | 'select-pages' | 'split-config' | 'progress' | 'done';
type SplitMode = 'custom' | 'range' | 'every';

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

export default function PdfSplit({ onBack }: Props) {
  const [step, setStep] = useState<Step>('select-pdf');
  const [selectedPdf, setSelectedPdf] = useState<PdfFile | null>(null);
  const [splitMode, setSplitMode] = useState<SplitMode>('custom');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [rangeFrom, setRangeFrom] = useState('1');
  const [rangeTo, setRangeTo] = useState('');
  const [everyN, setEveryN] = useState('1');
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const totalPages = selectedPdf?.pages || 0;

  const togglePage = (p: number) => {
    setSelectedPages((prev) => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
  };

  const getResultFiles = (): string[] => {
    if (!selectedPdf) return [];
    const baseName = selectedPdf.name.replace('.pdf', '');
    if (splitMode === 'custom') {
      const pages = Array.from(selectedPages).sort((a, b) => a - b);
      if (pages.length === 0) return [];
      return [`${baseName}_p${pages.join('-')}.pdf`];
    }
    if (splitMode === 'range') {
      const from = parseInt(rangeFrom) || 1;
      const to = parseInt(rangeTo) || totalPages;
      return [`${baseName}_p${from}-${to}.pdf`, `${baseName}_p${to + 1}-${totalPages}.pdf`].filter((_, i) => {
        if (i === 1) return to < totalPages;
        return true;
      });
    }
    // every N pages
    const n = parseInt(everyN) || 1;
    const files: string[] = [];
    for (let i = 1; i <= totalPages; i += n) {
      const end = Math.min(i + n - 1, totalPages);
      files.push(`${baseName}_p${i}-${end}.pdf`);
    }
    return files;
  };

  const canSplit = (): boolean => {
    if (splitMode === 'custom') return selectedPages.size > 0;
    if (splitMode === 'range') {
      const from = parseInt(rangeFrom);
      const to = parseInt(rangeTo);
      return from >= 1 && to >= from && to <= totalPages;
    }
    return parseInt(everyN) >= 1;
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
        <p style={{ padding: '12px 16px 4px', fontSize: 13, color: 'var(--text2)' }}>Select a PDF to split</p>
        <div className="file-list">
          {MOCK_PDFS.map((f) => (
            <div key={f.id} className="file-item" onClick={() => { setSelectedPdf(f); setRangeTo(String(Math.min(f.pages, 4))); setStep('select-pages'); }}>
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

  // Select pages / configure split
  if (step === 'select-pages') {
    const allSelected = selectedPages.size === totalPages;
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={() => { setStep('select-pdf'); setSelectedPages(new Set()); }}>←</button>
          <h1 className="topbar-title">Split PDF</h1>
          {splitMode === 'custom' && (
            <label className="select-all" onClick={() => {
              if (allSelected) setSelectedPages(new Set());
              else setSelectedPages(new Set(Array.from({ length: totalPages }, (_, i) => i + 1)));
            }}>
              <span className={`checkbox ${allSelected ? 'checked' : ''}`}>{allSelected ? '✓' : ''}</span>
              <span>All</span>
            </label>
          )}
        </header>

        {/* Split mode tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '8px 16px', flexShrink: 0 }}>
          {([['custom', 'Custom'], ['range', 'By Range'], ['every', 'Every N Pages']] as const).map(([k, l]) => (
            <button key={k} className={`toggle-btn ${splitMode === k ? 'active' : ''}`} onClick={() => setSplitMode(k)} style={{ flex: 1 }}>{l}</button>
          ))}
        </div>

        {splitMode === 'custom' && (
          <div className="pages-grid">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <div key={p} className={`page-thumb ${selectedPages.has(p) ? 'selected' : ''}`} onClick={() => togglePage(p)}>
                <div className="page-thumb-inner" style={{ overflow: 'hidden' }}>
                  <img src={`https://picsum.photos/seed/split${selectedPdf?.id}p${p}/200/280`} alt={`Page ${p}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {selectedPages.has(p) && <span className="thumb-check checked">✓</span>}
                <span className="page-thumb-num">{p}</span>
              </div>
            ))}
          </div>
        )}

        {splitMode === 'range' && (
          <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>Extract pages from a range</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)', minWidth: 40 }}>From</span>
              <input className="name-input" style={{ marginBottom: 0, flex: 1 }} type="number" min={1} max={totalPages} value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)', minWidth: 40 }}>To</span>
              <input className="name-input" style={{ marginBottom: 0, flex: 1 }} type="number" min={1} max={totalPages} value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text2)' }}>Total: {totalPages} pages. Will create 2 files: pages {rangeFrom}-{rangeTo} and pages {parseInt(rangeTo) + 1}-{totalPages}</p>
          </div>
        )}

        {splitMode === 'every' && (
          <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>Split into files of N pages each</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)', minWidth: 80 }}>Pages per file</span>
              <input className="name-input" style={{ marginBottom: 0, flex: 1 }} type="number" min={1} max={totalPages} value={everyN} onChange={(e) => setEveryN(e.target.value)} />
            </div>
            <p style={{ fontSize: 12, color: 'var(--text2)' }}>Will create {Math.ceil(totalPages / (parseInt(everyN) || 1))} file(s) from {totalPages} pages</p>
          </div>
        )}

        <div className="bottom-bar" style={{ flexDirection: 'column', gap: 8 }}>
          <button className="btn-primary btn-confirm-full" disabled={!canSplit()} onClick={startSplit}>
            Split ({getResultFiles().length} file{getResultFiles().length > 1 ? 's' : ''})
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
          <p className="progress-label">{progress >= 100 ? 'Done!' : 'Splitting...'}</p>
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
        <h1 className="topbar-title">Split Complete</h1>
      </header>
      <div className="done-card" style={{ flex: 1, justifyContent: 'center' }}>
        <div className="done-check">✓</div>
        <p className="done-success">Split successfully!</p>
        <p className="pdf-meta">Pictures/MXPlayer/PDF/</p>
        <div style={{ width: '100%', padding: '0 16px', maxHeight: 160, overflowY: 'auto' }}>
          {resultFiles.map((f, i) => (
            <p key={i} className="pdf-name" style={{ fontSize: 13, marginBottom: 4 }}>{f}</p>
          ))}
        </div>
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
                <div key={i} className="file-item" style={{ padding: '8px 0' }}>
                  <span style={{ fontSize: 20, marginRight: 8 }}>📄</span>
                  <span style={{ fontSize: 13 }}>{f}</span>
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
