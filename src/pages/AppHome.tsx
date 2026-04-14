import type { Page } from '../types';

interface Props {
  onNavigate: (page: Page) => void;
}

const QUICK_TOOLS = [
  { icon: '🎵', label: 'Music', color: '#f39c12' },
  { icon: '📁', label: 'File Transfer', color: '#3498db' },
  { icon: '📄', label: 'PDF Tools', color: '#6c5ce7', action: 'home' as Page },
  { icon: '⬇️', label: 'Status Saver', color: '#2ecc71' },
  { icon: '📋', label: 'My Playlists', color: '#9b59b6' },
  { icon: '🧹', label: 'Cleaner', color: '#1abc9c' },
  { icon: '🔒', label: 'Privacy', color: '#e67e22' },
];

const MOCK_FOLDERS = [
  { name: 'Documents', count: '12 files', badge: 0 },
  { name: 'Downloads', count: '8 files', badge: 2 },
  { name: 'Camera', count: '156 photos', badge: 0 },
  { name: 'Screenshots', count: '43 images', badge: 0 },
  { name: 'WhatsApp', count: '28 files', badge: 5 },
  { name: 'Archive', count: '15 files', badge: 0 },
];

export default function AppHome({ onNavigate }: Props) {
  return (
    <div className="page app-home-page">
      <header className="app-home-header">
        <h1 className="app-home-title">Folders</h1>
        <div className="app-home-actions">
          <button className="btn-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
          <button className="btn-icon">⊞</button>
        </div>
      </header>

      <div className="app-quick-tools">
        {QUICK_TOOLS.map((t) => (
          <button
            key={t.label}
            className="app-quick-tool"
            onClick={() => t.action && onNavigate(t.action)}
          >
            <div className="app-quick-icon" style={{ background: t.color }}>
              <span>{t.icon}</span>
            </div>
            <span className="app-quick-label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="app-history-section">
        <div className="app-history-tabs">
          <button className="app-history-tab">Free Microdrama</button>
          <button className="app-history-tab active">Local History</button>
        </div>
        <div className="app-history-cards">
          {[
            { thumb: 'https://picsum.photos/seed/h1/160/90', duration: '0:44' },
            { thumb: 'https://picsum.photos/seed/h2/160/90', duration: '0:19' },
            { thumb: 'https://picsum.photos/seed/h3/160/90', duration: '0:01' },
            { thumb: 'https://picsum.photos/seed/h4/160/90', duration: '1:23' },
          ].map((v, i) => (
            <div key={i} className="app-history-card">
              <img src={v.thumb} alt="" />
              <span className="app-history-duration">{v.duration}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="app-folder-list">
        {MOCK_FOLDERS.map((f) => (
          <div key={f.name} className="app-folder-item">
            <div className="app-folder-icon">📁</div>
            {f.badge > 0 && <span className="app-folder-badge">{f.badge}</span>}
            <div className="app-folder-info">
              <span className="app-folder-name">{f.name}</span>
              <span className="app-folder-count">{f.count}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="app-bottom-tabs">
        <button className="app-tab active">
          <span className="app-tab-icon">📁</span>
          <span>Local</span>
        </button>
        <button className="app-tab">
          <span className="app-tab-icon">▶️</span>
          <span>Video</span>
        </button>
        <button className="app-tab">
          <span className="app-tab-icon">⚡</span>
          <span>Quick</span>
        </button>
        <button className="app-tab">
          <span className="app-tab-icon">🔍</span>
          <span>Search</span>
        </button>
        <button className="app-tab">
          <span className="app-tab-icon">🎮</span>
          <span>Games</span>
        </button>
      </div>
    </div>
  );
}
