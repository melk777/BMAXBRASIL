# BMAX Admin - Setup Supabase

## 1. Criar o projeto

1. Crie um projeto no Supabase.
2. Copie `Project URL` e `anon public key` em Project Settings > API.
3. Cole esses valores em:
   - `iphone17-landing/admin/js/config.js`
   - `iphone17-landing/index.html`, dentro de `window.BMAX_CONFIG`

Nunca coloque a `service_role key` em arquivos do navegador.

## 2. Criar banco e storage

No SQL Editor do Supabase, execute nesta ordem:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_storage_policies.sql`
3. `supabase/migrations/003_realtime_publication.sql`
4. `supabase/migrations/004_customers.sql`
5. `supabase/migrations/005_orders_payment_flow.sql`
6. `supabase/seed.sql`

## 3. Criar primeiro admin

1. Em Authentication > Users, crie o usuario admin com e-mail e senha.
2. Copie o `User UID`.
3. Execute no SQL Editor:

```sql
insert into public.admin_profiles (id, name, role, active)
values ('COLE-O-USER-UID-AQUI', 'Administrador', 'admin', true);
```

## 4. Acessar

Abra:

```txt
/iphone17-landing/admin/index.html
```

Depois do login, o admin consegue gerenciar:

- Produtos
- Categorias
- Fotos de produtos
- Imagem principal e ordem de fotos
- Estoque, preco, preco promocional, status e tags
- Dados de marca, contato, redes sociais e home

## 5. Atualizacao instantanea

O site publico usa Supabase Realtime para escutar mudancas em:

- `products`
- `product_images`
- `categories`
- `site_settings`

Quando um produto, preco, foto ou configuracao for salvo no Admin, a landing tenta atualizar o catalogo automaticamente sem editar codigo.

## 6. Checkout, pedidos e estoque

No servidor/deploy, configure:

```txt
MP_ACCESS_TOKEN=...
MP_SITE_URL=https://bmaxbrasiloficial.com.br
MP_NOTIFICATION_URL=https://bmaxbrasiloficial.com.br/api/webhook-mercadopago
SUPABASE_URL=https://oqveyejntxkltpfdydof.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

`SUPABASE_SERVICE_ROLE_KEY` deve existir somente no servidor. Nunca coloque essa chave em `index.html` nem em arquivos do painel.

Com a migration `005_orders_payment_flow.sql`, o checkout cria um pedido pendente em `orders`, envia o `external_reference` ao Mercado Pago e o webhook atualiza o pedido quando o pagamento mudar de status.

Quando o pagamento fica `approved`, o banco baixa automaticamente o estoque do produto uma unica vez.
