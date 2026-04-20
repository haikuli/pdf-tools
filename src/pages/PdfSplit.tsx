import { useState } from 'react';

interface Props {
  onBack: () => void;
}

type Step = 'select-pdf' | 'split' | 'progress' | 'done';

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
  const [splits, setSplits] = useState<Set<number>>(new Set()); // split AFTER page N
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const totalPages = selectedPdf?.pages || 0;

  const toggleSplit = (afterPage: number) => {
    setSplits(prev => {
      const n = new Set(prev);
      n.has(afterPage) ? n.delete(afterPage) : n.add(afterPage);
      return n;
    });
  };

  const getResultFiles = (): { name: string; range: string }[] => {
    if (!selectedPdf || splits.size === 0) return [];
    const baseName = selectedPdf.name.replace('.pdf', '');
    const sortedSplits = Array.from(splits).sort((a, b) => a - b);
    const files: { name: string; range: string }[] = [];
    let start = 1;
    for (const s of sortedSplits) {
      files.push({ name: `${baseName}_part${files.length + 1}.pdf`, range: `${start}-${s}` });
      start = s + 1;
    }
    // Last segment
    files.push({ name: `${baseName}_part${files.length + 1}.pdf`, range: `${start}-${totalPages}` });
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
        <p style={{ padding: '12px 16px 4px', fontSize: 13, color: 'var(--text2)' }}>Select a PDF to split</p>
        <div className="file-list">
          {MOCK_PDFS.map((f) => (
            <div key={f.id} className="file-item" onClick={() => { setSelectedPdf(f); setSplits(new Set()); setStep('split'); }}>
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

  // Split page with visual dividers
  if (step === 'split') {
    const resultFiles = getResultFiles();
    const fileCount = resultFiles.length || 1;
    // Build rows of 3 pages, with split lines between rows
    const rows: number[][] = [];
    for (let i = 0; i < totalPages; i += 3) {
      rows.push(Array.from({ length: Math.min(3, totalPages - i) }, (_, j) => i + j + 1));
    }

    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={() => setStep('select-pdf')}>←</button>
          <h1 className="topbar-title">Split PDF</h1>
          <button className="btn-primary" disabled={splits.size === 0} onClick={startSplit}>
            Split ({fileCount})
          </button>
        </header>
        <p style={{ padding: '8px 16px 4px', fontSize: 12, color: 'var(--text2)' }}>
          Tap ✂ between pages to add split points
        </p>
        <div className="split-pages-container">
          {rows.map((row, rowIdx) => (
            <div key={rowIdx}>
              {/* Page row */}
              <div className="split-page-row">
                {row.map((pageNum) => (
                  <div key={pageNum} className="split-page-cell">
                    <div className="page-thumb" style={{ width: '100%', margin: 0 }}>
                      <div className="page-thumb-inner" style={{ overflow: 'hidden' }}>
                        <img
                          src={`https://picsum.photos/seed/split${selectedPdf?.id}p${pageNum}/200/280`}
                          alt={`Page ${pageNum}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <span className="page-thumb-num">{pageNum}</span>
                    </div>
                    {/* Inline split button between pages in same row */}
                    {pageNum < totalPages && pageNum !== row[row.length - 1] && (
                      <button
                        className={`split-inline-btn ${splits.has(pageNum) ? 'active' : ''}`}
                        onClick={() => toggleSplit(pageNum)}
                      >
                        ✂
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {/* Split line between rows */}
              {rowIdx < rows.length - 1 && (
                <div className="split-row-divider">
                  <button
                    className={`split-divider-btn ${splits.has(row[row.length - 1]) ? 'active' : ''}`}
                    onClick={() => toggleSplit(row[row.length - 1])}
                  >
                    <span className="split-divider-line" />
                    <span className="split-divider-icon">✂</span>
                    <span className="split-divider-line" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {splits.size > 0 && (
          <div style={{ padding: '8px 16px', fontSize: 12, color: 'var(--text2)', flexShrink: 0, borderTop: '1px solid var(--border)' }}>
            {resultFiles.map((f, i) => (
              <span key={i} style={{ marginRight: 12 }}>Part {i + 1}: p.{f.range}</span>
            ))}
          </div>
        )}
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
        <div style={{ width: '100%', padding: '8px 16px', maxHeight: 160, overflowY: 'auto' }}>
          {resultFiles.map((f, i) => (
            <p key={i} className="pdf-name" style={{ fontSize: 13, marginBottom: 4 }}>{f.name}</p>
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
                  <span style={{ fontSize: 13 }}>{f.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text2)', marginLeft: 'auto' }}>p.{f.range}</span>
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
