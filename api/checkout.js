import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send();

  try {
    const preference = new Preference(client);
    const body = req.body;

    const result = await preference.create({
      body: {
        items: [
          {
            title: body.produto,
            unit_price: Number(body.valor),
            quantity: 1,
            currency_id: 'BRL'
          }
        ],
        // Opcional: Para onde o cliente vai depois de pagar
        back_urls: {
          success: "https://seusite.vercel.app/sucesso",
          failure: "https://seusite.vercel.app/erro",
          pending: "https://seusite.vercel.app/pendente"
        },
        auto_return: "approved",
      }
    });

    res.status(200).json({ id: result.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
