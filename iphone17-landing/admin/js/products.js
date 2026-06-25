(function () {
  const { qs, slugify, formatCurrency, showToast, confirmDialog } = window.BmaxUI;
  let products = [];
  let categories = [];
  let currentImages = [];

  function normalizeColorsJson(product) {
    const colors = product?.metadata?.colors || [];
    return JSON.stringify(colors, null, 2);
  }

  function parseProductPayload() {
    let colors = [];
    const rawColors = qs('#product-colors-json').value.trim();
    if (rawColors) {
      try {
        colors = JSON.parse(rawColors);
      } catch (_) {
        throw new Error('JSON de cores invalido.');
      }
    }

    return {
      id: qs('#product-id').value || undefined,
      name: qs('#product-name').value.trim(),
      slug: qs('#product-slug').value.trim(),
      price: Number(qs('#product-price').value || 0),
      promotional_price: qs('#product-promotional-price').value ? Number(qs('#product-promotional-price').value) : null,
      stock: Number(qs('#product-stock').value || 0),
      category_id: qs('#product-category').value || null,
      status: qs('#product-status').value,
      short_description: qs('#product-short-description').value.trim(),
      description: qs('#product-description').value.trim(),
      tags: qs('#product-tags').value.split(',').map((tag) => tag.trim()).filter(Boolean),
      metadata: { colors }
    };
  }

  function renderCategoryOptions(selectedId) {
    qs('#product-category').innerHTML =
      '<option value="">Sem categoria</option>' +
      categories.map((category) => `<option value="${category.id}" ${category.id === selectedId ? 'selected' : ''}>${category.name}</option>`).join('');
  }

  function renderProducts() {
    const term = qs('#product-search')?.value.toLowerCase().trim() || '';
    const status = qs('#product-status-filter')?.value || '';
    const visible = products.filter((product) => {
      const matchesTerm = !term || [product.name, product.slug, (product.tags || []).join(' ')].join(' ').toLowerCase().includes(term);
      const matchesStatus = !status || product.status === status;
      return matchesTerm && matchesStatus;
    });

    qs('#products-table').innerHTML = visible
      .map((product) => {
        const mainImage = (product.product_images || []).find((image) => image.is_main) || (product.product_images || [])[0];
        return `
          <tr>
            <td>
              <div class="flex items-center gap-3">
                <img src="${mainImage?.public_url || '../assets/iphone17/deep-blue.png'}" alt="" class="h-12 w-12 rounded bg-slate-50 object-contain">
                <div><strong>${product.name}</strong><p class="text-xs text-slate-500">${product.categories?.name || 'Sem categoria'}</p></div>
              </div>
            </td>
            <td>${formatCurrency(product.price)}</td>
            <td>${formatCurrency(product.promotional_price || 0)}</td>
            <td>${product.stock || 0}</td>
            <td><span class="status-pill ${product.status}">${product.status === 'active' ? 'Ativo' : 'Inativo'}</span></td>
            <td class="text-right">
              <button class="icon-btn" data-edit-product="${product.id}" aria-label="Editar"><i class="ph ph-pencil"></i></button>
              <button class="icon-btn" data-delete-product="${product.id}" aria-label="Excluir"><i class="ph ph-trash"></i></button>
            </td>
          </tr>
        `;
      })
      .join('') || '<tr><td colspan="6" class="text-center text-slate-500">Nenhum produto encontrado.</td></tr>';
  }

  function renderProductImages(productId) {
    qs('#product-images-list').innerHTML = currentImages
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      .map((image) => `
        <div class="image-row">
          <img src="${image.public_url}" alt="">
          <div>
            <p class="truncate text-sm font-semibold">${image.alt_text || image.storage_path}</p>
            <div class="mt-1 flex items-center gap-2 text-xs">
              <button type="button" class="font-bold text-slate-900" data-main-image="${image.id}">${image.is_main ? 'Principal' : 'Definir principal'}</button>
              <button type="button" class="font-bold text-red-600" data-delete-image="${image.id}">Excluir</button>
            </div>
          </div>
          <input class="form-input w-20" type="number" min="0" value="${image.sort_order || 0}" data-image-order="${image.id}">
        </div>
      `)
      .join('') || `<p class="text-sm text-slate-500">${productId ? 'Nenhuma foto enviada.' : 'Salve o produto antes de enviar fotos.'}</p>`;
  }

  function resetProductForm() {
    qs('#product-modal-title').textContent = 'Novo produto';
    qs('#product-form').reset();
    qs('#product-id').value = '';
    currentImages = [];
    renderCategoryOptions('');
    qs('#product-colors-json').value = '[]';
    renderProductImages('');
    qs('#product-modal').classList.remove('hidden');
  }

  async function openProduct(id) {
    const product = await window.BmaxAPI.getProduct(id);
    qs('#product-modal-title').textContent = 'Editar produto';
    qs('#product-id').value = product.id;
    qs('#product-name').value = product.name || '';
    qs('#product-slug').value = product.slug || '';
    qs('#product-price').value = product.price || 0;
    qs('#product-promotional-price').value = product.promotional_price || '';
    qs('#product-stock').value = product.stock || 0;
    qs('#product-status').value = product.status || 'active';
    qs('#product-short-description').value = product.short_description || '';
    qs('#product-description').value = product.description || '';
    qs('#product-tags').value = (product.tags || []).join(', ');
    qs('#product-colors-json').value = normalizeColorsJson(product);
    currentImages = product.product_images || [];
    renderCategoryOptions(product.category_id);
    renderProductImages(product.id);
    qs('#product-modal').classList.remove('hidden');
  }

  async function loadProducts() {
    if (!window.BmaxAPI.configured) return;
    [products, categories] = await Promise.all([
      window.BmaxAPI.listProducts(true),
      window.BmaxAPI.listCategories()
    ]);
    renderCategoryOptions('');
    renderProducts();
  }

  function bindProducts() {
    qs('#new-product-button')?.addEventListener('click', resetProductForm);
    qs('#product-search')?.addEventListener('input', renderProducts);
    qs('#product-status-filter')?.addEventListener('change', renderProducts);
    qs('#product-name')?.addEventListener('input', (event) => {
      if (!qs('#product-id').value) qs('#product-slug').value = slugify(event.target.value);
    });

    qs('#products-table')?.addEventListener('click', async (event) => {
      const editId = event.target.closest('[data-edit-product]')?.dataset.editProduct;
      const deleteId = event.target.closest('[data-delete-product]')?.dataset.deleteProduct;
      if (editId) openProduct(editId).catch((error) => showToast(error.message, 'error'));
      if (deleteId && await confirmDialog('Excluir este produto e suas imagens vinculadas?')) {
        try {
          await window.BmaxAPI.deleteProduct(deleteId);
          showToast('Produto excluido.');
          await loadProducts();
          window.dispatchEvent(new CustomEvent('bmax:data-changed'));
        } catch (error) {
          showToast(error.message || 'Erro ao excluir produto.', 'error');
        }
      }
    });

    qs('#product-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitter = event.submitter;
      window.BmaxUI.setLoading(submitter, true, 'Salvando...');
      try {
        const product = await window.BmaxAPI.saveProduct(parseProductPayload());
        const files = Array.from(qs('#product-image-upload').files || []);
        if (files.length) {
          await window.BmaxAPI.uploadProductImages(product.id, files);
          qs('#product-image-upload').value = '';
        }
        showToast('Produto salvo.');
        await loadProducts();
        await openProduct(product.id);
        window.dispatchEvent(new CustomEvent('bmax:data-changed'));
      } catch (error) {
        showToast(error.message || 'Erro ao salvar produto.', 'error');
      } finally {
        window.BmaxUI.setLoading(submitter, false);
      }
    });

    qs('#product-images-list')?.addEventListener('click', async (event) => {
      const mainId = event.target.closest('[data-main-image]')?.dataset.mainImage;
      const deleteId = event.target.closest('[data-delete-image]')?.dataset.deleteImage;
      const productId = qs('#product-id').value;
      try {
        if (mainId) await window.BmaxAPI.setMainProductImage(productId, mainId);
        if (deleteId && await confirmDialog('Excluir esta imagem?')) {
          const image = currentImages.find((item) => item.id === deleteId);
          await window.BmaxAPI.deleteProductImage(image);
        }
        await openProduct(productId);
        await loadProducts();
        window.dispatchEvent(new CustomEvent('bmax:data-changed'));
      } catch (error) {
        showToast(error.message || 'Erro ao atualizar imagem.', 'error');
      }
    });

    qs('#product-images-list')?.addEventListener('change', async (event) => {
      const imageId = event.target.dataset.imageOrder;
      if (!imageId) return;
      try {
        await window.BmaxAPI.updateProductImage(imageId, { sort_order: Number(event.target.value || 0) });
        showToast('Ordem atualizada.');
      } catch (error) {
        showToast(error.message || 'Erro ao ordenar imagem.', 'error');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', bindProducts);
  window.addEventListener('bmax:admin-ready', loadProducts);
  window.addEventListener('bmax:data-changed', loadProducts);
  window.addEventListener('bmax:categories-loaded', (event) => {
    categories = event.detail.categories || [];
    renderCategoryOptions(qs('#product-category')?.value || '');
  });
  window.addEventListener('bmax:route', (event) => {
    if (event.detail.route === 'products') loadProducts().catch(console.error);
  });
})();
