import { useState } from 'react';

interface Props {
  onBack: () => void;
  mode: 'individual' | 'long';
}

type Step = 'select-pdf' | 'pages' | 'converting' | 'done' | 'viewer' | 'image-preview';
type OutputFormat = 'JPEG' | 'PNG';

interface PdfFile { id: string; name: string; size: string; thumbType: 'invoice' | 'contract' | 'presentation' | 'document' | 'resume'; }

const MOCK_PDFS: PdfFile[] = [
  { id: 'p1', name: 'Invoice_2026.pdf', size: '2.3 MB', thumbType: 'invoice' },
  { id: 'p2', name: 'Contract_signed.pdf', size: '856 KB', thumbType: 'contract' },
  { id: 'p3', name: 'Presentation.pdf', size: '5.1 MB', thumbType: 'presentation' },
  { id: 'p4', name: 'Tax_Report_2025.pdf', size: '1.2 MB', thumbType: 'document' },
  { id: 'p5', name: 'Meeting_Notes.pdf', size: '340 KB', thumbType: 'document' },
  { id: 'p6', name: 'User_Manual.pdf', size: '8.7 MB', thumbType: 'document' },
  { id: 'p7', name: 'Receipt_Amazon.pdf', size: '120 KB', thumbType: 'invoice' },
  { id: 'p8', name: 'Project_Plan_Q1.pdf', size: '3.4 MB', thumbType: 'resume' },
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

const MOCK_PAGES = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  selected: true,
  thumb: `https://picsum.photos/seed/pdfpage${i + 10}/200/280`,
}));

export default function PdfToImage({ onBack, mode }: Props) {
  const [step, setStep] = useState<Step>('select-pdf');
  const [selectedPdf, setSelectedPdf] = useState<PdfFile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [format, setFormat] = useState<OutputFormat>('JPEG');
  const [pages, setPages] = useState(MOCK_PAGES);
  const [progress, setProgress] = useState(0);

  const title = mode === 'long' ? 'PDF to Long Image' : 'PDF to Image';

  const togglePage = (id: number) => {
    setPages((prev) => prev.map((p) => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  const startConvert = () => {
    setStep('converting');
    let p = 0;
    const timer = setInterval(() => {
      p += 15;
      setProgress(Math.min(p, 100));
      if (p >= 100) { clearInterval(timer); setTimeout(() => setStep('done'), 500); }
    }, 200);
  };

  if (step === 'select-pdf') {
    const filtered = MOCK_PDFS.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={onBack}>←</button>
          <h1 className="topbar-title">{title}</h1>
        </header>
        <div style={{ padding: '8px 16px', flexShrink: 0 }}>
          <input className="name-input" style={{ marginBottom: 0, padding: '8px 12px', fontSize: 13 }} placeholder="Search files..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="file-list">
          {filtered.map((f) => (
            <div key={f.id} className="file-item" onClick={() => { setSelectedPdf(f); setStep('pages'); }}>
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

  if (step === 'pages') {
    const selectedCount = pages.filter((p) => p.selected).length;
    const allSelected = selectedCount === pages.length;
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={() => setStep('select-pdf')}>←</button>
          <h1 className="topbar-title">Select Pages</h1>
          <label className="select-all" onClick={() => setPages((prev) => prev.map((p) => ({ ...p, selected: !allSelected })))}>
            <span className={`checkbox ${allSelected ? 'checked' : ''}`}>{allSelected ? '✓' : ''}</span>
            <span>All</span>
          </label>
        </header>
        <div className="pages-grid">
          {pages.map((p, idx) => (
            <div key={p.id} className={`page-thumb ${p.selected ? 'selected' : ''}`} onClick={() => togglePage(p.id)}>
              <div className="page-thumb-inner" style={{ overflow: 'hidden' }}>
                <img src={`https://picsum.photos/seed/pdfpage${p.id + 9}/200/280`} alt={`Page ${p.id}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {p.selected && <span className="thumb-order">{pages.slice(0, idx).filter((x) => x.selected).length + 1}</span>}
            </div>
          ))}
        </div>
        <div className="bottom-bar" style={{ flexDirection: 'column', gap: 8 }}>
          <div className="toggle-group" style={{ width: '100%' }}>
            {(['JPEG', 'PNG'] as OutputFormat[]).map((f) => (
              <button key={f} className={`toggle-btn ${format === f ? 'active' : ''}`} onClick={() => setFormat(f)}>{f}</button>
            ))}
          </div>
          <button className="btn-primary btn-confirm-full" disabled={selectedCount === 0} onClick={startConvert}>
            Convert ({selectedCount})
          </button>
        </div>
      </div>
    );
  }

  if (step === 'converting') {
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
          <p className="progress-label">Converting...</p>
        </div>
      </div>
    );
  }

  const selectedPages = pages.filter((p) => p.selected);
  const folderName = selectedPdf?.name.replace('.pdf', '') || 'output';
  const savePath = `Pictures/MXPlayer/${folderName}/`;
  const ext = format.toLowerCase();

  if (step === 'image-preview') {
    return (
      <div className="page" style={{ background: '#000' }}>
        <header className="topbar" style={{ background: 'transparent', borderBottom: 'none' }}>
          <button className="btn-icon" style={{ color: '#fff' }} onClick={onBack}>←</button>
          <h1 className="topbar-title" style={{ color: '#fff' }}>{folderName}_longimage.{ext}</h1>
          <button className="btn-primary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => { /* share */ }}>Share</button>
        </header>
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            {selectedPages.map((p) => (
              <img key={p.id} src={`https://picsum.photos/seed/pdfpage${p.id + 9}/400/520`} alt="" style={{ width: '100%', display: 'block' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (step === 'viewer') {
    if (mode === 'long') {
      return (
        <div className="page">
          <header className="topbar">
            <button className="btn-icon" onClick={() => setStep('done')}>←</button>
            <h1 className="topbar-title">{folderName}</h1>
          </header>
          <p style={{ padding: '8px 16px 4px', fontSize: 11, color: 'var(--text2)' }}>{savePath}</p>
          <div className="file-list">
            <div className="file-item">
              <div style={{ width: 48, height: 62, flexShrink: 0, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {selectedPages.slice(0, 3).map((p) => (
                    <img key={p.id} src={`https://picsum.photos/seed/pdfpage${p.id + 9}/96/42`} alt="" style={{ width: '100%', flex: 1, objectFit: 'cover' }} />
                  ))}
                </div>
              </div>
              <div className="file-info">
                <span className="file-name">{folderName}_longimage.{ext}</span>
                <span className="file-meta">{selectedPages.length} pages stitched · {format}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={() => setStep('done')}>←</button>
          <h1 className="topbar-title">{folderName}</h1>
        </header>
        <p style={{ padding: '8px 16px 4px', fontSize: 11, color: 'var(--text2)' }}>{savePath}</p>
        <div className="file-list">
          {selectedPages.map((p) => (
            <div key={p.id} className="file-item">
              <div style={{ width: 48, height: 62, flexShrink: 0, borderRadius: 4, overflow: 'hidden' }}>
                <img src={`https://picsum.photos/seed/pdfpage${p.id + 9}/96/124`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="file-info">
                <span className="file-name">{folderName}_page{p.id}.{ext}</span>
                <span className="file-meta">Page {p.id} · {format}</span>
              </div>
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
        <h1 className="topbar-title">Conversion Complete</h1>
      </header>
      <div className="done-card" style={{ flex: 1, justifyContent: 'center' }}>
        <div className="done-check">✓</div>
        <p className="done-success">Converted successfully!</p>
        <p className="pdf-meta">
          {mode === 'long' ? '1 long image' : `${selectedPages.length} image${selectedPages.length > 1 ? 's' : ''}`} · {format}
        </p>
        <p className="pdf-meta" style={{ fontSize: 11, opacity: 0.7 }}>Saved to {savePath}</p>

        <div style={{ overflow: 'hidden', borderRadius: 6, margin: '12px auto', width: mode === 'long' ? 120 : 'auto', maxHeight: mode === 'long' ? 160 : 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
          {mode === 'long' ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {selectedPages.map((p) => (
                <img key={p.id} src={`https://picsum.photos/seed/pdfpage${p.id + 9}/200/260`} alt="" style={{ width: '100%', display: 'block' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
              {selectedPages.slice(0, 4).map((p) => (
                <div key={p.id} style={{ width: 60, height: 80, borderRadius: 4, overflow: 'hidden' }}>
                  <img src={`https://picsum.photos/seed/pdfpage${p.id + 9}/120/160`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
              {selectedPages.length > 4 && (
                <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--text2)' }}>+{selectedPages.length - 4}</span>
              )}
            </div>
          )}
        </div>

        <div className="done-actions">
          <button className="btn-primary btn-lg">Share</button>
          <button className="btn-secondary btn-lg" onClick={() => setStep(mode === 'long' ? 'image-preview' : 'viewer')}>Open</button>
        </div>
      </div>
    </div>
  );
}
