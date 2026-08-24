-- Campo de motivo do cancelamento (usado desde a correção do fluxo de
-- cancelamento, mas nunca havia sido efetivamente criado na tabela)
ALTER TABLE solicitacoes_demo
ADD COLUMN IF NOT EXISTS motivo_cancelamento text;

-- Código único da solicitação (gerado automaticamente na criação, formato
-- SD-YYYYMMDD-XXXX), para facilitar identificação em emails, chat e histórico
ALTER TABLE solicitacoes_demo
ADD COLUMN IF NOT EXISTS codigo_solicitacao text;

-- Até 3 datas sugeridas para a apresentação (data_desejada já existente é a
-- primeira; estas são as 2ª e 3ª opções, opcionais)
ALTER TABLE solicitacoes_demo
ADD COLUMN IF NOT EXISTS data_desejada_2 text;

ALTER TABLE solicitacoes_demo
ADD COLUMN IF NOT EXISTS data_desejada_3 text;

-- Detalhe da solução atual quando "solucao_atual" = 'Outros'
ALTER TABLE solicitacoes_demo
ADD COLUMN IF NOT EXISTS solucao_atual_outros text;

COMMENT ON COLUMN solicitacoes_demo.motivo_cancelamento IS 'Motivo informado ao cancelar a solicitação (pelo solicitante ou pelo administrativo)';
COMMENT ON COLUMN solicitacoes_demo.codigo_solicitacao IS 'Código único gerado na criação da solicitação (formato SD-YYYYMMDD-XXXX)';
COMMENT ON COLUMN solicitacoes_demo.data_desejada_2 IS '2ª data sugerida para a apresentação (opcional)';
COMMENT ON COLUMN solicitacoes_demo.data_desejada_3 IS '3ª data sugerida para a apresentação (opcional)';
COMMENT ON COLUMN solicitacoes_demo.solucao_atual_outros IS 'Detalhe da solução atual informado quando solucao_atual = Outros';
