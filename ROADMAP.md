# Roadmap & Status — Solicitação de Demonstrações MV

## ✅ Fase 1: MVP (Concluído)

### Autenticação & Segurança
- [x] Google OAuth com domínio @mv.com.br
- [x] Session management (HMAC-SHA256, httpOnly cookies)
- [x] CSRF protection com state tokens
- [x] Route protection via middleware

### Solicitação de Demonstração
- [x] Formulário com 30+ campos
- [x] Validação de tipo de apresentação (remota/presencial)
- [x] Email automático ao gerente e admin
- [x] Google Chat webhook para notificações
- [x] Toast de sucesso flutuante

### Acompanhamento (Minhas Solicitações)
- [x] View do usuário com suas solicitações
- [x] Real-time polling (3s)
- [x] Filtro por status
- [x] NPS modal flutuante (obrigatório ao entrar)

### Gestão (Admin)
- [x] View de todas as solicitações
- [x] Filtro por status
- [x] Confirmar agendamento (solicitado → demo agendada)
- [x] Marcar como realizada (demo agendada → realizada)
- [x] Campo apresentador (3 opções configuráveis)
- [x] Cancelamento com modal de confirmação
- [x] Modal com blur background

### NPS
- [x] Modal flutuante (não deixa pular)
- [x] 1-5 estrelas (obrigatório)
- [x] Comentário (opcional)
- [x] Tela de sucesso ao enviar
- [x] Aparece automaticamente para demos "realizada" sem NPS

### Email & Notificações
- [x] Nodemailer + Gmail SMTP
- [x] Notificação ao solicitante
- [x] Notificação ao admin
- [x] Notificação ao confirmar agendamento
- [x] Email solicitando NPS
- [x] Google Chat webhook para novas solicitações

### Cron Jobs (Vercel)
- [x] Verificação de fila (solicitações paradas 24h+)
- [x] Alertas via Google Chat
- [x] Configuração automática em vercel.json
- [x] Pronto para produção

---

## ✅ Fase 2: Dashboard & Métricas (Concluído)

### API Robusta
- [x] Performance por gerente (solicitações, canceladas, taxa cancelamento)
- [x] Performance por regional (solicitações, canceladas, taxa cancelamento)
- [x] Performance por apresentador (demos, NPS médio, % com NPS)
- [x] Performance de solicitantes (total, realizadas, % aprovação)
- [x] Ticket médio (dias entre solicitação → realizada)
- [x] Taxa de ocupação de agenda (% de dias com demo nos últimos 90)

### Interface Visual
- [x] Sistema de abas (Resumo, Gerentes, Regionais, Apresentadores, Solicitantes)
- [x] Cards com métricas principais
- [x] Tabelas ordenadas (mais relevantes primeiro)
- [x] Indicadores visuais (cores para alertar)
- [x] Responsive design

### Branding
- [x] Cores MV integradas (verde #008C77, azul #214B63)
- [x] Logo no sidebar
- [x] Tipografia corporativa

---

## ✅ Fase 3: Setup para Novo Desenvolvedor (Concluído)

### Documentação
- [x] ONBOARDING.md (45+ instruções passo-a-passo)
- [x] DEPLOYMENT.md (instruções Vercel)
- [x] .env.local.example (template com todas as vars)
- [x] CLAUDE.md (instruções para o projeto)

### Segurança
- [x] .gitignore melhorado (garante secrets não sejam commitados)
- [x] Nenhuma credencial em repo público

### Migrações
- [x] schema.sql (schema completo)
- [x] 001_gerente_conta_email.sql
- [x] 002_endereco_apresentacao.sql
- [x] 003_fix_status_constraint.sql
- [x] 004_adicionar_apresentador.sql

---

## 📋 Funcionalidades por Página

### `/login`
- Google OAuth com branding MV
- Redirects automáticos após login

### `/` (Nova Solicitação)
- Formulário completo com 30+ campos
- Conditional rendering (tipo de apresentação)
- Validação client/server
- Email e chat notifications
- Toast de sucesso

### `/minhas-solicitacoes`
- Lista de solicitações do usuário
- Real-time polling (status atualiza a cada 3s)
- NPS modal flutuante ao entrar (se houver demo realizada sem NPS)
- Cancelamento com confirmação

### `/gestao`
- Lista de todas as solicitações
- Filtro por status
- Ações: confirmar agendamento, marcar como realizada, cancelar
- Campo apresentador (dropdown com 3 opções)
- Modal de confirmação para cancelamento

### `/dashboard`
- 5 abas com diferentes visualizações
- Métricas KPI em cards
- Tabelas com dados ordenados
- Indicadores visuais (cores por performance)

---

## 🔧 Configurações de Produção

### Supabase
```sql
-- Executar todos os .sql em supabase/migrations/ na ordem
-- Schema automático criado em supabase/schema.sql
-- RLS habilitado (mas não usado — server usa service_role)
```

### Vercel
```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=...
ENABLE_EMAIL=true
GMAIL_USER=...
GMAIL_APP_PASSWORD=...
ADMINISTRATIVO_EMAILS=...
GOOGLE_CHAT_WEBHOOK_URL=...
GOOGLE_CHAT_WEBHOOK_FILA_URL=...
ENABLE_CRON_VERIFICAR_FILA=true
```

### Google Cloud
- OAuth URIs atualizadas
- Consent screen configurado
- Gmail API habilitada

---

## 📊 Arquitetura Técnica

```
Next.js 16.2 (App Router, TypeScript strict)
├── Frontend (React 19.2)
│   ├── Client components (useEffect, useState)
│   ├── Server components (getSessionUser, async)
│   └── Styling (Tailwind CSS v4)
├── Backend (API Routes)
│   ├── Auth (Google OAuth, sessions)
│   ├── CRUD (solicitações, NPS, status)
│   ├── Cron (verificar-fila a cada hora)
│   └── Dashboard (agregações)
├── Database (Supabase PostgreSQL)
│   ├── solicitacoes_demo
│   ├── nps_demo
│   └── resultado_comercial
├── External Services
│   ├── Google OAuth (login)
│   ├── Gmail (emails)
│   └── Google Chat (webhooks)
└── Deployment (Vercel)
    ├── Serverless functions
    ├── Cron jobs
    └── Static hosting
```

---

## 🚀 Próximos Passos (Sugestões)

### Curto Prazo
- [ ] Dashboard filtro por data range
- [ ] Exportar relatórios (CSV, PDF)
- [ ] Integração com Salesforce/CRM
- [ ] Mobile app (React Native)

### Médio Prazo
- [ ] Agendamento automático de calendário
- [ ] Integração com Google Calendar
- [ ] Notificações push
- [ ] Dark mode

### Longo Prazo
- [ ] AI para priorizar solicitações (urgência)
- [ ] Machine Learning para prever conversão
- [ ] Integração com WhatsApp Business
- [ ] Multi-empresa (multi-tenant)

---

## 📞 Suporte

Veja **ONBOARDING.md** para troubleshooting completo.

Para dúvidas sobre deployment, veja **DEPLOYMENT.md**.
