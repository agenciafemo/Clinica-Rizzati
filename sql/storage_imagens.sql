-- =====================================================================
-- Envio de imagens pelo painel do blog
-- Cole no Supabase > SQL Editor > New query > Run. Seguro rodar mais de uma vez.
--
-- Cria o espaço "blog" no Storage: qualquer visitante pode VER as imagens
-- (elas aparecem no site), mas só o usuário do painel pode enviar, trocar
-- ou apagar arquivos.
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog', 'blog', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Imagens do blog são públicas" on storage.objects;
create policy "Imagens do blog são públicas"
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'blog');

drop policy if exists "Admin envia imagens do blog" on storage.objects;
create policy "Admin envia imagens do blog"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'blog');

drop policy if exists "Admin troca imagens do blog" on storage.objects;
create policy "Admin troca imagens do blog"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'blog')
    with check (bucket_id = 'blog');

drop policy if exists "Admin apaga imagens do blog" on storage.objects;
create policy "Admin apaga imagens do blog"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'blog');
