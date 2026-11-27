import { NextRequest, NextResponse, after } from "next/server";
import { getDb } from "@/lib/db";
import { buscarSolicitacao, gerarCodigoSolicitacaoUnico } from "@/lib/repo";
import {
  notificarNovaSolicitacaoAoSolicitante,
  notificarNovaSolicitacaoAoAdministrativo,
} from "@/lib/email";
import { notificarNovaSolicitacaoNoChat } from "@/lib/googlechat";
import { cancelCalendarEvent } from "@/lib/google-calendar";

async function notificarComFallback<T>(
  label: string,
  promise: Promise<T>
): Promise<T | { sent: false; reason: string }> {
  try {
    return await promise;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`Falha ao notificar remarcação (${label}): ${reason}`);
    return { sent: false, reason };
  }
}

// Mantém a lista de códigos anteriores no marcador "[REMARCADA de A, B]" das observações.
function montarObservacoesRemarcada(observacoes: string, codigoAnterior: string | null): string {
  const marcador = /^\[REMARCADA(?: de ([^\]]+))?\]\s*/;
  const m = observacoes.match(marcador);
  const anteriores = m && m[1] ? m[1].split(",").map((c) => c.trim()).filter(Boolean) : [];
  const resto = observacoes.replace(marcador, "").trim();
  if (codigoAnterior && !anteriores.includes(codigoAnterior)) anteriores.push(codigoAnterior);
  const novoMarcador = anteriores.length > 0 ? `[REMARCADA de ${anteriores.join(", ")}]` : "[REMARCADA]";
  return resto ? `${novoMarcador} ${resto}` : novoMarcador;
}

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

    // Remarcar vale como uma NOVA solicitação: novo código, volta para a fila ("solicitado")
    // e dispara novamente Google Chat e e-mails. (Não usa o status "remarcacao", que exigia
    // uma constraint extra no banco.)
    const codigoAnterior = solicitacaoAnterior.codigo_solicitacao || null;
    const codigoNovo = await gerarCodigoSolicitacaoUnico();
    const agora = new Date().toISOString();

    const dadosAtualizacaoBase = {
      codigo_solicitacao: codigoNovo,
      data_desejada: nova_data_desejada,
      data_desejada_2: null,
      data_desejada_3: null,
      horario_inicio_desejado: horario_inicio_desejado || null,
      horario_fim_desejado: horario_fim_desejado || null,
      status: "solicitado",
      apresentador: null,
      data_hora_agendada: null,
      data_hora_agendada_fim: null,
      google_calendar_event_id: null,
      observacoes: montarObservacoesRemarcada(solicitacaoAnterior.observacoes || "", codigoAnterior),
      created_at: agora,
      updated_at: agora,
    };

    let res = await db
      .from("solicitacoes_demo")
      .update({
        ...dadosAtualizacaoBase,
        foi_remarcada: true,
        total_remarcacoes: (solicitacaoAnterior.total_remarcacoes || 0) + 1,
      })
      .eq("id", id)
      .select()
      .single();

    // Colunas de métrica (migration 009) ainda não criadas: remarca sem elas.
    if (res.error && (res.error.message?.includes("column") || res.error.code === "42703")) {
      res = await db
        .from("solicitacoes_demo")
        .update(dadosAtualizacaoBase)
        .eq("id", id)
        .select()
        .single();
    }

    if (res.error) {
      console.error("Erro ao atualizar solicitação na remarcação:", res.error);
      return NextResponse.json(
        { error: `Não foi possível remarcar: ${res.error.message || "erro ao salvar no banco"}` },
        { status: 500 }
      );
    }

    // Reenvia as mesmas mensagens de uma nova solicitação (Google Chat + e-mails) DEPOIS de
    // responder: o envio por SMTP pode demorar e estourar o tempo da função na Vercel.
    const opcoesNotificacao = { remarcadaDeCodigo: codigoAnterior };
    const solicitacaoAtualizada = res.data;
    after(async () => {
      await Promise.all([
        notificarComFallback("email solicitante", notificarNovaSolicitacaoAoSolicitante(solicitacaoAtualizada, opcoesNotificacao)),
        notificarComFallback("email administrativo", notificarNovaSolicitacaoAoAdministrativo(solicitacaoAtualizada, opcoesNotificacao)),
        notificarComFallback("google chat", notificarNovaSolicitacaoNoChat(solicitacaoAtualizada, opcoesNotificacao)),
      ]);
    });

    return NextResponse.json({
      solicitacao: res.data,
      codigo_anterior: codigoAnterior,
    });
  } catch (error) {
    console.error("Erro ao remarcar:", error);
    return NextResponse.json(
      { error: "Erro ao remarcar demonstração" },
      { status: 500 }
    );
  }
}
