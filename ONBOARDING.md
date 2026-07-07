# Onboarding — Solicitação de Demonstrações MV

Bem-vindo! Este documento guia você na configuração da aplicação do zero até deployment em produção.

## 1. Pré-requisitos

- Node.js 18+ (verificar com `node -v`)
- npm ou yarn instalado
- Git configurado (`git config --global user.name` e `git config --global user.email`)
- Acesso a:
  - Supabase (banco de dados)
  - Google Cloud Console (OAuth)
  - Google Workspace (Gmail, Google Chat)
  - Vercel (deploy)

## 2. Setup Local

### 2.1 Clone e instale dependências

```bash
git clone https://github.com/hugoresende-collab/apresentacao-mv.git
cd apresentacao-mv
npm install
```

### 2.2 Configurar variáveis de ambiente

Copie `.env.local.example` para `.env.local`:

```bash
cp .env.local.example .env.local
```

**Abra `.env.local` e preencha:**

#### Supabase
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **Project Settings > API**
4. Copie:
   - `NEXT_PUBLIC_SUPABASE_URL` (URL pública)
   - `SUPABASE_SERVICE_ROLE_KEY` (secret key - guarde bem!)

#### Google OAuth
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Vá em **APIs & Services > Credentials**
3. Clique em **Create Credentials > OAuth 2.0 Client ID**
4. Configure OAuth Consent Screen se necessário (domínio `@mv.com.br`)
5. Copie:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

#### Session Secret
Gere uma chave aleatória:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Cole em `SESSION_SECRET`

#### Gmail e Google Chat
1. **Gmail:**
   - Ativar autenticação em 2 fatores na conta MV
   - Gerar senha de app: https://myaccount.google.com/apppasswords
   - Preencher `GMAIL_USER` e `GMAIL_APP_PASSWORD`
   - Listar admins em `ADMINISTRATIVO_EMAILS` (separados por vírgula)

2. **Google Chat:**
   - No espaço do Google Chat onde receber alertas
   - Clique em ⚙️ > **Gerenciar apps e integrações > Criar webhook**
   - Copie a URL para `GOOGLE_CHAT_WEBHOOK_URL`
   - Repita para `GOOGLE_CHAT_WEBHOOK_FILA_URL` (ou use o mesmo webhook)

#### URLs e Flags
- `NEXT_PUBLIC_BASE_URL`: `http://localhost:3000` (local) ou seu domínio em prod
- `APP_URL`: igual a `NEXT_PUBLIC_BASE_URL`
- `ENABLE_EMAIL`: `false` (local) ou `true` (prod)
- `ENABLE_CRON_VERIFICAR_FILA`: `false` (local) ou `true` (Vercel)

### 2.3 Executar localmente

```bash
npm run dev
```

Abra http://localhost:3000 e teste o login com sua conta `@mv.com.br`.

## 3. Banco de Dados (Supabase)

### 3.1 Rodas as migrações SQL

1. Acesse Supabase Dashboard > **SQL Editor**
2. Crie uma nova query
3. Copie o conteúdo de `supabase/schema.sql`
4. Execute (clique **▶ Run**)
5. Repita para cada arquivo em `supabase/migrations/`:
   - `001_gerente_conta_email.sql`
   - `002_endereco_apresentacao.sql`
   - `003_fix_status_constraint.sql`

### 3.2 Verificar tabelas

No SQL Editor, execute:
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

Você deve ver: `solicitacoes_demo`, `nps_demo`, `resultado_comercial`

## 4. Funcionalidades

### Login
- Google OAuth (domínio `@mv.com.br` apenas)
- Session via cookie HMAC-SHA256 (httpOnly, secure)
- Logout disponível no sidebar

### Solicitar Demonstração
- Novo formulário com 30+ campos
- Validação de tipo de apresentação (presencial/remota)
- Email automático ao gerente de conta + admin
- Notificação Google Chat ao admin
- Sucesso toast por 2.5s

### Minhas Solicitações
- Ver solicitações que criou
- Status em tempo real (poll a cada 3s)
- NPS modal flutuante (obrigatório) ao entrar com demo "realizada"

### Gestão (Admin)
- Ver todas as solicitações
- Filtrar por status
- Confirmar agendamento (status: solicitado → demo agendada)
- Marcar como realizada (status: demo agendada → realizada)
- Cancelar solicitação
- Modal de confirmação para cancelamento

### NPS
- Modal flutuante (não deixa pular!)
- 1-5 estrelas (obrigatório)
- Comentário (opcional)
- Tela de sucesso ao enviar
- Aparece automaticamente para demos "realizada" sem NPS

### Cron: Verificar Fila
- Roda a cada hora (configurável em `vercel.json`)
- Detecta solicitações com status "solicitado" há 24h+
- Envia alerta Google Chat com lista + tempo parado
- Desabilitado localmente (`ENABLE_CRON_VERIFICAR_FILA=false`)

## 5. Deploy em Vercel

### 5.1 Conectar repositório

1. Acesse [Vercel Dashboard](https://vercel.com/)
2. Clique **Add New > Project**
3. Selecione seu repositório GitHub
4. Vercel detecta Next.js automaticamente ✓

### 5.2 Configurar Environment Variables

1. No painel do projeto, vá em **Settings > Environment Variables**
2. Adicione todas as variáveis de `.env.local`:
   - `NEXT_PUBLIC_*` (esses aparecem no build)
   - `SUPABASE_SERVICE_ROLE_KEY` (privado)
   - `SESSION_SECRET` (privado)
   - `GOOGLE_CLIENT_SECRET` (privado)
   - `GMAIL_APP_PASSWORD` (privado)
   - etc.

**Importante:** Não cola `.env.local` completo — adiciona uma por uma na interface Vercel.

### 5.3 Ativar Cron Jobs

1. Em **Settings > Cron Jobs**
2. Vercel lê `vercel.json` automaticamente
3. O cron `/api/cron/verificar-fila` rodará a cada hora (0 * * * *)

### 5.4 Deploy

Qualquer push para `main` dispara deploy automático:

```bash
git add .
git commit -m "Setup de produção"
git push
```

Monitore em Vercel > **Deployments**

### 5.5 Testar Cron (Opcional)

Após deploy, você pode chamar o cron manualmente:

```bash
curl https://seu-dominio.vercel.app/api/cron/verificar-fila \
  -H "Authorization: Bearer $CRON_SECRET"
```

(O `CRON_SECRET` é fornecido automaticamente pelo Vercel)

## 6. Troubleshooting

### Erro: "Port 3000 is in use"
```bash
# Windows
taskkill /PID <pid> /F

# Mac/Linux
kill -9 <pid>
```

### Erro: "SUPABASE_SERVICE_ROLE_KEY is not defined"
Verifique se `.env.local` existe e tem a chave preenchida.

### Erro: "Google OAuth redirect_uri mismatch"
Certifique-se em Google Cloud Console que `NEXT_PUBLIC_BASE_URL` está nos **Authorized redirect URIs**.

### NPS não aparece
1. Confirme que a demo tem status "realizada"
2. Verifique no SQL Editor: `SELECT * FROM nps_demo WHERE solicitacao_id = 'seu-id'`
3. Se não tiver registro NPS, o modal deve aparecer

### Emails não enviam
Confirme:
- `ENABLE_EMAIL=true`
- `GMAIL_USER` e `GMAIL_APP_PASSWORD` preenchidos
- Conta Gmail tem 2FA + senha de app gerada
- `ADMINISTRATIVO_EMAILS` tem emails válidos

### Google Chat não notifica
Verifique:
- `GOOGLE_CHAT_WEBHOOK_URL` e `GOOGLE_CHAT_WEBHOOK_FILA_URL` estão corretos
- Webhook está ativo no Google Chat (não expirou)
- `ENABLE_EMAIL=true` (controla ambos)

## 7. Estrutura do Projeto

```
app/
  api/
    auth/               # Login/logout
    cron/
      verificar-fila/   # Cron job (Vercel)
    solicitacoes/       # CRUD de solicitações, NPS, status
  login/                # Página de login
  minhas-solicitacoes/  # View do usuário
  gestao/               # View do admin
  nps/                  # Página de NPS (legacy)
lib/
  db.ts                 # Supabase client (service role)
  repo.ts               # Queries ao banco
  session.ts            # Gerenciamento de session
  email.ts              # Nodemailer
  googlechat.ts         # Webhooks Google Chat
  oauth-state.ts        # CSRF state tokens
  security.ts           # Validação de domínio
  types.ts              # TypeScript interfaces
supabase/
  schema.sql            # Schema inicial
  migrations/           # Atualizações incrementais
components/             # React components
public/                 # Assets estáticos
vercel.json             # Config de crons
```

## 8. Checklist de Produção

- [ ] Todas as env vars configuradas em Vercel
- [ ] `NEXT_PUBLIC_BASE_URL` aponta para domínio correto
- [ ] `ENABLE_EMAIL=true` e `ENABLE_CRON_VERIFICAR_FILA=true`
- [ ] Google OAuth URIs de redirecionamento atualizados
- [ ] Webhooks Google Chat testados
- [ ] Supabase backups ativados
- [ ] CNAME/DNS apontam para Vercel
- [ ] SSL/HTTPS ativado (Vercel faz automaticamente)
- [ ] Teste de login end-to-end
- [ ] Teste de criação de solicitação
- [ ] Teste de email admin
- [ ] Teste de Google Chat

## 9. Contato & Dúvidas

Se algo não funciona:
1. Verifique logs em Vercel > **Deployments > Logs**
2. Cheque `.env.local` se rodando localmente
3. Abra DevTools (F12) e veja Console/Network
4. Leia o error message completo — geralmente explica o problema

---

**Boa sorte! 🚀**
