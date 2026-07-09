-- Criar tabela de apresentadores
CREATE TABLE IF NOT EXISTS apresentadores (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  google_calendar_id TEXT,
  google_calendar_token TEXT,
  google_calendar_refresh_token TEXT,
  autorizado_por TEXT,
  data_autorizacao TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_apresentadores_nome ON apresentadores(nome);
CREATE INDEX IF NOT EXISTS idx_apresentadores_email ON apresentadores(email);

-- Inserir apresentadores padrão
INSERT INTO apresentadores (id, nome, email, created_at, updated_at) VALUES
  ('1', 'Valmir', 'valmir@mv.com.br', now(), now()),
  ('2', 'Barbara Moutinho', 'barbara.moutinho@mv.com.br', now(), now()),
  ('3', 'Ana Mendonça', 'ana.mendonca@mv.com.br', now(), now()),
  ('4', 'Gabriel Arcanjo', 'gabriel.arcanjo@mv.com.br', now(), now()),
  ('5', 'produto teste', 'produto@mv.com.br', now(), now())
ON CONFLICT DO NOTHING;
