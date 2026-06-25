(function () {
  const { qs, showToast } = window.BmaxUI;
  let settings = {};

  function fillSettings() {
    const brand = settings.brand || {};
    const home = settings.home || {};
    const contact = settings.contact || {};
    const social = settings.social || {};
    qs('#setting-brand-name').value = brand.name || '';
    qs('#setting-footer-name').value = brand.footer_name || '';
    qs('#setting-logo-url').value = brand.logo_url || '';
    qs('#setting-catalog-title').value = home.catalog_title || '';
    qs('#setting-stock-count').value = home.stock_count || '';
    qs('#setting-whatsapp').value = contact.whatsapp || '';
    qs('#setting-email').value = contact.email || '';
    qs('#setting-instagram').value = social.instagram || '';
    qs('#setting-facebook').value = social.facebook || '';
  }

  async function loadSettings() {
    if (!window.BmaxAPI.configured) return;
    settings = await window.BmaxAPI.getSettings();
    fillSettings();
  }

  function bindSettings() {
    qs('#settings-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const next = {
        brand: {
          ...(settings.brand || {}),
          name: qs('#setting-brand-name').value.trim(),
          footer_name: qs('#setting-footer-name').value.trim(),
          logo_url: qs('#setting-logo-url').value.trim()
        },
        home: {
          ...(settings.home || {}),
          catalog_title: qs('#setting-catalog-title').value.trim(),
          stock_count: Number(qs('#setting-stock-count').value || 0)
        },
        contact: {
          ...(settings.contact || {}),
          whatsapp: qs('#setting-whatsapp').value.trim(),
          email: qs('#setting-email').value.trim()
        },
        social: {
          ...(settings.social || {}),
          instagram: qs('#setting-instagram').value.trim(),
          facebook: qs('#setting-facebook').value.trim()
        }
      };
      try {
        await window.BmaxAPI.saveSettings(next);
        settings = next;
        showToast('Configuracoes salvas.');
        window.dispatchEvent(new CustomEvent('bmax:data-changed'));
      } catch (error) {
        showToast(error.message || 'Erro ao salvar configuracoes.', 'error');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', bindSettings);
  window.addEventListener('bmax:admin-ready', loadSettings);
  window.addEventListener('bmax:route', (event) => {
    if (event.detail.route === 'settings') loadSettings().catch(console.error);
  });
})();
