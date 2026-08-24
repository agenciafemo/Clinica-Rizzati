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
create policy "Público pode ler posts publicados"
    on public.blog_posts
    for select
    to anon, authenticated
    using (status = 'published');

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
-- Authentication > Users > Add user (email + senha), com "Auto Confirm
-- User" marcado. NÃO deixe o cadastro público (Sign Up) habilitado —
-- em Authentication > Providers > Email, desmarque "Allow new users
-- to sign up" para que só esse usuário criado manualmente consiga
-- entrar em admin.html.
-- =====================================================================
