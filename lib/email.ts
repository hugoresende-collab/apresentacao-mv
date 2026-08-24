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

function datasSugeridasTexto(solicitacao: SolicitacaoDemo): string {
  const datas = [solicitacao.data_desejada, solicitacao.data_desejada_2, solicitacao.data_desejada_3].filter(Boolean);
  return datas.join(", ");
}

function formatarMoedaBrl(valor: number | null): string {
  if (valor === null || valor === undefined) return "-";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function solucaoAtualTexto(solicitacao: SolicitacaoDemo): string {
  if (!solicitacao.solucao_atual) return "-";
  if (solicitacao.solucao_atual === "Outros") {
    return `Outros (${solicitacao.solucao_atual_outros || "não especificado"})`;
  }
  return solicitacao.solucao_atual;
}

function perfilServicosTexto(solicitacao: SolicitacaoDemo): string {
  const perfis = [
    solicitacao.atende_sus ? "Atende SUS" : null,
    solicitacao.atende_convenio_particular ? "Atende convênio/particular" : null,
    solicitacao.possui_pronto_socorro ? "Possui pronto socorro" : null,
    solicitacao.possui_ambulatorio ? "Possui ambulatório" : null,
  ].filter(Boolean);
  return perfis.length > 0 ? perfis.join(", ") : "-";
}

function qualificacaoHtml(solicitacao: SolicitacaoDemo): string {
  const todosCampos: Array<[string, string | null]> = [
    ["Dor do prospect", solicitacao.dor_prospect],
    ["Problemas em atendimento ao paciente", solicitacao.problemas_atendimento_paciente],
    ["Problemas na área clínica/assistencial", solicitacao.problemas_area_assistencial],
    ["Problemas em suprimentos", solicitacao.problemas_suprimentos],
    ["Problemas em faturamento", solicitacao.problemas_faturamento],
    ["Problemas financeiro/contábil", solicitacao.problemas_financeiro_contabil],
    ["Problemas em diagnóstico/terapia", solicitacao.problemas_diagnostico_terapia],
  ];
  const campos = todosCampos.filter(([, valor]) => valor && valor.trim());

  if (campos.length === 0) return "";

  return `
    <h3>Dores e qualificação</h3>
    <ul>
      ${campos.map(([label, valor]) => `<li><b>${label}:</b> ${valor}</li>`).join("")}
    </ul>
  `;
}

function resumoSolicitacaoHtml(solicitacao: SolicitacaoDemo): string {
  return `
    <h3>Solicitação</h3>
    <ul>
      <li><b>Código da solicitação:</b> ${solicitacao.codigo_solicitacao || "-"}</li>
      <li><b>Gerente de conta:</b> ${solicitacao.gerente_conta_nome} (${solicitacao.gerente_conta_email})</li>
      <li><b>Unidade regional:</b> ${solicitacao.unidade_regional}</li>
    </ul>

    <h3>Instituição / prospect</h3>
    <ul>
      <li><b>Instituição:</b> ${solicitacao.nome_instituicao} (${solicitacao.cidade})</li>
      <li><b>Natureza:</b> ${solicitacao.natureza_instituicao}</li>
      <li><b>Porte:</b> ${solicitacao.porte_instituicao}</li>
      <li><b>Tipo de unidade:</b> ${solicitacao.tipo_unidade}</li>
      <li><b>Perfil de serviços:</b> ${perfilServicosTexto(solicitacao)}</li>
      <li><b>Solução atual:</b> ${solucaoAtualTexto(solicitacao)}</li>
    </ul>

    <h3>Oportunidade</h3>
    <ul>
      <li><b>Tipo de oportunidade:</b> ${solicitacao.tipo_oportunidade}</li>
      <li><b>Tipo de projeto:</b> ${solicitacao.tipo_projeto || "-"}</li>
      <li><b>Código da oportunidade:</b> ${solicitacao.codigo_oportunidade || "-"}</li>
      <li><b>Número de visitas já realizadas:</b> ${solicitacao.numero_visitas || "-"}</li>
      <li><b>Valor aproximado do projeto:</b> ${formatarMoedaBrl(solicitacao.valor_aproximado_projeto)}</li>
      <li><b>% de evolução no CRM:</b> ${solicitacao.percentual_evolucao_crm || "-"}</li>
      <li><b>Patrocinador (sponsor):</b> ${solicitacao.nome_patrocinador || "-"} ${solicitacao.email_patrocinador ? `(${solicitacao.email_patrocinador})` : ""}</li>
    </ul>

    ${qualificacaoHtml(solicitacao)}

    <h3>Apresentação</h3>
    <ul>
      <li><b>Produto a apresentar:</b> ${solicitacao.produto_apresentar}</li>
      <li><b>Observação da apresentação:</b> ${solicitacao.observacao_apresentacao || "-"}</li>
      <li><b>Tipo de apresentação:</b> ${solicitacao.tipo_apresentacao}</li>
      ${solicitacao.endereco_apresentacao ? `<li><b>Endereço:</b> ${solicitacao.endereco_apresentacao}</li>` : ""}
      <li><b>Data(s) sugerida(s):</b> ${datasSugeridasTexto(solicitacao)} (${solicitacao.periodo || "sem período definido"})</li>
      <li><b>Horário desejado:</b> ${solicitacao.horario_inicio_desejado || "-"} a ${solicitacao.horario_fim_desejado || "-"}</li>
      <li><b>Observações:</b> ${solicitacao.observacoes || "-"}</li>
    </ul>
  `;
}

export async function notificarNovaSolicitacaoAoSolicitante(solicitacao: SolicitacaoDemo) {
  return sendEmail({
    to: solicitacao.gerente_conta_email,
    subject: `Recebemos sua solicitação de demo: ${solicitacao.nome_instituicao} [${solicitacao.codigo_solicitacao || "s/ código"}]`,
    html: `
      <p>Olá, ${solicitacao.gerente_conta_nome}! Recebemos sua solicitação de demonstração e o time da hospitalar vai analisar e agendar em breve.</p>
      ${resumoSolicitacaoHtml(solicitacao)}
    `,
  });
}

export async function notificarNovaSolicitacaoAoAdministrativo(solicitacao: SolicitacaoDemo) {
  const promises = ADMINISTRATIVO_EMAILS.map(email =>
    sendEmail({
      to: email,
      subject: `Nova solicitação de demo: ${solicitacao.nome_instituicao} [${solicitacao.codigo_solicitacao || "s/ código"}]`,
      html: `
        <p>Nova solicitação de demonstração recebida.</p>
        ${resumoSolicitacaoHtml(solicitacao)}
        <p><a href="${APP_URL}/gestao">Agendar esta demonstração</a></p>
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
      <li><b>Código da solicitação:</b> ${solicitacao.codigo_solicitacao || "-"}</li>
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
    subject: `Demo agendada: ${solicitacao.nome_instituicao} [${solicitacao.codigo_solicitacao || "s/ código"}]`,
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
              <li><b>Código da solicitação:</b> ${solicitacao.codigo_solicitacao || "-"}</li>
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
    subject: `Como foi a demonstração? ${solicitacao.nome_instituicao} [${solicitacao.codigo_solicitacao || "s/ código"}]`,
    html: `
      <p>Olá, ${solicitacao.gerente_conta_nome}!</p>
      <p>A demonstração para <b>${solicitacao.nome_instituicao}</b> (código ${solicitacao.codigo_solicitacao || "-"}) foi realizada com sucesso.</p>
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
