import { useState, useEffect } from 'react';

const STORAGE_KEY = 'img2pdf_drag_guide_seen';

export default function DragGuide() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="drag-guide-overlay" onClick={dismiss}>
      <div className="drag-guide-content">
        <div className="drag-guide-animation">
          <div className="drag-guide-cards">
            <div className="guide-card gc-1">1</div>
            <div className="guide-card gc-2">2</div>
            <div className="guide-card gc-3">3</div>
            <div className="guide-card gc-4">4</div>
          </div>
          <div className="drag-guide-hand">👆</div>
        </div>
        <p className="drag-guide-text">Drag images to reorder</p>
        <button className="btn-primary" onClick={dismiss}>Got it</button>
      </div>
    </div>
  );
}
