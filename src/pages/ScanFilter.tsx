import type { ImageItem, ScanFilter } from '../types';

interface Props {
  image: ImageItem;
  filter: ScanFilter;
  setFilter: (f: ScanFilter) => void;
  onNext: () => void;
  onBack: () => void;
}

const FILTERS: { key: ScanFilter; label: string; css: string }[] = [
  { key: 'original', label: 'Original', css: 'none' },
  { key: 'magic', label: 'Magic', css: 'contrast(1.3) brightness(1.1) saturate(0.3)' },
  { key: 'grayscale', label: 'Gray', css: 'grayscale(1) contrast(1.2)' },
  { key: 'bw', label: 'B&W', css: 'grayscale(1) contrast(2.5) brightness(1.2)' },
];

export function getFilterCSS(filter: ScanFilter): string {
  return FILTERS.find((f) => f.key === filter)?.css || 'none';
}

export default function ScanFilterPage({ image, filter, setFilter, onNext, onBack }: Props) {
  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={onBack}>←</button>
        <h1 className="topbar-title">Enhance</h1>
        <button className="btn-primary" onClick={onNext}>Next</button>
      </header>

      <div className="scan-filter-preview">
        <img
          src={image.url}
          alt="scan"
          style={{ filter: getFilterCSS(filter) }}
        />
      </div>

      <div className="scan-filter-options">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-option ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            <div className="filter-thumb">
              <img
                src={image.url}
                alt={f.label}
                style={{ filter: f.css }}
              />
            </div>
            <span>{f.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
