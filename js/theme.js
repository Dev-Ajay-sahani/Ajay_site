/**
 * Sarkari DNA Tools — Universal Theme Manager (Dark & Light Mode)
 */
(function() {
  'use strict';

  function getPreferredTheme() {
    const savedTheme = localStorage.getItem('sarkari_theme');
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sarkari_theme', theme);
    
    // Update theme toggle icons if present
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      btn.innerHTML = theme === 'dark' ? '☀️ <span class="hide-mobile">Light</span>' : '🌙 <span class="hide-mobile">Dark</span>';
      btn.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    });
  }

  // Apply immediately on load
  const initialTheme = getPreferredTheme();
  applyTheme(initialTheme);

  // Global toggle function
  window.toggleTheme = function() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  };

  // Sync on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getPreferredTheme());
  });
})();
