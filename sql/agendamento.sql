-- =====================================================================
-- Agendamento de posts — cole no Supabase > SQL Editor > New query > Run
--
-- Um post agendado é salvo como status 'published' com published_at no
-- futuro. Esta política faz o público só enxergar o post quando a data
-- e hora chegam. O admin (usuário autenticado) continua vendo tudo.
-- Seguro rodar mais de uma vez.
-- =====================================================================

drop policy if exists "Público pode ler posts publicados" on public.blog_posts;
create policy "Público pode ler posts publicados"
    on public.blog_posts
    for select
    to anon, authenticated
    using (status = 'published' and published_at is not null and published_at <= now());
