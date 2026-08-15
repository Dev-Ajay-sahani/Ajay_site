/**
 * Sarkari Babu Tools — High-Fidelity Image-Tools Engine
 * 100% Client-Side Image Transformation with Negligible Quality Loss
 */

const SarkariImgEngine = (function() {
  'use strict';

  /**
   * Multi-Step Bicubic Stepped Downsampling
   * Preserves maximum crispness and eliminates jagged aliasing
   */
  function highFidelityResize(source, targetW, targetH) {
    let curW = source.naturalWidth || source.width;
    let curH = source.naturalHeight || source.height;

    if (curW <= targetW * 1.25 && curH <= targetH * 1.25) {
      const out = document.createElement('canvas');
      out.width = targetW;
      out.height = targetH;
      const ctx = out.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(source, 0, 0, targetW, targetH);
      return out;
    }

    let currentCanvas = document.createElement('canvas');
    currentCanvas.width = curW;
    currentCanvas.height = curH;
    let currentCtx = currentCanvas.getContext('2d');
    currentCtx.drawImage(source, 0, 0);

    while (curW * 0.5 > targetW && curH * 0.5 > targetH) {
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

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetW;
    finalCanvas.height = targetH;
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(currentCanvas, 0, 0, targetW, targetH);

    return finalCanvas;
  }

  /**
   * Resize Image by Dimensions (px) or Percentage (%)
   */
  function resizeImage(source, options = {}) {
    const {
      width,
      height,
      maintainAspect = true,
      scalePercent = 100
    } = options;

    const srcW = source.naturalWidth || source.width;
    const srcH = source.naturalHeight || source.height;
    let targetW = srcW;
    let targetH = srcH;

    if (scalePercent && scalePercent !== 100) {
      targetW = Math.round(srcW * (scalePercent / 100));
      targetH = Math.round(srcH * (scalePercent / 100));
    } else if (width && height) {
      if (maintainAspect) {
        const aspect = srcW / srcH;
        if (width / height > aspect) {
          targetW = Math.round(height * aspect);
          targetH = height;
        } else {
          targetW = width;
          targetH = Math.round(width / aspect);
        }
      } else {
        targetW = width;
        targetH = height;
      }
    } else if (width) {
      const aspect = srcW / srcH;
      targetW = width;
      targetH = Math.round(width / aspect);
    } else if (height) {
      const aspect = srcW / srcH;
      targetH = height;
      targetW = Math.round(height * aspect);
    }

    return highFidelityResize(source, targetW, targetH);
  }

  /**
   * Convert Image Format (PNG, JPG, WEBP) with High Fidelity
   */
  function convertFormat(source, targetMimeType = 'image/jpeg', quality = 0.96) {
    let canvas = source;
    if (!(source instanceof HTMLCanvasElement)) {
      canvas = document.createElement('canvas');
      canvas.width = source.naturalWidth || source.width;
      canvas.height = source.naturalHeight || source.height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Pure white solid background for transparent PNG to JPG conversion
      if (targetMimeType === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(source, 0, 0);
    }

    return new Promise(resolve => canvas.toBlob(resolve, targetMimeType, quality));
  }

  /**
   * Apply Visual Studio Filters to Image with 100% Original Resolution Retention
   */
  function applyPhotoFilters(source, filters = {}) {
    const {
      brightness = 100,
      contrast = 100,
      saturation = 100,
      grayscale = 0,
      invert = 0,
      flipH = false,
      flipV = false
    } = filters;

    const canvas = document.createElement('canvas');
    canvas.width = source.naturalWidth || source.width;
    canvas.height = source.naturalHeight || source.height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.save();
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) invert(${invert}%)`;

    let scaleX = flipH ? -1 : 1;
    let scaleY = flipV ? -1 : 1;
    let posX = flipH ? -canvas.width : 0;
    let posY = flipV ? -canvas.height : 0;

    ctx.scale(scaleX, scaleY);
    ctx.drawImage(source, posX, posY, canvas.width, canvas.height);
    ctx.restore();

    return canvas;
  }

  /**
   * Overlay Custom Image / Logo Watermark with Full Transform (Drag, Scale, Rotate, Opacity)
   */
  function addImageWatermarkToImage(sourceCanvas, watermarkImg, options = {}) {
    const {
      scalePercent = 35,
      opacity = 0.6,
      posXPercent = 50,
      posYPercent = 50,
      position = 'center',
      tile = false,
      angle = 0
    } = options;

    const out = document.createElement('canvas');
    out.width = sourceCanvas.width || sourceCanvas.naturalWidth;
    out.height = sourceCanvas.height || sourceCanvas.naturalHeight;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw base image
    ctx.drawImage(sourceCanvas, 0, 0);

    const wmNaturalW = watermarkImg.naturalWidth || watermarkImg.width;
    const wmNaturalH = watermarkImg.naturalHeight || watermarkImg.height;
    const wmAspect = wmNaturalW / wmNaturalH;

    // Calculate watermark dimensions relative to base image
    const targetW = Math.round(out.width * (scalePercent / 100));
    const targetH = Math.round(targetW / wmAspect);

    ctx.save();
    ctx.globalAlpha = opacity;

    if (tile) {
      const stepX = targetW * 1.5;
      const stepY = targetH * 1.5;
      for (let x = -out.width; x < out.width * 2; x += stepX) {
        for (let y = -out.height; y < out.height * 2; y += stepY) {
          ctx.save();
          ctx.translate(x, y);
          if (angle !== 0) ctx.rotate((angle * Math.PI) / 180);
          ctx.drawImage(watermarkImg, -targetW / 2, -targetH / 2, targetW, targetH);
          ctx.restore();
        }
      }
    } else {
      let posX = (posXPercent / 100) * out.width;
      let posY = (posYPercent / 100) * out.height;
      const padding = Math.max(12, Math.round(out.width * 0.04));

      // Preset overrides if specified
      if (position === 'top-left') { posX = (targetW / 2) + padding; posY = (targetH / 2) + padding; }
      else if (position === 'top-center') { posX = out.width / 2; posY = (targetH / 2) + padding; }
      else if (position === 'top-right') { posX = out.width - (targetW / 2) - padding; posY = (targetH / 2) + padding; }
      else if (position === 'mid-left') { posX = (targetW / 2) + padding; posY = out.height / 2; }
      else if (position === 'center') { posX = out.width / 2; posY = out.height / 2; }
      else if (position === 'mid-right') { posX = out.width - (targetW / 2) - padding; posY = out.height / 2; }
      else if (position === 'bottom-left') { posX = (targetW / 2) + padding; posY = out.height - (targetH / 2) - padding; }
      else if (position === 'bottom-center') { posX = out.width / 2; posY = out.height - (targetH / 2) - padding; }
      else if (position === 'bottom-right') { posX = out.width - (targetW / 2) - padding; posY = out.height - (targetH / 2) - padding; }

      ctx.translate(posX, posY);
      if (angle !== 0) ctx.rotate((angle * Math.PI) / 180);
      ctx.drawImage(watermarkImg, -targetW / 2, -targetH / 2, targetW, targetH);
    }

    ctx.restore();
    return out;
  }

  /**
   * Overlay Custom Text Watermark with Full Transform (Drag, Scale, Rotate, Opacity)
   */
  function addWatermarkToImage(sourceCanvas, options = {}) {
    const {
      text = 'SARKARI BABU',
      scalePercent = 35,
      color = 'rgba(220, 38, 38, 0.5)',
      posXPercent = 50,
      posYPercent = 50,
      angle = -30,
      tile = false,
      position = 'center'
    } = options;

    const out = document.createElement('canvas');
    out.width = sourceCanvas.width || sourceCanvas.naturalWidth;
    out.height = sourceCanvas.height || sourceCanvas.naturalHeight;
    const ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw base image
    ctx.drawImage(sourceCanvas, 0, 0);

    const calculatedFontSize = Math.max(18, Math.round(out.width * (scalePercent / 100) * 0.22));
    ctx.font = `800 ${calculatedFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.lineWidth = Math.max(1, Math.round(calculatedFontSize * 0.04));
    ctx.strokeStyle = color.includes('255, 255, 255') ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.4)';

    if (tile) {
      const stepX = calculatedFontSize * 6;
      const stepY = calculatedFontSize * 3.5;
      for (let x = -out.width; x < out.width * 2; x += stepX) {
        for (let y = -out.height; y < out.height * 2; y += stepY) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((angle * Math.PI) / 180);
          ctx.strokeText(text, 0, 0);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }
      }
    } else {
      ctx.save();
      let posX = (posXPercent / 100) * out.width;
      let posY = (posYPercent / 100) * out.height;
      const padding = Math.max(12, Math.round(out.width * 0.04));

      if (position === 'top-left') { posX = calculatedFontSize * 3.5; posY = calculatedFontSize * 1.8; }
      else if (position === 'top-center') { posX = out.width / 2; posY = calculatedFontSize * 1.8; }
      else if (position === 'top-right') { posX = out.width - (calculatedFontSize * 3.5); posY = calculatedFontSize * 1.8; }
      else if (position === 'mid-left') { posX = calculatedFontSize * 3.5; posY = out.height / 2; }
      else if (position === 'center') { posX = out.width / 2; posY = out.height / 2; }
      else if (position === 'mid-right') { posX = out.width - (calculatedFontSize * 3.5); posY = out.height / 2; }
      else if (position === 'bottom-left') { posX = calculatedFontSize * 3.5; posY = out.height - (calculatedFontSize * 1.8); }
      else if (position === 'bottom-center') { posX = out.width / 2; posY = out.height - (calculatedFontSize * 1.8); }
      else if (position === 'bottom-right') { posX = out.width - (calculatedFontSize * 3.5); posY = out.height - (calculatedFontSize * 1.8); }

      ctx.translate(posX, posY);
      ctx.rotate((angle * Math.PI) / 180);
      ctx.strokeText(text, 0, 0);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }

    return out;
  }

  /**
   * Generate Classic Top/Bottom Text Meme
   */
  function generateMeme(source, topText = '', bottomText = '') {
    const canvas = document.createElement('canvas');
    canvas.width = source.naturalWidth || source.width;
    canvas.height = source.naturalHeight || source.height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(source, 0, 0);

    const fontSize = Math.max(24, Math.round(canvas.width * 0.08));
    ctx.font = `900 ${fontSize}px Impact, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(3, Math.round(fontSize * 0.08));
    ctx.textAlign = 'center';

    if (topText) {
      ctx.textBaseline = 'top';
      ctx.strokeText(topText.toUpperCase(), canvas.width / 2, fontSize * 0.3);
      ctx.fillText(topText.toUpperCase(), canvas.width / 2, fontSize * 0.3);
    }

    if (bottomText) {
      ctx.textBaseline = 'bottom';
      ctx.strokeText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - (fontSize * 0.3));
      ctx.fillText(bottomText.toUpperCase(), canvas.width / 2, canvas.height - (fontSize * 0.3));
    }

    return canvas;
  }

  /**
   * Trigger direct browser download for any data URL or Blob URL
   */
  function triggerDownload(url, filename = 'download.jpg') {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return {
    highFidelityResize,
    resizeImage,
    convertFormat,
    applyPhotoFilters,
    addWatermarkToImage,
    addImageWatermarkToImage,
    generateMeme,
    triggerDownload
  };
})();
