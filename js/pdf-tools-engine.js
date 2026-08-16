/**
 * Sarkari Babu Tools — PDF-Tools Engine (Powered by PDF-Lib & PDF.js)
 * 100% Client-Side PDF Manipulation (No Server Required)
 */

const SarkariPdfEngine = (function() {
  'use strict';

  // Initialize PDF.js worker
  if (window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  /**
   * Helper to safely clone an ArrayBuffer or Uint8Array to prevent buffer detachment
   */
  function safeCloneBuffer(bufferOrTypedArray) {
    if (!bufferOrTypedArray) return new ArrayBuffer(0);
    if (bufferOrTypedArray instanceof ArrayBuffer) {
      return bufferOrTypedArray.slice(0);
    }
    if (bufferOrTypedArray.buffer instanceof ArrayBuffer) {
      return bufferOrTypedArray.buffer.slice(
        bufferOrTypedArray.byteOffset,
        bufferOrTypedArray.byteOffset + bufferOrTypedArray.byteLength
      );
    }
    return bufferOrTypedArray;
  }

  /**
   * Merge Multiple PDF ArrayBuffers or Uint8Arrays into a Single PDF
   * @param {Array<ArrayBuffer|Uint8Array>} pdfArrayBuffers 
   * @returns {Promise<Uint8Array>}
   */
  async function mergePDFs(pdfArrayBuffers) {
    const { PDFDocument } = window.PDFLib;
    const mergedDoc = await PDFDocument.create();

    for (const buffer of pdfArrayBuffers) {
      const cloned = safeCloneBuffer(buffer);
      const srcDoc = await PDFDocument.load(cloned);
      const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach((page) => mergedDoc.addPage(page));
    }

    return await mergedDoc.save();
  }

  /**
   * Split PDF by extracting specified page numbers (1-indexed)
   * @param {ArrayBuffer|Uint8Array} pdfBuffer 
   * @param {Array<number>} pageNumbers (e.g. [1, 2, 4, 5])
   * @returns {Promise<Uint8Array>}
   */
  async function extractPdfPages(pdfBuffer, pageNumbers) {
    const { PDFDocument } = window.PDFLib;
    const cloned = safeCloneBuffer(pdfBuffer);
    const srcDoc = await PDFDocument.load(cloned);
    const newDoc = await PDFDocument.create();

    const totalPages = srcDoc.getPageCount();
    const validIndices = pageNumbers
      .map(p => p - 1)
      .filter(idx => idx >= 0 && idx < totalPages);

    const copiedPages = await newDoc.copyPages(srcDoc, validIndices);
    copiedPages.forEach(p => newDoc.addPage(p));

    return await newDoc.save();
  }

  /**
   * Rotate PDF Pages
   * @param {ArrayBuffer|Uint8Array} pdfBuffer 
   * @param {number} rotationDegrees (90, 180, 270)
   * @param {Array<number>|'all'} pagesToRotate 
   * @returns {Promise<Uint8Array>}
   */
  async function rotatePdfPages(pdfBuffer, rotationDegrees = 90, pagesToRotate = 'all') {
    const { PDFDocument, degrees } = window.PDFLib;
    const cloned = safeCloneBuffer(pdfBuffer);
    const doc = await PDFDocument.load(cloned);
    const pages = doc.getPages();

    pages.forEach((page, idx) => {
      const pageNum = idx + 1;
      if (pagesToRotate === 'all' || pagesToRotate.includes(pageNum)) {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + rotationDegrees) % 360));
      }
    });

    return await doc.save();
  }

  /**
   * Add Text Watermark across PDF Pages
   * @param {ArrayBuffer|Uint8Array} pdfBuffer 
   * @param {string} watermarkText (e.g. "CONFIDENTIAL")
   * @param {object} options 
   * @returns {Promise<Uint8Array>}
   */
  async function addPdfWatermark(pdfBuffer, watermarkText, options = {}) {
    if (window.SarkariEngine) window.SarkariEngine.showProgress('Applying Text Watermark', 25, 'Loading PDF structure...');
    const { PDFDocument, rgb, degrees, StandardFonts } = window.PDFLib;
    const cloned = safeCloneBuffer(pdfBuffer);
    const doc = await PDFDocument.load(cloned);
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const pages = doc.getPages();

    const {
      fontSize = 48,
      opacity = 0.25,
      angle = -45,
      color = { r: 0.8, g: 0.2, b: 0.2 } // Reddish by default
    } = options;

    if (window.SarkariEngine) window.SarkariEngine.updateProgress(60, `Stamping text across ${pages.length} pages...`);

    pages.forEach(page => {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      page.drawText(watermarkText, {
        x: (width / 2) - (textWidth / 2) * Math.cos((angle * Math.PI) / 180),
        y: (height / 2) - (textHeight / 2),
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity,
        rotate: degrees(angle)
      });
    });

    if (window.SarkariEngine) window.SarkariEngine.updateProgress(90, 'Saving watermarked document...');
    const result = await doc.save();
    if (window.SarkariEngine) window.SarkariEngine.hideProgress();
    return result;
  }

  /**
   * Add Logo / Stamp Image Watermark across PDF Pages
   * @param {ArrayBuffer|Uint8Array} pdfBuffer 
   * @param {string|Uint8Array|ArrayBuffer} imageInput (DataURL, Uint8Array, or ArrayBuffer)
   * @param {object} options 
   * @returns {Promise<Uint8Array>}
   */
  async function addPdfImageWatermark(pdfBuffer, imageInput, options = {}) {
    if (window.SarkariEngine) window.SarkariEngine.showProgress('Applying Logo Watermark', 20, 'Loading PDF document...');
    const { PDFDocument, degrees } = window.PDFLib;
    const cloned = safeCloneBuffer(pdfBuffer);
    const doc = await PDFDocument.load(cloned);

    if (window.SarkariEngine) window.SarkariEngine.updateProgress(40, 'Embedding logo image...');
    
    let imgBytes = null;
    let isPng = false;

    if (typeof imageInput === 'string') {
      if (imageInput.startsWith('data:image/png')) {
        isPng = true;
      }
      const base64Data = imageInput.split(',')[1] || imageInput;
      const binaryString = window.atob(base64Data);
      const len = binaryString.length;
      imgBytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        imgBytes[i] = binaryString.charCodeAt(i);
      }
    } else if (imageInput instanceof Uint8Array || imageInput instanceof ArrayBuffer) {
      imgBytes = new Uint8Array(safeCloneBuffer(imageInput));
      // Check magic bytes for PNG (0x89, 0x50, 0x4E, 0x47)
      if (imgBytes[0] === 0x89 && imgBytes[1] === 0x50) {
        isPng = true;
      }
    }

    let embeddedImage = null;
    try {
      if (isPng) {
        embeddedImage = await doc.embedPng(imgBytes);
      } else {
        embeddedImage = await doc.embedJpg(imgBytes);
      }
    } catch (e) {
      try {
        embeddedImage = await doc.embedPng(imgBytes);
      } catch (e2) {
        embeddedImage = await doc.embedJpg(imgBytes);
      }
    }

    const {
      scale = 0.40, // 40% of page width
      opacity = 0.25,
      angle = 0,
      position = 'center', // 'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'tile', 'diagonal'
      customX = null,
      customY = null
    } = options;

    const pages = doc.getPages();
    if (window.SarkariEngine) window.SarkariEngine.updateProgress(65, `Stamping logo across ${pages.length} pages...`);

    pages.forEach(page => {
      const { width: pWidth, height: pHeight } = page.getSize();
      
      const aspect = embeddedImage.width / embeddedImage.height;
      const targetW = pWidth * scale;
      const targetH = targetW / aspect;

      if (position === 'tile') {
        const stepX = Math.max(120, targetW * 1.5);
        const stepY = Math.max(120, targetH * 1.5);
        for (let x = -targetW; x < pWidth + targetW; x += stepX) {
          for (let y = -targetH; y < pHeight + targetH; y += stepY) {
            page.drawImage(embeddedImage, {
              x,
              y,
              width: targetW,
              height: targetH,
              opacity,
              rotate: degrees(angle)
            });
          }
        }
      } else {
        let x = (pWidth - targetW) / 2;
        let y = (pHeight - targetH) / 2;

        if (position === 'top-left') {
          x = pWidth * 0.05;
          y = pHeight * 0.95 - targetH;
        } else if (position === 'top-right') {
          x = pWidth * 0.95 - targetW;
          y = pHeight * 0.95 - targetH;
        } else if (position === 'bottom-left') {
          x = pWidth * 0.05;
          y = pHeight * 0.05;
        } else if (position === 'bottom-right') {
          x = pWidth * 0.95 - targetW;
          y = pHeight * 0.05;
        } else if (position === 'diagonal') {
          x = (pWidth - targetW) / 2;
          y = (pHeight - targetH) / 2;
        } else if (position === 'custom' && customX !== null && customY !== null) {
          x = customX;
          y = customY;
        }

        page.drawImage(embeddedImage, {
          x,
          y,
          width: targetW,
          height: targetH,
          opacity,
          rotate: degrees(angle)
        });
      }
    });

    if (window.SarkariEngine) window.SarkariEngine.updateProgress(90, 'Saving watermarked document...');
    const result = await doc.save();
    if (window.SarkariEngine) window.SarkariEngine.hideProgress();
    return result;
  }

  /**
   * Add Page Numbers to PDF
   * @param {ArrayBuffer|Uint8Array} pdfBuffer 
   * @param {object} options 
   * @returns {Promise<Uint8Array>}
   */
  async function addPageNumbers(pdfBuffer, options = {}) {
    const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
    const cloned = safeCloneBuffer(pdfBuffer);
    const doc = await PDFDocument.load(cloned);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const totalPages = pages.length;

    const {
      position = 'bottom-center', // 'bottom-center', 'bottom-right', 'top-right'
      format = '{page} of {total}', // or '{page}'
      fontSize = 10,
      margin = 20
    } = options;

    pages.forEach((page, idx) => {
      const pageNum = idx + 1;
      const text = format.replace('{page}', pageNum).replace('{total}', totalPages);
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const { width, height } = page.getSize();

      let x = (width - textWidth) / 2;
      let y = margin;

      if (position === 'bottom-right') {
        x = width - textWidth - margin;
        y = margin;
      } else if (position === 'top-right') {
        x = width - textWidth - margin;
        y = height - margin;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.2, 0.2, 0.2)
      });
    });

    return await doc.save();
  }

  /**
   * Render PDF Pages as Canvas / Images using PDF.js
   * @param {ArrayBuffer|Uint8Array} pdfBuffer 
   * @param {number} scale (e.g. 1.5 for crisp HD)
   * @returns {Promise<Array<{pageNum: number, dataUrl: string, canvas: HTMLCanvasElement}>>}
   */
  async function convertPdfToImages(pdfBuffer, scale = 1.5) {
    if (!window.pdfjsLib) {
      throw new Error('PDF.js library is not loaded.');
    }

    if (window.SarkariEngine) window.SarkariEngine.showProgress('Reading PDF Document', 15, 'Parsing document structure...');

    // Always copy data to a new Uint8Array to prevent worker transfer from detaching user's buffer
    const safeData = new Uint8Array(safeCloneBuffer(pdfBuffer));
    const loadingTask = window.pdfjsLib.getDocument({ data: safeData });
    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;
    const results = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const pct = 20 + Math.round((pageNum / pageCount) * 75);
      if (window.SarkariEngine) {
        window.SarkariEngine.updateProgress(pct, `Rendering Page ${pageNum} of ${pageCount}...`);
      }

      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      const renderContext = {
        canvasContext: ctx,
        viewport
      };

      await page.render(renderContext).promise;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      results.push({ pageNum, dataUrl, canvas });
    }

    if (window.SarkariEngine) {
      window.SarkariEngine.updateProgress(100, 'All pages ready!');
      setTimeout(window.SarkariEngine.hideProgress, 200);
    }

    return results;
  }

  /**
   * Delete or Reorganize Pages in a PDF
   * @param {ArrayBuffer|Uint8Array} pdfBuffer 
   * @param {Array<number>} newPageOrder (1-indexed, e.g. [3, 1, 2] to reorder or omit numbers to delete)
   * @returns {Promise<Uint8Array>}
   */
  async function reorderOrDeletePages(pdfBuffer, newPageOrder) {
    const { PDFDocument } = window.PDFLib;
    const cloned = safeCloneBuffer(pdfBuffer);
    const srcDoc = await PDFDocument.load(cloned);
    const newDoc = await PDFDocument.create();

    const indices = newPageOrder.map(n => n - 1);
    const copiedPages = await newDoc.copyPages(srcDoc, indices);
    copiedPages.forEach(p => newDoc.addPage(p));

    return await newDoc.save();
  }

  /**
   * Download a Uint8Array or Blob as a File
   */
  function downloadFile(data, filename, mimeType = 'application/pdf') {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  return {
    mergePDFs,
    extractPdfPages,
    rotatePdfPages,
    addPdfWatermark,
    addPdfImageWatermark,
    addPageNumbers,
    convertPdfToImages,
    reorderOrDeletePages,
    downloadFile
  };
})();
