import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { buscarSolicitacao } from "@/lib/repo";
import { notificarRemarcacao } from "@/lib/email";
import { cancelCalendarEvent } from "@/lib/google-calendar";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nova_data_desejada, horario_inicio_desejado, horario_fim_desejado } = body;

    if (!nova_data_desejada) {
      return NextResponse.json(
        { error: "nova_data_desejada é obrigatória" },
        { status: 400 }
      );
    }

    const db = getDb();
    const solicitacaoAnterior = await buscarSolicitacao(id);

    if (!solicitacaoAnterior) {
      return NextResponse.json(
        { error: "Solicitação não encontrada" },
        { status: 404 }
      );
    }

    // Cancelar evento anterior no Google Calendar se existir
    if (solicitacaoAnterior.apresentador && solicitacaoAnterior.data_hora_agendada && solicitacaoAnterior.google_calendar_event_id) {
      try {
        const { data: apresentador } = await db
          .from("apresentadores")
          .select("*")
          .eq("nome", solicitacaoAnterior.apresentador)
          .single();

        if (apresentador?.google_calendar_token) {
          await cancelCalendarEvent(
            apresentador.google_calendar_token,
            apresentador.google_calendar_id || "primary",
            solicitacaoAnterior.google_calendar_event_id,
            {
              refreshToken: apresentador.google_calendar_refresh_token,
              onTokenRefreshed: async (novoAccessToken) => {
                await db
                  .from("apresentadores")
                  .update({ google_calendar_token: novoAccessToken })
                  .eq("id", apresentador.id);
              },
            }
          );
        }
      } catch (error) {
        console.error("Erro ao cancelar evento anterior no Google Calendar:", error);
      }
    }

    const res = await db
      .from("solicitacoes_demo")
      .update({
        data_desejada: nova_data_desejada,
        horario_inicio_desejado: horario_inicio_desejado || null,
        horario_fim_desejado: horario_fim_desejado || null,
        status: "solicitado",
        data_hora_agendada: null,
        data_hora_agendada_fim: null,
        google_calendar_event_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (res.error) throw res.error;

    // Enviar emails
    await notificarRemarcacao(
      res.data,
      nova_data_desejada,
      horario_inicio_desejado,
      horario_fim_desejado
    );

    return NextResponse.json({ solicitacao: res.data });
  } catch (error) {
    console.error("Erro ao remarcar:", error);
    return NextResponse.json(
      { error: "Erro ao remarcar demonstração" },
      { status: 500 }
    );
  }
}
