(function () {
  const { qs, qsa, setRoute } = window.BmaxUI;

  function bindNavigation() {
    qsa('.nav-item').forEach((item) => {
      item.addEventListener('click', () => setRoute(item.dataset.route));
    });

    qs('#menu-toggle')?.addEventListener('click', () => {
      qs('#sidebar')?.classList.toggle('-translate-x-full');
    });

    qsa('[data-close-modal]').forEach((button) => {
      button.addEventListener('click', () => button.closest('.modal')?.classList.add('hidden'));
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    bindNavigation();
    window.BmaxAuth.bindAuth();
    await window.BmaxAuth.checkAuth();
    setRoute('dashboard');
  });
})();
