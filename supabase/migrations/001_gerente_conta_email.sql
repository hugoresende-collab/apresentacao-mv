-- Adiciona o email do gerente de conta (necessário para notificá-lo por email
-- quando a solicitação de demo é criada). Rode no SQL Editor do Supabase.

alter table solicitacoes_demo
  add column if not exists gerente_conta_email text;
