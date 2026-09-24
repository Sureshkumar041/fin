// Runs in <head> before the page is painted, so the correct theme is applied
// on first render (no flash of light mode for dark-mode users).
// Keep in sync with STORAGE_KEY in theme-provider.tsx.
export const themeScript = `(function () {
  try {
    var stored = localStorage.getItem('theme');
    var dark = stored === 'dark' || ((stored === null || stored === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();`;
