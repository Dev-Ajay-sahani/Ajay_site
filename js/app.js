/**
 * Sarkari DNA Tools - UI Controller & Application State
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // ==========================================
  // Government Exam Presets Configuration
  // ==========================================
  const EXAM_PRESETS = {
    'pan-photo': {
      title: 'PAN Card Photo Resizer',
      subtitle: 'Crop & Resize as per NSDL / UTI PAN Card Application Portal',
      width: 2.5,
      height: 3.5,
      unit: 'cm',
      dpi: 200,
      minKB: 10,
      maxKB: 50,
      defaultFilename: 'pan_card_photo.jpg',
      aspectRatio: 2.5 / 3.5,
      allowNameDate: false,
      infoNote: 'NSDL/UTI specs: 2.5×3.5 cm portrait, 200 DPI (197×276 px), strictly under 50 KB.'
    },
    'pan-signature': {
      title: 'PAN Card Signature Resizer',
      subtitle: 'Crop & Resize Signature for NSDL / UTI PAN Card Portal',
      width: 4.5,
      height: 2.0,
      unit: 'cm',
      dpi: 200,
      minKB: 5,
      maxKB: 20,
      defaultFilename: 'pan_card_signature.jpg',
      aspectRatio: 4.5 / 2.0,
      allowNameDate: false,
      infoNote: 'NSDL/UTI specs: 4.5×2.0 cm landscape, 200 DPI (354×157 px), strictly under 20 KB.'
    },
    'ssc-photo': {
      title: 'SSC Exam Photo Resizer (with DOP & Name)',
      subtitle: 'For SSC CGL, CHSL, MTS, CPO, GD Constable',
      width: 3.5,
      height: 4.5,
      unit: 'cm',
      dpi: 200,
      minKB: 20,
      maxKB: 50,
      defaultFilename: 'ssc_photo.jpg',
      aspectRatio: 3.5 / 4.5,
      allowNameDate: true,
      infoNote: 'SSC Requirement: 3.5×4.5 cm (200 DPI), 20 KB to 50 KB. Date of Photograph (DOP) printed on white bottom strip.'
    },
    'ssc-signature': {
      title: 'SSC Exam Signature Resizer',
      subtitle: 'For SSC CGL, CHSL, MTS, CPO, GD Constable',
      width: 4.0,
      height: 2.0,
      unit: 'cm',
      dpi: 200,
      minKB: 10,
      maxKB: 20,
      defaultFilename: 'ssc_signature.jpg',
      aspectRatio: 4.0 / 2.0,
      allowNameDate: false,
      infoNote: 'SSC Signature Requirement: 4.0×2.0 cm landscape, 10 KB to 20 KB, black/blue ink on white paper.'
    },
    'upsc-photo': {
      title: 'UPSC Exam Photo Resizer',
      subtitle: 'For Civil Services (CSE), NDA, CDS, CAPF, EPFO',
      width: 3.5,
      height: 4.5,
      unit: 'cm',
      dpi: 300,
      minKB: 20,
      maxKB: 300,
      defaultFilename: 'upsc_photo.jpg',
      aspectRatio: 3.5 / 4.5,
      allowNameDate: true,
      infoNote: 'UPSC Specs: 3.5×4.5 cm (300 DPI, 350×450 px to 1000×1000 px), 20 KB to 300 KB. White background.'
    },
    'upsc-signature': {
      title: 'UPSC Exam Signature Resizer',
      subtitle: 'For Civil Services (CSE), NDA, CDS, CAPF',
      width: 3.5,
      height: 1.5,
      unit: 'cm',
      dpi: 300,
      minKB: 20,
      maxKB: 300,
      defaultFilename: 'upsc_signature.jpg',
      aspectRatio: 3.5 / 1.5,
      allowNameDate: false,
      infoNote: 'UPSC Signature: 3.5×1.5 cm (350×150 px min), 20 KB to 300 KB.'
    },
    'ibps-photo': {
      title: 'IBPS / SBI Bank Photo Resizer',
      subtitle: 'For IBPS PO, Clerk, SO, RRB & SBI Exams',
      width: 4.5,
      height: 3.5,
      unit: 'cm',
      dpi: 200,
      minKB: 20,
      maxKB: 50,
      defaultFilename: 'ibps_photo.jpg',
      aspectRatio: 3.5 / 4.5,
      allowNameDate: false,
      infoNote: 'IBPS/SBI Specs: 4.5×3.5 cm (200×230 px), 20 KB to 50 KB.'
    },
    'ibps-signature': {
      title: 'IBPS / SBI Signature Resizer',
      subtitle: 'For Bank PO & Clerk Recruitment',
      width: 140,
      height: 60,
      unit: 'px',
      dpi: 200,
      minKB: 10,
      maxKB: 20,
      defaultFilename: 'ibps_signature.jpg',
      aspectRatio: 140 / 60,
      allowNameDate: false,
      infoNote: 'IBPS/SBI Signature: 140×60 pixels, 10 KB to 20 KB, black ink on white paper.'
    },
    'railway-photo': {
      title: 'Railway (RRB) Photo Resizer',
      subtitle: 'For RRB NTPC, Group D, ALP, Technician, JE',
      width: 35,
      height: 45,
      unit: 'mm',
      dpi: 200,
      minKB: 20,
      maxKB: 50,
      defaultFilename: 'railway_rrb_photo.jpg',
      aspectRatio: 35 / 45,
      allowNameDate: true,
      infoNote: 'Railway RRB: 35×45 mm, 20 KB to 50 KB, clear white background.'
    },
    'nta-photo': {
      title: 'NTA (NEET / JEE / CUET) Photo Resizer',
      subtitle: 'For NEET UG, JEE Main, CUET, UGC NET',
      width: 3.5,
      height: 4.5,
      unit: 'cm',
      dpi: 200,
      minKB: 10,
      maxKB: 200,
      defaultFilename: 'nta_photo.jpg',
      aspectRatio: 3.5 / 4.5,
      allowNameDate: true,
      infoNote: 'NTA Guidelines: 3.5×4.5 cm, 10 KB to 200 KB, name & date of photo at bottom.'
    }
  };

  // State
  let currentTool = 'pan-photo';
  let activeCropper = null;
  let rawImageFile = null;
  let croppedCanvas = null;
  let processedBlobUrl = null;
  let processedBlob = null;

  // Aadhaar Merge State
  let aadhaarFrontImg = null;
  let aadhaarBackImg = null;
  let mergedAadhaarCanvas = null;
  let aadhaarMergeMode = 'side-by-side';

  // DOM Elements Cache
  const cardScreen = document.getElementById('cardScreen');
  const processPanel = document.getElementById('processPanel');
  const singleToolSection = document.getElementById('singleToolSection');
  const aadhaarSection = document.getElementById('aadhaarSection');
  const currentToolHeading = document.getElementById('currentToolHeading');
  const toolInstructionCallout = document.getElementById('toolInstructionCallout');
  const fileSelectedName = document.getElementById('fileSelectedName');
  const singleFileInput = document.getElementById('singleFileInput');
  const singlePreviewImg = document.getElementById('singlePreviewImg');
  const singlePlaceholderIcon = document.getElementById('singlePlaceholderIcon');
  const singleStatusBadge = document.getElementById('singleStatusBadge');
  const previewMetaInfo = document.getElementById('previewMetaInfo');
  const singleDownloadBtn = document.getElementById('singleDownloadBtn');
  const examPresetSelect = document.getElementById('examPresetSelect');
  
  // Custom Dimension Inputs
  const customWidthInput = document.getElementById('customWidthInput');
  const customHeightInput = document.getElementById('customHeightInput');
  const customUnitSelect = document.getElementById('customUnitSelect');
  const customDpiSelect = document.getElementById('customDpiSelect');
  const customMaxKbInput = document.getElementById('customMaxKbInput');

  // Name & Date on Photo
  const enableNameDateCheck = document.getElementById('enableNameDateCheck');
  const nameDateFields = document.getElementById('nameDateFields');
  const candidateNameInput = document.getElementById('candidateNameInput');
  const photoDateInput = document.getElementById('photoDateInput');

  // Crop Modal Elements
  const cropModal = document.getElementById('cropModal');
  const modalCropImage = document.getElementById('modalCropImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalInfoBanner = document.getElementById('modalInfoBanner');

  // Aadhaar Elements
  const docFrontInput = document.getElementById('docFrontInput');
  const docBackInput = document.getElementById('docBackInput');
  const docFrontImg = document.getElementById('docFrontImg');
  const docBackImg = document.getElementById('docBackImg');
  const docFrontPh = document.getElementById('docFrontPh');
  const docBackPh = document.getElementById('docBackPh');
  const aadhaarGapInput = document.getElementById('aadhaarGapInput');
  const mergedOutputPreview = document.getElementById('mergedOutputPreview');
  const mergedResultImg = document.getElementById('mergedResultImg');
  const aadhaarMergedInfo = document.getElementById('aadhaarMergedInfo');
  const downloadAadhaarPdfBtn = document.getElementById('downloadAadhaarPdfBtn');
  const downloadAadhaarJpgBtn = document.getElementById('downloadAadhaarJpgBtn');

  // Mobile Navigation Elements
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileSidebar = document.getElementById('mobileSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const mobileDropdownToggle = document.getElementById('mobileDropdownToggle');
  const mobileSubmenu = document.getElementById('mobileSubmenu');

  // ==========================================
  // Navigation & Drawer Controllers
  // ==========================================
  if (hamburgerBtn && mobileSidebar && sidebarOverlay) {
    const toggleSidebar = (open) => {
      const state = open !== undefined ? open : !mobileSidebar.classList.contains('open');
      mobileSidebar.classList.toggle('open', state);
      sidebarOverlay.classList.toggle('open', state);
      hamburgerBtn.classList.toggle('open', state);
    };

    hamburgerBtn.addEventListener('click', () => toggleSidebar());
    sidebarOverlay.addEventListener('click', () => toggleSidebar(false));

    if (mobileDropdownToggle && mobileSubmenu) {
      mobileDropdownToggle.addEventListener('click', (e) => {
        e.preventDefault();
        mobileSubmenu.classList.toggle('open');
      });
    }

    document.querySelectorAll('.mobile-sidebar a:not(.mobile-dropdown-toggle)').forEach(link => {
      link.addEventListener('click', () => toggleSidebar(false));
    });
  }

  // ==========================================
  // Tool Switching & Preset Handlers
  // ==========================================
  window.openProcess = function(toolKey) {
    currentTool = toolKey;

    if (cardScreen) cardScreen.style.display = 'none';
    if (processPanel) processPanel.classList.add('active');

    if (toolKey === 'aadhaar-merge') {
      if (singleToolSection) singleToolSection.style.display = 'none';
      if (aadhaarSection) aadhaarSection.style.display = 'block';
      if (currentToolHeading) currentToolHeading.textContent = 'Merge Aadhaar Card (Front + Back)';
    } else {
      if (aadhaarSection) aadhaarSection.style.display = 'none';
      if (singleToolSection) singleToolSection.style.display = 'block';
      applyToolPreset(toolKey);
    }

    window.scrollTo({ top: processPanel.offsetTop - 80, behavior: 'smooth' });
  };

  window.goBack = function() {
    if (processPanel) processPanel.classList.remove('active');
    if (cardScreen) cardScreen.style.display = 'grid';
    window.scrollTo({ top: cardScreen.offsetTop - 80, behavior: 'smooth' });
  };

  function applyToolPreset(toolKey) {
    const cfg = EXAM_PRESETS[toolKey] || EXAM_PRESETS['pan-photo'];

    if (currentToolHeading) currentToolHeading.textContent = cfg.title;
    if (toolInstructionCallout) {
      toolInstructionCallout.innerHTML = `<strong>Guideline:</strong> ${cfg.infoNote}`;
    }

    if (examPresetSelect) examPresetSelect.value = toolKey;
    if (customWidthInput) customWidthInput.value = cfg.width;
    if (customHeightInput) customHeightInput.value = cfg.height;
    if (customUnitSelect) customUnitSelect.value = cfg.unit;
    if (customDpiSelect) customDpiSelect.value = cfg.dpi;
    if (customMaxKbInput) customMaxKbInput.value = cfg.maxKB;

    // Signature mode preview aspect ratio styling
    const previewFrame = document.querySelector('.preview-frame');
    if (previewFrame) {
      if (toolKey.includes('signature') || (cfg.width > cfg.height)) {
        previewFrame.classList.add('signature-mode');
      } else {
        previewFrame.classList.remove('signature-mode');
      }
    }

    // Name and Date option visibility
    const nameDateWrapper = document.getElementById('nameDateOptionsWrapper');
    if (nameDateWrapper) {
      nameDateWrapper.style.display = cfg.allowNameDate ? 'block' : 'none';
    }

    resetSinglePreview();
  }

  if (examPresetSelect) {
    examPresetSelect.addEventListener('change', (e) => {
      const selected = e.target.value;
      if (selected === 'custom') {
        if (currentToolHeading) currentToolHeading.textContent = 'Custom Dimension Photo Resizer';
        if (toolInstructionCallout) {
          toolInstructionCallout.innerHTML = '<strong>Custom Mode:</strong> Enter your exact required width, height, DPI, and max KB limits below.';
        }
      } else {
        applyToolPreset(selected);
      }
    });
  }

  // Preset quick tabs
  document.querySelectorAll('.tab-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tool = btn.getAttribute('data-tool');
      window.openProcess(tool);
    });
  });

  // Name & Date toggle checkbox
  if (enableNameDateCheck && nameDateFields) {
    enableNameDateCheck.addEventListener('change', () => {
      nameDateFields.style.display = enableNameDateCheck.checked ? 'grid' : 'none';
      if (croppedCanvas) {
        reprocessImageWithOverlay();
      }
    });
  }

  if (candidateNameInput) candidateNameInput.addEventListener('input', () => {
    if (croppedCanvas) reprocessImageWithOverlay();
  });
  if (photoDateInput) photoDateInput.addEventListener('input', () => {
    if (croppedCanvas) reprocessImageWithOverlay();
  });

  // ==========================================
  // Single Image Cropping & Uploading Handlers
  // ==========================================
  window.triggerSingleUpload = function() {
    if (singleFileInput) singleFileInput.click();
  };

  if (singleFileInput) {
    singleFileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImageFile(e.target.files[0]);
      }
    });
  }

  // Drag and Drop support on single drop zone
  const singlePreviewFrame = document.querySelector('.preview-frame');
  if (singlePreviewFrame) {
    singlePreviewFrame.addEventListener('dragover', (e) => {
      e.preventDefault();
      singlePreviewFrame.style.borderColor = 'var(--teal-blue)';
    });
    singlePreviewFrame.addEventListener('dragleave', (e) => {
      e.preventDefault();
      singlePreviewFrame.style.borderColor = '#94a3b8';
    });
    singlePreviewFrame.addEventListener('drop', (e) => {
      e.preventDefault();
      singlePreviewFrame.style.borderColor = '#94a3b8';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageFile(e.dataTransfer.files[0]);
      }
    });
  }

  function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }

    rawImageFile = file;
    if (fileSelectedName) {
      fileSelectedName.value = file.name;
      fileSelectedName.classList.add('has-file');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      openCropperModal(e.target.result);
    };
    reader.readAsDataURL(file);
  }

  // ==========================================
  // Cropper.js Modal Setup
  // ==========================================
  function openCropperModal(imageSrc) {
    if (!cropModal || !modalCropImage) return;

    const preset = EXAM_PRESETS[currentTool] || {};
    const ar = preset.aspectRatio || NaN;

    if (modalTitle) modalTitle.textContent = `Crop ${preset.title || 'Image'}`;
    if (modalInfoBanner) {
      modalInfoBanner.textContent = preset.infoNote || 'Adjust the crop box to frame your photo or signature properly.';
    }

    modalCropImage.src = imageSrc;
    cropModal.classList.add('active');

    if (activeCropper) {
      activeCropper.destroy();
    }

    // Initialize Cropper.js
    activeCropper = new Cropper(modalCropImage, {
      aspectRatio: ar,
      viewMode: 1,
      autoCropArea: 0.95,
      responsive: true,
      restore: false,
      guides: true,
      center: true,
      highlight: false,
      cropBoxMovable: true,
      cropBoxResizable: true,
      toggleDragModeOnDblclick: false,
    });
  }

  window.closeCropModal = function() {
    if (cropModal) cropModal.classList.remove('active');
    if (activeCropper) {
      activeCropper.destroy();
      activeCropper = null;
    }
  };

  // Cropper Toolbar buttons
  window.cropperZoom = (val) => activeCropper && activeCropper.zoom(val);
  window.cropperRotate = (deg) => activeCropper && activeCropper.rotate(deg);
  window.cropperReset = () => activeCropper && activeCropper.reset();

  // Apply Crop & Calculate Target Output
  window.applyCrop = async function() {
    if (!activeCropper) return;

    const preset = EXAM_PRESETS[currentTool] || {};
    const unit = customUnitSelect ? customUnitSelect.value : (preset.unit || 'cm');
    const dpi = customDpiSelect ? parseInt(customDpiSelect.value, 10) : (preset.dpi || 200);
    const widthVal = customWidthInput ? parseFloat(customWidthInput.value) : (preset.width || 3.5);
    const heightVal = customHeightInput ? parseFloat(customHeightInput.value) : (preset.height || 4.5);
    const minKb = preset.minKB || 10;
    const maxKb = customMaxKbInput ? parseFloat(customMaxKbInput.value) : (preset.maxKB || 50);

    const targetWidthPx = SarkariEngine.toPixels(widthVal, unit, dpi);
    const targetHeightPx = SarkariEngine.toPixels(heightVal, unit, dpi);

    // Get cropped canvas at exact target resolution
    croppedCanvas = activeCropper.getCroppedCanvas({
      width: targetWidthPx,
      height: targetHeightPx,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });

    closeCropModal();
    await reprocessImageWithOverlay();
  };

  async function reprocessImageWithOverlay() {
    if (!croppedCanvas) return;

    let finalCanvas = croppedCanvas;

    // Check if Name and Date overlay is enabled
    const isNameDateEnabled = enableNameDateCheck && enableNameDateCheck.checked;
    if (isNameDateEnabled) {
      const candidateName = candidateNameInput ? candidateNameInput.value.trim() : '';
      const photoDate = photoDateInput ? photoDateInput.value.trim() : '';
      const dateText = photoDate ? `DOP: ${photoDate}` : '';

      finalCanvas = SarkariEngine.addNameAndDateToPhoto(croppedCanvas, candidateName, dateText);
    }

    const preset = EXAM_PRESETS[currentTool] || {};
    const dpi = customDpiSelect ? parseInt(customDpiSelect.value, 10) : (preset.dpi || 200);
    const minKb = preset.minKB || 10;
    const maxKb = customMaxKbInput ? parseFloat(customMaxKbInput.value) : (preset.maxKB || 50);

    // Compress to target KB range
    const result = await SarkariEngine.compressToTargetKB(finalCanvas, minKb, maxKb, dpi);
    processedBlob = result.blob;
    processedBlobUrl = result.url;

    // Update UI Preview
    if (singlePreviewImg) {
      singlePreviewImg.src = processedBlobUrl;
      singlePreviewImg.classList.add('loaded');
    }
    if (singlePlaceholderIcon) singlePlaceholderIcon.style.display = 'none';
    if (singleStatusBadge) singleStatusBadge.classList.add('active');

    if (previewMetaInfo) {
      previewMetaInfo.innerHTML = `<strong>${finalCanvas.width}×${finalCanvas.height} px</strong> · <strong>${result.sizeKB} KB</strong> · ${dpi} DPI`;
    }

    if (singleDownloadBtn) singleDownloadBtn.classList.add('visible');
  }

  window.downloadProcessedImage = function() {
    if (!processedBlobUrl) return;
    const preset = EXAM_PRESETS[currentTool] || {};
    const filename = preset.defaultFilename || 'sarkari_resized_image.jpg';
    SarkariEngine.triggerDownload(processedBlobUrl, filename);
  };

  function resetSinglePreview() {
    croppedCanvas = null;
    processedBlob = null;
    processedBlobUrl = null;
    if (singlePreviewImg) {
      singlePreviewImg.src = '';
      singlePreviewImg.classList.remove('loaded');
    }
    if (singlePlaceholderIcon) singlePlaceholderIcon.style.display = 'flex';
    if (singleStatusBadge) singleStatusBadge.classList.remove('active');
    if (fileSelectedName) {
      fileSelectedName.value = 'No file chosen';
      fileSelectedName.classList.remove('has-file');
    }
    if (previewMetaInfo) previewMetaInfo.textContent = 'Upload image to view specs';
    if (singleDownloadBtn) singleDownloadBtn.classList.remove('visible');
  }

  // ==========================================
  // Aadhaar Front + Back Merger Logic
  // ==========================================
  let curDocSide = null; // 'front' or 'back'

  window.triggerDocUpload = function(side) {
    curDocSide = side;
    if (side === 'front' && docFrontInput) docFrontInput.click();
    if (side === 'back' && docBackInput) docBackInput.click();
  };

  if (docFrontInput) {
    docFrontInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        loadDocForCrop(e.target.files[0], 'front');
      }
    });
  }

  if (docBackInput) {
    docBackInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        loadDocForCrop(e.target.files[0], 'back');
      }
    });
  }

  function loadDocForCrop(file, side) {
    curDocSide = side;
    const reader = new FileReader();
    reader.onload = (e) => {
      openAadhaarCropModal(e.target.result, side);
    };
    reader.readAsDataURL(file);
  }

  function openAadhaarCropModal(imageSrc, side) {
    if (!cropModal || !modalCropImage) return;

    if (modalTitle) modalTitle.textContent = `Crop Aadhaar ${side.toUpperCase()} Side`;
    if (modalInfoBanner) {
      modalInfoBanner.textContent = 'Crop the card cleanly up to the edges. Free ratio or card standard.';
    }

    modalCropImage.src = imageSrc;
    cropModal.classList.add('active');

    if (activeCropper) activeCropper.destroy();

    activeCropper = new Cropper(modalCropImage, {
      aspectRatio: NaN, // Free crop for ID cards
      viewMode: 1,
      autoCropArea: 0.98,
      responsive: true
    });

    // Override apply button for Aadhaar
    const originalApply = window.applyCrop;
    window.applyCrop = function() {
      if (!activeCropper) return;

      const canvas = activeCropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high'
      });

      const croppedUrl = canvas.toDataURL('image/jpeg', 0.92);

      if (curDocSide === 'front') {
        aadhaarFrontImg = canvas;
        if (docFrontImg) {
          docFrontImg.src = croppedUrl;
          docFrontImg.classList.add('loaded');
        }
        if (docFrontPh) docFrontPh.style.display = 'none';
      } else {
        aadhaarBackImg = canvas;
        if (docBackImg) {
          docBackImg.src = croppedUrl;
          docBackImg.classList.add('loaded');
        }
        if (docBackPh) docBackPh.style.display = 'none';
      }

      closeCropModal();
      window.applyCrop = originalApply; // restore
      updateMergedAadhaarPreview();
    };
  }

  function updateMergedAadhaarPreview() {
    if (!aadhaarFrontImg || !aadhaarBackImg) {
      if (mergedOutputPreview) mergedOutputPreview.classList.remove('visible');
      return;
    }

    const gap = aadhaarGapInput ? parseInt(aadhaarGapInput.value, 10) || 20 : 20;

    mergedAadhaarCanvas = SarkariEngine.mergeDocuments(aadhaarFrontImg, aadhaarBackImg, {
      layout: aadhaarMergeMode,
      gap,
      padding: 24,
      targetHeight: 500,
      addBorder: true
    });

    const mergedUrl = mergedAadhaarCanvas.toDataURL('image/jpeg', 0.9);
    if (mergedResultImg) mergedResultImg.src = mergedUrl;
    if (mergedOutputPreview) mergedOutputPreview.classList.add('visible');

    if (aadhaarMergedInfo) {
      aadhaarMergedInfo.textContent = `Merged: ${mergedAadhaarCanvas.width}×${mergedAadhaarCanvas.height} px · Ready to download as Single PDF or Image.`;
    }
  }

  window.onAadhaarGapChange = function() {
    if (aadhaarFrontImg && aadhaarBackImg) {
      updateMergedAadhaarPreview();
    }
  };

  window.downloadAadhaarPDF = function() {
    if (!mergedAadhaarCanvas) {
      alert('Please upload both Front and Back sides of Aadhaar card first.');
      return;
    }
    SarkariEngine.exportToPdf(mergedAadhaarCanvas, 'aadhaar_card_merged.pdf', 'portrait');
  };

  window.downloadAadhaarJPG = function() {
    if (!mergedAadhaarCanvas) {
      alert('Please upload both Front and Back sides of Aadhaar card first.');
      return;
    }
    const dataUrl = mergedAadhaarCanvas.toDataURL('image/jpeg', 0.92);
    SarkariEngine.triggerDownload(dataUrl, 'aadhaar_card_merged.jpg');
  };

  // ==========================================
  // FAQ Accordion Controls
  // ==========================================
  window.toggleFaq = function(buttonElement) {
    const isAlreadyOpen = buttonElement.classList.contains('open');
    const answer = buttonElement.nextElementSibling;

    // Close all other open FAQs
    document.querySelectorAll('.faq-question-btn').forEach(btn => {
      btn.classList.remove('open');
      if (btn.nextElementSibling) btn.nextElementSibling.classList.remove('open');
    });

    if (!isAlreadyOpen && answer) {
      buttonElement.classList.add('open');
      answer.classList.add('open');
    }
  };

});
