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

async function criarEventoNoCalendario(
  apresentadorId: string,
  solicitacao: SolicitacaoDemo
): Promise<{ criado: boolean; link?: string; motivo?: string }> {
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

    const inicio = new Date(solicitacao.data_hora_agendada!);
    const fim = new Date(inicio.getTime() + DURACAO_EVENTO_MINUTOS * 60 * 1000);

    const link = await createCalendarEvent(
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
        start: inicio.toISOString(),
        end: fim.toISOString(),
        location: solicitacao.link_ou_local || solicitacao.endereco_apresentacao || undefined,
        attendees: solicitacao.gerente_conta_email
          ? [{ email: solicitacao.gerente_conta_email, displayName: solicitacao.gerente_conta_nome }]
          : undefined,
      }
    );

    return { criado: true, link };
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

  const emailResult = await notificarAgendamentoConfirmado(solicitacao!);
  return NextResponse.json({ solicitacao, email: emailResult, calendarEvento });
}
