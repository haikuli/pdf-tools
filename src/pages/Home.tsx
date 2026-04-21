import { useState, useRef } from 'react';
import type { Page } from '../types';
import PdfViewer from './PdfViewer';
import {
  ImageToPdfIcon, IdCardIcon, ScanToPdfIcon,
  CompressPdfIcon, MergePdfIcon, SplitPdfIcon,
  PdfToImageIcon, PdfToLongImageIcon,
} from '../components/ToolIcons';

interface Props {
  onNavigate: (page: Page) => void;
  onBack?: () => void;
}

type SortField = 'date' | 'name' | 'size';
type SortOrder = 'asc' | 'desc';

interface PdfFile {
  id: string;
  name: string;
  size: string;
  sizeBytes: number;
  date: string;
  createdDate: string;
  dateTs: number;
  path: string;
  locked: boolean;
  thumb: string;
}

const TOOLS = [
  { icon: <ImageToPdfIcon />, label: 'Image to PDF', page: 'picker' as Page },
  { icon: <ScanToPdfIcon />, label: 'Scan to PDF', page: 'scan-capture' as Page },
  { icon: <IdCardIcon />, label: 'ID Card', page: 'idcard-notice' as Page },
  { icon: <PdfToImageIcon />, label: 'PDF to Image', page: 'pdf2img-mode' as Page },
  { icon: <PdfToLongImageIcon />, label: 'PDF to Long Image', page: 'pdf2longimg' as Page },
  { icon: <CompressPdfIcon />, label: 'Compress PDF', page: 'compress-level' as Page },
  { icon: <MergePdfIcon />, label: 'Merge PDF', page: 'merge-select' as Page },
  { icon: <SplitPdfIcon />, label: 'Extract', page: 'split-pages' as Page },
];

const MOCK_FILES: PdfFile[] = [
  { id: 'f1', name: 'Invoice_2026.pdf', size: '2.3 MB', sizeBytes: 2300000, date: '2026-03-28', createdDate: '2026-03-01', dateTs: 1743120000000, path: 'Documents/', locked: false, thumb: '' },
  { id: 'f2', name: 'Contract_signed.pdf', size: '856 KB', sizeBytes: 856000, date: '2026-03-25', createdDate: '2026-02-15', dateTs: 1742860800000, path: 'Documents/', locked: true, thumb: '' },
  { id: 'f3', name: 'Presentation.pdf', size: '5.1 MB', sizeBytes: 5100000, date: '2026-03-20', createdDate: '2026-03-10', dateTs: 1742428800000, path: 'Downloads/', locked: false, thumb: '' },
  { id: 'f4', name: 'Tax_Report_2025.pdf', size: '1.2 MB', sizeBytes: 1200000, date: '2026-03-15', createdDate: '2025-12-20', dateTs: 1741996800000, path: 'Documents/', locked: true, thumb: '' },
  { id: 'f5', name: 'Meeting_Notes.pdf', size: '340 KB', sizeBytes: 340000, date: '2026-03-10', createdDate: '2026-03-10', dateTs: 1741564800000, path: 'Documents/', locked: false, thumb: '' },
  { id: 'f6', name: 'User_Manual.pdf', size: '8.7 MB', sizeBytes: 8700000, date: '2026-02-28', createdDate: '2025-06-15', dateTs: 1740700800000, path: 'Downloads/', locked: false, thumb: '' },
  { id: 'f7', name: 'Receipt_Amazon.pdf', size: '120 KB', sizeBytes: 120000, date: '2026-02-20', createdDate: '2026-02-20', dateTs: 1740009600000, path: 'Downloads/', locked: false, thumb: '' },
  { id: 'f8', name: 'Project_Plan_Q1.pdf', size: '3.4 MB', sizeBytes: 3400000, date: '2026-02-10', createdDate: '2026-01-05', dateTs: 1739145600000, path: 'Documents/', locked: false, thumb: '' },
  { id: 'f9', name: 'Insurance_Policy.pdf', size: '1.8 MB', sizeBytes: 1800000, date: '2026-01-25', createdDate: '2025-11-10', dateTs: 1737763200000, path: 'Documents/', locked: true, thumb: '' },
  { id: 'f10', name: 'Travel_Itinerary.pdf', size: '450 KB', sizeBytes: 450000, date: '2026-01-15', createdDate: '2026-01-12', dateTs: 1736899200000, path: 'Downloads/', locked: false, thumb: '' },
  { id: 'f11', name: 'Resume_2026.pdf', size: '280 KB', sizeBytes: 280000, date: '2026-01-05', createdDate: '2025-12-28', dateTs: 1736035200000, path: 'Documents/', locked: false, thumb: '' },
  { id: 'f12', name: 'Bank_Statement_Dec.pdf', size: '920 KB', sizeBytes: 920000, date: '2025-12-20', createdDate: '2025-12-20', dateTs: 1734652800000, path: 'Documents/', locked: true, thumb: '' },
  { id: 'f13', name: 'Recipe_Collection.pdf', size: '6.2 MB', sizeBytes: 6200000, date: '2025-12-05', createdDate: '2025-08-15', dateTs: 1733356800000, path: 'Downloads/', locked: false, thumb: '' },
  { id: 'f14', name: 'Warranty_Card.pdf', size: '150 KB', sizeBytes: 150000, date: '2025-11-18', createdDate: '2025-11-18', dateTs: 1731888000000, path: 'Documents/', locked: false, thumb: '' },
  { id: 'f15', name: 'Lease_Agreement.pdf', size: '2.1 MB', sizeBytes: 2100000, date: '2025-11-01', createdDate: '2025-07-01', dateTs: 1730419200000, path: 'Documents/', locked: true, thumb: '' },
  { id: 'f16', name: 'Photo_Album_Export.pdf', size: '12.5 MB', sizeBytes: 12500000, date: '2025-10-20', createdDate: '2025-10-20', dateTs: 1729382400000, path: 'Downloads/', locked: false, thumb: '' },
  { id: 'f17', name: 'Course_Certificate.pdf', size: '380 KB', sizeBytes: 380000, date: '2025-10-10', createdDate: '2025-09-30', dateTs: 1728518400000, path: 'Documents/', locked: false, thumb: '' },
  { id: 'f18', name: 'Budget_2026.pdf', size: '1.5 MB', sizeBytes: 1500000, date: '2025-09-28', createdDate: '2025-09-01', dateTs: 1727481600000, path: 'Documents/', locked: false, thumb: '' },
  { id: 'f19', name: 'Medical_Report.pdf', size: '4.3 MB', sizeBytes: 4300000, date: '2025-09-15', createdDate: '2025-09-15', dateTs: 1726358400000, path: 'Documents/', locked: true, thumb: '' },
  { id: 'f20', name: 'Ebook_Chapter1.pdf', size: '7.8 MB', sizeBytes: 7800000, date: '2025-08-30', createdDate: '2025-08-30', dateTs: 1724976000000, path: 'Downloads/', locked: false, thumb: '' },
];

const SORT_FIELDS: { key: SortField; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'name', label: 'Name' },
  { key: 'size', label: 'Size' },
];

export default function Home({ onNavigate, onBack }: Props) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [tempSortField, setTempSortField] = useState<SortField>('date');
  const [tempSortOrder, setTempSortOrder] = useState<SortOrder>('desc');
  const [showSort, setShowSort] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [multiSelect, setMultiSelect] = useState(false);
  const [menuFile, setMenuFile] = useState<string | null>(null);
  const [passwordDialog, setPasswordDialog] = useState<PdfFile | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const fileLongPress = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('pdf_search_history') || '[]'); } catch { return []; }
  });

  const saveSearch = (q: string) => {
    if (!q.trim()) return;
    const updated = [q, ...searchHistory.filter((h) => h !== q)].slice(0, 5);
    setSearchHistory(updated);
    localStorage.setItem('pdf_search_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('pdf_search_history');
  };

  const [propsFile, setPropsFile] = useState<PdfFile | null>(null);

  const sortedFiles = [...MOCK_FILES]
    .filter((f) => !searchQuery || f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'date': return dir * (a.dateTs - b.dateTs);
      case 'name': return dir * a.name.localeCompare(b.name);
      case 'size': return dir * (a.sizeBytes - b.sizeBytes);
    }
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFileClick = (file: PdfFile) => {
    if (multiSelect) {
      toggleSelect(file.id);
      return;
    }
    if (file.locked) {
      setPasswordDialog(file);
      setPassword('');
      setPasswordError(false);
      return;
    }
    // Open PDF viewer
    setViewingFile(file.name);
  };

  const handlePasswordSubmit = () => {
    if (password.length >= 1) {
      const name = passwordDialog?.name || '';
      setPasswordDialog(null);
      setViewingFile(name);
    } else {
      setPasswordError(true);
    }
  };

  return (
    <div className="page">
      {viewingFile ? (
        <PdfViewer fileName={viewingFile} onBack={() => setViewingFile(null)} />
      ) : (
        <>
      <header className="topbar">
        {showSearch ? (
          <>
            <input
              type="text"
              className="topbar-search-input"
              placeholder="Search PDF files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button className="btn-icon" onClick={() => { saveSearch(searchQuery); setShowSearch(false); setSearchQuery(''); }}>✕</button>
          </>
        ) : (
          <>
            {onBack && <button className="btn-icon" onClick={onBack}>←</button>}
            <h1 className="topbar-title">PDF Tools</h1>
            <button className="btn-icon" onClick={() => setShowSearch(true)}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <button className="btn-icon" onClick={() => onNavigate('pdf-settings')}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </>
        )}
      </header>

      {/* Tool quick entrance - hidden during search */}
      {!showSearch && (
        <>
          <div className="tools-section-label">TOOLS</div>
          <div className="tools-grid">
            {TOOLS.map((t) => (
              <button
                key={t.label}
                className="tool-item"
                onClick={() => t.page && onNavigate(t.page)}
                disabled={!t.page}
              >
                {t.icon}
                <span className="tool-label">{t.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Search history */}
      {showSearch && !searchQuery && searchHistory.length > 0 && (
        <div className="search-history">
          <div className="search-history-header">
            <span>Recent Searches</span>
            <button className="btn-text" style={{ margin: 0, padding: '2px 0', fontSize: 12 }} onClick={clearHistory}>Clear</button>
          </div>
          {searchHistory.map((h, i) => (
            <button key={i} className="search-history-item" onClick={() => setSearchQuery(h)}>
              <span className="search-history-icon">🕐</span>
              <span>{h}</span>
            </button>
          ))}
        </div>
      )}

      {/* Sort bar */}
      <div className="file-list-header">
        <span className="file-list-title">{multiSelect ? `Selected (${selected.size})` : 'MY PDF FILES'}</span>
        <div className="file-list-actions">
          {multiSelect && (
            <button className="sort-btn" onClick={() => { setMultiSelect(false); setSelected(new Set()); }}>Cancel</button>
          )}
          {!multiSelect && (
            <button className="sort-btn" onClick={() => { setTempSortField(sortField); setTempSortOrder(sortOrder); setShowSort(!showSort); }}>
              {SORT_FIELDS.find((f) => f.key === sortField)?.label || 'Sort'} ↕
            </button>
          )}
        </div>
      </div>

      {showSort && (
        <div className="dialog-overlay" onClick={() => setShowSort(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()} style={{maxWidth:320}}>
            <h2 style={{marginBottom:16}}>Sort</h2>
            <div style={{display:'flex',gap:12,marginBottom:20}}>
              {SORT_FIELDS.map((f) => (
                <button key={f.key} style={{
                  display:'flex',flexDirection:'column',alignItems:'center',gap:6,
                  padding:'12px 16px',borderRadius:'var(--radius-sm)',border:'1px solid',flex:1,
                  borderColor: tempSortField === f.key ? 'var(--primary)' : 'var(--border)',
                  background: tempSortField === f.key ? 'rgba(108,92,231,0.15)' : 'var(--surface2)',
                  color: tempSortField === f.key ? 'var(--primary)' : 'var(--text2)',
                  cursor:'pointer',fontSize:12,fontWeight:500
                }} onClick={() => setTempSortField(f.key)}>
                  <span style={{fontSize:20}}>{f.key === 'date' ? '📅' : f.key === 'name' ? '🔤' : '📦'}</span>
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:8,marginBottom:20}}>
              <button className={`toggle-btn ${tempSortOrder === 'asc' ? 'active' : ''}`} style={{flex:1,padding:10}} onClick={() => setTempSortOrder('asc')}>↑ Ascending</button>
              <button className={`toggle-btn ${tempSortOrder === 'desc' ? 'active' : ''}`} style={{flex:1,padding:10}} onClick={() => setTempSortOrder('desc')}>↓ Descending</button>
            </div>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setShowSort(false)}>Cancel</button>
              <button className="btn-primary" onClick={() => { setSortField(tempSortField); setSortOrder(tempSortOrder); setShowSort(false); }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* PDF file list */}
      <div className="file-list">
        {sortedFiles.map((file) => (
          <div
            key={file.id}
            className={`file-item ${selected.has(file.id) ? 'file-selected' : ''}`}
            onClick={() => handleFileClick(file)}
            onContextMenu={(e) => { e.preventDefault(); setMenuFile(file.id); }}
            onTouchStart={() => { fileLongPress.current = setTimeout(() => { setMultiSelect(true); toggleSelect(file.id); }, 500); }}
            onTouchEnd={() => { if (fileLongPress.current) clearTimeout(fileLongPress.current); }}
            onTouchMove={() => { if (fileLongPress.current) clearTimeout(fileLongPress.current); }}
          >
            {multiSelect && (
              <span className={`checkbox ${selected.has(file.id) ? 'checked' : ''}`}>
                {selected.has(file.id) ? '✓' : ''}
              </span>
            )}
            <div className="file-thumb" style={file.locked ? { background: '#f0f0f0' } : undefined}>
              {file.locked && <div className="file-thumb-lock">🔒</div>}
              {(file.id === 'f1' || file.id === 'f7' || file.id === 'f12') ? (<>
                <div className="ft-title" /><div className="ft-line" style={{width:'100%',height:1,background:'#ccc'}} />
                <div className="ft-row"><div /><div /><div /></div>
                <div className="ft-row"><div style={{background:'#f5f5f5'}} /><div style={{background:'#f5f5f5'}} /><div style={{background:'#f5f5f5'}} /></div>
                <div className="ft-row"><div /><div /><div /></div>
                <div className="ft-line" style={{width:'40%',marginTop:2}} />
              </>) : (file.id === 'f3' || file.id === 'f16') ? (<>
                <div className="ft-block" style={{width:'100%',height:20,background:'#e8e0ff'}} />
                <div className="ft-title" style={{width:'70%',marginTop:2}} />
                <div className="ft-line" style={{width:'50%'}} />
              </>) : (file.id === 'f2' || file.id === 'f15' || file.id === 'f9') ? (<>
                <div className="ft-title" style={{width:'50%'}} />
                <div className="ft-line" style={{width:'95%'}} /><div className="ft-line" style={{width:'85%'}} />
                <div className="ft-line" style={{width:'90%'}} /><div className="ft-line" style={{width:'75%'}} />
                <div style={{marginTop:'auto',height:8,borderTop:'1px dashed #ccc',display:'flex',alignItems:'flex-end'}}>
                  <div style={{width:'40%',height:4,background:'#d0d0d0',borderRadius:2}} />
                </div>
              </>) : (file.id === 'f11' || file.id === 'f17') ? (<>
                <div style={{width:14,height:14,borderRadius:7,background:'#e8e8e8',alignSelf:'center',marginBottom:2}} />
                <div className="ft-title" style={{width:'70%',alignSelf:'center'}} />
                <div className="ft-line" style={{width:'90%'}} /><div className="ft-line" style={{width:'80%'}} />
                <div className="ft-line" style={{width:'85%'}} />
              </>) : (<>
                <div className="ft-title" />
                <div className="ft-line" style={{width:'95%'}} /><div className="ft-line" style={{width:'80%'}} />
                <div className="ft-line" style={{width:'90%'}} /><div className="ft-line" style={{width:'70%'}} />
                <div className="ft-line" style={{width:'85%'}} /><div className="ft-line" style={{width:'60%'}} />
                <div className="ft-line" style={{width:'75%'}} />
              </>)}
            </div>
            <div className="file-info">
              <span className="file-name">
                {file.name}
                {file.id === 'f1' && <span className="new-badge">NEW</span>}
              </span>
              <span className="file-meta">{file.size} · {file.date}</span>
            </div>
            <button className="file-more" onClick={(e) => { e.stopPropagation(); setMenuFile(menuFile === file.id ? null : file.id); }}>⋮</button>

            {menuFile === file.id && (
              <div className="file-menu">
                {['Rename', 'Share', 'PDF to Image', 'PDF to Long Image', 'Merge PDF', 'Extract Pages', 'Compress PDF', 'Delete', 'Properties'].map((action) => (
                  <button key={action} className="file-menu-item" onClick={() => {
                    setMenuFile(null);
                    if (action === 'Properties') {
                      setPropsFile(file);
                    }
                  }}>{action}</button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Multi-select bottom bar */}
      {multiSelect && selected.size > 0 && (
        <div className="bottom-bar">
          <button className="btn-secondary">Share</button>
          <button className="btn-primary">Merge</button>
          <button className="btn-danger">Delete</button>
        </div>
      )}

      {/* Password dialog */}
      {passwordDialog && (
        <div className="dialog-overlay" onClick={() => setPasswordDialog(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Password required</h2>
            <p>{passwordDialog.name} is password protected. Enter the password to open the PDF file.</p>
            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="name-input"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                placeholder="Enter password"
                autoFocus
                style={{ marginBottom: passwordError ? 4 : 16 }}
              />
              <button className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            {passwordError && <p className="password-error">Wrong password.</p>}
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setPasswordDialog(null)}>Cancel</button>
              <button className="btn-primary" onClick={handlePasswordSubmit}>OK</button>
            </div>
          </div>
        </div>
      )}

      {/* Properties dialog */}
      {propsFile && (
        <div className="dialog-overlay" onClick={() => setPropsFile(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Properties</h2>
            <div className="props-list">
              <div className="props-row"><span>Name</span><span>{propsFile.name}</span></div>
              <div className="props-row"><span>Size</span><span>{propsFile.size}</span></div>
              <div className="props-row"><span>Modified</span><span>{propsFile.date}</span></div>
              <div className="props-row"><span>Created</span><span>{propsFile.createdDate}</span></div>
              <div className="props-row"><span>Path</span><span>{propsFile.path}</span></div>
              <div className="props-row"><span>Protected</span><span>{propsFile.locked ? 'Yes' : 'No'}</span></div>
            </div>
            <div className="dialog-actions">
              <button className="btn-primary" onClick={() => setPropsFile(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
