-- =====================================================================
-- CRM: etapas com procedimento e valor da consulta
-- Cole no Supabase > SQL Editor > New query > Run. Seguro rodar mais de uma vez.
--
-- Para o banco que já tem o CRM. Um banco novo não precisa deste arquivo:
-- crm_schema.sql já traz tudo isto.
-- =====================================================================

alter table public.crm_leads add column if not exists procedimento text;
alter table public.crm_leads add column if not exists valor_consulta numeric(10,2);

-- O evento de "agendado" passa a carregar o valor da consulta.
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

-- Receita de consultas e orçamentos em aberto, separados da receita de
-- procedimentos fechados.
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
    avg(extract(epoch from (respondido_em - primeiro_contato_em)) / 60)
        filter (where respondido_em is not null)                                as resposta_min,
    coalesce(sum(valor_consulta), 0)                                            as receita_consultas,
    coalesce(sum(valor_estimado) filter (where status in ('orcamento', 'negociacao')), 0) as orcamentos_abertos
from base;
