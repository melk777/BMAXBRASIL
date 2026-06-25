(function () {
  const grid = () => document.querySelector('.products-grid');
  const money = (value) => Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0
  });

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function imageUrl(image) {
    if (!image) return 'assets/iphone17/deep-blue.png';
    return image.public_url || image.storage_path || 'assets/iphone17/deep-blue.png';
  }

  function productColors(product, images) {
    const colors = Array.isArray(product.metadata?.colors) ? product.metadata.colors : [];
    if (colors.length) return colors;
    return images.map((image, index) => ({
      name: image.alt_text || `Foto ${index + 1}`,
      hex: index === 0 ? '#2F333A' : '#E3E4E6',
      image: imageUrl(image)
    }));
  }

  function renderProduct(product, index) {
    const images = (product.product_images || []).slice().sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));
    const main = images.find((image) => image.is_main) || images[0];
    const colors = productColors(product, images);
    const imageId = `dynamic-product-image-${index}`;
    const colorSelectId = `dynamic-color-${index}`;
    const search = [product.name, product.slug, product.categories?.name, ...(product.tags || [])].join(' ').toLowerCase();
    const checkoutPrice = product.promotional_price || product.price;

    return `
      <div class="product-card" data-product-id="${product.id}" data-search="${escapeHtml(search)}">
        <div class="product-img-wrapper">
          <img id="${imageId}" src="${escapeHtml(imageUrl(main))}" alt="${escapeHtml(product.name)}" style="object-fit: contain; padding: 10px;">
        </div>
        <div class="color-variants">
          ${colors.map((color, colorIndex) => `
            <div class="color-swatch ${colorIndex === 0 ? 'active' : ''}"
              style="background-color: ${escapeHtml(color.hex || '#E3E4E6')};"
              data-img="${escapeHtml(color.image || imageUrl(main))}"
              title="${escapeHtml(color.name)}"
              onclick="changeProductColor('${imageId}', this)"></div>
          `).join('')}
        </div>
        <h3 style="font-size: 1.15rem; min-height: 55px;">${escapeHtml(product.name)}</h3>
        <p class="product-price-card">Parcelado: ${money(product.price)}</p>
        <p class="product-price-pix">${money(checkoutPrice)} <span>no PIX (-5%)</span></p>
        <select id="${colorSelectId}" class="seletor-cor-luxo">
          ${colors.map((color) => `<option value="${escapeHtml(color.name)}">${escapeHtml(color.name)}</option>`).join('')}
        </select>
        <a href="javascript:void(0)"
          class="btn primary-btn btn-glow btn-reserva-venda"
          data-produto="${escapeHtml(product.name)}"
          data-valor="${Number(checkoutPrice || 0).toFixed(2)}"
          data-cor-id="${colorSelectId}">RESERVAR UNIDADE</a>
      </div>
    `;
  }

  function applySettings(settings) {
    const brand = settings.brand || {};
    const home = settings.home || {};
    const contact = settings.contact || {};
    const social = settings.social || {};

    document.querySelectorAll('.logo span').forEach((span, index) => {
      if (index === 0 && brand.name) span.textContent = brand.name;
      if (index > 0 && brand.footer_name) span.textContent = brand.footer_name;
    });

    if (home.catalog_title) {
      const title = document.querySelector('#produtos .section-title');
      if (title) title.textContent = home.catalog_title;
    }

    if (Number.isFinite(Number(home.stock_count))) {
      document.querySelectorAll('.stock-count').forEach((el) => {
        el.textContent = Number(home.stock_count);
      });
    }

    const footer = document.querySelector('footer .container');
    if (footer && (contact.whatsapp || contact.email || social.instagram)) {
      let contactLine = footer.querySelector('[data-dynamic-contact]');
      if (!contactLine) {
        contactLine = document.createElement('p');
        contactLine.dataset.dynamicContact = 'true';
        footer.appendChild(contactLine);
      }
      contactLine.textContent = [contact.whatsapp, contact.email, social.instagram].filter(Boolean).join(' · ');
    }
  }

  async function renderCatalog() {
    if (!window.BmaxPublicAPI?.isConfigured()) return;
    const target = grid();
    if (!target) return;
    try {
      const [products, settings] = await Promise.all([
        window.BmaxPublicAPI.listProducts(),
        window.BmaxPublicAPI.getSettings()
      ]);
      if (products && products.length) {
        target.innerHTML = products.map(renderProduct).join('');
        products.forEach((product) => window.BmaxPublicAPI.trackProductView(product.id));
      }
      applySettings(settings || {});
    } catch (error) {
      console.warn('Catalogo dinamico indisponivel. Mantendo fallback estatico.', error);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderCatalog();
    window.BmaxPublicAPI?.subscribeToCatalog(() => renderCatalog());
  });
})();
