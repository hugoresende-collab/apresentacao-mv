ALTER TABLE solicitacoes_demo
  ADD COLUMN IF NOT EXISTS gerente_conta_avatar_url text;

COMMENT ON COLUMN solicitacoes_demo.gerente_conta_avatar_url IS 'URL da foto de perfil do Google do solicitante, capturada no momento da criação da solicitação';
