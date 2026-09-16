(function () {
  try {
    var theme = localStorage.getItem('assure-theme');
    if (theme !== 'light' && theme !== 'dark') {
      theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
})();
