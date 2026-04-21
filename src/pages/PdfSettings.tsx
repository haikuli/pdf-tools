import { useState } from 'react';

interface Props {
  onBack: () => void;
}

export default function PdfSettings({ onBack }: Props) {
  const [autoCropMode, setAutoCropMode] = useState('ask');
  const [defaultPageSize, setDefaultPageSize] = useState('A4 Portrait');
  const [defaultMargin, setDefaultMargin] = useState('None');

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={onBack}>←</button>
        <h1 className="topbar-title">Settings</h1>
      </header>

      <div className="settings-page-list">
        <div className="settings-page-item">
          <span className="settings-item-label">Auto Crop</span>
          <select className="settings-select" value={autoCropMode} onChange={(e) => setAutoCropMode(e.target.value)}>
            <option value="ask">Ask every time</option>
            <option value="on">Always on</option>
            <option value="off">Always off</option>
          </select>
        </div>

        <div className="settings-page-item">
          <span className="settings-item-label">Default Page Size</span>
          <select className="settings-select" value={defaultPageSize} onChange={(e) => setDefaultPageSize(e.target.value)}>
            <option>Fit</option>
            <option>A4 Portrait</option>
            <option>A4 Landscape</option>
            <option>Letter Portrait</option>
            <option>Letter Landscape</option>
            <option>Legal Portrait</option>
            <option>Legal Landscape</option>
          </select>
        </div>

        <div className="settings-page-item">
          <span className="settings-item-label">Default Margin</span>
          <select className="settings-select" value={defaultMargin} onChange={(e) => setDefaultMargin(e.target.value)}>
            <option>None</option>
            <option>Small</option>
            <option>Large</option>
          </select>
        </div>
      </div>
    </div>
  );
}
