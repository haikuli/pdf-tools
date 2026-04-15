import { useState } from 'react';

interface Props {
  onBack: () => void;
}

type Step = 'select-pdf' | 'level' | 'progress' | 'done';
type Level = 'small' | 'medium' | 'large';

interface PdfFile { id: string; name: string; size: string; sizeBytes: number; thumbType: string; }

const MOCK_PDFS: PdfFile[] = [
  { id: 'p1', name: 'Invoice_2026.pdf', size: '2.3 MB', sizeBytes: 2300000, thumbType: 'invoice' },
  { id: 'p2', name: 'Contract_signed.pdf', size: '856 KB', sizeBytes: 856000, thumbType: 'contract' },
  { id: 'p3', name: 'Presentation.pdf', size: '5.1 MB', sizeBytes: 5100000, thumbType: 'presentation' },
  { id: 'p4', name: 'Tax_Report_2025.pdf', size: '1.2 MB', sizeBytes: 1200000, thumbType: 'document' },
  { id: 'p5', name: 'Meeting_Notes.pdf', size: '340 KB', sizeBytes: 340000, thumbType: 'document' },
  { id: 'p6', name: 'User_Manual.pdf', size: '8.7 MB', sizeBytes: 8700000, thumbType: 'document' },
  { id: 'p7', name: 'Receipt_Amazon.pdf', size: '120 KB', sizeBytes: 120000, thumbType: 'invoice' },
  { id: 'p8', name: 'Project_Plan_Q1.pdf', size: '3.4 MB', sizeBytes: 3400000, thumbType: 'resume' },
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

const LEVELS: { key: Level; label: string; desc: string; ratio: number }[] = [
  { key: 'small', label: 'Small Size', desc: 'Low quality · Maximum compression', ratio: 0.25 },
  { key: 'medium', label: 'Medium Size', desc: 'Good quality · Balanced', ratio: 0.45 },
  { key: 'large', label: 'Large Size', desc: 'Best quality · Minimal compression', ratio: 0.75 },
];

function formatSize(bytes: number): string {
  if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
  return `${Math.round(bytes / 1000)} KB`;
}

export default function PdfCompress({ onBack }: Props) {
  const [step, setStep] = useState<Step>('select-pdf');
  const [selectedPdf, setSelectedPdf] = useState<PdfFile | null>(null);
  const [level, setLevel] = useState<Level>('small');
  const [progress, setProgress] = useState(0);

  const currentLevel = LEVELS.find((l) => l.key === level)!;
  const compressedSize = selectedPdf ? Math.round(selectedPdf.sizeBytes * currentLevel.ratio) : 0;
  const reduction = selectedPdf ? Math.round((1 - currentLevel.ratio) * 100) : 0;

  // Simulate compression result based on file size and level
  const isSmallFile = selectedPdf ? selectedPdf.sizeBytes < 500000 : false;
  // Small files: all levels have minimal effect
  const smallFileRatio = level === 'small' ? 0.992 : level === 'medium' ? 0.995 : 0.998;
  const actualRatio = isSmallFile ? smallFileRatio : currentLevel.ratio;
  const actualCompressedSize = selectedPdf ? Math.round(selectedPdf.sizeBytes * actualRatio) : 0;
  const actualReduction = Math.round((1 - actualRatio) * 100);
  const noSignificantReduction = actualReduction <= 1;

  const startCompress = () => {
    setStep('progress');
    let p = 0;
    const timer = setInterval(() => {
      p += 12;
      setProgress(Math.min(p, 100));
      if (p >= 100) { clearInterval(timer); setTimeout(() => setStep('done'), 500); }
    }, 200);
  };

  if (step === 'select-pdf') {
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={onBack}>←</button>
          <h1 className="topbar-title">Compress PDF</h1>
        </header>
        <p style={{ padding: '12px 16px 4px', fontSize: 13, color: 'var(--text2)' }}>Select a PDF to compress</p>
        <div className="file-list">
          {MOCK_PDFS.map((f) => (
            <div key={f.id} className="file-item" onClick={() => { setSelectedPdf(f); setStep('level'); }}>
              <PdfThumb type={f.thumbType} />
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

  if (step === 'level') {
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={() => setStep('select-pdf')}>←</button>
          <h1 className="topbar-title">Compress PDF</h1>
        </header>
        <div className="compress-body">
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
        {noSignificantReduction ? (
          <>
            <div className="done-check" style={{ background: '#e8f5e9', color: '#4caf50' }}>✓</div>
            <p className="done-success" style={{ color: 'var(--text2)' }}>Already optimized</p>
            <p className="pdf-meta">This file is already well compressed. No significant reduction is possible.</p>
            <p className="pdf-name">{selectedPdf?.name}</p>
            <p className="pdf-meta">{selectedPdf?.size}</p>
            <div className="done-actions">
              <button className="btn-primary btn-lg" onClick={onBack}>Done</button>
            </div>
          </>
        ) : (
          <>
            <div className="done-check">✓</div>
            <p className="done-success">Reduced by {actualReduction}%</p>
            <p className="pdf-meta">{selectedPdf?.size} → {formatSize(actualCompressedSize)}</p>
            <p className="pdf-name">{selectedPdf?.name.replace('.pdf', '')}_compressed.pdf</p>
            <p className="pdf-meta">Documents/MXPlayer/PDF/</p>
            <div className="done-actions">
              <button className="btn-primary btn-lg">Share</button>
              <button className="btn-secondary btn-lg" onClick={onBack}>Open</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
