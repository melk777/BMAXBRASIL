(function () {
  const { qs, formatCurrency } = window.BmaxUI;

  async function loadDashboard() {
    if (!window.BmaxAPI.configured) return;
    const stats = await window.BmaxAPI.getStats();
    qs('#stat-products').textContent = stats.products;
    qs('#stat-active-products').textContent = stats.activeProducts;
    qs('#stat-stock').textContent = stats.stock;
    qs('#stat-orders').textContent = stats.orders;
    qs('#stat-customers').textContent = stats.customers || 0;
    qs('#recent-products').innerHTML = stats.recentProducts
      .map((product) => `
        <div class="flex items-center justify-between gap-3 py-3">
          <div>
            <p class="font-semibold">${product.name}</p>
            <p class="text-xs text-slate-500">${product.status === 'active' ? 'Ativo' : 'Inativo'} · ${product.stock || 0} em estoque</p>
          </div>
          <span class="text-sm font-semibold">${formatCurrency(product.promotional_price || product.price)}</span>
        </div>
      `)
      .join('') || '<p class="py-4 text-sm text-slate-500">Nenhum produto cadastrado.</p>';
  }

  window.addEventListener('bmax:admin-ready', loadDashboard);
  window.addEventListener('bmax:data-changed', loadDashboard);
  window.addEventListener('bmax:route', (event) => {
    if (event.detail.route === 'dashboard') loadDashboard().catch(console.error);
  });
})();
