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
4. `supabase/seed.sql`

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
