import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Método não permitido' });

  try {
    const preference = new Preference(client);
    const { produto, valor } = req.body; // Pega o nome e o preço enviados pelo botão

    const result = await preference.create({
      body: {
        items: [
          {
            title: produto,
            unit_price: Number(valor),
            quantity: 1,
            currency_id: 'BRL'
          }
        ],
        // Importante: Isso garante que o cliente volte ao seu site
        back_urls: {
          success: "https://seusite.vercel.app", 
          failure: "https://seusite.vercel.app",
          pending: "https://seusite.vercel.app"
        },
        auto_return: "approved",
      }
    });

    // Retorna o ID da preferência para o site abrir o checkout
    return res.status(200).json({ id: result.id });

  } catch (error) {
    console.error("Erro MP:", error);
    return res.status(500).json({ error: error.message });
  }
}
