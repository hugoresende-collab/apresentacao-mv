ALTER TABLE solicitacoes_demo
  ADD COLUMN IF NOT EXISTS data_hora_agendada_fim text;

COMMENT ON COLUMN solicitacoes_demo.data_hora_agendada_fim IS 'Horário de término do agendamento confirmado pelo admin, permite duração diferente de 60 minutos (ex: 2h, 3h, dia inteiro)';
