(function () {
  const config = window.BMAX_ADMIN_CONFIG || {};
  const configured = Boolean(config.supabaseUrl && config.supabaseAnonKey && window.supabase);
  const client = configured ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey) : null;

  async function requireClient() {
    if (!client) {
      throw new Error('Supabase nao configurado. Edite admin/js/config.js.');
    }
    return client;
  }

  async function getSession() {
    const sb = await requireClient();
    const { data, error } = await sb.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function isAdmin() {
    const sb = await requireClient();
    const session = await getSession();
    if (!session) return false;
    const { data, error } = await sb
      .from('admin_profiles')
      .select('id, role, active')
      .eq('id', session.user.id)
      .eq('active', true)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  async function listProducts(includeInactive = true) {
    const sb = await requireClient();
    let query = sb
      .from('products')
      .select('*, categories(id,name), product_images(*)')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (!includeInactive) query = query.eq('status', 'active');
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function getProduct(id) {
    const sb = await requireClient();
    const { data, error } = await sb
      .from('products')
      .select('*, product_images(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async function saveProduct(payload) {
    const sb = await requireClient();
    const id = payload.id;
    delete payload.id;
    const query = id
      ? sb.from('products').update(payload).eq('id', id).select().single()
      : sb.from('products').insert(payload).select().single();
    const { data, error } = await query;
    if (error) throw error;
    await audit(id ? 'update' : 'create', 'products', data.id, payload);
    return data;
  }

  async function deleteProduct(id) {
    const sb = await requireClient();
    const { error } = await sb.from('products').delete().eq('id', id);
    if (error) throw error;
    await audit('delete', 'products', id, {});
  }

  async function listCategories() {
    const sb = await requireClient();
    const { data, error } = await sb
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  }

  async function saveCategory(payload) {
    const sb = await requireClient();
    const id = payload.id;
    delete payload.id;
    const query = id
      ? sb.from('categories').update(payload).eq('id', id).select().single()
      : sb.from('categories').insert(payload).select().single();
    const { data, error } = await query;
    if (error) throw error;
    await audit(id ? 'update' : 'create', 'categories', data.id, payload);
    return data;
  }

  async function deleteCategory(id) {
    const sb = await requireClient();
    const { error } = await sb.from('categories').delete().eq('id', id);
    if (error) throw error;
    await audit('delete', 'categories', id, {});
  }

  async function uploadProductImages(productId, files) {
    const sb = await requireClient();
    const rows = [];
    for (const file of files) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${productId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await sb.storage
        .from(config.productMediaBucket || 'product-media')
        .upload(path, file, { upsert: false });
      if (uploadError) throw uploadError;
      const { data: publicData } = sb.storage.from(config.productMediaBucket || 'product-media').getPublicUrl(path);
      rows.push({
        product_id: productId,
        storage_path: path,
        public_url: publicData.publicUrl,
        alt_text: file.name,
        is_main: false,
        sort_order: 99
      });
    }
    if (!rows.length) return [];
    const { data, error } = await sb.from('product_images').insert(rows).select();
    if (error) throw error;
    await audit('upload', 'product_images', productId, { count: rows.length });
    return data || [];
  }

  async function updateProductImage(id, payload) {
    const sb = await requireClient();
    const { data, error } = await sb.from('product_images').update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async function deleteProductImage(image) {
    const sb = await requireClient();
    if (image.storage_path && !image.storage_path.startsWith('assets/')) {
      await sb.storage.from(config.productMediaBucket || 'product-media').remove([image.storage_path]);
    }
    const { error } = await sb.from('product_images').delete().eq('id', image.id);
    if (error) throw error;
  }

  async function setMainProductImage(productId, imageId) {
    const sb = await requireClient();
    const { error: clearError } = await sb
      .from('product_images')
      .update({ is_main: false })
      .eq('product_id', productId);
    if (clearError) throw clearError;
    return updateProductImage(imageId, { is_main: true });
  }

  async function getSettings() {
    const sb = await requireClient();
    const { data, error } = await sb.from('site_settings').select('*');
    if (error) throw error;
    return Object.fromEntries((data || []).map((row) => [row.key, row.value || {}]));
  }

  async function saveSettings(settings) {
    const sb = await requireClient();
    const rows = Object.entries(settings).map(([key, value]) => ({ key, value }));
    const { error } = await sb.from('site_settings').upsert(rows, { onConflict: 'key' });
    if (error) throw error;
    await audit('update', 'site_settings', null, settings);
  }

  async function getStats() {
    const sb = await requireClient();
    const [products, orders] = await Promise.all([
      sb.from('products').select('id,status,stock,name,created_at').order('created_at', { ascending: false }),
      sb.from('orders').select('id,status')
    ]);
    if (products.error) throw products.error;
    if (orders.error) throw orders.error;
    const rows = products.data || [];
    return {
      products: rows.length,
      activeProducts: rows.filter((p) => p.status === 'active').length,
      stock: rows.reduce((sum, p) => sum + Number(p.stock || 0), 0),
      orders: (orders.data || []).length,
      recentProducts: rows.slice(0, 6)
    };
  }

  async function audit(action, entity, entityId, payload) {
    try {
      const sb = await requireClient();
      const session = await getSession();
      await sb.from('audit_logs').insert({
        actor_id: session?.user?.id || null,
        action,
        entity,
        entity_id: entityId || null,
        payload: payload || {}
      });
    } catch (_) {
      /* Audit failures must not block admin work. */
    }
  }

  window.BmaxAPI = {
    configured,
    client,
    getSession,
    isAdmin,
    listProducts,
    getProduct,
    saveProduct,
    deleteProduct,
    listCategories,
    saveCategory,
    deleteCategory,
    uploadProductImages,
    updateProductImage,
    deleteProductImage,
    setMainProductImage,
    getSettings,
    saveSettings,
    getStats
  };
})();
