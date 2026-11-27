import { NextRequest, NextResponse } from "next/server";
import { atualizarStatus, buscarSolicitacao } from "@/lib/repo";
import { solicitarNps, notificarCancelamento } from "@/lib/email";
import { getDb } from "@/lib/db";
import { cancelCalendarEvent } from "@/lib/google-calendar";
import type { StatusSolicitacao } from "@/lib/types";

const STATUS_VALIDOS: StatusSolicitacao[] = ["solicitado", "remarcacao", "demo agendada", "realizada", "cancelada"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existente = await buscarSolicitacao(id);
    if (!existente) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
    }

    const body = await request.json();
    const status: StatusSolicitacao = body.status;
    const apresentador = body.apresentador || null;
    const motivo_cancelamento = body.motivo_cancelamento || null;

    if (!STATUS_VALIDOS.includes(status)) {
      return NextResponse.json({ error: "Status inválido" }, { status: 400 });
    }

    const solicitacao = await atualizarStatus(id, status, apresentador, motivo_cancelamento);

    // Cancelada: remove também o evento do Google Calendar do apresentador
    let calendarRemovido: boolean | undefined;
    if (status === "cancelada" && existente.google_calendar_event_id && existente.apresentador) {
      calendarRemovido = false;
      try {
        const db = getDb();
        const { data: apres } = await db
          .from("apresentadores")
          .select("*")
          .eq("nome", existente.apresentador)
          .single();

        if (apres?.google_calendar_token) {
          await cancelCalendarEvent(
            apres.google_calendar_token,
            apres.google_calendar_id || "primary",
            existente.google_calendar_event_id,
            {
              refreshToken: apres.google_calendar_refresh_token,
              onTokenRefreshed: async (novoAccessToken) => {
                await db
                  .from("apresentadores")
                  .update({ google_calendar_token: novoAccessToken })
                  .eq("id", apres.id);
              },
            }
          );
          calendarRemovido = true;
          await db.from("solicitacoes_demo").update({ google_calendar_event_id: null }).eq("id", id);
        }
      } catch (error) {
        // Não impede o cancelamento; o evento pode já ter sido apagado manualmente.
        console.error("Erro ao remover evento do Google Calendar ao cancelar:", error);
      }
    }

    if (!solicitacao) {
      return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 });
    }

    let emailResult;
    if (status === "realizada") {
      emailResult = await solicitarNps(solicitacao);
    } else if (status === "cancelada" && motivo_cancelamento) {
      emailResult = await notificarCancelamento(solicitacao, motivo_cancelamento);
    }

    return NextResponse.json({ solicitacao, email: emailResult, calendarRemovido });
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
