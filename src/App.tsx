import { useState, useCallback } from 'react';
import type { ImageItem, PageSize, PageOrientation, FillMode, Margin, Page } from './types';
import AppHome from './pages/AppHome';
import Home from './pages/Home';
import ImagePicker, { ALL_MOCK_IMAGES } from './pages/ImagePicker';
import ImageEditor from './pages/ImageEditor';
import PreviewGrid from './pages/PreviewGrid';
import ConvertProgress from './pages/ConvertProgress';
import FinalStatus from './pages/FinalStatus';
import ScanCapture from './pages/ScanCapture';
import SimpleCamera from './pages/SimpleCamera';
import ReorderPage from './pages/ReorderPage';
import IdCardScan from './pages/IdCardScan';
import PdfViewer from './pages/PdfViewer';
import PdfToImage from './pages/PdfToImage';
import PdfCompress from './pages/PdfCompress';
import PdfMerge from './pages/PdfMerge';
import PdfSplit from './pages/PdfSplit';
import PdfSettings from './pages/PdfSettings';
import './App.css';

let idCounter = 0;
const genId = () => `img-${++idCounter}-${Date.now()}`;

export default function App() {
  const [page, setPage] = useState<Page>('app-home');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [editorIndex, setEditorIndex] = useState(0);
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [pageOrientation, setPageOrientation] = useState<PageOrientation>('portrait');
  const [fillMode, setFillMode] = useState<FillMode>('fit');
  const [margin, setMargin] = useState<Margin>('None');
  const [pdfName, setPdfName] = useState('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [retakeImageId, setRetakeImageId] = useState<string | null>(null);
  const [addingFromEditor, setAddingFromEditor] = useState(false);
  const [autoCropEnabled, setAutoCropEnabled] = useState(true);
  const [reorderSnapshot, setReorderSnapshot] = useState<ImageItem[] | null>(null);

  // Scan state
  const [scanImages, setScanImages] = useState<ImageItem[]>([]);
  const [scanIndex, setScanIndex] = useState(0);
  const [scanRetakeId, setScanRetakeId] = useState<string | null>(null);

  const addImages = useCallback((files: File[]) => {
    setLoading(true);
    let remaining = files.length;
    files.forEach((f) => {
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        const item: ImageItem = { id: genId(), file: f, url, name: f.name, rotation: 0, width: img.naturalWidth, height: img.naturalHeight };
        setImages((prev) => [...prev, item]);
        remaining--;
        if (remaining === 0) setLoading(false);
      };
      img.onerror = () => { remaining--; if (remaining === 0) setLoading(false); };
      img.src = url;
    });
  }, []);

  const addScanImages = useCallback((files: File[]) => {
    files.forEach((f) => {
      const url = URL.createObjectURL(f);
      const img = new Image();
      img.onload = () => {
        const item: ImageItem = { id: genId(), file: f, url, name: f.name, rotation: 0, width: img.naturalWidth, height: img.naturalHeight };
        setScanImages((prev) => [...prev, item]);
      };
      img.src = url;
    });
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx !== -1) URL.revokeObjectURL(prev[idx].url);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const updateImage = useCallback((id: string, patch: Partial<ImageItem>) => {
    setImages((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }, []);

  const reorderImages = useCallback((from: number, to: number) => {
    setImages((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
  }, []);

  const removeScanImage = useCallback((id: string) => {
    setScanImages((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handlePickerConfirm = (selectedIds: Set<string>) => {
    if (selectedIds.size === 0) return;
    const selectedImages = ALL_MOCK_IMAGES.filter((img) => selectedIds.has(img.id));
    if (addingFromEditor) {
      const newStartIndex = images.length;
      setImages((prev) => [...prev, ...selectedImages]);
      setEditorIndex(newStartIndex);
      setAddingFromEditor(false);
    } else {
      setImages(selectedImages);
      setEditorIndex(0);
      setPageSize('A4');
      setPageOrientation('portrait');
      setFillMode('fit');
      setMargin('None');
    }
    setPage('editor');
  };

  const handleConvert = (name: string) => { setPdfName(name); setPage('converting'); };
  const handleScanConvert = (name: string) => { setPdfName(name); setPage('scan-converting'); };

  const handleConvertComplete = (blob: Blob) => {
    setPdfBlob(blob);
    setPdfUrl(URL.createObjectURL(blob));
    setPage('done');
  };

  const handleScanConvertComplete = (blob: Blob) => {
    setPdfBlob(blob);
    setPdfUrl(URL.createObjectURL(blob));
    setPage('scan-done');
  };

  const handleClose = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfBlob(null); setPdfUrl(''); setImages([]); setPdfName('');
    setPage('home');
  };

  const handleScanClose = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfBlob(null); setPdfUrl(''); setScanImages([]); setPdfName('');
    setPage('home');
  };

  const handleScanCapture = (capturedImages: { id: string; url: string }[]) => {
    const items: ImageItem[] = capturedImages.map((c) => ({
      id: c.id,
      file: new File([], 'scan.jpg'),
      url: c.url,
      name: 'scan.jpg',
      rotation: 0,
    }));
    setScanImages((prev) => [...prev, ...items]);
    setScanIndex(0);
    setPage('scan-crop');
  };

  return (
    <div className="app-shell">
      {page === 'app-home' && <AppHome onNavigate={setPage} />}
      {page === 'home' && <Home onNavigate={setPage} onBack={() => setPage('app-home')} />}

      {page === 'picker' && (
        <ImagePicker images={ALL_MOCK_IMAGES} addImages={addImages} removeImage={removeImage} onConfirm={handlePickerConfirm} loading={loading} onBack={() => { if (addingFromEditor) { setAddingFromEditor(false); setPage('editor'); } else { setPage('home'); } }} onCamera={() => setPage('picker-camera')} autoCrop={autoCropEnabled} onAutoCropChange={setAutoCropEnabled} />
      )}
      {page === 'picker-camera' && (
        <SimpleCamera onDone={(captured) => {
          const items: ImageItem[] = captured.map((c) => ({ id: c.id, file: new File([], 'photo.jpg'), url: c.url, name: 'photo.jpg', rotation: 0 }));
          if (items.length === 0) { setPage(addingFromEditor ? 'editor' : 'picker'); return; }
          if (addingFromEditor) {
            const newStartIndex = images.length;
            setImages((prev) => [...prev, ...items]);
            setEditorIndex(newStartIndex);
            setAddingFromEditor(false);
          } else {
            setImages(items);
            setEditorIndex(0);
            setPageSize('A4');
            setPageOrientation('portrait');
            setFillMode('fit');
            setMargin('None');
          }
          setPage('editor');
        }} onBack={() => setPage(addingFromEditor ? 'editor' : 'picker')} />
      )}
      {page === 'editor' && (
        <ImageEditor
          images={images}
          currentIndex={editorIndex}
          setCurrentIndex={setEditorIndex}
          updateImage={updateImage}
          removeImage={removeImage}
          addImages={addImages}
          onDone={() => setPage('preview')}
          onBack={() => setPage('picker')}
          onQuit={() => { setImages([]); setPage('home'); }}
          onRetake={() => {
            const img = images[editorIndex];
            if (img) { setRetakeImageId(img.id); setPage('retake-camera'); }
          }}
          onAddImage={() => { setAddingFromEditor(true); setPage('picker'); }}
          onScan={() => { setAddingFromEditor(true); setPage('picker-camera'); }}
          onReorder={() => { setReorderSnapshot([...images]); setPage('reorder'); }}
          pageSize={pageSize}
          setPageSize={setPageSize}
          pageOrientation={pageOrientation}
          setPageOrientation={setPageOrientation}
          defaultFillMode={fillMode}
          defaultMargin={margin}
          onDefaultsChange={(d) => { if (d.fillMode) setFillMode(d.fillMode); if (d.margin) setMargin(d.margin); }}
        />
      )}
      {page === 'reorder' && (
        <ReorderPage
          images={images}
          reorderImages={reorderImages}
          removeImage={removeImage}
          onDone={() => { setReorderSnapshot(null); setPage('editor'); }}
          onBack={() => { if (reorderSnapshot) setImages(reorderSnapshot); setReorderSnapshot(null); setPage('editor'); }}
        />
      )}
      {page === 'retake-camera' && (
        <SimpleCamera onDone={(captured) => {
          if (captured.length > 0 && retakeImageId) {
            updateImage(retakeImageId, { url: captured[0].url, rotation: 0 });
          }
          setRetakeImageId(null);
          setPage('editor');
        }} onBack={() => { setRetakeImageId(null); setPage('editor'); }} />
      )}
      {page === 'preview' && (
        <PreviewGrid images={images} addImages={addImages} removeImage={removeImage} onConvert={handleConvert} onBack={() => setPage('editor')} pageSize={pageSize} pageOrientation={pageOrientation} />
      )}
      {page === 'converting' && (
        <ConvertProgress images={images} pageSize={pageSize} pageOrientation={pageOrientation} defaultFillMode={fillMode} defaultMargin={margin} pdfName={pdfName} onComplete={handleConvertComplete} onCancel={() => setPage('preview')} />
      )}
      {page === 'done' && pdfBlob && (
        <FinalStatus pdfName={pdfName} pdfUrl={pdfUrl} pdfBlob={pdfBlob} thumbnail={images[0]?.url} onClose={handleClose} />
      )}

      {/* Scan flow */}
      {page === 'scan-capture' && (
        <ScanCapture onDone={handleScanCapture} onBack={() => setPage(scanImages.length > 0 ? 'scan-preview' : 'home')} onSwitchToIdCard={() => setPage('idcard-notice')} />
      )}
      {page === 'scan-crop' && (
        <ImageEditor images={scanImages} currentIndex={scanIndex} setCurrentIndex={setScanIndex}
          updateImage={(id, patch) => setScanImages((prev) => prev.map((i) => i.id === id ? { ...i, ...patch } : i))}
          removeImage={(id) => setScanImages((prev) => prev.filter((i) => i.id !== id))}
          addImages={addScanImages}
          onDone={() => setPage('scan-preview')}
          onBack={() => setPage('scan-capture')}
          onQuit={() => { setScanImages([]); setPage('home'); }}
          onRetake={() => {
            const img = scanImages[scanIndex];
            if (img) { setScanRetakeId(img.id); setPage('scan-retake'); }
          }} />
      )}
      {page === 'scan-retake' && (
        <ScanCapture onDone={(captured) => {
          if (captured.length > 0 && scanRetakeId) {
            setScanImages((prev) => prev.map((i) => i.id === scanRetakeId ? { ...i, url: captured[0].url, rotation: 0 } : i));
          }
          setScanRetakeId(null);
          setPage('scan-crop');
        }} onBack={() => { setScanRetakeId(null); setPage('scan-crop'); }} />
      )}
      {page === 'scan-preview' && (
        <PreviewGrid images={scanImages} addImages={addScanImages} removeImage={removeScanImage} onConvert={handleScanConvert} onBack={() => setPage('scan-crop')} title="Preview" onTakePhoto={() => setPage('scan-capture')} />
      )}
      {page === 'scan-converting' && (
        <ConvertProgress images={scanImages} pageSize={pageSize} pageOrientation={pageOrientation} defaultFillMode={fillMode} defaultMargin={margin} pdfName={pdfName} onComplete={handleScanConvertComplete} onCancel={() => setPage('scan-preview')} />
      )}
      {page === 'scan-done' && pdfBlob && (
        <FinalStatus pdfName={pdfName} pdfUrl={pdfUrl} pdfBlob={pdfBlob} thumbnail={scanImages[0]?.url} onClose={handleScanClose} />
      )}

      {/* ID Card Scan */}
      {page === 'idcard-notice' && (
        <IdCardScan onComplete={() => setPage('home')} onBack={() => setPage('home')} onSwitchToScan={() => setPage('scan-capture')} />
      )}

      {/* PDF Viewer */}
      {page === 'pdf-viewer' && (
        <PdfViewer fileName="Document.pdf" onBack={() => setPage('home')} />
      )}

      {/* PDF to Image */}
      {page === 'pdf2img-mode' && (
        <PdfToImage onBack={() => setPage('home')} mode="individual" />
      )}

      {page === 'pdf2longimg' && (
        <PdfToImage onBack={() => setPage('home')} mode="long" />
      )}

      {/* Compress */}
      {page === 'compress-level' && (
        <PdfCompress onBack={() => setPage('home')} />
      )}

      {/* Merge */}
      {page === 'merge-select' && (
        <PdfMerge onBack={() => setPage('home')} />
      )}

      {/* Split */}
      {page === 'split-pages' && (
        <PdfSplit onBack={() => setPage('home')} />
      )}

      {page === 'pdf-settings' && (
        <PdfSettings onBack={() => setPage('home')} />
      )}
    </div>
  );
}
