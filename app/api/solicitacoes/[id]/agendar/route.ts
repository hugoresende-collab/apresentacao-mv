import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { agendarSolicitacao, buscarSolicitacao } from "@/lib/repo";
import { notificarAgendamentoConfirmado } from "@/lib/email";
import { createCalendarEvent } from "@/lib/google-calendar";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/types";
import type { SolicitacaoDemo } from "@/lib/types";

const DURACAO_EVENTO_MINUTOS = 60;

// Monta início/fim como horário local "puro" (sem conversão de fuso),
// pois o Google Calendar já recebe o timeZone "America/Sao_Paulo" separadamente.
// Usar `new Date(...).toISOString()` aqui faria o servidor (que roda em UTC)
// interpretar o horário errado e deslocar o evento em -3h.
function calcularInicioFim(
  dataHoraAgendada: string,
  duracaoMinutos: number
): { start: string; end: string } {
  const [dataParte, horaParte] = dataHoraAgendada.split("T");
  const [ano, mes, dia] = dataParte.split("-").map(Number);
  const [hora, minuto] = horaParte.split(":").map(Number);

  const totalMinutosFim = hora * 60 + minuto + duracaoMinutos;
  const diasAdicionais = Math.floor(totalMinutosFim / (24 * 60));
  const minutosFimNoDia = ((totalMinutosFim % (24 * 60)) + 24 * 60) % (24 * 60);
  const horaFim = Math.floor(minutosFimNoDia / 60);
  const minutoFim = minutosFimNoDia % 60;

  const dataFimUtc = new Date(Date.UTC(ano, mes - 1, dia + diasAdicionais));
  const dataFimStr = `${dataFimUtc.getUTCFullYear()}-${String(dataFimUtc.getUTCMonth() + 1).padStart(2, "0")}-${String(dataFimUtc.getUTCDate()).padStart(2, "0")}`;

  return {
    start: `${dataParte}T${horaParte}:00`,
    end: `${dataFimStr}T${String(horaFim).padStart(2, "0")}:${String(minutoFim).padStart(2, "0")}:00`,
  };
}

async function criarEventoNoCalendario(
  apresentadorId: string,
  solicitacao: SolicitacaoDemo
): Promise<{ criado: boolean; link?: string; meetLink?: string | null; motivo?: string }> {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return { criado: false, motivo: "Google OAuth não está configurado" };
  }

  const db = getDb();
  const { data: apresentador, error } = await db
    .from("apresentadores")
    .select("*")
    .eq("id", apresentadorId)
    .single();

  if (error || !apresentador) {
    return { criado: false, motivo: "Apresentador não encontrado" };
  }

  if (!apresentador.google_calendar_token) {
    return { criado: false, motivo: "Apresentador não tem Google Calendar autorizado" };
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/apresentadores/google-oauth/callback`
    );
    oauth2Client.setCredentials({
      access_token: apresentador.google_calendar_token,
      refresh_token: apresentador.google_calendar_refresh_token,
    });

    const { start, end } = calcularInicioFim(solicitacao.data_hora_agendada!, DURACAO_EVENTO_MINUTOS);

    const { link, meetLink } = await createCalendarEvent(
      apresentador.google_calendar_token,
      apresentador.google_calendar_id || "primary",
      {
        summary: `Demonstração MV — ${solicitacao.nome_instituicao}`,
        description: [
          `Código da solicitação: ${solicitacao.codigo_solicitacao || "-"}`,
          `Produto: ${solicitacao.produto_apresentar}`,
          `Gerente de conta: ${solicitacao.gerente_conta_nome} (${solicitacao.gerente_conta_email})`,
          solicitacao.observacao_apresentacao ? `Observação: ${solicitacao.observacao_apresentacao}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        start,
        end,
        location: solicitacao.link_ou_local || solicitacao.endereco_apresentacao || undefined,
        attendees: solicitacao.gerente_conta_email
          ? [{ email: solicitacao.gerente_conta_email, displayName: solicitacao.gerente_conta_nome }]
          : undefined,
      }
    );

    return { criado: true, link, meetLink };
  } catch (error) {
    console.error("Erro ao criar evento no Google Calendar do apresentador:", error);
    return {
      criado: false,
      motivo: error instanceof Error ? error.message : "Erro ao criar evento no Google Calendar",
    };
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { id } = await params;
  const existente = await buscarSolicitacao(id);
  if (!existente) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  const body = await request.json();
  const { data_hora_agendada, agendado_por, link_ou_local, apresentador, apresentador_id } = body;

  if (!data_hora_agendada || !agendado_por || !apresentador) {
    return NextResponse.json(
      { error: "data_hora_agendada, agendado_por e apresentador são obrigatórios" },
      { status: 400 }
    );
  }

  const solicitacao = await agendarSolicitacao(id, {
    data_hora_agendada,
    agendado_por,
    link_ou_local: link_ou_local || null,
    apresentador,
  });

  const calendarEvento = apresentador_id
    ? await criarEventoNoCalendario(apresentador_id, solicitacao!)
    : { criado: false, motivo: "Apresentador sem id vinculado" };

  let solicitacaoFinal = solicitacao!;
  if (!link_ou_local && calendarEvento.meetLink) {
    solicitacaoFinal =
      (await agendarSolicitacao(id, {
        data_hora_agendada,
        agendado_por,
        link_ou_local: calendarEvento.meetLink,
        apresentador,
      })) || solicitacaoFinal;
  }

  const emailResult = await notificarAgendamentoConfirmado(solicitacaoFinal);
  return NextResponse.json({ solicitacao: solicitacaoFinal, email: emailResult, calendarEvento });
}
