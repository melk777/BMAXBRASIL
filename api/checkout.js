import { MercadoPagoConfig, Preference } from 'mercadopago';

// Esta é a "ponte" segura que criamos na Vercel (Environment Variables)
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

export default async function handler(req, res) {
  // Garante que só aceitamos pedidos de compra (POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    // Recebe o nome do iPhone e o valor (R$ 5.717, R$ 11.770, etc.) que o botão enviou
    const bodyData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const preference = new Preference(client);

    // Cria a ordem de pagamento no Mercado Pago
    const response = await preference.create({
      body: {
        items: [
          {
            id: 'reserva-iphone-17',
            title: bodyData.produto || 'iPhone BMAX BRASIL', // Nome dinâmico (ex: Pro Max 256GB)
            quantity: 1,
            unit_price: Number(bodyData.valor), // Valor parcelado que configuramos no botão
            currency_id: 'BRL'
          }
        ],
        // Configuração para aprovação imediata (D+0)
        binary_mode: true, 
        back_urls: {
          success: 'https://landingpage-eight-eosin.vercel.app/',
          failure: 'https://landingpage-eight-eosin.vercel.app/',
          pending: 'https://landingpage-eight-eosin.vercel.app/'
        },
        auto_return: 'approved',
      }
    });

    // Devolve o ID da reserva para o seu site abrir o checkout
    res.status(200).json({ id: response.id });

  } catch (error) {
    console.error("Erro no Mercado Pago:", error);
    res.status(500).json({ error: "Erro ao gerar pagamento" });
  }
}
