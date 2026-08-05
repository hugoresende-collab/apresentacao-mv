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
  // Gerar link do Google Meet
  const googleMeetLink = `https://meet.google.com/${solicitacao.id.substring(0, 21)}`;

  const emailContent = `
    <h2>Demonstração Agendada!</h2>
    <p>Sua solicitação de demonstração foi agendada com sucesso.</p>

    <h3>Detalhes:</h3>
    <ul>
      <li><b>Instituição:</b> ${solicitacao.nome_instituicao}</li>
      <li><b>Produto:</b> ${solicitacao.produto_apresentar}</li>
      <li><b>Data/Hora:</b> ${solicitacao.data_hora_agendada ? new Date(solicitacao.data_hora_agendada).toLocaleString("pt-BR") : "a definir"}</li>
      <li><b>Apresentador:</b> ${solicitacao.apresentador || "a definir"}</li>
      <li><b>Local/Link:</b> ${solicitacao.link_ou_local || googleMeetLink}</li>
    </ul>

    ${!solicitacao.link_ou_local ? `
    <h3>Google Meet:</h3>
    <p><a href="${googleMeetLink}" style="background-color: #1f9e78; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
      Entrar na Videochamada
    </a></p>
    <p>Link: ${googleMeetLink}</p>
    ` : ""}

    <p>Agradecemos sua confiança!</p>
  `;

  // Enviar para o solicitante
  const resultSolicitante = sendEmail({
    to: solicitacao.gerente_conta_email,
    subject: `Demo agendada: ${solicitacao.nome_instituicao}`,
    html: emailContent,
  });

  // Enviar também para o apresentador
  if (solicitacao.apresentador) {
    import("./apresentadores-config").then(async (mod) => {
      const apresentadorEmail = mod.getApresentadorEmail(solicitacao.apresentador!);

      if (apresentadorEmail) {
        await sendEmail({
          to: apresentadorEmail,
          subject: `Demonstração agendada: ${solicitacao.nome_instituicao}`,
          html: `
            <h2>Nova Demonstração Agendada para Você</h2>
            <p>Uma nova demonstração foi agendada com sua participação.</p>

            <h3>Detalhes:</h3>
            <ul>
              <li><b>Instituição:</b> ${solicitacao.nome_instituicao}</li>
              <li><b>Gerente de Conta:</b> ${solicitacao.gerente_conta_nome} (${solicitacao.gerente_conta_email})</li>
              <li><b>Produto:</b> ${solicitacao.produto_apresentar}</li>
              <li><b>Data/Hora:</b> ${solicitacao.data_hora_agendada ? new Date(solicitacao.data_hora_agendada).toLocaleString("pt-BR") : "a definir"}</li>
              <li><b>Tipo:</b> ${solicitacao.tipo_apresentacao}</li>
              <li><b>Local/Link:</b> ${solicitacao.link_ou_local || googleMeetLink}</li>
            </ul>

            ${!solicitacao.link_ou_local ? `
            <h3>Google Meet:</h3>
            <p><a href="${googleMeetLink}" style="background-color: #1f9e78; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Entrar na Videochamada
            </a></p>
            ` : ""}

            <p>Preparado para a demonstração?</p>
          `,
        });
      }
    });
  }

  return resultSolicitante;
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
