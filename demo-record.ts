import { chromium, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5174/pdf-tools/';
const PAUSE = 2000;
const SHORT = 1200;
const LONG = 3000;

async function tap(page: Page, selector: string, timeout = 5000) {
  const el = page.locator(selector).first();
  await el.waitFor({ timeout }).catch(() => {});
  const box = await el.boundingBox().catch(() => null);
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
    await page.waitForTimeout(300);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  } else {
    await el.click().catch(() => {});
  }
}

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 1,
    recordVideo: { dir: './demo-videos/', size: { width: 430, height: 932 } },
  });
  const page = await context.newPage();
  await page.goto(BASE_URL);

  // Inject visible cursor
  await page.addStyleTag({ content: `
    #pw-cursor { position:fixed; width:24px; height:24px; border-radius:50%; background:rgba(108,92,231,0.5); border:2px solid rgba(108,92,231,0.8); pointer-events:none; z-index:99999; transform:translate(-50%,-50%); display:none; }
  `});
  await page.evaluate(() => {
    const d = document.createElement('div'); d.id = 'pw-cursor'; document.body.appendChild(d);
    document.addEventListener('mousemove', e => { d.style.left=e.clientX+'px'; d.style.top=e.clientY+'px'; d.style.display='block'; });
    document.addEventListener('mousedown', () => { d.style.transform='translate(-50%,-50%) scale(0.7)'; });
    document.addEventListener('mouseup', () => { d.style.transform='translate(-50%,-50%) scale(1)'; });
  });

  await page.waitForTimeout(LONG);
  await page.waitForTimeout(LONG);

  // === PDF Tools Home ===
  await tap(page, 'text=PDF Tools');
  await page.mouse.move(215, 700);
  await page.waitForTimeout(LONG);

  await page.waitForSelector('.file-list', { timeout: 10000 });
  await page.waitForTimeout(SHORT);

  const fileList = page.locator('.file-list');
  await fileList.evaluate((el: HTMLElement) => el.scrollTo({ top: 500, behavior: 'smooth' }));
  await page.waitForTimeout(PAUSE);
  await fileList.evaluate((el: HTMLElement) => el.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(SHORT);

  // Search → preview
  await tap(page, '.topbar .btn-icon >> nth=1');
  await page.waitForTimeout(SHORT);
  await page.locator('.topbar-search-input').fill('Invoice');
  await page.waitForTimeout(PAUSE);
  await tap(page, 'text=Invoice_2026.pdf');
  await page.waitForTimeout(LONG);
  await page.locator('button:has-text("←")').first().click();
  await page.waitForTimeout(SHORT);
  await tap(page, '.topbar button:has-text("✕")');
  await page.waitForTimeout(PAUSE);

  // Encrypted file
  await tap(page, 'text=Contract_signed.pdf');
  await page.waitForTimeout(PAUSE);
  await page.waitForSelector('.password-input-wrap', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(SHORT);
  await page.locator('.password-input-wrap input').fill('1234');
  await page.waitForTimeout(SHORT);
  await tap(page, '.dialog-actions >> text=OK');
  await page.waitForTimeout(LONG);
  await page.locator('button:has-text("←")').first().click();
  await page.waitForTimeout(PAUSE);

  // === Image Picker ===
  await tap(page, 'text=Image to PDF');
  await page.waitForTimeout(PAUSE);

  // FIX 1: Wait longer before dismissing guide
  if (await page.locator('text=Got it').isVisible().catch(() => false)) {
    await page.waitForTimeout(LONG); // let user see the guide animation
    await tap(page, 'text=Got it');
    await page.waitForTimeout(SHORT);
  }

  await page.selectOption('.folder-dropdown', 'Camera');
  await page.waitForTimeout(SHORT);

  // Select 5 images
  const thumbs = page.locator('.picker-thumb');
  for (let i = 0; i < 5; i++) {
    const box = await thumbs.nth(i).boundingBox().catch(() => null);
    if (box) {
      await page.mouse.move(box.x + box.width/2, box.y + box.height/2, { steps: 8 });
      await page.waitForTimeout(200);
      await page.mouse.click(box.x + box.width/2, box.y + box.height/2);
    }
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(PAUSE);

  // Preview image
  await tap(page, '.picker-preview-btn >> nth=1');
  await page.waitForTimeout(PAUSE);
  await page.mouse.click(380, 466);
  await page.waitForTimeout(SHORT);
  await tap(page, '.image-preview-overlay button:has-text("←")');
  await page.waitForTimeout(SHORT);

  // Remove one from strip
  const removeBtn = page.locator('.picker-selected-remove').last();
  const rBox = await removeBtn.boundingBox().catch(() => null);
  if (rBox) {
    await page.mouse.move(rBox.x + rBox.width/2, rBox.y + rBox.height/2, { steps: 8 });
    await page.waitForTimeout(300);
    await page.mouse.click(rBox.x + rBox.width/2, rBox.y + rBox.height/2);
  }
  await page.waitForTimeout(PAUSE);

  // === Confirm → Editor ===
  await tap(page, '.btn-confirm-full');
  await page.waitForTimeout(SHORT);
  await page.waitForSelector('.bottom-sheet', { timeout: 3000 }).catch(() => {});
  await page.waitForTimeout(SHORT);
  await tap(page, '.bottom-sheet .btn-confirm-full');
  await page.waitForTimeout(PAUSE);

  // === Editor ===

  // 1. Rotate (twice = 180°, avoids aspect ratio issue)
  await tap(page, '.bar-btn:has-text("Rotate")');
  await page.waitForTimeout(SHORT);
  await tap(page, '.bar-btn:has-text("Rotate")');
  await page.waitForTimeout(PAUSE);

  // 2. Crop
  await tap(page, '.bar-btn:has-text("Crop")');
  await page.waitForTimeout(LONG);
  await tap(page, '.bar-btn:has-text("Crop")');
  await page.waitForTimeout(SHORT);

  // FIX 2 & 6: Filter — only apply to current image, don't apply to all
  await tap(page, '.bar-btn:has-text("Filter")');
  await page.waitForTimeout(PAUSE);
  await tap(page, '.filter-sheet-option:has-text("Color+")');
  await page.waitForTimeout(PAUSE);
  await tap(page, '.bar-btn:has-text("Filter")');
  await page.waitForTimeout(SHORT);

  // Navigate to next image to show it doesn't have filter
  const nextArrow = page.locator('.editor-nav-center .page-arrow').last();
  await nextArrow.click().catch(() => {});
  await page.waitForTimeout(SHORT);
  // Go back to first
  const prevArrow = page.locator('.editor-nav-center .page-arrow').first();
  await prevArrow.click().catch(() => {});
  await page.waitForTimeout(SHORT);

  // 4. Delete — navigate to last page
  for (let i = 0; i < 3; i++) {
    await nextArrow.click().catch(() => {});
    await page.waitForTimeout(400);
  }
  await tap(page, '.bar-btn:has-text("Delete")');
  await page.waitForTimeout(SHORT);
  await tap(page, '.btn-danger');
  await page.waitForTimeout(PAUSE);

  // FIX 3: Reorder — actually drag an item
  await tap(page, '.bar-btn:has-text("Reorder")');
  await page.waitForTimeout(SHORT);
  await page.waitForSelector('.drag-guide-overlay', { timeout: 3000 }).catch(() => {});
  await tap(page, '.drag-guide-overlay .btn-primary');
  await page.waitForTimeout(PAUSE);

  // Drag first card to second position
  const cards = page.locator('.preview-card');
  const card1 = await cards.nth(0).boundingBox().catch(() => null);
  const card2 = await cards.nth(1).boundingBox().catch(() => null);
  if (card1 && card2) {
    await page.mouse.move(card1.x + card1.width/2, card1.y + card1.height/2, { steps: 5 });
    await page.waitForTimeout(200);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.move(card2.x + card2.width/2, card2.y + card2.height/2, { steps: 15 });
    await page.waitForTimeout(300);
    await page.mouse.up();
  }
  await page.waitForTimeout(PAUSE);

  await tap(page, '.topbar .btn-primary:has-text("Done")');
  await page.waitForTimeout(PAUSE);

  // FIX 4: Add — click directly without scrolling bar
  await tap(page, '.bar-btn:has-text("Add")');
  await page.waitForTimeout(LONG); // show the bottom sheet fully
  await tap(page, '.editor-sheet button:has-text("Album")');
  await page.waitForTimeout(PAUSE);
  const newThumb = page.locator('.picker-thumb').nth(6);
  const ntBox = await newThumb.boundingBox().catch(() => null);
  if (ntBox) {
    await page.mouse.move(ntBox.x + ntBox.width/2, ntBox.y + ntBox.height/2, { steps: 8 });
    await page.waitForTimeout(200);
    await page.mouse.click(ntBox.x + ntBox.width/2, ntBox.y + ntBox.height/2);
  }
  await page.waitForTimeout(SHORT);
  await tap(page, '.btn-confirm-full');
  await page.waitForTimeout(SHORT);
  await page.waitForSelector('.bottom-sheet', { timeout: 3000 }).catch(() => {});
  await tap(page, '.bottom-sheet .btn-confirm-full');
  await page.waitForTimeout(PAUSE);

  // 7. Page Size
  await tap(page, '.bar-btn:has-text("Page Size")');
  await page.waitForTimeout(PAUSE);
  // Show A4 is selected (default), just display the sheet
  await page.waitForTimeout(PAUSE);
  await tap(page, '.bar-btn:has-text("Page Size")');
  await page.waitForTimeout(SHORT);

  // === Preview ===
  await tap(page, '.topbar .btn-primary:has-text("Done")');
  await page.waitForTimeout(PAUSE);

  const preview = page.locator('.preview-list, .preview-grid');
  await preview.evaluate((el: HTMLElement) => el.scrollTo({ top: 600, behavior: 'smooth' })).catch(() => {});
  await page.waitForTimeout(PAUSE);
  await preview.evaluate((el: HTMLElement) => el.scrollTo({ top: 0, behavior: 'smooth' })).catch(() => {});
  await page.waitForTimeout(PAUSE);

  // === Convert & Done ===
  await tap(page, '.btn-confirm-full:has-text("Convert")');
  await page.waitForTimeout(SHORT);
  await page.locator('.bottom-sheet input, .bottom-sheet .folder-dropdown').fill('My_Document');
  await page.waitForTimeout(SHORT);
  await tap(page, '.bottom-sheet .btn-primary:has-text("Convert")');
  await page.waitForTimeout(LONG);
  await page.waitForTimeout(LONG);

  // Open and browse
  await tap(page, 'text=Open');
  await page.waitForTimeout(LONG);
  await page.waitForTimeout(LONG);

  // Save - page.close() finalizes the video, then saveAs copies it
  const video = page.video();
  await page.close();
  await page.waitForTimeout(1000).catch(() => {});
  if (video) {
    try {
      await video.saveAs('/Users/haikuli/Downloads/Kiro/image-to-pdf/demo-videos/demo2.webm');
      console.log('✅ Video saved to demo-videos/demo2.webm');
    } catch (e) {
      console.log('⚠️ saveAs failed, checking temp path...');
      try {
        const p = await video.path();
        console.log('Temp path:', p);
      } catch {}
    }
  } else {
    console.log('⚠️ No video object');
  }
  await context.close();
  await browser.close();
  console.log('✅ Done');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
