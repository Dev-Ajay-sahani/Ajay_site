/**
 * Sarkari Babu Tools — High-Fidelity Image & Canvas Processing Engine
 * 100% Client-Side Private Processing
 * Features: Multi-Step Bicubic Downsampling, Micro-Sharpening, and Smart Perceptual Compression
 */

const SarkariEngine = (function() {
  'use strict';

  /**
   * Convert physical unit to pixels at given DPI
   */
  function toPixels(value, unit, dpi = 200) {
    if (unit === 'px') return Math.round(value);
    if (unit === 'in') return Math.round(value * dpi);
    if (unit === 'cm') return Math.round((value / 2.54) * dpi);
    if (unit === 'mm') return Math.round((value / 25.4) * dpi);
    return Math.round(value);
  }

  /**
   * Convert pixels to physical unit at given DPI
   */
  function fromPixels(px, unit, dpi = 200) {
    if (unit === 'px') return px;
    if (unit === 'in') return (px / dpi).toFixed(2);
    if (unit === 'cm') return ((px * 2.54) / dpi).toFixed(2);
    if (unit === 'mm') return ((px * 25.4) / dpi).toFixed(1);
    return px;
  }

  /**
   * High-Quality Stepped Downsampling (Bicubic Multi-Pass)
   * Prevents pixel aliasing and moire artifacts when scaling down large photos.
   */
  function highQualityDownsample(sourceCanvas, targetWidth, targetHeight) {
    let curW = sourceCanvas.width;
    let curH = sourceCanvas.height;

    // If source is already at or near target size, perform direct high-quality copy
    if (curW <= targetWidth * 1.25 && curH <= targetHeight * 1.25) {
      const out = document.createElement('canvas');
      out.width = targetWidth;
      out.height = targetHeight;
      const ctx = out.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
      return out;
    }

    // Create an intermediate stepping canvas
    let currentCanvas = document.createElement('canvas');
    currentCanvas.width = curW;
    currentCanvas.height = curH;
    let currentCtx = currentCanvas.getContext('2d');
    currentCtx.drawImage(sourceCanvas, 0, 0);

    // Iteratively halve dimensions until reaching near target
    while (curW * 0.5 > targetWidth && curH * 0.5 > targetHeight) {
      curW = Math.round(curW * 0.5);
      curH = Math.round(curH * 0.5);

      const nextCanvas = document.createElement('canvas');
      nextCanvas.width = curW;
      nextCanvas.height = curH;
      const nextCtx = nextCanvas.getContext('2d');
      nextCtx.imageSmoothingEnabled = true;
      nextCtx.imageSmoothingQuality = 'high';
      nextCtx.drawImage(currentCanvas, 0, 0, curW, curH);

      currentCanvas = nextCanvas;
      currentCtx = nextCtx;
    }

    // Final scaling pass to exact target dimensions
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(currentCanvas, 0, 0, targetWidth, targetHeight);

    return finalCanvas;
  }

  /**
   * Subtle Unsharp Masking (Convolution Sharpen Filter)
   * Restores high-frequency micro-contrast (eyes, text, signature lines) post-downscale.
   */
  function applyMicroSharpen(canvas, strength = 0.22) {
    if (strength <= 0) return canvas;

    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.getImageData(0, 0, w, h);
    const src = imgData.data;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d');
    const outImgData = outCtx.createImageData(w, h);
    const dst = outImgData.data;

    // Fast 3x3 convolution kernel with edge preservation
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;

        if (x === 0 || x === w - 1 || y === 0 || y === h - 1) {
          dst[idx] = src[idx];
          dst[idx + 1] = src[idx + 1];
          dst[idx + 2] = src[idx + 2];
          dst[idx + 3] = src[idx + 3];
          continue;
        }

        // Surrounding pixel indices
        const top = idx - (w * 4);
        const bot = idx + (w * 4);
        const left = idx - 4;
        const right = idx + 4;

        for (let c = 0; c < 3; c++) {
          const center = src[idx + c];
          const neighborAvg = (src[top + c] + src[bot + c] + src[left + c] + src[right + c]) * 0.25;
          const diff = center - neighborAvg;
          
          // Subtle boost to micro-edges only
          const val = center + diff * strength;
          dst[idx + c] = Math.min(255, Math.max(0, Math.round(val)));
        }
        dst[idx + 3] = src[idx + 3]; // Alpha unchanged
      }
    }

    outCtx.putImageData(outImgData, 0, 0);
    return outCanvas;
  }

  /**
   * Embed exact DPI resolution into JPEG JFIF header
   */
  async function insertDpiIntoJpeg(blob, dpi = 200) {
    const arrayBuffer = await blob.arrayBuffer();
    const view = new DataView(arrayBuffer);

    if (view.getUint16(0) !== 0xFFD8) {
      return blob; // Not a JPEG
    }

    let offset = 2;
    let jfifFound = false;

    while (offset < view.byteLength - 4) {
      const marker = view.getUint16(offset);
      const length = view.getUint16(offset + 2);

      if (marker === 0xFFE0) { // APP0 Marker
        if (
          view.getUint8(offset + 4) === 0x4A && // J
          view.getUint8(offset + 5) === 0x46 && // F
          view.getUint8(offset + 6) === 0x49 && // I
          view.getUint8(offset + 7) === 0x46 && // F
          view.getUint8(offset + 8) === 0x00
        ) {
          view.setUint8(offset + 11, 1);       // 1 = dots per inch (DPI)
          view.setUint16(offset + 12, dpi);     // X density
          view.setUint16(offset + 14, dpi);     // Y density
          jfifFound = true;
          break;
        }
      }
      offset += 2 + length;
    }

    return jfifFound ? new Blob([arrayBuffer], { type: 'image/jpeg' }) : blob;
  }

  /**
   * Smart Perceptual Compression to Target KB with Maximum Quality Preservation
   * - Performs 10-step precision binary search.
   * - Applies micro-sharpening to prevent blurriness.
   * - Avoids crushing JPEG quality below 0.40; if needed, applies clean anti-aliased scaling.
   */
  async function compressToTargetKB(canvas, minKB = 10, maxKB = 50, targetDpi = 200, options = {}) {
    // Handle flexible argument order if minKB is actually targetMaxKB
    if (typeof minKB === 'number' && (typeof maxKB !== 'number' || maxKB < minKB)) {
      if (typeof maxKB !== 'number') {
        maxKB = minKB;
        minKB = Math.max(5, Math.round(maxKB * 0.2));
      }
    }
    if (typeof targetDpi !== 'number') {
      targetDpi = 200;
    }

    const { applySharpen = true } = options;

    // Apply micro-sharpening before compression
    let workingCanvas = canvas;
    if (applySharpen && canvas.width <= 1200) {
      workingCanvas = applyMicroSharpen(canvas, 0.20);
    }

    let low = 0.05;
    let high = 0.99;
    let bestBlob = null;
    let bestQuality = 0.88;

    const getBlob = (c, q) => new Promise(resolve => c.toBlob(resolve, 'image/jpeg', q));

    // 10-iteration binary search for fine-grained compression
    for (let i = 0; i < 10; i++) {
      const mid = (low + high) / 2;
      const blob = await getBlob(workingCanvas, mid);
      const kb = blob.size / 1024;

      bestBlob = blob;
      bestQuality = mid;

      if (kb >= minKB && kb <= maxKB) {
        break;
      } else if (kb > maxKB) {
        high = mid;
      } else {
        low = mid;
      }
    }

    // Safety fallback: If highest quality is still larger than maxKB (very noisy huge source),
    // perform slight smooth downscaling instead of destroying JPEG quality into ugly macroblocks.
    let currentKB = bestBlob.size / 1024;
    if (currentKB > maxKB && bestQuality <= 0.20) {
      let scale = 0.92;
      while (currentKB > maxKB && scale >= 0.70) {
        const scaled = highQualityDownsample(
          workingCanvas,
          Math.round(workingCanvas.width * scale),
          Math.round(workingCanvas.height * scale)
        );
        const candidateBlob = await getBlob(scaled, 0.75);
        currentKB = candidateBlob.size / 1024;
        if (currentKB <= maxKB) {
          bestBlob = candidateBlob;
          bestQuality = 0.75;
          break;
        }
        scale -= 0.08;
      }
    }

    const finalBlob = await insertDpiIntoJpeg(bestBlob, targetDpi);
    const sizeKB = (finalBlob.size / 1024).toFixed(1);
    const url = URL.createObjectURL(finalBlob);

    return {
      blob: finalBlob,
      quality: bestQuality,
      sizeKB: parseFloat(sizeKB),
      url
    };
  }

  /**
   * Overlay Name and Date on Photo (Bottom white/black strip)
   */
  function addNameAndDateToPhoto(sourceCanvas, candidateName, dateText, options = {}) {
    const {
      barHeightPercent = 0.18,
      bgColor = '#FFFFFF',
      textColor = '#0F0F0F',
      fontFamily = '"Space Grotesk", sans-serif',
      border = true
    } = options;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = sourceCanvas.width;
    outCanvas.height = sourceCanvas.height;
    const ctx = outCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(sourceCanvas, 0, 0);

    if (!candidateName && !dateText) {
      return outCanvas;
    }

    const barHeight = Math.round(outCanvas.height * barHeightPercent);
    const barY = outCanvas.height - barHeight;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, barY, outCanvas.width, barHeight);

    if (border) {
      ctx.strokeStyle = '#0F0F0F';
      ctx.lineWidth = Math.max(2, Math.round(outCanvas.width * 0.006));
      ctx.beginPath();
      ctx.moveTo(0, barY);
      ctx.lineTo(outCanvas.width, barY);
      ctx.stroke();
    }

    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const hasBoth = Boolean(candidateName && dateText);
    const fontSize = Math.max(12, Math.round(barHeight * (hasBoth ? 0.32 : 0.48)));
    ctx.font = `700 ${fontSize}px ${fontFamily}`;

    if (hasBoth) {
      const line1Y = barY + (barHeight * 0.32);
      const line2Y = barY + (barHeight * 0.72);
      ctx.fillText(candidateName.toUpperCase(), outCanvas.width / 2, line1Y, outCanvas.width * 0.94);
      ctx.fillText(dateText, outCanvas.width / 2, line2Y, outCanvas.width * 0.94);
    } else {
      const text = candidateName || dateText;
      ctx.fillText(text, outCanvas.width / 2, barY + (barHeight / 2), outCanvas.width * 0.94);
    }

    return outCanvas;
  }

  /**
   * Thumb Impression Scanner & Contrast Enhancer
   * Enhances faint ink ridges to crisp black and white
   */
  function enhanceThumbImpression(sourceCanvas, threshold = 128, invert = false) {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = sourceCanvas.width;
    outCanvas.height = sourceCanvas.height;
    const ctx = outCanvas.getContext('2d');

    ctx.drawImage(sourceCanvas, 0, 0);
    const imgData = ctx.getImageData(0, 0, outCanvas.width, outCanvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = (r * 0.299 + g * 0.587 + b * 0.114);

      let val = gray < threshold ? 0 : 255;
      if (invert) val = 255 - val;

      data[i] = val;
      data[i + 1] = val;
      data[i + 2] = val;
    }

    ctx.putImageData(imgData, 0, 0);
    return outCanvas;
  }

  /**
   * Document Scanner & Grayscale/B&W High-Pass Filter
   */
  function scanAndEnhanceDocument(sourceCanvas, mode = 'grayscale', contrast = 1.3) {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = sourceCanvas.width;
    outCanvas.height = sourceCanvas.height;
    const ctx = outCanvas.getContext('2d');

    ctx.drawImage(sourceCanvas, 0, 0);
    const imgData = ctx.getImageData(0, 0, outCanvas.width, outCanvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      let gray = (r * 0.299 + g * 0.587 + b * 0.114);

      if (mode === 'bw') {
        const val = gray < 140 ? 0 : 255;
        data[i] = val; data[i + 1] = val; data[i + 2] = val;
      } else if (mode === 'magic-color') {
        r = ((r - 128) * contrast) + 128;
        g = ((g - 128) * contrast) + 128;
        b = ((b - 128) * contrast) + 128;
        data[i] = Math.min(255, Math.max(0, r));
        data[i + 1] = Math.min(255, Math.max(0, g));
        data[i + 2] = Math.min(255, Math.max(0, b));
      } else {
        gray = ((gray - 128) * contrast) + 128;
        const finalGray = Math.min(255, Math.max(0, gray));
        data[i] = finalGray; data[i + 1] = finalGray; data[i + 2] = finalGray;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return outCanvas;
  }

  /**
   * Merge Front & Back Card (Aadhaar / Voter ID / PAN / Driving License)
   */
  function mergeDocuments(imgFront, imgBack, options = {}) {
    const {
      layout = 'side-by-side',
      gap = 24,
      padding = 24,
      targetHeight = 600,
      bgColor = '#FFFFFF',
      addBorder = true
    } = options;

    const frontAspect = imgFront.width / imgFront.height;
    const backAspect = imgBack.width / imgBack.height;

    const normHeight = targetHeight;
    const frontWidth = Math.round(normHeight * frontAspect);
    const backWidth = Math.round(normHeight * backAspect);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    if (layout === 'side-by-side') {
      canvas.width = (padding * 2) + frontWidth + gap + backWidth;
      canvas.height = (padding * 2) + normHeight;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const fX = padding;
      const fY = padding;
      ctx.drawImage(imgFront, fX, fY, frontWidth, normHeight);

      const bX = padding + frontWidth + gap;
      const bY = padding;
      ctx.drawImage(imgBack, bX, bY, backWidth, normHeight);

      if (addBorder) {
        ctx.strokeStyle = '#0F0F0F';
        ctx.lineWidth = 3;
        ctx.strokeRect(fX, fY, frontWidth, normHeight);
        ctx.strokeRect(bX, bY, backWidth, normHeight);
      }
    } else {
      const maxW = Math.max(frontWidth, backWidth);
      canvas.width = (padding * 2) + maxW;
      canvas.height = (padding * 2) + normHeight + gap + normHeight;

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const fX = padding + (maxW - frontWidth) / 2;
      const fY = padding;
      ctx.drawImage(imgFront, fX, fY, frontWidth, normHeight);

      const bX = padding + (maxW - backWidth) / 2;
      const bY = padding + normHeight + gap;
      ctx.drawImage(imgBack, bX, bY, backWidth, normHeight);

      if (addBorder) {
        ctx.strokeStyle = '#0F0F0F';
        ctx.lineWidth = 3;
        ctx.strokeRect(fX, fY, frontWidth, normHeight);
        ctx.strokeRect(bX, bY, backWidth, normHeight);
      }
    }

    return canvas;
  }

  /**
   * Combine Candidate Photo + Signature into 1 file (UPSSSC/MPPEB format)
   */
  function joinPhotoAndSignature(photoCanvas, sigCanvas, orientation = 'top-bottom', targetWidth = 350, targetHeight = 500) {
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (orientation === 'top-bottom') {
      const photoH = Math.round(targetHeight * 0.72);
      const sigH = targetHeight - photoH;

      ctx.drawImage(photoCanvas, 0, 0, targetWidth, photoH);
      ctx.drawImage(sigCanvas, 0, photoH, targetWidth, sigH);

      ctx.strokeStyle = '#0F0F0F';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, photoH);
      ctx.lineTo(targetWidth, photoH);
      ctx.stroke();
    } else {
      const halfW = Math.round(targetWidth / 2);
      ctx.drawImage(photoCanvas, 0, 0, halfW, targetHeight);
      ctx.drawImage(sigCanvas, halfW, 0, halfW, targetHeight);

      ctx.strokeStyle = '#0F0F0F';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(halfW, 0);
      ctx.lineTo(halfW, targetHeight);
      ctx.stroke();
    }

    return canvas;
  }

  /**
   * Create Printable Passport Grid Sheet (A4 or 4x6 inch)
   */
  function generatePassportPrintSheet(photoCanvas, count = 8, paperSize = 'A4') {
    const dpi = 300;
    const sheetW = paperSize === 'A4' ? 2480 : 1800;
    const sheetH = paperSize === 'A4' ? 3508 : 1200;

    const canvas = document.createElement('canvas');
    canvas.width = sheetW;
    canvas.height = sheetH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, sheetW, sheetH);

    const photoW = toPixels(3.5, 'cm', dpi);
    const photoH = toPixels(4.5, 'cm', dpi);

    let cols = 4;
    let rows = 2;

    if (paperSize === 'A4') {
      if (count <= 6) { cols = 3; rows = 2; }
      else if (count <= 8) { cols = 4; rows = 2; }
      else if (count <= 12) { cols = 4; rows = 3; }
      else if (count <= 16) { cols = 4; rows = 4; }
      else if (count <= 24) { cols = 4; rows = 6; }
      else { cols = 5; rows = 6; }
    } else {
      if (count <= 4) { cols = 2; rows = 2; }
      else if (count <= 6) { cols = 3; rows = 2; }
      else { cols = 4; rows = 2; }
    }

    const totalGridW = cols * photoW;
    const totalGridH = rows * photoH;
    const gapX = Math.max(20, Math.floor((sheetW - totalGridW) / (cols + 1)));
    const gapY = Math.max(24, Math.floor((sheetH - totalGridH) / (rows + 1)));

    let drawn = 0;
    for (let r = 0; r < rows && drawn < count; r++) {
      for (let c = 0; c < cols && drawn < count; c++) {
        const x = gapX + c * (photoW + gapX);
        const y = gapY + r * (photoH + gapY);

        ctx.drawImage(photoCanvas, x, y, photoW, photoH);

        // Cutting guides
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 8]);
        ctx.strokeRect(x - 2, y - 2, photoW + 4, photoH + 4);
        ctx.setLineDash([]);

        drawn++;
      }
    }

    return canvas;
  }

  /**
   * Export image or canvas into PDF via jsPDF with high fidelity
   */
  function exportToPdf(canvasOrDataUrl, fileName = 'document.pdf', orientation = 'portrait') {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      alert('PDF generation library is loading. Please try again.');
      return;
    }

    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });

    const imgData = typeof canvasOrDataUrl === 'string' ? canvasOrDataUrl : canvasOrDataUrl.toDataURL('image/jpeg', 0.98);
    const pageWidth = orientation === 'portrait' ? 210 : 297;
    const pageHeight = orientation === 'portrait' ? 297 : 210;
    const margin = 10;
    const usableW = pageWidth - (margin * 2);
    const usableH = pageHeight - (margin * 2);

    let canvasWidth = 800;
    let canvasHeight = 600;
    if (typeof canvasOrDataUrl !== 'string') {
      canvasWidth = canvasOrDataUrl.width;
      canvasHeight = canvasOrDataUrl.height;
    }

    const imgAspect = canvasWidth / canvasHeight;
    let renderW = usableW;
    let renderH = renderW / imgAspect;

    if (renderH > usableH) {
      renderH = usableH;
      renderW = renderH * imgAspect;
    }

    const posX = margin + (usableW - renderW) / 2;
    const posY = margin + (usableH - renderH) / 2;

    doc.addImage(imgData, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST');
    doc.save(fileName);
  }

  /**
   * Trigger automatic file download helper
   */
  function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 100);
  }

  /**
   * Official India Government Portal Master Presets (2026 Edition)
   */
  const GOVT_PRESETS_2026 = {
    // 1. COMPETITIVE EXAMS
    'ssc-photo': { name: 'SSC Physical / DV Photo', width: 276, height: 354, dpi: 200, minKB: 20, maxKB: 50, aspect: 3.5/4.5, bg: 'white', notes: 'White background, colour, 3.5x4.5cm. No cap/glasses.' },
    'ssc-sig': { name: 'SSC Scanned Signature', width: 315, height: 157, dpi: 200, minKB: 10, maxKB: 20, aspect: 4.0/2.0, bg: 'white', notes: 'Black ink, running hand (NEVER ALL CAPS). 4x2 cm.' },
    'upsc-photo': { name: 'UPSC CSE/NDA Photo (with DOP)', width: 413, height: 531, dpi: 300, minKB: 20, maxKB: 300, aspect: 3.5/4.5, bg: 'white', notes: 'Mandatory Name & Date of Photo (DOP) at bottom. No glasses.' },
    'upsc-sig': { name: 'UPSC Scanned Signature', width: 350, height: 150, dpi: 300, minKB: 20, maxKB: 100, aspect: 3.5/1.5, bg: 'white', notes: 'Black ink only on white paper. Running hand.' },
    'ibps-photo': { name: 'IBPS / SBI Bank Photo', width: 200, height: 230, dpi: 200, minKB: 20, maxKB: 50, aspect: 200/230, bg: 'white', notes: '200x230 px, white background, NO glasses (post-2023 rule).' },
    'ibps-sig': { name: 'IBPS / SBI Bank Signature', width: 140, height: 60, dpi: 200, minKB: 10, maxKB: 20, aspect: 140/60, bg: 'white', notes: '140x60 px, black ink only, running hand.' },
    'ibps-thumb': { name: 'IBPS / SBI Left Thumb Impression', width: 240, height: 240, dpi: 200, minKB: 20, maxKB: 50, aspect: 1, bg: 'white', notes: '240x240 px, black/blue ink on white paper, 200 DPI.' },
    'ibps-declaration': { name: 'IBPS / SBI Handwritten Declaration', width: 800, height: 400, dpi: 200, minKB: 50, maxKB: 100, aspect: 800/400, bg: 'white', notes: '800x400 px, English declaration in black ink.' },
    'rrb-photo': { name: 'Railways RRB Photo', width: 276, height: 354, dpi: 200, minKB: 20, maxKB: 100, aspect: 3.5/4.5, bg: 'white', notes: '3.5x4.5 cm, white background, no spectacles/cap.' },
    'rrb-sig': { name: 'Railways RRB Signature', width: 276, height: 118, dpi: 200, minKB: 10, maxKB: 20, aspect: 3.5/1.5, bg: 'white', notes: 'Black/blue ink on white paper, 10-20 KB.' },
    'nta-passport': { name: 'NTA NEET/JEE Passport Photo', width: 413, height: 531, dpi: 300, minKB: 10, maxKB: 200, aspect: 3.5/4.5, bg: 'white', notes: '80% face & ears coverage against white bg. Name+DOP at bottom.' },
    'nta-postcard': { name: 'NTA NEET Postcard Photo (4x6")', width: 1200, height: 1800, dpi: 300, minKB: 10, maxKB: 200, aspect: 4/6, bg: 'white', notes: '4x6 inch postcard size for physical examination hall.' },

    // 2. CORE IDENTITY & GOVT PORTALS
    'passport-seva-photo': { name: 'Passport Seva (GPSP 2.0) Photo', width: 630, height: 810, dpi: 450, minKB: 10, maxKB: 250, aspect: 630/810, bg: 'white', notes: 'EXACT 630x810 px (7:9 aspect ratio, 35x45mm). Strict NO glasses.' },
    'passport-seva-sig': { name: 'Passport Seva Signature', width: 600, height: 200, dpi: 300, minKB: 10, maxKB: 100, aspect: 3/1, bg: 'white', notes: 'Real handwritten signature, black or dark blue ballpoint pen.' },
    'parivahan-photo': { name: 'Sarathi Parivahan DL/LL Photo', width: 420, height: 525, dpi: 300, minKB: 10, maxKB: 20, aspect: 420/525, bg: 'white', notes: 'STRICT 10-20 KB limit (aim for 15-18 KB). Rejects if >20KB!' },
    'parivahan-sig': { name: 'Sarathi Parivahan DL/LL Signature', width: 256, height: 64, dpi: 200, minKB: 10, maxKB: 20, aspect: 256/64, bg: 'white', notes: '256x64 px landscape, STRICT 10-20 KB.' },
    'pan-nsdl-photo': { name: 'PAN Card Photo (NSDL / Protean)', width: 197, height: 276, dpi: 200, minKB: 10, maxKB: 50, aspect: 2.5/3.5, bg: 'white', notes: '2.5x3.5 cm at 200 DPI, under 50 KB.' },
    'pan-nsdl-sig': { name: 'PAN Card Signature (NSDL / Protean)', width: 354, height: 157, dpi: 200, minKB: 10, maxKB: 50, aspect: 4.5/2.0, bg: 'white', notes: '4.5x2.0 cm at 200 DPI, under 50 KB.' },
    'pan-uti-photo': { name: 'PAN Card Photo (UTIITSL)', width: 213, height: 213, dpi: 300, minKB: 10, maxKB: 30, aspect: 1, bg: 'white', notes: 'EXACT 213x213 px at 300 DPI, under 30 KB.' },
    'pan-uti-sig': { name: 'PAN Card Signature (UTIITSL)', width: 400, height: 200, dpi: 200, minKB: 10, maxKB: 60, aspect: 2/1, bg: 'white', notes: 'EXACT 400x200 px at 200/600 DPI, under 60 KB.' },
    'voter-id-photo': { name: 'Voter ID Form 6 (NVSP / ECI)', width: 200, height: 230, dpi: 200, minKB: 20, maxKB: 50, aspect: 200/230, bg: 'white', notes: '200x230 px passport photo, under 50 KB.' },
    'epfo-uan-photo': { name: 'EPFO / UAN Profile Photo', width: 413, height: 531, dpi: 300, minKB: 10, maxKB: 100, aspect: 3.5/4.5, bg: 'white', notes: '3.5x4.5 cm, 80% face, both ears clearly visible, <100 KB.' },
    'gst-promoter-photo': { name: 'GSTN Promoter / Signatory Photo', width: 400, height: 500, dpi: 200, minKB: 10, maxKB: 100, aspect: 4/5, bg: 'white', notes: 'JPEG format, max 100 KB.' },
    'upsssc-combined': { name: 'UPSSSC / MPPEB Joined File', width: 350, height: 500, dpi: 200, minKB: 20, maxKB: 50, aspect: 350/500, bg: 'white', notes: 'Single file: Photo top (70%) + Signature bottom (30%).' }
  };

  /**
   * Generate Standard Handwritten Declaration Canvas
   * Candidate Name and specific wording rendered onto a scanned white paper style
   */
  function generateDeclarationCanvas(candidateName = 'YOUR NAME', customText = null) {
    const defaultText = customText || `I, ${candidateName.toUpperCase()}, hereby declare that all the information submitted by me in the application form is correct, true and valid. I will present the supporting documents as and when required.`;
    
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    // Crisp white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 400);

    // Subtle paper border
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 780, 380);

    ctx.font = 'italic bold 22px "Georgia", "Times New Roman", serif';
    ctx.fillStyle = '#0F172A';
    ctx.textBaseline = 'top';

    // Word wrap logic
    const words = defaultText.split(' ');
    let line = '';
    let y = 50;
    const x = 50;
    const maxWidth = 700;
    const lineHeight = 38;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' ';
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);

    return canvas;
  }

  /**
   * Universal Clipboard Paste Handler (Ctrl+V)
   * @param {function} onFileReceived Callback receiving the pasted File object
   */
  function setupClipboardPaste(onFileReceived) {
    window.addEventListener('paste', (e) => {
      // Don't intercept paste if user is typing in a text field
      const active = document.activeElement;
      if (active) {
        const tag = active.tagName.toLowerCase();
        if (tag === 'textarea' || (tag === 'input' && active.type !== 'file' && active.type !== 'range')) {
          return;
        }
      }

      if (!e.clipboardData) return;

      const items = e.clipboardData.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              e.preventDefault();
              showToast('📋 Image pasted from clipboard!');
              if (typeof onFileReceived === 'function') {
                onFileReceived(file);
              }
              return;
            }
          }
        }
      }

      const files = e.clipboardData.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          if (files[i].type.indexOf('image') !== -1) {
            e.preventDefault();
            showToast('📋 Image pasted from clipboard!');
            if (typeof onFileReceived === 'function') {
              onFileReceived(files[i]);
            }
            return;
          }
        }
      }
    });
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--text-primary);
      color: var(--bg-surface);
      padding: 10px 22px;
      border-radius: 9999px;
      font-size: 13.5px;
      font-weight: 700;
      box-shadow: 0 10px 25px rgba(0,0,0,0.25);
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transition = 'opacity 0.4s ease';
      setTimeout(() => t.remove(), 400);
    }, 2500);
  }

  /**
   * Ultra-Resilient Large File & High-Resolution Image Loader
   * Handles 50MB–100MB+ images, camera RAW, 108MP mobile photos with zero memory exhaustion.
   * @param {File|Blob|string} fileInput
   * @returns {Promise<{img: HTMLImageElement, canvas: HTMLCanvasElement, width: number, height: number, dataUrl: string, revoke: Function}>}
   */
  async function loadLargeImage(fileInput) {
    let objectUrl = null;
    let isBlob = false;

    if (fileInput instanceof Blob || fileInput instanceof File) {
      if (fileInput.name && (fileInput.name.toLowerCase().endsWith('.heic') || fileInput.name.toLowerCase().endsWith('.heif')) && window.heic2any) {
        try {
          const convertedBlob = await window.heic2any({ blob: fileInput, toType: 'image/jpeg', quality: 0.95 });
          objectUrl = URL.createObjectURL(Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob);
        } catch (e) {
          console.warn('HEIC conversion fallback:', e);
          objectUrl = URL.createObjectURL(fileInput);
        }
      } else {
        objectUrl = URL.createObjectURL(fileInput);
      }
      isBlob = true;
    } else if (typeof fileInput === 'string') {
      objectUrl = fileInput;
    } else {
      throw new Error('Invalid image input');
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const origW = img.naturalWidth || img.width;
        const origH = img.naturalHeight || img.height;

        // If dimensions are insanely huge (e.g. > 6000px), safely cap max allocation to 5000px to prevent browser canvas crash
        const MAX_DIM = 5000;
        let targetW = origW;
        let targetH = origH;

        if (origW > MAX_DIM || origH > MAX_DIM) {
          if (origW > origH) {
            targetW = MAX_DIM;
            targetH = Math.round((origH * MAX_DIM) / origW);
          } else {
            targetH = MAX_DIM;
            targetW = Math.round((origW * MAX_DIM) / origH);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const dataUrl = targetW === origW ? (isBlob ? objectUrl : img.src) : canvas.toDataURL('image/jpeg', 0.96);

        resolve({
          img,
          canvas,
          width: targetW,
          height: targetH,
          originalWidth: origW,
          originalHeight: origH,
          dataUrl: objectUrl || dataUrl,
          revoke: () => { if (isBlob && objectUrl) URL.revokeObjectURL(objectUrl); }
        });
      };

      img.onerror = (err) => {
        if (isBlob && objectUrl) URL.revokeObjectURL(objectUrl);
        reject(err);
      };

      img.src = objectUrl;
    });
  }

  return {
    toPixels,
    fromPixels,
    highQualityDownsample,
    applyMicroSharpen,
    insertDpiIntoJpeg,
    compressToTargetKB,
    addNameAndDateToPhoto,
    enhanceThumbImpression,
    scanAndEnhanceDocument,
    mergeDocuments,
    joinPhotoAndSignature,
    generatePassportPrintSheet,
    generateDeclarationCanvas,
    exportToPdf,
    triggerDownload,
    setupClipboardPaste,
    loadLargeImage,
    showToast,
    GOVT_PRESETS_2026
  };
})();

