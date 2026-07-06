import type { SolicitacaoDemo } from "./types";

const EMAIL_ENABLED = process.env.ENABLE_EMAIL === "true";
const BARBARA_EMAIL = process.env.BARBARA_EMAIL || "barbara@mv.com.br";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(payload: EmailPayload): Promise<{ sent: boolean; reason?: string }> {
  if (!EMAIL_ENABLED) {
    console.log(`[email desligado] Para: ${payload.to} | Assunto: ${payload.subject}`);
    return { sent: false, reason: "ENABLE_EMAIL=false — email não enviado (modo v1 local)" };
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  });

  return { sent: true };
}

export async function notificarNovaSolicitacao(solicitacao: SolicitacaoDemo) {
  return sendEmail({
    to: BARBARA_EMAIL,
    subject: `Nova solicitação de demo: ${solicitacao.nome_instituicao}`,
    html: `
      <p>Nova solicitação de demonstração recebida.</p>
      <ul>
        <li><b>Gerente de conta:</b> ${solicitacao.gerente_conta_nome}</li>
        <li><b>Instituição:</b> ${solicitacao.nome_instituicao} (${solicitacao.cidade})</li>
        <li><b>Produto:</b> ${solicitacao.produto_apresentar}</li>
        <li><b>Data desejada:</b> ${solicitacao.data_desejada} (${solicitacao.periodo || "sem período definido"})</li>
        <li><b>Tipo:</b> ${solicitacao.tipo_apresentacao}</li>
      </ul>
      <p><a href="${APP_URL}/agendar">Agendar esta demonstração</a></p>
    `,
  });
}

export async function notificarAgendamentoConfirmado(solicitacao: SolicitacaoDemo) {
  return sendEmail({
    to: solicitacao.email_patrocinador || BARBARA_EMAIL,
    subject: `Demo agendada: ${solicitacao.nome_instituicao}`,
    html: `
      <p>Sua solicitação de demonstração foi agendada.</p>
      <ul>
        <li><b>Instituição:</b> ${solicitacao.nome_instituicao}</li>
        <li><b>Data/hora:</b> ${solicitacao.data_hora_agendada}</li>
        <li><b>Local/link:</b> ${solicitacao.link_ou_local || "a definir"}</li>
      </ul>
    `,
  });
}

export async function solicitarNps(solicitacao: SolicitacaoDemo) {
  return sendEmail({
    to: solicitacao.email_patrocinador || BARBARA_EMAIL,
    subject: `Como foi a demonstração? ${solicitacao.nome_instituicao}`,
    html: `
      <p>A demonstração para ${solicitacao.nome_instituicao} foi realizada. Conte pra gente como foi:</p>
      <p><a href="${APP_URL}/nps/${solicitacao.id}">Responder pesquisa de satisfação</a></p>
    `,
  });
}

export function emailStatus() {
  return { enabled: EMAIL_ENABLED };
}
