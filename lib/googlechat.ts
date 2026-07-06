import type { SolicitacaoDemo } from "./types";

const CHAT_ENABLED = process.env.ENABLE_EMAIL === "true";
const WEBHOOK_URL = process.env.GOOGLE_CHAT_WEBHOOK_URL || "";

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

  const texto = [
    "*Nova solicitação de demonstração*",
    `*Gerente de conta:* ${solicitacao.gerente_conta_nome} (${solicitacao.gerente_conta_email})`,
    `*Instituição:* ${solicitacao.nome_instituicao} (${solicitacao.cidade})`,
    `*Produto:* ${solicitacao.produto_apresentar}`,
    `*Data desejada:* ${solicitacao.data_desejada}${solicitacao.periodo ? ` (${solicitacao.periodo})` : ""}`,
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
