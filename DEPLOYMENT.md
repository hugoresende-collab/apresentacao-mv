# Deployment em Vercel

Guia passo-a-passo para publicar a aplicação em produção.

## Pré-requisitos

- Acesso ao repositório GitHub
- Conta Vercel (podem usar github.com/login com GitHub account)
- Acesso a todas as credenciais (Supabase, Google, Gmail, Google Chat)

## Passo 1: Conectar Repositório ao Vercel

1. Abra https://vercel.com/dashboard
2. Clique **Add New** > **Project**
3. Selecione seu repositório GitHub
4. Vercel detecta Next.js ✓
5. Clique **Deploy** (ainda sem env vars)

> Esse primeiro deploy falhará porque env vars não estão definidas. É normal!

## Passo 2: Configurar Environment Variables

1. No painel do projeto, vá em **Settings** > **Environment Variables**
2. Cole CADA variável de `.env.local.example`:

### Supabase (Público)
```
NEXT_PUBLIC_SUPABASE_URL = https://seu-projeto.supabase.co
```

### Supabase (Privado)
```
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5c...
```

### Google OAuth
```
GOOGLE_CLIENT_ID = xxx-xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = GOCSPX-xxx
ALLOWED_LOGIN_DOMAINS = mv.com.br
```

### Session
```
SESSION_SECRET = (gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NEXT_PUBLIC_BASE_URL = https://seu-dominio.vercel.app
APP_URL = https://seu-dominio.vercel.app
```

### Email
```
ENABLE_EMAIL = true
GMAIL_USER = seu-email@mv.com.br
GMAIL_APP_PASSWORD = sua-senha-de-app
ADMINISTRATIVO_EMAILS = admin1@mv.com.br,admin2@mv.com.br
```

### Google Chat
```
GOOGLE_CHAT_WEBHOOK_URL = https://chat.googleapis.com/v1/spaces/...
GOOGLE_CHAT_WEBHOOK_FILA_URL = https://chat.googleapis.com/v1/spaces/...
```

### Cron
```
ENABLE_CRON_VERIFICAR_FILA = true
```

## Passo 3: Configurar Google OAuth em Produção

**No Google Cloud Console:**

1. Vá em **APIs & Services** > **Credentials**
2. Clique em seu OAuth 2.0 Client ID
3. Em **Authorized JavaScript origins**, adicione:
   ```
   https://seu-dominio.vercel.app
   ```
4. Em **Authorized redirect URIs**, adicione:
   ```
   https://seu-dominio.vercel.app/api/google/callback
   ```
5. Clique **Save**

## Passo 4: Redeploy

1. Após preencher todas as env vars, vá em **Deployments**
2. Clique nos **...** do último deploy (falhado)
3. Selecione **Redeploy**
4. Aguarde build completar (~2-3 min)

Se build falhar, veja os logs clicando na linha do deploy.

## Passo 5: Configurar Domínio Customizado (Opcional)

Se quiser `apresentacao.mv.com` em vez de `xxx.vercel.app`:

1. Em **Project Settings** > **Domains**
2. Clique **Add** > escreva seu domínio
3. Vercel gera registros DNS (CNAME)
4. Adicione os registros no seu provedor DNS
5. Aguarde propagação (~5-30 min)

## Passo 6: Ativar Cron Jobs

Vercel lê `vercel.json` automaticamente:

```json
{
  "crons": [
    {
      "path": "/api/cron/verificar-fila",
      "schedule": "0 * * * *"
    }
  ]
}
```

Isso já está configurado. O cron rodará a cada hora (00, 01, 02, ... 23).

### Testar Cron Manualmente

Após deploy, você pode invocar o cron para testar:

```bash
curl https://seu-dominio.vercel.app/api/cron/verificar-fila \
  -H "Authorization: Bearer $(echo $CRON_SECRET)"
```

> O `CRON_SECRET` é gerado automaticamente por Vercel. Você o vê em Vercel > Settings > Environment Variables (como `CRON_SECRET`).

## Passo 7: Verificar Logs

Para debug em produção:

1. Vá em **Deployments** > clique no último deploy
2. Abra **Logs**
3. Procure por erros ou mensagens relevantes

Para logs do cron especificamente:

1. Vá em **Deployments**
2. Aba **Logs** > **Cron**

## Troubleshooting

### Build falha com "NEXT_PUBLIC_SUPABASE_URL is not defined"
- Confirme que a env var está em **Production** (não apenas Preview)
- Aguarde cache ser limpo (pode levar alguns minutos)
- Tente redeploy

### OAuth redirect_uri_mismatch
- Verifique se `NEXT_PUBLIC_BASE_URL` é exatamente o domínio onde está hospedado
- Confirme Google Cloud Console tem a URL nos redirect URIs

### Emails não enviam
- Confirme `ENABLE_EMAIL=true` em Vercel
- Teste localmente com `.env.local` para isolar o problema

### Google Chat webhook retorna 403
- Verifique se a URL do webhook ainda é válida (webhooks expiram)
- Regenere no Google Chat se necessário

## Deploy Automático

Qualquer push para `main` (ou branch configurada) dispara deploy automático:

```bash
git add .
git commit -m "Seu commit"
git push
```

Aguarde notificação de Vercel (pode ser via GitHub status checks ou email).

## Rollback

Se um deploy quebrar produção:

1. Em **Deployments**, veja a lista histórica
2. Clique no deploy anterior que funcionava
3. Clique **...** > **Redeploy**

Isso volta para a versão anterior em segundos.

---

**Pronto! Você está em produção! 🚀**
