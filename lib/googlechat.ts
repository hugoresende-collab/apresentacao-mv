import type { SolicitacaoDemo } from "./types";

const CHAT_ENABLED = process.env.ENABLE_EMAIL === "true";
const WEBHOOK_URL = process.env.GOOGLE_CHAT_WEBHOOK_URL || "";
const WEBHOOK_FILA_URL = process.env.GOOGLE_CHAT_WEBHOOK_FILA_URL || "";

export async function notificarNovaSolicitacaoNoChat(
  solicitacao: SolicitacaoDemo
): Promise<{ sent: boolean; reason?: string }> {
  if (!CHAT_ENABLED) {
    console.log(`[google chat desligado] Nova solicitação: ${solicitacao.nome_instituicao}`);
    return { sent: false, reason: "ENABLE_EMAIL=false — mensagem não enviada (modo v1 local)" };
  }

  if (!WEBHOOK_URL) {
    console.log("[google chat] GOOGLE_CHAT_WEBHOOK_URL não configurado — mensagem não enviada");
    return { sent: false, reason: "GOOGLE_CHAT_WEBHOOK_URL não configurado" };
  }

  const datasSugeridas = [solicitacao.data_desejada, solicitacao.data_desejada_2, solicitacao.data_desejada_3]
    .filter(Boolean)
    .join(", ");

  const texto = [
    "*Nova solicitação de demonstração*",
    `*Código:* ${solicitacao.codigo_solicitacao || "-"}`,
    `*Gerente de conta:* ${solicitacao.gerente_conta_nome} (${solicitacao.gerente_conta_email})`,
    `*Instituição:* ${solicitacao.nome_instituicao} (${solicitacao.cidade})`,
    `*Produto:* ${solicitacao.produto_apresentar}`,
    `*Data(s) sugerida(s):* ${datasSugeridas}${solicitacao.periodo ? ` (${solicitacao.periodo})` : ""}`,
    `*Tipo:* ${solicitacao.tipo_apresentacao}`,
  ].join("\n");

  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ text: texto }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Webhook do Google Chat retornou status ${response.status}: ${detail}`);
  }

  return { sent: true };
}

export async function notificarFilaParadaNoChat(
  solicitacoes: SolicitacaoDemo[]
): Promise<{ sent: boolean; reason?: string }> {
  if (!CHAT_ENABLED) {
    console.log(`[google chat desligado] Fila parada: ${solicitacoes.length} solicitação(ões)`);
    return { sent: false, reason: "ENABLE_EMAIL=false — mensagem não enviada" };
  }

  if (!WEBHOOK_FILA_URL) {
    console.log("[google chat] GOOGLE_CHAT_WEBHOOK_FILA_URL não configurado — mensagem não enviada");
    return { sent: false, reason: "GOOGLE_CHAT_WEBHOOK_FILA_URL não configurado" };
  }

  const linhas = solicitacoes.map((s) => {
    const criadoEm = new Date(s.created_at);
    const agora = new Date();
    const horasPassadas = Math.floor((agora.getTime() - criadoEm.getTime()) / (1000 * 60 * 60));

    return `• ${s.nome_instituicao} (${s.cidade}) - ${horasPassadas}h atrás - ${s.gerente_conta_nome}`;
  });

  const texto = [
    "⚠️ *ALERTA: Fila de solicitações parada!*",
    `${solicitacoes.length} solicitação(ões) com mais de 24h sem alteração de status`,
    "",
    ...linhas,
    "",
    `Total: ${solicitacoes.length} | Verificação automática`,
  ].join("\n");

  const response = await fetch(WEBHOOK_FILA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ text: texto }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Webhook do Google Chat (fila) retornou status ${response.status}: ${detail}`);
  }

  return { sent: true };
}
