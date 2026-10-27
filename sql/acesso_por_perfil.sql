-- =====================================================================
-- Perfis de acesso — clínica e agência
-- Cole no Supabase > SQL Editor > New query > Run. Seguro rodar mais de uma vez.
--
-- O projeto passa a ter dois usuários:
--
--   blog@clinicarizzatti.com.br  -> clínica. Faz tudo: blog e funil.
--   agenciafemo@gmail.com        -> agência. Só o funil de pacientes.
--
-- Até agora qualquer usuário logado podia tudo, porque as políticas
-- liberavam o papel "authenticated" inteiro. Com um segundo login isso
-- deixa de servir: a agência entraria também no blog e no envio de
-- imagens, já que a sessão do Supabase é a mesma em todas as páginas.
--
-- A lista abaixo é de quem PODE. Usuário novo que apareça e não esteja
-- nela não mexe no blog, sem precisar lembrar de bloquear nada.
-- =====================================================================

create or replace function public.e_equipe_clinica()
returns boolean
language sql
stable
security invoker
as $$
    select lower(coalesce(auth.jwt() ->> 'email', '')) in (
        'blog@clinicarizzatti.com.br'
    );
$$;

comment on function public.e_equipe_clinica() is
    'Quem é da clínica. Para dar acesso ao blog a mais alguém, acrescente o e-mail à lista desta função.';

-- =====================================================================
-- BLOG — escrita e rascunhos passam a ser só da clínica
--
-- A leitura pública dos posts publicados continua como está: ela não
-- depende de login e é o que alimenta o site.
-- =====================================================================
drop policy if exists "Admin pode ler todos os posts" on public.blog_posts;
create policy "Admin pode ler todos os posts"
    on public.blog_posts
    for select
    to authenticated
    using (public.e_equipe_clinica());

drop policy if exists "Admin pode criar posts" on public.blog_posts;
create policy "Admin pode criar posts"
    on public.blog_posts
    for insert
    to authenticated
    with check (public.e_equipe_clinica());

drop policy if exists "Admin pode editar posts" on public.blog_posts;
create policy "Admin pode editar posts"
    on public.blog_posts
    for update
    to authenticated
    using (public.e_equipe_clinica())
    with check (public.e_equipe_clinica());

drop policy if exists "Admin pode apagar posts" on public.blog_posts;
create policy "Admin pode apagar posts"
    on public.blog_posts
    for delete
    to authenticated
    using (public.e_equipe_clinica());

-- =====================================================================
-- STORAGE — enviar, trocar e apagar imagem do blog também é só da clínica
-- Ver as imagens continua público: elas aparecem no site.
-- =====================================================================
drop policy if exists "Admin envia imagens do blog" on storage.objects;
create policy "Admin envia imagens do blog"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'blog' and public.e_equipe_clinica());

drop policy if exists "Admin troca imagens do blog" on storage.objects;
create policy "Admin troca imagens do blog"
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'blog' and public.e_equipe_clinica())
    with check (bucket_id = 'blog' and public.e_equipe_clinica());

drop policy if exists "Admin apaga imagens do blog" on storage.objects;
create policy "Admin apaga imagens do blog"
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'blog' and public.e_equipe_clinica());

-- =====================================================================
-- FUNIL — continua liberado para todo usuário autenticado, de propósito:
-- clínica e agência têm o mesmo acesso aos leads. As políticas de
-- crm_schema.sql não mudam.
--
-- Vale saber o que isso significa: o login da agência enxerga nome,
-- telefone, interesse clínico e observações das pacientes. Se um dia
-- quiser separar, dá para criar uma view só com os indicadores e deixar
-- a agência apenas nela.
-- =====================================================================

-- =====================================================================
-- ANTES DE RODAR: crie o usuário da agência
--
--   Supabase Dashboard > Authentication > Users > Add user
--   e-mail: agenciafemo@gmail.com
--   marque "Auto Confirm User"
--
-- Mantenha desmarcado "Allow new users to sign up" em
-- Authentication > Providers > Email, para que ninguém se cadastre
-- sozinho.
--
-- CONFERIR DEPOIS: entre em /crm.html com o login da agência e tente
-- abrir /admin.html. O painel do blog deve recusar a sessão e voltar
-- para a tela de senha.
-- =====================================================================
