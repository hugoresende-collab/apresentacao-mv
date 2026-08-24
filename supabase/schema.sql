-- Schema do sistema de solicitação de demonstrações.
-- Rode este arquivo no SQL Editor do Supabase (Project > SQL Editor > New query).

create extension if not exists "pgcrypto";

create table if not exists solicitacoes_demo (
  id uuid primary key default gen_random_uuid(),
  gerente_conta_nome text not null,
  gerente_conta_email text,
  unidade_regional text not null,
  nome_instituicao text not null,
  natureza_instituicao text not null,
  porte_instituicao text not null,
  cidade text not null,
  tipo_unidade text not null,
  solucao_atual text,
  solucao_atual_outros text,
  tipo_oportunidade text not null,
  tipo_projeto text,
  produto_apresentar text not null,
  observacao_apresentacao text,
  nome_patrocinador text,
  email_patrocinador text,
  codigo_oportunidade text,
  codigo_solicitacao text,
  numero_visitas text,
  valor_aproximado_projeto numeric,
  percentual_evolucao_crm text,
  atende_sus boolean not null default false,
  atende_convenio_particular boolean not null default false,
  possui_pronto_socorro boolean not null default false,
  possui_ambulatorio boolean not null default false,
  dor_prospect text,
  problemas_atendimento_paciente text,
  problemas_area_assistencial text,
  problemas_suprimentos text,
  problemas_faturamento text,
  problemas_financeiro_contabil text,
  problemas_diagnostico_terapia text,
  tipo_apresentacao text not null,
  data_desejada text not null,
  data_desejada_2 text,
  data_desejada_3 text,
  periodo text,
  horario_inicio_desejado text,
  horario_fim_desejado text,
  observacoes text,
  status text not null default 'solicitado' check (status in ('solicitado', 'demo agendada', 'realizada', 'cancelada')),
  data_hora_agendada text,
  data_hora_agendada_fim text,
  agendado_por text,
  link_ou_local text,
  apresentador text,
  data_hora_realizada timestamptz,
  motivo_cancelamento text,
  endereco_apresentacao text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists nps_demo (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null unique references solicitacoes_demo(id) on delete cascade,
  nota integer not null check (nota >= 0 and nota <= 10),
  comentario text,
  respondido_em timestamptz not null default now()
);

create table if not exists resultado_comercial (
  id uuid primary key default gen_random_uuid(),
  solicitacao_id uuid not null unique references solicitacoes_demo(id) on delete cascade,
  proposta_gerada boolean not null default false,
  proposta_fechada boolean not null default false,
  valor_proposta numeric,
  contrato_cancelado boolean not null default false,
  atualizado_por text,
  data_atualizacao timestamptz not null default now()
);

-- RLS habilitado, mas sem policies: o app acessa exclusivamente via
-- SUPABASE_SERVICE_ROLE_KEY no servidor (API routes), que ignora RLS.
alter table solicitacoes_demo enable row level security;
alter table nps_demo enable row level security;
alter table resultado_comercial enable row level security;
