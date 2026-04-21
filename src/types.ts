export interface ImageItem {
  id: string;
  file: File;
  url: string;
  name: string;
  rotation: number;
  width?: number;
  height?: number;
  crop?: { x: number; y: number; w: number; h: number };
  fillMode?: FillMode;
  alignment?: Alignment;
  margin?: Margin;
}

export type PageSize = 'Auto' | 'A4' | 'Letter' | 'Legal';
export type PageOrientation = 'portrait' | 'landscape';
export type FillMode = 'fit' | 'fill' | 'stretch';
export type Alignment = 'center' | 'top' | 'bottom';
export type Margin = 'None' | 'Small' | 'Large';
export type ScanFilter = 'original' | 'grayscale' | 'bw' | 'magic';

export interface WatermarkConfig {
  enabled: boolean;
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  angle: number;
  mode: 'single' | 'tile';
}

export interface SignatureItem {
  id: string;
  url: string;
  x: number;  // percentage 0-100
  y: number;  // percentage 0-100
  width: number; // percentage of page width
  pageIndex: number; // which image/page it's on
}

export type Page =
  | 'app-home'
  | 'home'
  // Image to PDF
  | 'picker' | 'picker-camera' | 'retake-camera' | 'editor' | 'reorder' | 'preview' | 'converting' | 'done'
  // Scan to PDF
  | 'scan-capture' | 'scan-crop' | 'scan-retake' | 'scan-reorder' | 'scan-filter' | 'scan-preview' | 'scan-converting' | 'scan-done'
  // ID Card Scan
  | 'idcard-notice' | 'idcard-front' | 'idcard-back' | 'idcard-preview' | 'idcard-converting' | 'idcard-done'
  // PDF Viewer
  | 'pdf-viewer'
  // PDF to Image
  | 'pdf2img-mode' | 'pdf2img-pages' | 'pdf2img-converting' | 'pdf2img-done'
  | 'pdf2longimg'
  // Compress
  | 'compress-level' | 'compress-progress' | 'compress-done'
  // Merge
  | 'merge-select' | 'merge-order' | 'merge-progress' | 'merge-done'
  // Split
  | 'split-select' | 'split-pages' | 'split-confirm' | 'split-progress' | 'split-done'
  // Settings
  | 'pdf-settings';
