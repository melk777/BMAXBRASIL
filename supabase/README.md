# Supabase - BMAX Brasil

Execute os arquivos SQL no Supabase SQL Editor nesta ordem:

1. `migrations/001_initial_schema.sql`
2. `migrations/002_storage_policies.sql`
3. `migrations/003_realtime_publication.sql`
4. `migrations/004_customers.sql`
5. `migrations/005_orders_payment_flow.sql`
6. `seed.sql`

A migracao `004_customers.sql` cria a tabela `customers`, usada para salvar os dados preenchidos antes do checkout:

- nome completo
- CPF
- e-mail
- telefone
- endereco completo com CEP
- ponto de referencia
- produto escolhido
- valor
- preferencia do Mercado Pago
- status do atendimento/pagamento

Depois de executar a migracao, acesse `iphone17-landing/admin/index.html` e entre no painel. A nova aba **Clientes** mostra cada cadastro recebido pelo checkout.

No servidor, configure `SUPABASE_SERVICE_ROLE_KEY` para que a API grave pedidos, relacione clientes ao checkout e baixe estoque pelo webhook do Mercado Pago.

A migracao `005_orders_payment_flow.sql` estende `orders` e cria a funcao `complete_order_from_payment`, usada por `/api/webhook-mercadopago` quando o pagamento muda de status.
