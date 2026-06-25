(function () {
  const titles = {
    dashboard: ['Dashboard', 'Visao geral da operacao'],
    customers: ['Clientes', 'Cadastros realizados antes da compra'],
    products: ['Produtos', 'Cadastro, precos, estoque e imagens'],
    categories: ['Categorias', 'Organizacao do catalogo'],
    media: ['Midia', 'Fotos e arquivos usados no site'],
    settings: ['Configuracoes', 'Marca, contato, redes e home']
  };

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function showToast(message, type = 'success') {
    const toast = qs('#toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.remove('hidden');
    toast.style.background = type === 'error' ? 'rgb(185 28 28)' : 'rgb(15 23 42)';
    clearTimeout(window.__bmaxToastTimer);
    window.__bmaxToastTimer = setTimeout(() => toast.classList.add('hidden'), 3400);
  }

  function setLoading(button, loading, label) {
    if (!button) return;
    if (loading) {
      button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = label || 'Salvando...';
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }

  function confirmDialog(message) {
    const modal = qs('#confirm-modal');
    const msg = qs('#confirm-message');
    const ok = qs('#confirm-ok');
    const cancel = qs('#confirm-cancel');
    msg.textContent = message || 'Esta acao nao pode ser desfeita.';
    modal.classList.remove('hidden');

    return new Promise((resolve) => {
      function cleanup(result) {
        modal.classList.add('hidden');
        ok.removeEventListener('click', onOk);
        cancel.removeEventListener('click', onCancel);
        resolve(result);
      }
      function onOk() {
        cleanup(true);
      }
      function onCancel() {
        cleanup(false);
      }
      ok.addEventListener('click', onOk);
      cancel.addEventListener('click', onCancel);
    });
  }

  function setRoute(route) {
    qsa('.view-section').forEach((section) => section.classList.add('hidden'));
    qs(`#${route}-section`)?.classList.remove('hidden');
    qsa('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.route === route));
    const [title, subtitle] = titles[route] || titles.dashboard;
    qs('#page-title').textContent = title;
    qs('#page-subtitle').textContent = subtitle;
    qs('#sidebar')?.classList.add('-translate-x-full');
    window.dispatchEvent(new CustomEvent('bmax:route', { detail: { route } }));
  }

  window.BmaxUI = {
    qs,
    qsa,
    formatCurrency,
    slugify,
    showToast,
    setLoading,
    confirmDialog,
    setRoute
  };
})();
