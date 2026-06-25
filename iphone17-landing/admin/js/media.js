(function () {
  const { qs } = window.BmaxUI;

  async function loadMedia() {
    if (!window.BmaxAPI.configured) return;
    const products = await window.BmaxAPI.listProducts(true);
    const images = products.flatMap((product) =>
      (product.product_images || []).map((image) => ({ ...image, product_name: product.name }))
    );
    qs('#media-grid').innerHTML = images
      .map((image) => `
        <article class="panel-card">
          <img src="${image.public_url}" alt="" class="mb-3 h-40 w-full rounded bg-slate-50 object-contain">
          <p class="truncate text-sm font-semibold">${image.product_name}</p>
          <p class="truncate text-xs text-slate-500">${image.storage_path}</p>
        </article>
      `)
      .join('') || '<p class="text-sm text-slate-500">Nenhuma imagem cadastrada.</p>';
  }

  window.addEventListener('bmax:admin-ready', loadMedia);
  window.addEventListener('bmax:data-changed', loadMedia);
  window.addEventListener('bmax:route', (event) => {
    if (event.detail.route === 'media') loadMedia().catch(console.error);
  });
})();
