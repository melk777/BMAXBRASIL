import { MercadoPagoConfig, Payment } from 'mercadopago';

// Configuração com o seu Token de Acesso (MP_ACCESS_TOKEN) salvo na Vercel
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

export default async function handler(req, res) {
  // Só aceita requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  try {
    const payment = new Payment(client);
    const body = req.body;

    // Dados que o seu checkout-pagamento.html enviou
    const paymentData = {
      body: {
        transaction_amount: Number(body.transactionAmount),
        token: body.token, // Token do cartão gerado pelo SDK
        description: body.description,
        installments: Number(body.installments),
        payment_method_id: body.paymentMethodId,
        issuer_id: body.issuerId,
        payer: {
          email: body.payer.email,
          identification: {
            type: body.payer.identification.type,
            number: body.payer.identification.number
          }
        }
      }
    };

    const response = await payment.create(paymentData);

    // Retorna o status do pagamento para o cliente
    res.status(200).json({
      status: response.status,
      status_detail: response.status_detail,
      id: response.id
    });

  } catch (error) {
    console.error("Erro no processamento:", error);
    res.status(500).json({ 
      error: "Erro ao processar pagamento",
      details: error.message 
    });
  }
}
