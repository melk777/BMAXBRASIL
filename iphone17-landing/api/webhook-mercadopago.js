const SUPABASE_URL = process.env.SUPABASE_URL && process.env.SUPABASE_URL.trim();
const SUPABASE_SERVICE_ROLE_KEY =
  (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim()) ||
  (process.env.SUPABASE_SECRET_KEY && process.env.SUPABASE_SECRET_KEY.trim());

function canUseSupabase() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

async function supabaseRequest(path, options = {}) {
  if (!canUseSupabase()) {
    throw new Error('Supabase service role nao configurada');
  }

  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.message || data?.hint || data?.details || `Supabase ${response.status}`);
  }
  return data;
}

function getPaymentId(req) {
  const body = req.body || {};
  return (
    body?.data?.id ||
    body?.id ||
    body?.resource?.split('/').pop() ||
    req.query?.['data.id'] ||
    req.query?.id ||
    null
  );
}

async function fetchMercadoPagoPayment(paymentId) {
  const token = process.env.MP_ACCESS_TOKEN && process.env.MP_ACCESS_TOKEN.trim();
  if (!token) throw new Error('MP_ACCESS_TOKEN ausente');

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Mercado Pago ${response.status}`);
  }
  return data;
}

function normalizeStatus(mpStatus) {
  const statusMap = {
    approved: 'approved',
    pending: 'pending',
    in_process: 'pending',
    rejected: 'rejected',
    cancelled: 'cancelled',
    refunded: 'refunded',
    charged_back: 'charged_back'
  };
  return statusMap[mpStatus] || mpStatus || 'unknown';
}

async function updateOrderFromPayment(payment) {
  const orderId = payment.external_reference || payment.metadata?.order_id;
  if (!orderId) {
    return { skipped: true, reason: 'payment without external_reference' };
  }

  const rows = await supabaseRequest('/rest/v1/rpc/complete_order_from_payment', {
    method: 'POST',
    body: JSON.stringify({
      p_order_id: orderId,
      p_payment_reference: String(payment.id),
      p_payment_status: normalizeStatus(payment.status),
      p_raw_payment: payment
    })
  });

  return { skipped: false, order: rows };
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo nao permitido' });
  }

  try {
    const paymentId = getPaymentId(req);
    if (!paymentId) {
      return res.status(200).json({ ok: true, ignored: true, reason: 'missing payment id' });
    }

    const payment = await fetchMercadoPagoPayment(paymentId);
    const result = await updateOrderFromPayment(payment);
    return res.status(200).json({ ok: true, paymentId, result });
  } catch (error) {
    console.error('mercadopago webhook:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || String(error)
    });
  }
}
