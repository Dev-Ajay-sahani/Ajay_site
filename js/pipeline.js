/**
 * Sarkari Babu — Cross-Tool Result Pipeline & Seamless Workflow Chaining
 * Passes results (images/documents) between tools in pure client-side browser memory.
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
      console.warn('SessionStorage quota exceeded, switching to temporary memory pass', err);
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
   * Inject a notification banner if incoming payload is waiting
   * @param {string} containerSelector Target container element or ID
   * @param {function} onAccept Callback when user clicks 'Use Image'
   */
  initReceiver(containerSelector, onAccept) {
    const data = this.getIncoming();
    if (!data || !data.dataUrl) return;

    const container = typeof containerSelector === 'string' 
      ? document.querySelector(containerSelector) 
      : containerSelector;

    if (!container) return;

    const banner = document.createElement('div');
    banner.id = 'pipelineBanner';
    banner.style.cssText = `
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(16, 185, 129, 0.12));
      border: 1.5px solid var(--primary);
      border-radius: var(--radius-lg);
      padding: 14px 18px;
      margin-bottom: 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      box-shadow: var(--shadow-md);
      animation: fadeIn 0.3s ease;
    `;

    banner.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="font-size:24px;">✨</div>
        <div>
          <div style="font-weight:800;font-size:14px;color:var(--text-primary);">
            Image Received from ${data.sourceName}
          </div>
          <div style="font-size:12px;color:var(--text-secondary);font-family:var(--font-mono);">
            File: ${data.fileName} ${data.sizeKB ? '· ' + data.sizeKB + ' KB' : ''}
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn-primary" id="pipelineAcceptBtn" style="padding:7px 14px;font-size:13px;">
          ⚡ Auto-Load Into This Tool
        </button>
        <button class="btn-secondary" id="pipelineDismissBtn" style="padding:7px 10px;font-size:13px;">
          ✕ Dismiss
        </button>
      </div>
    `;

    container.prepend(banner);

    document.getElementById('pipelineAcceptBtn').onclick = () => {
      if (typeof onAccept === 'function') {
        const img = new Image();
        img.onload = () => {
          onAccept(img, data);
          banner.remove();
          SarkariPipeline.clear();
        };
        img.src = data.dataUrl;
      }
    };

    document.getElementById('pipelineDismissBtn').onclick = () => {
      banner.remove();
      SarkariPipeline.clear();
    };
  }
};
