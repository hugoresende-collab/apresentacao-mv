-- Adicionar campo apresentador à tabela solicitacoes_demo
ALTER TABLE solicitacoes_demo
ADD COLUMN apresentador text;

-- Adicionar campo data_hora_realizada para trackear quando a demo foi realizada
ALTER TABLE solicitacoes_demo
ADD COLUMN data_hora_realizada timestamptz;

-- Comentário explicativo
COMMENT ON COLUMN solicitacoes_demo.apresentador IS 'Nome do apresentador/demonstrador (preenchido na gestão quando marca como realizada)';
COMMENT ON COLUMN solicitacoes_demo.data_hora_realizada IS 'Data/hora exata quando a demo foi marcada como realizada (para cálculos de performance)';
