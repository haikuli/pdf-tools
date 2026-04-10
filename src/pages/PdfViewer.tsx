import { useState } from 'react';

interface Props {
  fileName: string;
  onBack: () => void;
}

const PAGES = [
  {
    title: 'Annual Report 2024',
    sections: [
      { type: 'heading' as const, text: 'Executive Summary' },
      { type: 'text' as const, text: 'This report provides a comprehensive overview of our company performance during the fiscal year 2024. Key highlights include revenue growth of 23% year-over-year and expansion into three new markets.' },
      { type: 'text' as const, text: 'Our strategic initiatives have yielded significant results across all business units, with particularly strong performance in the digital services division.' },
      { type: 'image' as const, text: '' },
      { type: 'heading' as const, text: 'Financial Highlights' },
      { type: 'text' as const, text: 'Total revenue reached $4.2 billion, representing a 23% increase from the previous fiscal year. Operating margins improved by 340 basis points to 18.7%.' },
      { type: 'table' as const, text: '' },
    ],
  },
  {
    title: '',
    sections: [
      { type: 'heading' as const, text: 'Market Analysis' },
      { type: 'text' as const, text: 'The global market for our core products grew by 12% in 2024, driven by increased digital transformation spending across enterprise customers.' },
      { type: 'text' as const, text: 'We maintained our market-leading position with a 31% share in the enterprise segment, up from 28% in the prior year.' },
      { type: 'chart' as const, text: '' },
      { type: 'heading' as const, text: 'Regional Performance' },
      { type: 'text' as const, text: 'North America remained our largest market, contributing 52% of total revenue. Asia-Pacific showed the strongest growth at 34% year-over-year.' },
      { type: 'text' as const, text: 'European operations stabilized following restructuring efforts, with revenue growing 8% on a constant currency basis.' },
    ],
  },
  {
    title: '',
    sections: [
      { type: 'heading' as const, text: 'Product Development' },
      { type: 'text' as const, text: 'We launched 12 new products and 47 feature updates across our portfolio. R&D investment increased to $680 million, representing 16.2% of revenue.' },
      { type: 'image' as const, text: '' },
      { type: 'text' as const, text: 'Key product launches included our next-generation cloud platform, AI-powered analytics suite, and mobile-first collaboration tools.' },
      { type: 'heading' as const, text: 'Looking Ahead' },
      { type: 'text' as const, text: 'For fiscal year 2025, we expect continued momentum with revenue growth projected at 18-22%. Strategic priorities include AI integration, geographic expansion, and sustainability initiatives.' },
      { type: 'text' as const, text: 'We remain committed to delivering long-term value for our shareholders while investing in innovation and talent development.' },
    ],
  },
];

export default function PdfViewer({ fileName, onBack }: Props) {

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={onBack}>←</button>
        <h1 className="topbar-title">{fileName}</h1>
      </header>
      <div className="viewer-body">
        {PAGES.map((page, pi) => (
          <div key={pi} className="viewer-page" id={`page-${pi}`}>
            {page.title && <h2 className="vp-title">{page.title}</h2>}
            {page.sections.map((s, si) => {
              if (s.type === 'heading') return <h3 key={si} className="vp-heading">{s.text}</h3>;
              if (s.type === 'text') return <p key={si} className="vp-text">{s.text}</p>;
              if (s.type === 'image') return (
                <div key={si} className="vp-image">
                  <div className="vp-image-icon">🖼</div>
                  <span>Figure {pi + 1}.{si}</span>
                </div>
              );
              if (s.type === 'chart') return (
                <div key={si} className="vp-chart">
                  <div className="vp-chart-bars">
                    {[65, 78, 45, 92, 58, 84].map((h, i) => (
                      <div key={i} className="vp-bar" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <span>Chart {pi + 1}.{si}</span>
                </div>
              );
              if (s.type === 'table') return (
                <div key={si} className="vp-table">
                  <div className="vp-row vp-row-header">
                    <span>Metric</span><span>2023</span><span>2024</span><span>Change</span>
                  </div>
                  <div className="vp-row"><span>Revenue</span><span>$3.4B</span><span>$4.2B</span><span>+23%</span></div>
                  <div className="vp-row"><span>Net Income</span><span>$520M</span><span>$710M</span><span>+37%</span></div>
                  <div className="vp-row"><span>Employees</span><span>12,400</span><span>14,800</span><span>+19%</span></div>
                </div>
              );
              return null;
            })}
            <span className="vp-page-num">{pi + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
