import type { ReactNode } from 'react';

const p = {
  fill: 'none',
  stroke: '#fff',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Icon({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <div className="tool-icon-box" style={{ background: bg }}>
      <svg viewBox="0 0 24 24" width="24" height="24" {...p}>
        {children}
      </svg>
    </div>
  );
}

export function ImageToPdfIcon() {
  return (
    <Icon bg="#e74c3c">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" fill="#fff" stroke="none" />
      <path d="M21 15l-5-5L5 21" />
    </Icon>
  );
}

export function ScanToPdfIcon() {
  return (
    <Icon bg="#3498db">
      <path d="M3 7V5a2 2 0 012-2h2" />
      <path d="M17 3h2a2 2 0 012 2v2" />
      <path d="M21 17v2a2 2 0 01-2 2h-2" />
      <path d="M7 21H5a2 2 0 01-2-2v-2" />
      <line x1="3" y1="12" x2="21" y2="12" />
    </Icon>
  );
}

export function IdCardIcon() {
  return (
    <Icon bg="#f39c12">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="11" r="2" />
      <line x1="14" y1="9" x2="19" y2="9" />
      <line x1="14" y1="13" x2="18" y2="13" />
    </Icon>
  );
}

export function SplitPdfIcon() {
  return (
    <Icon bg="#e67e22">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <line x1="12" y1="3" x2="12" y2="21" strokeDasharray="3 2" />
      <path d="M8 12H5" />
      <path d="M19 12h-3" />
    </Icon>
  );
}

export function CompressPdfIcon() {
  return (
    <Icon bg="#2ecc71">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M12 18v-6" />
      <path d="M9 15l3 3 3-3" />
    </Icon>
  );
}

export function MergePdfIcon() {
  return (
    <Icon bg="#9b59b6">
      <rect x="2" y="4" width="8" height="10" rx="1" />
      <rect x="14" y="4" width="8" height="10" rx="1" />
      <path d="M6 17v3h12v-3" />
      <path d="M12 14v6" />
    </Icon>
  );
}

export function PdfToImageIcon() {
  return (
    <Icon bg="#1abc9c">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <rect x="8" y="13" width="8" height="6" rx="1" />
    </Icon>
  );
}

export function PdfToLongImageIcon() {
  return (
    <Icon bg="#34495e">
      <rect x="6" y="2" width="12" height="20" rx="2" />
      <line x1="6" y1="8" x2="18" y2="8" />
      <line x1="6" y1="14" x2="18" y2="14" />
    </Icon>
  );
}
