ALTER TABLE solicitacoes_demo
  ADD COLUMN IF NOT EXISTS google_calendar_event_id text;

COMMENT ON COLUMN solicitacoes_demo.google_calendar_event_id IS 'ID do evento criado no Google Calendar, necessário para cancelar se remarcado';
