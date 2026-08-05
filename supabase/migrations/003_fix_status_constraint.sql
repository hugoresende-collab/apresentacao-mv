-- First, update existing rows with old status values to new values
UPDATE solicitacoes_demo SET status = 'demo agendada' WHERE status = 'agendado';
UPDATE solicitacoes_demo SET status = 'realizada' WHERE status = 'realizado';
UPDATE solicitacoes_demo SET status = 'cancelada' WHERE status = 'cancelado';

-- Drop the old check constraint
ALTER TABLE solicitacoes_demo
DROP CONSTRAINT solicitacoes_demo_status_check;

-- Add the new check constraint with updated status values
ALTER TABLE solicitacoes_demo
ADD CONSTRAINT solicitacoes_demo_status_check
CHECK (status IN ('solicitado', 'demo agendada', 'realizada', 'cancelada'));
