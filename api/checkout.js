/**
 * Mercado Pago — Preferência (Checkout Pro) → { id }
 * Variáveis: MP_ACCESS_TOKEN (obrigatório)
 * MP_SITE_URL (opcional; senão usa host do request ou URL pública abaixo)
 */

import { randomUUID } from 'crypto';

/** Domínio oficial da BMAX (fallback quando MP_SITE_URL / VERCEL_URL não estão definidos) */
const DEFAULT_PUBLIC_SITE_URL = 'https://bmaxbrasiloficial.com.br';

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

  const { produto, valor } = body;
  const preco = Number(typeof valor === 'string' ? valor.replace(',', '.') : valor);
  if (!produto || Number.isNaN(preco) || preco <= 0) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: 'Informe produto (texto) e valor (número positivo).'
    });
  }

  const forwarded = req.headers['x-forwarded-host'];
  const forwardedProto = req.headers['x-forwarded-proto'];
  const fromRequest =
    typeof forwarded === 'string'
      ? `${forwardedProto === 'http' ? 'http' : 'https'}://${forwarded}`
      : '';

  const site =
    (process.env.MP_SITE_URL && process.env.MP_SITE_URL.trim()) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    fromRequest ||
    DEFAULT_PUBLIC_SITE_URL;

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
