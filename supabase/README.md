# Supabase - BMAX Brasil

Execute os arquivos SQL no Supabase SQL Editor nesta ordem:

1. `migrations/001_initial_schema.sql`
2. `migrations/002_storage_policies.sql`
3. `migrations/003_realtime_publication.sql`
4. `migrations/004_customers.sql`
5. `seed.sql`

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

No servidor, configure `SUPABASE_SERVICE_ROLE_KEY` se quiser que a API grave os cadastros com uma chave privada. Se essa variavel nao existir, a API usa a anon key publica e a policy de insert anonimo criada na migracao.
