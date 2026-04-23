# Requirement – PDF Tools Phase 1 (Updated based on Prototype)

## Background

AMXP Local is evolving into a comprehensive file management app, with the goal of covering all file-related use cases in one place. PDF tools — including PDF converters, merge/split, compress, and more — are among the most frequently used and highly requested features. Supporting these capabilities will deepen the in-app experience, improve user stickiness, and drive higher engagement.

## Feature List Overview

- **PDF Viewer**: Support opening and rendering PDF files natively within the app. Also allow users to open password-protected PDF files by entering the correct password.
- **Image to PDF**: Convert one or more images into a single PDF file. All processing must be done on device.
- **Scan to PDF**: Camera capture images and convert to a single PDF file with document edge detection.
- **ID Card Scan**: Combine the front and back of an ID card into a single A4 PDF page.
- **PDF Compress**: Reduce the file size of a PDF while maintaining acceptable quality.
- **PDF to Image** (Include Long Image): Convert each page of a PDF into image files or a single scrollable long image.
- **PDF Merge**: Combine multiple PDF files into one.
- **PDF Extract** (formerly Split): Extract specific pages from a PDF file to create a new PDF document.

## Prototype Link

https://haikuli.github.io/pdf-tools/

---

## 1. Homepage

### Entry Points
Support PDF Tools entrance from Local Tiles (labeled "Fatafat") on the app home page. Tapping the entry lands on the PDF Tools home page.

### PDF Tools Home Page

The page is comprised of two parts:

#### 1) Tool Quick Entrance (8 tools)
- Image to PDF
- Scan to PDF
- ID Card ScanAuto Cropped images will be displayed as original image when using Crop feature 
- Compress PDF
- Merge PDF
- Extract PDF

#### 2) PDF File List
Display all PDF files in user internal storage & SD card. External devices (e.g., USB) are not included.

**File items in list are comprised of:**
- File thumbnail (styled document preview showing document type — invoice, contract, presentation, etc.)
- File name
- File size
- Modification date

**Note:** File path is NOT shown in the list view. Path is available in the Properties dialog.

**Sort by:**
- Recent (Modification Date): From new to old / From old to new
- Title: A to Z / Z to A
- File Size: From large to small / From small to large

Sort is accessed via a sort button that opens a dialog with sort field selection and ascending/descending toggle.

**Search:**
- Search icon in the top bar opens a search input
- Real-time filtering of PDF files by name
- Search history is saved (up to 5 recent searches) with clear option
- Tapping a search result opens the file

**Password-protected PDF files:**
When the user attempts to open a password-protected PDF file, a password dialog appears:
- Title: "Password required"
- Description: "[filename] is password protected. Enter the password to open the PDF file."
- Input box with show/hide password toggle
- CTA: [Cancel, OK]
- Incorrect password: Error message "Wrong password." appears below the input box

**More options for single file (context menu via ⋮ or long press):**
- Rename
- Share
- PDF to Image
- PDF to Long Image
- Merge PDF
- Extract PDF
- Compress PDF
- Delete
- Properties

**Properties dialog shows:**
- Name
- Size
- Modified date
- Created date
- Path
- Protected (Yes/No)

**Multi-select:**
- Long press a file to enter multi-select mode
- Bottom bar: Share, Merge, Delete

**Settings (gear icon in top bar):**
Settings page with two sections:
- **Import**: Auto Crop (Ask every time / Always on / Always off)
- **PDF Output**: Default Page Size (Fit / A4 Portrait / A4 Landscape / Letter Portrait / Letter Landscape / Legal Portrait / Legal Landscape), Default Margin (None / Small / Large)

---

## 2. PDF Viewer

Enables users to open and render PDF files natively within the app.

**User Flow:**
1. User single clicks on a PDF file item to open it
2. If the file is password-protected, password dialog appears
3. User enters password; app validates on-device
4. App renders the file; user can scroll and navigate pages

---

## 3. Image to PDF

Convert one or more images into a single PDF file. Supports both gallery selection and camera capture. Images are preserved in user's selection order.

**Input:**
- Source: Device gallery (via image picker with folder browsing) or camera capture
- Supported formats: JPEG, PNG, WEBP, BMP
- Max images: 100 per conversion

**Output:**
- File Format: PDF
- Page Layout: One image per page
- Default Page Size: A4 Portrait (configurable in Settings)
- File Naming: Default 'my-document.pdf', user can rename
- Output saved to: /storage/emulated/0/Documents/MXPlayer/PDF/

**User Flow:**

### Step 1: Image Picker
- User taps "Image to PDF" entry point
- **First-time onboarding guide**: Semi-transparent overlay shows swipe-to-select gesture animation with sequential 1,2,3,4 highlights on actual images. Tap anywhere to dismiss. Shown only once (remembered in localStorage).
- Folder dropdown at top to switch between: All Photos, Camera, Screenshots, Downloads, Favorites
- 3-column grid of image thumbnails
- Tap to select/deselect; selected images show order number badge (1, 2, 3...)
- **Swipe multi-select**: Long press + drag across images to quickly select/deselect multiple
- **Full-screen preview**: Tap ⤢ button on any image to preview full screen, swipe left/right to navigate
- **Select All**: Checkbox in top bar to select/deselect all images in current folder
- **Selected strip**: Bottom bar shows selected image thumbnails with ✕ remove buttons
- **Camera**: Camera button in grid to capture new photos
- Tap "Confirm (N)" to proceed

### Step 2: Import Options
- Bottom sheet with two options: Original (keep as is) / Auto Crop (detect edges)
- "Remember my choice" checkbox — when checked, shows hint "Change anytime in Settings" with ? help button showing Settings location
- Tap "Continue" to proceed to editor

### Step 3: Editor
- Full-screen image canvas with current image displayed
- **Page indicator**: ‹ 1/5 › centered between canvas and thumbnail strip
- **Thumbnail strip**: Horizontal scrollable strip at bottom showing all images (64px), auto-scrolls to active image
- **Multi-select mode**: ✓ button to enter multi-select, shows checkboxes on thumbnails, enables batch Rotate and Delete

**Bottom bar tools (left to right, horizontally scrollable):**
1. **Rotate**: Each tap rotates 90° clockwise
2. **Crop**: Toggle crop overlay with corner handles, grid lines. Apply/Cancel buttons
3. **Filter**: Sheet with 5 options — Original, Auto, Grayscale, B&W, Color+. **Per-image** (each image has its own filter). "Apply to all images" checkbox available.
4. **Delete**: Removes current image with confirmation dialog
5. **Reorder**: Opens reorder page with drag-and-drop grid. First-time drag guide overlay. Supports delete (✕ on each card). Back cancels reorder, Done confirms.
6. **Add**: Sheet above bar with Album and Camera options to add more images
7. **Page Size**: Sheet with horizontal scrollable options — Fit / A4 Portrait / A4 Landscape / Letter Portrait / Letter Landscape / Legal Portrait / Legal Landscape. Global setting (applies to all pages).
8. **Placement**: Sheet with Fill mode (Fit/Fill/Stretch), Margin (None/Small/Large), Align (Center/Top/Bottom). Per-image with "Apply to all" checkbox.

Tap "Done" to proceed to preview.

### Step 4: Preview
- Title: "Preview (N)" showing image count
- List view (default) or grid view toggle in top bar
- Scrollable list showing all pages with applied page size, rotation, and filter
- Page numbers shown on each card
- "Convert" button at bottom

### Step 5: Convert
- Bottom sheet to name the PDF file
- Progress ring animation
- **Done page**: ✓ icon, "Converted successfully!", PDF thumbnail preview, file name, path, Share (primary) and Open (secondary) buttons
- Open shows in-app PDF preview
- Back from done page returns to home

**Edge Cases:**
- If storage insufficient: error dialog "Not enough storage space"
- If user removes all selected images: Back to image picker page
- If a PDF file with same name exists: auto suffix [filename] (1)
- If selected images are corrupted: skip and continue, show prompt on final page

---

## 4. Scan to PDF

Camera capture images and convert to a single PDF file with document edge auto-detection.

**Input:**
- Source: Camera capture with OpenCV edge detection
- Output: PDF, one image per page
- Default Page Size: Fit (Auto) — page size matches image aspect ratio
- File Naming: Default 'Scan_[timestamp].pdf', user can rename
- Output saved to: /storage/emulated/0/Documents/MXPlayer/PDF/

**User Flow:**

### Step 1: Camera
- Camera opens with real-time document edge detection (purple overlay with corner dots)
- Top bar: Back, title "Scan", Grid toggle, Flash toggle
- **Mode tabs**: "Scan" / "ID Card" tabs above capture button to switch between modes
- Grid overlay toggle for alignment
- Capture button; captured thumbnails stack at bottom left with count badge
- Album button to import from gallery
- "Next (N)" button appears after first capture

### Step 2: Editor
Same as Image to PDF editor with all tools:
- Retake, Rotate, Crop, Filter, Delete, Reorder, Add (Album & Camera), Page Size, Placement
- **Retake** is positioned before Rotate in the bottom bar (leftmost tool)
- **Add** opens a sheet with both Album and Camera options
- **Retake** available to re-capture specific images via camera
- Default page size is Fit (Auto), not A4

### Step 3: Preview → Convert → Done
Same flow as Image to PDF.

**Filter options (same as Image to PDF):**
- Original
- Auto/Magic: contrast 1.3, brightness 1.1, saturate 0.4
- Grayscale: grayscale 1, contrast 1.2
- B&W: grayscale 1, contrast 3.0, brightness 1.3
- Color+: contrast 1.2, saturate 1.5, brightness 1.05

---

## 5. ID Card Scan

A layout tool that places the front and back images of an ID card on a single A4 page.

**Input:**
- Front/Back images via camera capture or gallery
- Supported formats: JPEG, PNG

**Output:**
- PDF with both images on single A4 page (75% width, centered)
- File Naming based on type: IDCard_[date].pdf / Passport_[date].pdf / SinglePage_[date].pdf
- Output saved to: /storage/emulated/0/Documents/MXPlayer/PDF/

**User Flow:**

### Step 1: Guide Page
- Camera preview with overlay card showing mock ID card layout
- **Privacy Notice dialog** (shown on first entry): "Your ID card images are processed entirely on your device. No images are uploaded." [Cancel, Got it]
- **3 mode options**: ID Card (2 sides), Passport (split 1 capture into 2 pages), Single Side
- Grid toggle and flash toggle in top bar
- "Start Scan" button
- **Mode tabs**: "Scan" / "ID Card" tabs to switch to Scan to PDF

### Step 2: Capture
- Camera with viewfinder frame (ID card aspect ratio 1.586:1)
- Title shows "Front Side" / "Back Side"
- After capturing front, toast: "Front side captured! Now scan the back side."
- Album button available
- Grid and flash toggles
- **During retake**: Scan/ID Card mode tabs hidden

### Step 3: Preview
- A4 page preview with front and back images (75% width, centered)
- Bottom bar: Edit, Filter, Convert button
- Filter sheet with Original/Magic/Grayscale/B&W options

### Step 4: Edit (Adjust)
- Full canvas with current image
- Page indicator ‹ 1/2 › for front/back navigation
- Left/right swipe to switch between front and back
- Bottom bar: Rotate, Crop, Retake
- **Retake only re-captures the current image** (single shot, returns to preview)

### Step 5: Convert → Done
- Name the PDF → Progress → Done page
- Done page: ✓, file name, path, Share/Open buttons
- Open shows front/back images in scrollable preview

---

## 6. PDF to Image (Include Long Image)

Two separate entry points: "PDF to Image" and "PDF to Long Image".

**Input:** PDF file from device storage
**Output:**
- Individual images: each page as separate JPEG/PNG
- Long image: all selected pages merged vertically
- Output saved to: /storage/emulated/0/Pictures/MXPlayer/[OriginalName]/

**User Flow:**

### Step 1: Select File
- Title: "Select File"
- Search bar for filtering
- PDF file list with thumbnails, name, size, date

### Step 2: Select Pages
- Title: "Select Pages"
- Page thumbnails in grid (3 columns) with real images
- Select All checkbox in top bar
- Selected pages show order number badge
- Bottom bar: Format toggle (JPEG/PNG) + "Convert (N)" button

### Step 3: Convert → Done
- Progress ring
- Done page shows: ✓, "Converted successfully!", image count, format, save path
- Preview thumbnails of converted images
- Share and Open buttons
- **Individual mode**: Open shows file list with thumbnails
- **Long image mode**: Open shows full scrollable long image with Share button

---

## 7. PDF Compress

Reduce PDF file size while maintaining acceptable quality.

**Input:** PDF file from device storage
**Output:**
- Compressed PDF file
- File Naming: '[OriginalName]_compressed.pdf'
- Output saved to: /storage/emulated/0/Documents/MXPlayer/PDF/

**Compression Levels:**
- Small Size: Low quality, maximum compression (ratio ~0.25)
- Medium Size: Good quality, balanced (ratio ~0.45)
- Large Size: Best quality, minimal compression (ratio ~0.75)
- Default selection: Small Size

**User Flow:**

### Step 1: Select File
- Title: "Select File"
- Search bar + PDF file list with thumbnails, name, size, date

### Step 2: Choose Level
- Title: "Compress PDF"
- Three radio-style options with description
- "Compress" button at bottom

### Step 3: Progress → Done
- Progress ring with ✓ on completion
- **If file already optimized** (reduction ≤ 1%): Green ✓, "Already optimized", file info, "Done" button
- **If compressed**: ✓, "Reduced by XX%", size comparison, file name, path, Share/Open buttons
- Open shows mock PDF page preview

---

## 8. PDF Merge

Combine multiple PDF files into one.

**Input:**
- Minimum: 2 PDF files
- Maximum: TBC

**Output:**
- Single merged PDF
- File Naming: Default 'Merged_[timestamp].pdf', user can rename
- Output saved to: /storage/emulated/0/Documents/MXPlayer/PDF/

**User Flow:**

### Step 1: Select Files
- Title: "Select Files"
- Search bar + PDF file list with styled thumbnails, name, size, date
- Checkbox selection, Select All in top bar
- "Next (N)" button at bottom (enabled when ≥ 2 selected)

### Step 2: Reorder
- Title: "Merge PDF"
- Hint: "Drag to reorder"
- File list with: red circle minus (−) delete button on left, thumbnail, file info, drag handle (☰) on right
- **"+ Add PDF"** item at bottom of list (dashed border) to go back and add more files
- Deleting a file syncs the selection state
- "Merge (N)" button at bottom
- Tap Merge → name the PDF in bottom sheet → progress

### Step 3: Done
- ✓, "Merged successfully!", PDF thumbnail, file name, path
- Share/Open buttons
- Open shows multi-page mock PDF preview

---

## 9. PDF Extract (formerly Split)

Extract specific pages from a PDF file to create a new PDF document.

**Input:** Single PDF file
**Output:**
- Single PDF with selected pages (in original page order)
- File Naming: '[OriginalName]_p[pages].pdf'
- Output saved to: /storage/emulated/0/Documents/MXPlayer/PDF/

**User Flow:**

### Step 1: Select File
- Title: "Select File"
- Search bar + PDF file list with thumbnails, name, size, date, page count

### Step 2: Select Pages
- Title: "Select Pages"
- Page thumbnails in grid (3 columns) with real images
- Selected pages show ✓ checkmark (no order number — pages are always in original order)
- Select All checkbox in top bar
- Page number shown at bottom of each thumbnail
- "Extract (N pages)" button at bottom

### Step 3: Progress → Done
- Progress ring
- Done page: ✓, "Extracted successfully!", PDF thumbnail, file name, path
- Share/Open buttons
- Open shows selected pages as scrollable image preview

---

## 10. Processing Cancel Operation

**Applies to:** All PDF processing features

**Behavior:**
If the user presses the back button/gesture during processing or editing:
- Confirmation dialog appears

| Area | Feature | Dialog Title | Dialog Content | CTAs |
|------|---------|-------------|----------------|------|
| PDF Generate/Convert | Image to PDF, PDF to Image, Scan to PDF, ID Card Scan | Quit? | Your current progress will be lost. Are you sure you want to quit? | [Cancel, Quit] |
| Compress | Compress PDF | Quit compressing? | Are you sure you want to quit and discard the changes? | [Cancel, Quit] |
| Merge | Merge PDF | Quit Merging? | Are you sure you want to quit and discard the changes? | [Cancel, Quit] |
| Extract | Extract PDF | Quit? | Are you sure you want to quit and discard the changes? | [Cancel, Quit] |
| Capture | Scan to PDF | Discard photos? | Your captured photos will not be saved. | [Cancel, Discard] |
| Capture | ID Card Scan | Quit? | Your current progress will be lost. Are you sure you want to quit? | [Cancel, Quit] |

---

## 11. File Search

Support searching PDF file items in:
- Homepage PDF file list
- All "Select File" pages (Compress, Merge, Extract, PDF to Image)

**Behavior:**
- Search icon in top bar
- Tap to open search input with placeholder "Search files..." / "Search PDF files..."
- Real-time filtering by file name (case-insensitive)
- Search history saved (up to 5 recent searches)
- Clear history option
- Close search with ✕ button

---

## 12. All Done Pages — Unified Pattern

All features follow a consistent done page pattern:

- Title bar: Descriptive completion title (e.g., "PDF Converted", "PDF Compressed", "PDF Merged", "Pages Extracted", "Images Exported")
- ✓ green circle icon
- Success message
- PDF/image thumbnail preview
- File name
- Save path
- **Share** (primary button, full width)
- **Open** (secondary button, full width)
- Back from done page returns to PDF Tools home

---

## Key Differences from Original PRD

1. **Extract PDF** (renamed from "Split PDF"): Simplified to page selection only — no range input, no split tasks. Users tap to select pages, extract into one new PDF.
2. **Image to PDF Editor**: Bottom bar order is Rotate → Crop → Filter → Delete → Reorder → Add → Page Size → Placement. Filter is per-image. Swipe multi-select guide on first visit.
3. **Scan to PDF**: Default page size is Fit (Auto), not A4. Shares the same editor as Image to PDF with all tools including Page Size and Placement.
4. **ID Card Scan**: Privacy notice is a dialog overlay (not a separate page). Edit page supports left/right swipe between front/back. Retake only re-captures single image.
5. **Merge PDF**: Reorder page has red circle minus delete + drag handle. "+ Add PDF" is inline in the list. Select All available.
6. **Homepage**: File path removed from list view (available in Properties). Created date added to Properties. Settings simplified to Auto Crop + Default Page Size + Default Margin.
7. **Search**: Available on all file selection pages, not just homepage. Includes search history.
8. **Done pages**: All unified with thumbnail preview, descriptive titles, Share (primary) / Open (secondary) pattern.
