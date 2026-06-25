(function () {
  const config = window.BMAX_CONFIG || {};
  const configured = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  const client = configured ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;

  function isConfigured() {
    return configured;
  }

  async function listProducts() {
    if (!client) return null;
    const { data, error } = await client
      .from('products')
      .select('*, categories(id,name,slug), product_images(*)')
      .eq('status', 'active')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function getSettings() {
    if (!client) return {};
    const { data, error } = await client.from('site_settings').select('*');
    if (error) throw error;
    return Object.fromEntries((data || []).map((row) => [row.key, row.value || {}]));
  }

  function subscribeToCatalog(callback) {
    if (!client) return () => {};
    const channel = client
      .channel('public-catalog-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'product_images' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, callback)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, callback)
      .subscribe();
    return () => client.removeChannel(channel);
  }

  async function trackProductView(productId) {
    if (!client || !productId) return;
    try {
      await client.from('product_views').insert({
        product_id: productId,
        source: 'landing',
        user_agent: navigator.userAgent
      });
    } catch (_) {
      /* Analytics should never break storefront rendering. */
    }
  }

  window.BmaxPublicAPI = {
    isConfigured,
    listProducts,
    getSettings,
    subscribeToCatalog,
    trackProductView
  };
})();
