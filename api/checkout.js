import { MercadoPagoConfig, Preference } from 'mercadopago';

// 1. Inicializa o Mercado Pago com o seu Token de Acesso Privado
// Certifique-se de que o nome da variável na Vercel seja exatamente MP_ACCESS_TOKEN
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

export default async function handler(req, res) {
  // Segurança: Só permite requisições do tipo POST (que é o que o seu botão envia)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const preference = new Preference(client);
    const { produto, valor } = req.body;

    // 2. Cria a "Preferência" de compra no servidor do Mercado Pago
    const result = await preference.create({
      body: {
        items: [
          {
            title: produto, // Ex: "iPhone 17 Pro Max 256GB (Preto)"
            unit_price: Number(valor), // Ex: 9195.00
            quantity: 1,
            currency_id: 'BRL'
          }
        ],
        // 3. URLs de Retorno: Para onde o cliente vai após pagar
        // Substitua o link abaixo pelo link real do seu site na Vercel
        back_urls: {
          success: "https://landingpage-eight-eosin.vercel.app", 
          failure: "https://landingpage-eight-eosin.vercel.app/",
          pending: "https://landingpage-eight-eosin.vercel.app/"
        },
        auto_return: "approved",
        
        // 4. Configurações de Pagamento para o cliente de luxo
        payment_methods: {
          installments: 12, // Permite parcelamento em até 12x
          excluded_payment_types: [
            { id: "ticket" } // Opcional: Remove "Boleto" para focar em Pix e Cartão
          ]
        },
        // Notificação de segurança (Webhook) - opcional para o futuro
        notification_url: "https://seusite.vercel.app/api/webhooks",
      }
    });

    // 5. Responde ao seu site com o ID da Preferência gerado
    return res.status(200).json({ id: result.id });

  } catch (error) {
    console.error("Erro interno no Mercado Pago:", error);
    // Retorna o erro detalhado para ajudar no diagnóstico caso algo falhe
    return res.status(500).json({ 
      error: "Erro ao gerar preferência", 
      details: error.message 
    });
  }
}
