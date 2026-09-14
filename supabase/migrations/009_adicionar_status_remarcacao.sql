-- Migration 009: Permitir o status 'remarcacao' na tabela solicitacoes_demo
-- e adicionar colunas para histórico e métricas de remarcações.
--
-- Execute este script no SQL Editor do Supabase (Project > SQL Editor > New query).

-- 1. Atualizar a constraint de status para incluir 'remarcacao'
ALTER TABLE solicitacoes_demo
DROP CONSTRAINT IF EXISTS solicitacoes_demo_status_check;

ALTER TABLE solicitacoes_demo
ADD CONSTRAINT solicitacoes_demo_status_check
CHECK (status IN ('solicitado', 'remarcacao', 'demo agendada', 'realizada', 'cancelada'));

-- 2. Colunas para rastreamento de remarcação no dashboard e relatórios
ALTER TABLE solicitacoes_demo
ADD COLUMN IF NOT EXISTS foi_remarcada boolean DEFAULT false;

ALTER TABLE solicitacoes_demo
ADD COLUMN IF NOT EXISTS total_remarcacoes integer DEFAULT 0;

COMMENT ON COLUMN solicitacoes_demo.foi_remarcada IS 'Indica se a solicitação já passou por ao menos uma remarcação';
COMMENT ON COLUMN solicitacoes_demo.total_remarcacoes IS 'Quantidade total de vezes que a solicitação foi remarcada';
