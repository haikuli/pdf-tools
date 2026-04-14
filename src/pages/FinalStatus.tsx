import { useState } from 'react';

interface Props {
  pdfName: string;
  pdfUrl: string;
  pdfBlob: Blob;
  thumbnail?: string;
  onClose: () => void;
}

export default function FinalStatus({ pdfName, pdfUrl, pdfBlob, thumbnail, onClose }: Props) {
  const fileName = `${pdfName}.pdf`;
  const fileSize = (pdfBlob.size / 1024).toFixed(1);
  const [showPreview, setShowPreview] = useState(false);

  const handleOpen = () => {
    // Try new tab first
    try {
      const newTab = window.open('', '_blank');
      if (newTab) {
        newTab.document.write(`
          <html><head><title>${fileName}</title></head>
          <body style="margin:0;padding:0;overflow:hidden">
          <embed src="${pdfUrl}" type="application/pdf" width="100%" height="100%" style="position:absolute;inset:0" />
          </body></html>
        `);
        newTab.document.close();
        return;
      }
    } catch {
      // fallback
    }
    // Fallback: in-app preview
    setShowPreview(true);
  };

  const handleShare = async () => {
    if (navigator.share) {
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      try {
        await navigator.share({ files: [file], title: pdfName });
      } catch {
        downloadFile();
      }
    } else {
      downloadFile();
    }
  };

  const downloadFile = () => {
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = fileName;
    a.click();
  };

  if (showPreview) {
    return (
      <div className="page">
        <header className="topbar">
          <button className="btn-icon" onClick={() => setShowPreview(false)}>←</button>
          <h1 className="topbar-title">{fileName}</h1>
        </header>
        <embed src={pdfUrl} type="application/pdf" className="pdf-iframe" />
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={onClose}>←</button>
        <h1 className="topbar-title">PDF Converted</h1>
      </header>

      <div className="done-card" style={{ flex: 1, justifyContent: 'center' }}>
        <div className="done-check">✓</div>
        <p className="done-success">Converted successfully!</p>

        <div className="pdf-preview">
          {thumbnail ? (
            <img src={thumbnail} alt="PDF thumbnail" className="pdf-thumb" />
          ) : (
            <div className="pdf-thumb-placeholder">PDF</div>
          )}
        </div>

        <p className="pdf-name">{fileName}</p>
        <p className="pdf-meta">{fileSize} KB · Documents/</p>

        <div className="done-actions">
          <button className="btn-primary btn-lg" onClick={handleOpen}>Open</button>
          <button className="btn-secondary btn-lg" onClick={handleShare}>Share</button>
        </div>
      </div>
    </div>
  );
}
