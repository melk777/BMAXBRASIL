import { randomUUID } from 'crypto';

const DEFAULT_PUBLIC_SITE_URL = 'https://bmaxbrasiloficial.com.br';
const DEFAULT_SUPABASE_URL = 'https://oqveyejntxkltpfdydof.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_QoEIfW1EYIu5Tqc7e6EHnw_TSnOfcF9';
const SUPABASE_SERVICE_ROLE_KEY =
  (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim()) ||
  (process.env.SUPABASE_SECRET_KEY && process.env.SUPABASE_SECRET_KEY.trim());

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function cleanText(value, max = 160) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

function supabaseUrl() {
  return (process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, '');
}

function publicSupabaseKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
}

function serviceHeaders(extra = {}) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return null;
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function supabaseServiceRequest(path, options = {}) {
  const headers = serviceHeaders(options.headers || {});
  if (!headers) return null;

  const response = await fetch(`${supabaseUrl()}${path}`, {
    ...options,
    headers
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(data?.message || data?.hint || data?.details || `Supabase ${response.status}`);
  }
  return data;
}

function validateCustomer(rawCustomer) {
  const customer = rawCustomer && typeof rawCustomer === 'object' ? rawCustomer : {};
  const fullName = cleanText(customer.nomeCompleto, 120);
  const email = cleanText(customer.email, 160).toLowerCase();
  const cpf = onlyDigits(customer.cpf);
  const phone = onlyDigits(customer.telefone);
  const cep = onlyDigits(customer.cep);
  const address = cleanText(customer.endereco, 180);
  const number = cleanText(customer.numero, 20);
  const complement = cleanText(customer.complemento, 80);
  const neighborhood = cleanText(customer.bairro, 100);
  const city = cleanText(customer.cidade, 100);
  const state = cleanText(customer.estado, 2).toUpperCase();
  const reference = cleanText(customer.pontoReferencia, 180);

  const errors = [];
  if (fullName.split(' ').filter(Boolean).length < 2) errors.push('nome completo');
  if (!/^\d{11}$/.test(cpf)) errors.push('CPF');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('e-mail');
  if (!/^\d{10,11}$/.test(phone)) errors.push('telefone');
  if (!/^\d{8}$/.test(cep)) errors.push('CEP');
  if (!address) errors.push('endereco');
  if (!number) errors.push('numero');
  if (!neighborhood) errors.push('bairro');
  if (!city) errors.push('cidade');
  if (!/^[A-Z]{2}$/.test(state)) errors.push('estado');
  if (!reference) errors.push('ponto de referencia');

  if (errors.length) {
    return {
      ok: false,
      message: `Complete os dados do cliente: ${errors.join(', ')}.`
    };
  }

  const [firstName, ...restName] = fullName.split(' ');
  return {
    ok: true,
    customer: {
      fullName,
      firstName,
      lastName: restName.join(' ') || firstName,
      email,
      cpf,
      phone,
      cep,
      address,
      number,
      complement,
      neighborhood,
      city,
      state,
      reference
    }
  };
}

async function getProduct(productId) {
  if (!productId) return null;
  const rows = await supabaseServiceRequest(
    `/rest/v1/products?id=eq.${encodeURIComponent(productId)}&select=id,name,price,promotional_price,stock,status,tags,metadata`
  );
  return rows?.[0] || null;
}

async function createPendingOrder({ product, productName, amount, color, quantity, customer }) {
  const rows = await supabaseServiceRequest('/rest/v1/orders?select=id', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      product_id: product?.id || null,
      customer_name: customer.fullName,
      customer_email: customer.email,
      customer_phone: customer.phone,
      amount,
      status: 'pending',
      payment_provider: 'mercado_pago',
      color: color || null,
      quantity,
      product_snapshot: {
        name: product?.name || productName,
        price: product?.price || amount,
        promotional_price: product?.promotional_price || null,
        tags: product?.tags || [],
        metadata: product?.metadata || {}
      },
      customer_snapshot: customer
    })
  });

  return rows?.[0] || null;
}

async function updatePendingOrder({ orderId, preferenceId, customerId, externalReference }) {
  if (!orderId) return;
  await supabaseServiceRequest(`/rest/v1/orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      customer_id: customerId || null,
      preference_id: preferenceId,
      external_reference: externalReference
    })
  });
}

async function saveCustomerRegistration({ customer, produto, preco, preferenceId, externalReference, orderId }) {
  const supabaseKey = publicSupabaseKey();
  if (!supabaseUrl() || !supabaseKey) {
    return { ok: false, skipped: true, reason: 'Supabase nao configurado' };
  }

  const row = {
    full_name: customer.fullName,
    cpf: customer.cpf,
    email: customer.email,
    phone: customer.phone,
    cep: customer.cep,
    address: customer.address,
    number: customer.number,
    complement: customer.complement,
    neighborhood: customer.neighborhood,
    city: customer.city,
    state: customer.state,
    reference_point: customer.reference,
    product_name: String(produto).slice(0, 256),
    product_amount: preco,
    payment_provider: 'mercado_pago',
    payment_preference_id: preferenceId,
    payment_status: 'checkout_created',
    source: 'checkout',
    metadata: {
      external_reference: externalReference,
      order_id: orderId || null,
      user_agent: customer.userAgent || null
    }
  };

  try {
    const response = await fetch(`${supabaseUrl()}/rest/v1/customers`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: JSON.stringify(row)
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      console.error('customer registration insert:', data || response.statusText);
      return { ok: false, status: response.status, details: data };
    }
    return { ok: true, customerId: Array.isArray(data) ? data[0]?.id : data?.id };
  } catch (error) {
    console.error('customer registration insert:', error);
    return { ok: false, details: error.message || String(error) };
  }
}

function resolveSite(req) {
  const forwarded = req.headers['x-forwarded-host'];
  const forwardedProto = req.headers['x-forwarded-proto'];
  const hostFirst = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';
  const fromRequest = hostFirst
    ? `${forwardedProto === 'http' ? 'http' : 'https'}://${hostFirst}`
    : '';

  return (
    (process.env.MP_SITE_URL && process.env.MP_SITE_URL.trim()) ||
    fromRequest ||
    DEFAULT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
  ).replace(/\/$/, '');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Metodo nao permitido' });

  const token = process.env.MP_ACCESS_TOKEN && String(process.env.MP_ACCESS_TOKEN).trim();
  if (!token) {
    return res.status(503).json({
      error: 'Pagamento nao configurado',
      message: 'Defina MP_ACCESS_TOKEN nas variaveis de ambiente do servidor.',
      details: 'MP_ACCESS_TOKEN ausente'
    });
  }

  const body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Corpo da requisicao invalido' });
  }

  const { produto, valor, cliente } = body;
  const productId = body.product_id || body.productId || null;
  const quantity = Math.max(Number(body.quantity || 1), 1);
  const color = cleanText(body.cor || body.color || '', 80);
  const product = await getProduct(productId);
  const productName = product?.name || produto;
  const preco = product
    ? Number(product.promotional_price || product.price)
    : Number(typeof valor === 'string' ? valor.replace(',', '.') : valor);

  if (product && product.status !== 'active') {
    return res.status(409).json({ error: 'Produto indisponivel' });
  }

  if (product && Number(product.stock || 0) < quantity) {
    return res.status(409).json({ error: 'Estoque insuficiente' });
  }

  if (!productName || Number.isNaN(preco) || preco <= 0) {
    return res.status(400).json({
      error: 'Dados invalidos',
      details: 'Informe produto e valor positivo.'
    });
  }

  const customerResult = validateCustomer(cliente);
  if (!customerResult.ok) {
    return res.status(400).json({
      error: 'Cadastro obrigatorio',
      details: customerResult.message
    });
  }
  const customer = customerResult.customer;
  customer.userAgent = req.headers['user-agent'] || null;

  const base = resolveSite(req);
  const pendingOrder = await createPendingOrder({
    product,
    productName,
    amount: preco,
    color,
    quantity,
    customer
  });
  const externalReference = pendingOrder?.id || randomUUID();
  const displayProduct = color ? `${productName} - Cor: ${color}` : productName;
  const notify =
    (process.env.MP_NOTIFICATION_URL && process.env.MP_NOTIFICATION_URL.trim()) ||
    `${base}/api/webhook-mercadopago`;

  const preferenceBody = {
    items: [
      {
        title: String(displayProduct).slice(0, 256),
        unit_price: preco,
        quantity,
        currency_id: 'BRL'
      }
    ],
    payer: {
      name: customer.firstName,
      surname: customer.lastName,
      email: customer.email,
      phone: {
        area_code: customer.phone.slice(0, 2),
        number: customer.phone.slice(2)
      },
      identification: {
        type: 'CPF',
        number: customer.cpf
      },
      address: {
        zip_code: customer.cep,
        street_name: customer.address,
        street_number: customer.number
      }
    },
    metadata: {
      cliente_nome_completo: customer.fullName,
      cliente_cpf: customer.cpf,
      cliente_email: customer.email,
      cliente_telefone: customer.phone,
      entrega_cep: customer.cep,
      entrega_endereco: customer.address,
      entrega_numero: customer.number,
      entrega_complemento: customer.complement,
      entrega_bairro: customer.neighborhood,
      entrega_cidade: customer.city,
      entrega_estado: customer.state,
      entrega_ponto_referencia: customer.reference,
      produto: String(displayProduct).slice(0, 256),
      product_id: product?.id || productId || null,
      order_id: pendingOrder?.id || null,
      color: color || null
    },
    external_reference: externalReference,
    back_urls: {
      success: `${base}/?status=aprovado`,
      failure: `${base}/?status=rejeitado`,
      pending: `${base}/?status=pendente`
    },
    auto_return: 'approved',
    notification_url: notify,
    payment_methods: {
      installments: 12
    }
  };

  try {
    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': randomUUID()
      },
      body: JSON.stringify(preferenceBody)
    });

    const data = await mpRes.json().catch(() => ({}));
    if (!mpRes.ok) {
      const msg =
        data.message ||
        data.error ||
        (Array.isArray(data.cause) && data.cause.map((cause) => cause.description || cause.code).join('; ')) ||
        mpRes.statusText;
      return res.status(502).json({
        error: 'Mercado Pago recusou a preferencia',
        details: msg,
        status: mpRes.status
      });
    }

    if (!data.id) {
      return res.status(502).json({
        error: 'Resposta inesperada do Mercado Pago',
        details: 'A API nao retornou id da preferencia.',
        raw: data
      });
    }

    const customerRegistration = await saveCustomerRegistration({
      customer,
      produto: displayProduct,
      preco,
      preferenceId: data.id,
      externalReference,
      orderId: pendingOrder?.id || null
    });

    if (!customerRegistration.ok) {
      return res.status(502).json({
        error: 'Cadastro nao salvo no painel',
        message: 'Nao foi possivel registrar os dados do cliente no painel administrativo. Confira as migrations do Supabase.',
        details: customerRegistration.details || customerRegistration.reason || 'Falha ao gravar cliente no Supabase.'
      });
    }

    await updatePendingOrder({
      orderId: pendingOrder?.id,
      preferenceId: data.id,
      customerId: customerRegistration.customerId || null,
      externalReference
    });

    return res.status(200).json({
      id: data.id,
      order_id: pendingOrder?.id || null,
      customer_registered: true,
      customer_id: customerRegistration.customerId || null
    });
  } catch (err) {
    console.error('checkout preferences:', err);
    return res.status(500).json({
      error: 'Falha ao contatar Mercado Pago',
      details: err.message || String(err)
    });
  }
}
