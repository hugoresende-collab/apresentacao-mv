import { NextRequest, NextResponse } from "next/server";
import { getDb, nowIso } from "@/lib/db";
import { buscarSolicitacao } from "@/lib/repo";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/types";
import { trocarApresentadorNoEvento } from "@/lib/google-calendar";
import { notificarNovoApresentador } from "@/lib/email";
import { getApresentadorEmail } from "@/lib/apresentadores-config";

type ResultadoCalendario =
  | { status: "sem_evento"; motivo?: string }
  | { status: "ok"; modo: "movido" | "convidado"; motivo?: string }
  | { status: "erro"; motivo: string };

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const { apresentador_id } = await request.json();
    if (!apresentador_id) {
      return NextResponse.json({ error: "apresentador_id é obrigatório" }, { status: 400 });
    }

    const existente = await buscarSolicitacao(id);
    if (!existente) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
    }
    if (existente.status !== "demo agendada") {
      return NextResponse.json(
        { error: "Só é possível alterar o apresentador de uma demonstração agendada." },
        { status: 400 }
      );
    }

    const db = getDb();
    const { data: novo, error: erroNovo } = await db
      .from("apresentadores")
      .select("*")
      .eq("id", apresentador_id)
      .single();
    if (erroNovo || !novo) {
      return NextResponse.json({ error: "Apresentador não encontrado" }, { status: 404 });
    }
    if (novo.nome === existente.apresentador) {
      return NextResponse.json({ error: "Este já é o apresentador da demonstração." }, { status: 400 });
    }

    const { data: anterior } = existente.apresentador
      ? await db.from("apresentadores").select("*").eq("nome", existente.apresentador).single()
      : { data: null };

    const emailNovo: string | undefined = novo.email || getApresentadorEmail(novo.nome);
    const emailAnterior: string | null =
      anterior?.email || (existente.apresentador ? getApresentadorEmail(existente.apresentador) || null : null);

    // Atualiza o evento do Google Calendar SEM excluí-lo
    let calendario: ResultadoCalendario = { status: "sem_evento" };
    if (existente.google_calendar_event_id) {
      if (!anterior?.google_calendar_token) {
        calendario = {
          status: "erro",
          motivo: "o apresentador anterior não tem Google Calendar autorizado",
        };
      } else if (!emailNovo) {
        calendario = { status: "erro", motivo: "o novo apresentador não tem e-mail cadastrado" };
      } else {
        try {
          const calendarioNovo =
            novo.google_calendar_id && novo.google_calendar_id !== "primary"
              ? novo.google_calendar_id
              : emailNovo;

          const r = await trocarApresentadorNoEvento({
            accessToken: anterior.google_calendar_token,
            refreshToken: anterior.google_calendar_refresh_token,
            onTokenRefreshed: async (novoAccessToken) => {
              await db
                .from("apresentadores")
                .update({ google_calendar_token: novoAccessToken })
                .eq("id", anterior.id);
            },
            calendarIdAtual: anterior.google_calendar_id || "primary",
            eventId: existente.google_calendar_event_id,
            novoCalendarId: calendarioNovo,
            novoEmail: emailNovo,
            novoNome: novo.nome,
            emailAnterior,
          });
          calendario = { status: "ok", modo: r.modo, motivo: r.motivoFallback };
        } catch (error) {
          console.error("Erro ao trocar apresentador no Google Calendar:", error);
          calendario = {
            status: "erro",
            motivo: error instanceof Error ? error.message : "erro ao atualizar o evento",
          };
        }
      }
    }

    const { data: atualizada, error: erroUpdate } = await db
      .from("solicitacoes_demo")
      .update({ apresentador: novo.nome, updated_at: nowIso() })
      .eq("id", id)
      .select()
      .single();

    if (erroUpdate || !atualizada) {
      console.error("Erro ao salvar novo apresentador:", erroUpdate);
      return NextResponse.json({ error: "Erro ao salvar o novo apresentador" }, { status: 500 });
    }

    // E-mail para o novo apresentador
    let email: { sent: boolean; reason?: string } = { sent: false, reason: "apresentador sem e-mail" };
    if (emailNovo) {
      try {
        email = await notificarNovoApresentador(atualizada, emailNovo, existente.apresentador);
      } catch (error) {
        console.error("Erro ao enviar e-mail ao novo apresentador:", error);
        email = { sent: false, reason: error instanceof Error ? error.message : String(error) };
      }
    }

    return NextResponse.json({ solicitacao: atualizada, calendario, email });
  } catch (error) {
    console.error("Erro ao alterar apresentador:", error);
    return NextResponse.json({ error: "Erro ao alterar apresentador" }, { status: 500 });
  }
}
