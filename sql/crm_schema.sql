-- =====================================================================
-- CRM / Funil de pacientes — schema Supabase
-- Execute este script inteiro em: Supabase Dashboard > SQL Editor > New query
-- Seguro rodar mais de uma vez.
--
-- Três tabelas, com uma separação importante entre elas:
--
--   crm_cliques  -> log anônimo de origem. O site grava aqui, sem nenhum
--                   dado pessoal. É a única tabela que o visitante pode
--                   escrever.
--   crm_leads    -> o cadastro do paciente. Só o painel (usuário logado)
--                   lê e escreve. Nunca exposta ao público.
--   crm_eventos  -> histórico de cada mudança de status. Serve de auditoria
--                   e de fila para o envio das conversões às plataformas.
-- =====================================================================

-- =====================================================================
-- 1. CLIQUES — origem capturada antes de o lead sair para o WhatsApp
--
-- O visitante clica no botão de WhatsApp, o site gera um código curto
-- (ref_code), grava a origem aqui e coloca o código na mensagem. Quando
-- a recepção cadastra o lead, digita esse código e a origem vem junto.
-- Sem dado pessoal: se esta tabela vazar, não há paciente identificável.
-- =====================================================================
create table if not exists public.crm_cliques (
    id uuid primary key default gen_random_uuid(),
    ref_code text not null unique,
    pagina text,
    gclid text,
    fbclid text,
    fbp text,                       -- cookie _fbp, melhora o match na Meta
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    utm_term text,
    created_at timestamptz not null default now()
);

create index if not exists crm_cliques_ref_code_idx on public.crm_cliques (ref_code);
create index if not exists crm_cliques_created_at_idx on public.crm_cliques (created_at desc);

-- =====================================================================
-- 2. LEADS — o funil, em duas fases
--
-- Fase de aquisição (o que o tráfego controla):
--   novo -> em_atendimento -> agendado -> confirmado -> compareceu
-- Fase clínica (o que a clínica controla):
--   compareceu -> orcamento -> negociacao -> fechado -> realizado
-- Saídas: faltou (não compareceu) e perdido (desistiu/sem resposta)
-- =====================================================================
create table if not exists public.crm_leads (
    id uuid primary key default gen_random_uuid(),

    -- Identificação
    nome text not null,
    telefone text not null,
    -- Só os dígitos, para buscar e achar duplicata sem depender da formatação.
    telefone_digitos text generated always as (regexp_replace(telefone, '\D', '', 'g')) stored,
    email text,

    -- Status no funil
    status text not null default 'novo' check (status in (
        'novo', 'em_atendimento', 'agendado', 'confirmado', 'compareceu',
        'orcamento', 'negociacao', 'fechado', 'realizado',
        'faltou', 'perdido'
    )),

    -- Canal: a resposta da paciente para "como você nos conheceu?". É a
    -- primeira pergunta do cadastro, no vocabulário da recepção, não no de
    -- tráfego. O ref_code preenche sozinho quando o lead veio pelo site.
    ref_code text references public.crm_cliques (ref_code) on delete set null,
    canal text not null default 'nao_informado' check (canal in (
        'instagram', 'facebook', 'google', 'site',
        'indicacao', 'retorno', 'outro', 'nao_informado'
    )),
    gclid text,
    fbclid text,
    fbp text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    utm_term text,

    -- Atendimento
    profissional text,
    -- Interesse clínico: fica AQUI, para a clínica se organizar, e nunca sai
    -- no envio às plataformas de anúncio. Dado de saúde é sensível na LGPD.
    interesse text,                 -- o que procura no primeiro contato
    procedimento text,              -- o que vai fazer, definido no orçamento
    observacoes text,

    -- Datas que alimentam os indicadores
    primeiro_contato_em timestamptz not null default now(),
    respondido_em timestamptz,      -- usada no tempo médio de resposta
    agendado_para timestamptz,
    compareceu_em timestamptz,
    fechado_em timestamptz,

    -- Dinheiro. A consulta é paga antes de a paciente comparecer, então
    -- valor_consulta preenchido já é receita. O procedimento não: enquanto
    -- não fecha, valor_estimado é orçamento em aberto, e só valor_fechado conta.
    valor_consulta numeric(10,2),   -- consulta paga no agendamento
    valor_estimado numeric(10,2),   -- orçamento apresentado do procedimento
    valor_fechado numeric(10,2),    -- o que a paciente efetivamente fechou

    motivo_perda text check (motivo_perda is null or motivo_perda in (
        'preco', 'sem_resposta', 'demora_atendimento', 'distancia',
        'so_pesquisando', 'escolheu_outra', 'fora_do_perfil', 'outro'
    )),

    -- Entra marcado como true: perguntar autorização a cada paciente no meio
    -- do atendimento não funciona na recepção. O controle é por exceção, quem
    -- pedir para ficar de fora é desmarcado no cadastro completo e some do
    -- envio às plataformas. A base legal fica no aviso de privacidade do site.
    consentimento_marketing boolean not null default true,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Colunas que chegaram depois da primeira versão. "add column if not exists"
-- deixa o script seguro tanto em banco novo quanto no que já tinha a tabela.
alter table public.crm_leads add column if not exists procedimento text;
alter table public.crm_leads add column if not exists valor_consulta numeric(10,2);

create index if not exists crm_leads_status_idx on public.crm_leads (status);
create index if not exists crm_leads_telefone_idx on public.crm_leads (telefone_digitos);
create index if not exists crm_leads_canal_idx on public.crm_leads (canal);
create index if not exists crm_leads_contato_idx on public.crm_leads (primeiro_contato_em desc);

-- =====================================================================
-- 3. EVENTOS — uma linha por mudança de status
--
-- Serve para duas coisas: o histórico do lead e a fila de conversões a
-- enviar para a Meta e para o Google. Cada etapa vira um evento próprio,
-- com o valor daquele momento, em vez de um único evento no fim do funil.
-- =====================================================================
create table if not exists public.crm_eventos (
    id uuid primary key default gen_random_uuid(),
    lead_id uuid not null references public.crm_leads (id) on delete cascade,
    de_status text,
    para_status text not null,
    valor numeric(10,2),
    created_at timestamptz not null default now(),
    enviado_meta_em timestamptz,
    enviado_google_em timestamptz,
    erro_envio text
);

create index if not exists crm_eventos_lead_idx on public.crm_eventos (lead_id, created_at desc);
create index if not exists crm_eventos_pendentes_idx
    on public.crm_eventos (created_at)
    where enviado_meta_em is null or enviado_google_em is null;

-- =====================================================================
-- Automações
-- =====================================================================

-- Preenche as datas do funil conforme o status muda, para a recepção não
-- ter que lembrar de datar nada à mão.
create or replace function public.crm_leads_before_write()
returns trigger
language plpgsql
security invoker
as $$
begin
    new.updated_at = now();

    -- Primeira saída de "novo" marca o momento da resposta.
    if new.respondido_em is null and new.status <> 'novo' then
        new.respondido_em = now();
    end if;

    if new.status = 'compareceu' and new.compareceu_em is null then
        new.compareceu_em = now();
    end if;

    if new.status in ('fechado', 'realizado') and new.fechado_em is null then
        new.fechado_em = now();
    end if;

    -- Saiu do funil de perda: o motivo deixa de fazer sentido.
    if new.status not in ('perdido', 'faltou') then
        new.motivo_perda = null;
    end if;

    return new;
end;
$$;

drop trigger if exists crm_leads_set_dates on public.crm_leads;
create trigger crm_leads_set_dates
    before insert or update on public.crm_leads
    for each row
    execute function public.crm_leads_before_write();

-- Registra o evento da mudança de status.
create or replace function public.crm_leads_log_evento()
returns trigger
language plpgsql
security invoker
as $$
declare
    v_valor numeric(10,2);
begin
    if tg_op = 'UPDATE' and new.status = old.status then
        return new;
    end if;

    v_valor = case
        when new.status in ('fechado', 'realizado') then coalesce(new.valor_fechado, new.valor_estimado)
        when new.status in ('orcamento', 'negociacao') then new.valor_estimado
        when new.status = 'agendado' then new.valor_consulta
        else null
    end;

    insert into public.crm_eventos (lead_id, de_status, para_status, valor)
    values (new.id, case when tg_op = 'UPDATE' then old.status else null end, new.status, v_valor);

    return new;
end;
$$;

drop trigger if exists crm_leads_log_evento on public.crm_leads;
create trigger crm_leads_log_evento
    after insert or update of status on public.crm_leads
    for each row
    execute function public.crm_leads_log_evento();

-- Copia a origem do clique para o lead quando a recepção informa o ref_code.
create or replace function public.crm_aplicar_ref_code()
returns trigger
language plpgsql
security invoker
as $$
declare
    c public.crm_cliques;
begin
    if new.ref_code is null then
        return new;
    end if;

    select * into c from public.crm_cliques where ref_code = new.ref_code;
    if not found then
        return new;
    end if;

    new.gclid = coalesce(new.gclid, c.gclid);
    new.fbclid = coalesce(new.fbclid, c.fbclid);
    new.fbp = coalesce(new.fbp, c.fbp);
    new.utm_source = coalesce(new.utm_source, c.utm_source);
    new.utm_medium = coalesce(new.utm_medium, c.utm_medium);
    new.utm_campaign = coalesce(new.utm_campaign, c.utm_campaign);
    new.utm_content = coalesce(new.utm_content, c.utm_content);
    new.utm_term = coalesce(new.utm_term, c.utm_term);

    -- A resposta da paciente manda. Só deduz o canal se a recepção não
    -- escolheu nenhum.
    if new.canal = 'nao_informado' then
        new.canal = case
            when c.utm_source ilike '%instagram%' then 'instagram'
            when c.gclid is not null then 'google'
            when c.fbclid is not null then 'facebook'
            when c.utm_source ilike '%facebook%' then 'facebook'
            when c.utm_source ilike '%google%' then 'google'
            else 'site'
        end;
    end if;

    return new;
end;
$$;

drop trigger if exists crm_leads_aplicar_ref on public.crm_leads;
create trigger crm_leads_aplicar_ref
    before insert or update of ref_code on public.crm_leads
    for each row
    execute function public.crm_aplicar_ref_code();

-- =====================================================================
-- Views de indicadores — o painel lê daqui em vez de calcular no navegador
-- =====================================================================

-- Conversão etapa por etapa, dos últimos 90 dias.
create or replace view public.crm_funil_resumo
with (security_invoker = true) as
with base as (
    select * from public.crm_leads where primeiro_contato_em >= now() - interval '90 days'
)
select
    count(*)                                                                    as leads,
    count(*) filter (where respondido_em is not null)                           as respondidos,
    count(*) filter (where status not in ('novo', 'em_atendimento', 'perdido')) as agendados,
    count(*) filter (where compareceu_em is not null)                           as compareceram,
    count(*) filter (where status = 'faltou')                                   as faltaram,
    count(*) filter (where status in ('orcamento', 'negociacao'))               as em_orcamento,
    count(*) filter (where status in ('fechado', 'realizado'))                  as fecharam,
    count(*) filter (where status = 'perdido')                                  as perdidos,
    coalesce(sum(valor_fechado) filter (where status in ('fechado', 'realizado')), 0) as receita,
    -- Tempo médio de resposta, em minutos.
    avg(extract(epoch from (respondido_em - primeiro_contato_em)) / 60)
        filter (where respondido_em is not null)                                as resposta_min,
    -- Consulta é paga no agendamento: valor preenchido já é dinheiro no caixa.
    coalesce(sum(valor_consulta), 0)                                            as receita_consultas,
    -- Orçamento ainda não é dinheiro. Fica separado para não inflar a receita.
    coalesce(sum(valor_estimado) filter (where status in ('orcamento', 'negociacao')), 0) as orcamentos_abertos
from base;

-- Mesmo recorte, quebrado por canal. É aqui que se vê se o tráfego pago
-- está trazendo paciente ou só curioso, sem a indicação mascarar o número.
create or replace view public.crm_por_canal
with (security_invoker = true) as
select
    canal,
    count(*)                                                                    as leads,
    count(*) filter (where compareceu_em is not null)                           as compareceram,
    count(*) filter (where status in ('fechado', 'realizado'))                  as fecharam,
    coalesce(sum(valor_fechado) filter (where status in ('fechado', 'realizado')), 0) as receita
from public.crm_leads
where primeiro_contato_em >= now() - interval '90 days'
group by canal
order by leads desc;

-- Fila de envio: as transições que valem como conversão e ainda não subiram.
create or replace view public.crm_eventos_pendentes
with (security_invoker = true) as
select
    e.id, e.lead_id, e.para_status, e.valor, e.created_at,
    e.enviado_meta_em, e.enviado_google_em,
    l.telefone_digitos, l.email, l.gclid, l.fbclid, l.fbp,
    -- Nome genérico de propósito: nunca o procedimento.
    case e.para_status
        when 'agendado'  then 'Schedule'
        when 'compareceu' then 'Lead'
        when 'fechado'   then 'Purchase'
        when 'realizado' then 'Purchase'
    end as evento_plataforma
from public.crm_eventos e
join public.crm_leads l on l.id = e.lead_id
where e.para_status in ('agendado', 'compareceu', 'fechado', 'realizado')
  and (e.enviado_meta_em is null or e.enviado_google_em is null)
  and l.consentimento_marketing = true
order by e.created_at;

-- =====================================================================
-- RLS
--
-- crm_cliques: o visitante pode INSERIR (é o log de origem do site), e
-- não pode ler nada. Ler é só do painel.
-- crm_leads e crm_eventos: nada para o público. Só usuário autenticado.
-- =====================================================================
alter table public.crm_cliques enable row level security;
alter table public.crm_leads enable row level security;
alter table public.crm_eventos enable row level security;

drop policy if exists "Site pode registrar clique" on public.crm_cliques;
create policy "Site pode registrar clique"
    on public.crm_cliques
    for insert
    to anon, authenticated
    with check (true);

drop policy if exists "Admin pode ler cliques" on public.crm_cliques;
create policy "Admin pode ler cliques"
    on public.crm_cliques
    for select
    to authenticated
    using (true);

drop policy if exists "Admin gerencia leads" on public.crm_leads;
create policy "Admin gerencia leads"
    on public.crm_leads
    for all
    to authenticated
    using (true)
    with check (true);

-- O histórico é gravado pelo gatilho de crm_leads, que roda com as
-- permissões de quem está logado. Sem esta política, todo cadastro falharia.
drop policy if exists "Admin registra eventos" on public.crm_eventos;
create policy "Admin registra eventos"
    on public.crm_eventos
    for insert
    to authenticated
    with check (true);

drop policy if exists "Admin le eventos" on public.crm_eventos;
create policy "Admin le eventos"
    on public.crm_eventos
    for select
    to authenticated
    using (true);

drop policy if exists "Admin atualiza eventos" on public.crm_eventos;
create policy "Admin atualiza eventos"
    on public.crm_eventos
    for update
    to authenticated
    using (true)
    with check (true);

-- =====================================================================
-- DEPOIS DE RODAR ESTE SCRIPT
--
-- 1. O painel fica em /crm.html e o login pede e-mail e senha, porque
--    tem mais de um usuário. Quem pode entrar em quê está definido em
--    sql/acesso_por_perfil.sql.
--
-- 2. Enquanto o site não estiver gravando em crm_cliques, o campo de
--    código de referência fica vazio e a recepção escolhe a origem na mão.
--    O funil e os indicadores funcionam igual.
--
-- 3. LGPD: "interesse" e "observacoes" são dados sensíveis de saúde e
--    existem só para a clínica. O envio às plataformas usa apenas
--    telefone e e-mail com hash, mais o valor, e o nome do evento é
--    sempre genérico (Schedule, Lead, Purchase). A view
--    crm_eventos_pendentes só entrega quem tem consentimento_marketing.
-- =====================================================================
