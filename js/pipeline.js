/**
 * Sarkari Babu — Cross-Tool Result Pipeline & Seamless Workflow Chaining
 * Passes results (images/documents) between tools in pure client-side browser memory.
 * Immediately and automatically auto-loads the file into the destination tool.
 */

const SarkariPipeline = {
  STORAGE_KEY: 'sarkari_babu_pipeline_payload',

  /**
   * Send the current tool's processed image to another tool
   * @param {string} targetUrl e.g. 'image-compressor.html'
   * @param {string} dataUrl Base64 or Blob URL of the image
   * @param {object} meta { sourceName: 'Custom Cropper', fileName: 'custom_photo.jpg', sizeKB: 45 }
   */
  passTo(targetUrl, dataUrl, meta = {}) {
    if (!dataUrl) {
      alert('Please upload or generate an image first!');
      return;
    }
    const payload = {
      dataUrl,
      sourceName: meta.sourceName || 'Previous Tool',
      fileName: meta.fileName || 'transferred_image.jpg',
      sizeKB: meta.sizeKB || 0,
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(payload));
      window.location.href = targetUrl;
    } catch (err) {
      console.warn('SessionStorage quota warning, transferring directly:', err);
      window.location.href = targetUrl;
    }
  },

  /**
   * Retrieve any incoming image passed from a previous tool
   * @returns {object|null}
   */
  getIncoming() {
    try {
      const raw = sessionStorage.getItem(this.STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Valid for 30 minutes
      if (Date.now() - data.timestamp > 30 * 60 * 1000) {
        sessionStorage.removeItem(this.STORAGE_KEY);
        return null;
      }
      return data;
    } catch (e) {
      return null;
    }
  },

  /**
   * Clear the pipeline cache
   */
  clear() {
    sessionStorage.removeItem(this.STORAGE_KEY);
  },

  /**
   * Automatic Receiver: Immediately auto-loads the incoming image and shows an alert toast
   * @param {string|HTMLElement} containerSelector
   * @param {function} onAccept Callback with (Image, meta)
   */
  initReceiver(containerSelector, onAccept) {
    const data = this.getIncoming();
    if (!data || !data.dataUrl) return;

    // Immediately consume payload so reloads don't loop
    this.clear();

    const img = new Image();
    img.onload = () => {
      if (typeof onAccept === 'function') {
        onAccept(img, data);
      }

      // Show sleek floating toast confirming the auto-transfer
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, var(--primary), #10B981);
        color: #fff;
        padding: 10px 22px;
        border-radius: var(--radius-full);
        font-size: 13.5px;
        font-weight: 700;
        box-shadow: var(--shadow-lg);
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: fadeIn 0.3s ease;
      `;
      toast.innerHTML = `✨ <span>Transferred image auto-loaded from <strong>${data.sourceName}</strong>!</span>`;
      document.body.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => toast.remove(), 500);
      }, 3500);
    };

    img.src = data.dataUrl;
  }
};
