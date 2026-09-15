-- =====================================================================
-- Blog da Clínica Rizzati — schema Supabase
-- Execute este script inteiro em: Supabase Dashboard > SQL Editor > New query
-- =====================================================================

create table if not exists public.blog_posts (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    title text not null,
    excerpt text,
    meta_description text,
    body_html text not null,
    category text,
    author text,
    cover_image_url text,
    read_time_minutes integer default 5,
    status text not null default 'draft' check (status in ('draft', 'published')),
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Campos de SEO e de respostas para IA. "add column if not exists" torna o script
-- seguro tanto em projeto novo quanto em projeto que já tinha a tabela.
alter table public.blog_posts add column if not exists seo_title text;
alter table public.blog_posts add column if not exists focus_keyword text;
alter table public.blog_posts add column if not exists keywords text;
alter table public.blog_posts add column if not exists summary text;
alter table public.blog_posts add column if not exists faq jsonb not null default '[]'::jsonb;
alter table public.blog_posts add column if not exists reviewed_by text;
alter table public.blog_posts add column if not exists cover_image_alt text;

do $$
begin
    if not exists (select 1 from pg_constraint where conname = 'blog_posts_faq_is_array') then
        alter table public.blog_posts
            add constraint blog_posts_faq_is_array check (jsonb_typeof(faq) = 'array');
    end if;
end;
$$;

create index if not exists blog_posts_status_published_at_idx
    on public.blog_posts (status, published_at desc);

create index if not exists blog_posts_slug_idx
    on public.blog_posts (slug);

-- Mantém updated_at sempre atualizado
create or replace function public.set_blog_posts_updated_at()
returns trigger
language plpgsql
security invoker
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists blog_posts_set_updated_at on public.blog_posts;
create trigger blog_posts_set_updated_at
    before update on public.blog_posts
    for each row
    execute function public.set_blog_posts_updated_at();

-- =====================================================================
-- RLS: qualquer visitante (anon) só pode LER posts publicados.
-- Somente um usuário autenticado (o admin da clínica) pode criar,
-- editar, apagar ou ver rascunhos.
-- =====================================================================
alter table public.blog_posts enable row level security;

drop policy if exists "Público pode ler posts publicados" on public.blog_posts;
-- Post agendado = status 'published' com published_at no futuro: só fica visível quando a data chega.
create policy "Público pode ler posts publicados"
    on public.blog_posts
    for select
    to anon, authenticated
    using (status = 'published' and published_at is not null and published_at <= now());

drop policy if exists "Admin pode ler todos os posts" on public.blog_posts;
create policy "Admin pode ler todos os posts"
    on public.blog_posts
    for select
    to authenticated
    using (true);

drop policy if exists "Admin pode criar posts" on public.blog_posts;
create policy "Admin pode criar posts"
    on public.blog_posts
    for insert
    to authenticated
    with check (true);

drop policy if exists "Admin pode editar posts" on public.blog_posts;
create policy "Admin pode editar posts"
    on public.blog_posts
    for update
    to authenticated
    using (true)
    with check (true);

drop policy if exists "Admin pode apagar posts" on public.blog_posts;
create policy "Admin pode apagar posts"
    on public.blog_posts
    for delete
    to authenticated
    using (true);

-- =====================================================================
-- IMPORTANTE: depois de rodar este script, crie o usuário admin em
-- Authentication > Users > Add user:
--   e-mail: blog@clinicarizzatti.com.br  (o mesmo de ADMIN_EMAIL em blog-config.mjs)
--   senha: forte, com 16+ caracteres — o painel pede só a senha
--   marque "Auto Confirm User"
-- NÃO deixe o cadastro público (Sign Up) habilitado — em
-- Authentication > Providers > Email, desmarque "Allow new users to
-- sign up" para que só esse usuário consiga entrar em admin.html.
--
-- Depois: projeto NOVO -> rode sql/seed_posts.sql
--         projeto RESTAURADO (já tinha posts) -> rode sql/blog_seo_backfill.sql
-- =====================================================================
