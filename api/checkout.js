/**
 * Mercado Pago — Preferência (Checkout Pro) → { id }
 * Variáveis: MP_ACCESS_TOKEN (obrigatório)
 * MP_SITE_URL (opcional; senão usa host do request ou URL pública abaixo)
 */

import { randomUUID } from 'crypto';

/** Fallback das back_urls do MP quando o host do request não veio nos headers */
const DEFAULT_PUBLIC_SITE_URL = 'https://bmaxbrasiloficial.com.br';

function onlyDigits(value) {
  return String(value || '').replace(/\D/g, '');
}

function cleanText(value, max = 160) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
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
  if (!address) errors.push('endereço');
  if (!number) errors.push('número');
  if (!neighborhood) errors.push('bairro');
  if (!city) errors.push('cidade');
  if (!/^[A-Z]{2}$/.test(state)) errors.push('estado');
  if (!reference) errors.push('ponto de referência');

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const token = process.env.MP_ACCESS_TOKEN && String(process.env.MP_ACCESS_TOKEN).trim();
  if (!token) {
    return res.status(503).json({
      error: 'Pagamento não configurado',
      message:
        'Defina MP_ACCESS_TOKEN nas variáveis de ambiente do servidor (Mercado Pago → Credenciais).',
      details: 'MP_ACCESS_TOKEN ausente'
    });
  }

  let body = req.body;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Corpo da requisição inválido' });
  }

  const { produto, valor, cliente } = body;
  const preco = Number(typeof valor === 'string' ? valor.replace(',', '.') : valor);
  if (!produto || Number.isNaN(preco) || preco <= 0) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: 'Informe produto (texto) e valor (número positivo).'
    });
  }

  const customerResult = validateCustomer(cliente);
  if (!customerResult.ok) {
    return res.status(400).json({
      error: 'Cadastro obrigatório',
      details: customerResult.message
    });
  }
  const customer = customerResult.customer;

  const forwarded = req.headers['x-forwarded-host'];
  const forwardedProto = req.headers['x-forwarded-proto'];
  const hostFirst =
    typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';
  const fromRequest = hostFirst
    ? `${forwardedProto === 'http' ? 'http' : 'https'}://${hostFirst}`
    : '';

  /* MP_SITE_URL → host real da requisição (domínio customizado) → domínio oficial.
     Nunca priorizar VERCEL_URL aqui: na Vercel ele é sempre *.vercel.app e o MP
     redireciona “voltar à loja” para o deploy em vez do site. */
  const site =
    (process.env.MP_SITE_URL && process.env.MP_SITE_URL.trim()) ||
    fromRequest ||
    DEFAULT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  const base = site.replace(/\/$/, '');
  const preferenceBody = {
    items: [
      {
        title: String(produto).slice(0, 256),
        unit_price: preco,
        quantity: 1,
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
      produto: String(produto).slice(0, 256)
    },
    external_reference: randomUUID(),
    back_urls: {
      success: `${base}/?status=aprovado`,
      failure: `${base}/?status=rejeitado`,
      pending: `${base}/?status=pendente`
    },
    auto_return: 'approved',
    payment_methods: {
      installments: 12
    }
  };

  const notify = process.env.MP_NOTIFICATION_URL && process.env.MP_NOTIFICATION_URL.trim();
  if (notify) {
    preferenceBody.notification_url = notify;
  }

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
        (Array.isArray(data.cause) && data.cause.map((c) => c.description || c.code).join('; ')) ||
        mpRes.statusText;
      return res.status(502).json({
        error: 'Mercado Pago recusou a preferência',
        details: msg,
        status: mpRes.status
      });
    }

    if (!data.id) {
      return res.status(502).json({
        error: 'Resposta inesperada do Mercado Pago',
        details: 'A API não retornou id da preferência.',
        raw: data
      });
    }

    return res.status(200).json({ id: data.id });
  } catch (err) {
    console.error('checkout preferences:', err);
    return res.status(500).json({
      error: 'Falha ao contatar Mercado Pago',
      details: err.message || String(err)
    });
  }
}
