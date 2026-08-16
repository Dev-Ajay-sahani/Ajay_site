// Sarkari Babu Tools - PWA Installer Engine & Service Worker Registration
(function () {
  let deferredPrompt = null;

  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => console.log('Sarkari Babu Service Worker Registered:', reg.scope))
        .catch((err) => console.warn('Service Worker Registration Failed:', err));
    });
  }

  // 2. Check if already running in standalone PWA app mode
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://');

  window.addEventListener('DOMContentLoaded', () => {
    const navInstallBtn = document.getElementById('navInstallBtn');
    const fabInstallBtn = document.getElementById('fabInstallBtn');

    if (isStandalone) {
      if (navInstallBtn) navInstallBtn.style.display = 'none';
      if (fabInstallBtn) fabInstallBtn.style.display = 'none';
      return;
    }

    // Always display install buttons on mobile / desktop web if not in standalone
    if (navInstallBtn) navInstallBtn.style.display = 'inline-flex';
    if (fabInstallBtn) fabInstallBtn.style.display = 'flex';

    // 3. Listen for browser install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (navInstallBtn) navInstallBtn.style.display = 'inline-flex';
      if (fabInstallBtn) fabInstallBtn.style.display = 'flex';
    });

    // 4. Handle installed event
    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      if (navInstallBtn) navInstallBtn.style.display = 'none';
      if (fabInstallBtn) fabInstallBtn.style.display = 'none';
      showToast('🎉 Sarkari Babu App Installed Successfully!');
    });
  });

  // Global trigger function for install buttons
  window.triggerPWAInstall = async function () {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        deferredPrompt = null;
        const navInstallBtn = document.getElementById('navInstallBtn');
        const fabInstallBtn = document.getElementById('fabInstallBtn');
        if (navInstallBtn) navInstallBtn.style.display = 'none';
        if (fabInstallBtn) fabInstallBtn.style.display = 'none';
      }
    } else {
      // iOS / Chrome manual instruction fallback
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        alert(
          '📱 To install Sarkari Babu on your iPhone/iPad:\n1. Tap the Share button 📤 in Safari.\n2. Scroll down and select "Add to Home Screen" ➕.'
        );
      } else {
        alert(
          '📱 To install Sarkari Babu App:\n1. Tap your browser menu (⋮ in Chrome/Edge top-right).\n2. Select "Install app" or "Add to Home screen".'
        );
      }
    }
  };

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '80px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.background = '#10b981';
    toast.style.color = '#ffffff';
    toast.style.padding = '12px 24px';
    toast.style.borderRadius = '30px';
    toast.style.fontWeight = '700';
    toast.style.fontSize = '14px';
    toast.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
    toast.style.zIndex = '99999';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
})();
