import { NextRequest, NextResponse } from "next/server";
import { listarSolicitacoes } from "@/lib/repo";
import { notificarFilaParadaNoChat } from "@/lib/googlechat";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verificar se a requisição vem do Vercel Cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const habilitado = process.env.ENABLE_CRON_VERIFICAR_FILA === "true";
    if (!habilitado) {
      return NextResponse.json({ message: "Cron desabilitado" }, { status: 200 });
    }

    const solicitacoes = await listarSolicitacoes();

    const agora = new Date();
    const vinteQuatroHorasAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);

    const filaParada = solicitacoes.filter((s) => {
      if (s.status !== "solicitado") return false;

      const criadoEm = new Date(s.created_at);
      return criadoEm <= vinteQuatroHorasAtras;
    });

    if (filaParada.length === 0) {
      return NextResponse.json(
        { message: "Nenhuma solicitação parada detectada" },
        { status: 200 }
      );
    }

    await notificarFilaParadaNoChat(filaParada);

    return NextResponse.json({
      success: true,
      message: `${filaParada.length} solicitação(ões) parada(s) notificada(s)`,
      count: filaParada.length,
    });
  } catch (error) {
    console.error("Erro ao verificar fila:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erro interno",
      },
      { status: 500 }
    );
  }
}

// Config do Vercel Cron
export const runtime = "nodejs";
