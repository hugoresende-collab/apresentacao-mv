import type { SolicitacaoDemo } from "./types";

const EMAIL_ENABLED = process.env.ENABLE_EMAIL === "true";
const ADMINISTRATIVO_EMAILS = (process.env.ADMINISTRATIVO_EMAILS || "administrativo@mv.com.br").split(",").map(e => e.trim());
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

function resumoSolicitacaoHtml(solicitacao: SolicitacaoDemo): string {
  return `
    <ul>
      <li><b>Gerente de conta:</b> ${solicitacao.gerente_conta_nome} (${solicitacao.gerente_conta_email})</li>
      <li><b>Instituição:</b> ${solicitacao.nome_instituicao} (${solicitacao.cidade})</li>
      <li><b>Produto:</b> ${solicitacao.produto_apresentar}</li>
      <li><b>Data desejada:</b> ${solicitacao.data_desejada} (${solicitacao.periodo || "sem período definido"})</li>
      <li><b>Tipo:</b> ${solicitacao.tipo_apresentacao}</li>
    </ul>
  `;
}

export async function notificarNovaSolicitacaoAoSolicitante(solicitacao: SolicitacaoDemo) {
  return sendEmail({
    to: solicitacao.gerente_conta_email,
    subject: `Recebemos sua solicitação de demo: ${solicitacao.nome_instituicao}`,
    html: `
      <p>Olá, ${solicitacao.gerente_conta_nome}! Recebemos sua solicitação de demonstração e o time administrativo vai agendar em breve.</p>
      ${resumoSolicitacaoHtml(solicitacao)}
    `,
  });
}

export async function notificarNovaSolicitacaoAoAdministrativo(solicitacao: SolicitacaoDemo) {
  const promises = ADMINISTRATIVO_EMAILS.map(email =>
    sendEmail({
      to: email,
      subject: `Nova solicitação de demo: ${solicitacao.nome_instituicao}`,
      html: `
        <p>Nova solicitação de demonstração recebida.</p>
        ${resumoSolicitacaoHtml(solicitacao)}
        <p><a href="${APP_URL}/agendar">Agendar esta demonstração</a></p>
      `,
    })
  );
  const results = await Promise.all(promises);
  return { sent: results.every(r => r.sent) };
}

export async function notificarAgendamentoConfirmado(solicitacao: SolicitacaoDemo) {
  return sendEmail({
    to: solicitacao.gerente_conta_email,
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
    to: solicitacao.gerente_conta_email,
    subject: `Como foi a demonstração? ${solicitacao.nome_instituicao}`,
    html: `
      <p>Olá, ${solicitacao.gerente_conta_nome}!</p>
      <p>A demonstração para <b>${solicitacao.nome_instituicao}</b> foi realizada com sucesso.</p>
      <p>Gostaríamos de saber como foi sua experiência:</p>
      <ul>
        <li>A demonstração atendeu a todos os requisitos?</li>
        <li>Todas as necessidades da instituição foram cobertas?</li>
        <li>Qual foi seu feedback geral sobre a apresentação?</li>
      </ul>
      <p><a href="${APP_URL}/nps/${solicitacao.id}">Avaliar agora</a></p>
      <p>Sua avaliação nos ajuda a melhorar continuamente o atendimento.</p>
    `,
  });
}

export function emailStatus() {
  return { enabled: EMAIL_ENABLED };
}
