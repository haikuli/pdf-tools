import { useRef, useState } from 'react';
import type { ImageItem } from '../types';
import DragGuide from '../components/DragGuide';

interface Props {
  images: ImageItem[];
  reorderImages: (from: number, to: number) => void;
  removeImage: (id: string) => void;
  onDone: () => void;
  onBack: () => void;
}

export default function ReorderPage({ images, reorderImages, removeImage, onDone, onBack }: Props) {
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dragging, setDragging] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDragStart = (idx: number) => { dragItem.current = idx; setDragging(true); };
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); dragOver.current = idx; };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      reorderImages(dragItem.current, dragOver.current);
    }
    dragItem.current = null; dragOver.current = null; setDragging(false);
  };
  const handleTouchStart = (idx: number) => {
    longPressTimer.current = setTimeout(() => handleDragStart(idx), 500);
  };
  const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  return (
    <div className="page">
      <header className="topbar">
        <button className="btn-icon" onClick={onBack}>←</button>
        <h1 className="topbar-title">Reorder</h1>
        <button className="btn-primary" onClick={onDone}>Done</button>
      </header>
      <p style={{textAlign:'center',fontSize:12,color:'var(--text2)',padding:'8px 0 0'}}>Drag to reorder pages</p>
      <div className="preview-grid">
        {images.map((img, idx) => (
          <div
            key={img.id}
            className={`preview-card ${dragging && dragItem.current === idx ? 'dragging' : ''}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            onTouchStart={() => handleTouchStart(idx)}
            onTouchEnd={handleTouchEnd}
          >
            <img src={img.url} alt={img.name} style={img.rotation ? {transform: `rotate(${img.rotation}deg)`} : undefined} />
            <span className="card-index">{idx + 1}</span>
            <button className="preview-card-delete" onClick={(e) => { e.stopPropagation(); setDeleteId(img.id); }}>✕</button>
          </div>
        ))}
      </div>
      <DragGuide />

      {deleteId && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h2>Remove Page?</h2>
            <p>This page will be removed.</p>
            <div className="dialog-actions">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => { removeImage(deleteId); setDeleteId(null); if (images.length <= 1) onBack(); }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
