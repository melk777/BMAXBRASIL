(function () {
  const { qs, slugify, showToast, confirmDialog } = window.BmaxUI;
  let categories = [];

  function resetForm() {
    qs('#category-id').value = '';
    qs('#category-name').value = '';
    qs('#category-slug').value = '';
    qs('#category-description').value = '';
    qs('#category-status').value = 'active';
  }

  function fillForm(category) {
    qs('#category-id').value = category.id;
    qs('#category-name').value = category.name || '';
    qs('#category-slug').value = category.slug || '';
    qs('#category-description').value = category.description || '';
    qs('#category-status').value = category.status || 'active';
  }

  function renderCategories() {
    qs('#categories-table').innerHTML = categories
      .map((category) => `
        <tr>
          <td><strong>${category.name}</strong><p class="text-xs text-slate-500">${category.description || ''}</p></td>
          <td>${category.slug}</td>
          <td><span class="status-pill ${category.status}">${category.status === 'active' ? 'Ativa' : 'Inativa'}</span></td>
          <td class="text-right">
            <button class="icon-btn" data-edit-category="${category.id}" aria-label="Editar"><i class="ph ph-pencil"></i></button>
            <button class="icon-btn" data-delete-category="${category.id}" aria-label="Excluir"><i class="ph ph-trash"></i></button>
          </td>
        </tr>
      `)
      .join('') || '<tr><td colspan="4" class="text-center text-slate-500">Nenhuma categoria cadastrada.</td></tr>';
  }

  async function loadCategories() {
    if (!window.BmaxAPI.configured) return;
    categories = await window.BmaxAPI.listCategories();
    renderCategories();
    window.dispatchEvent(new CustomEvent('bmax:categories-loaded', { detail: { categories } }));
  }

  function bindCategories() {
    qs('#new-category-button')?.addEventListener('click', resetForm);
    qs('#category-name')?.addEventListener('input', (event) => {
      if (!qs('#category-id').value) qs('#category-slug').value = slugify(event.target.value);
    });

    qs('#category-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
        await window.BmaxAPI.saveCategory({
          id: qs('#category-id').value || undefined,
          name: qs('#category-name').value.trim(),
          slug: qs('#category-slug').value.trim(),
          description: qs('#category-description').value.trim(),
          status: qs('#category-status').value
        });
        showToast('Categoria salva.');
        resetForm();
        await loadCategories();
        window.dispatchEvent(new CustomEvent('bmax:data-changed'));
      } catch (error) {
        showToast(error.message || 'Erro ao salvar categoria.', 'error');
      }
    });

    qs('#categories-table')?.addEventListener('click', async (event) => {
      const editId = event.target.closest('[data-edit-category]')?.dataset.editCategory;
      const deleteId = event.target.closest('[data-delete-category]')?.dataset.deleteCategory;
      if (editId) fillForm(categories.find((category) => category.id === editId));
      if (deleteId && await confirmDialog('Excluir esta categoria? Produtos vinculados ficarao sem categoria.')) {
        try {
          await window.BmaxAPI.deleteCategory(deleteId);
          showToast('Categoria excluida.');
          await loadCategories();
          window.dispatchEvent(new CustomEvent('bmax:data-changed'));
        } catch (error) {
          showToast(error.message || 'Erro ao excluir categoria.', 'error');
        }
      }
    });
  }

  document.addEventListener('DOMContentLoaded', bindCategories);
  window.addEventListener('bmax:admin-ready', loadCategories);
  window.addEventListener('bmax:route', (event) => {
    if (event.detail.route === 'categories') loadCategories().catch(console.error);
  });
})();
