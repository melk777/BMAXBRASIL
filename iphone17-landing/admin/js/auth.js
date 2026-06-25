(function () {
  const { qs, showToast } = window.BmaxUI;

  async function showLogin(message) {
    qs('#login-view')?.classList.remove('hidden');
    qs('#admin-view')?.classList.add('hidden');
    if (message) qs('#login-message').textContent = message;
  }

  async function showAdmin() {
    qs('#login-view')?.classList.add('hidden');
    qs('#admin-view')?.classList.remove('hidden');
  }

  async function checkAuth() {
    if (!window.BmaxAPI.configured) {
      qs('#setup-warning')?.classList.remove('hidden');
      return showLogin('Supabase ainda nao foi configurado.');
    }

    const session = await window.BmaxAPI.getSession();
    if (!session) return showLogin('');
    const allowed = await window.BmaxAPI.isAdmin();
    if (!allowed) {
      await window.BmaxAPI.client.auth.signOut();
      return showLogin('Usuario sem permissao administrativa.');
    }
    await showAdmin();
    window.dispatchEvent(new CustomEvent('bmax:admin-ready'));
  }

  function bindAuth() {
    qs('#login-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = qs('#login-message');
      message.textContent = 'Entrando...';
      try {
        const { error } = await window.BmaxAPI.client.auth.signInWithPassword({
          email: qs('#login-email').value.trim(),
          password: qs('#login-password').value
        });
        if (error) throw error;
        await checkAuth();
        showToast('Login realizado com sucesso.');
      } catch (error) {
        message.textContent = error.message || 'Nao foi possivel entrar.';
      }
    });

    qs('#logout-button')?.addEventListener('click', async () => {
      await window.BmaxAPI.client?.auth.signOut();
      showLogin('');
    });
  }

  window.BmaxAuth = { bindAuth, checkAuth };
})();
