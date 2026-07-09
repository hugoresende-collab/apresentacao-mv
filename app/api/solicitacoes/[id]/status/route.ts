import { NextRequest, NextResponse } from "next/server";
import { atualizarStatus, buscarSolicitacao } from "@/lib/repo";
import { solicitarNps } from "@/lib/email";
import type { StatusSolicitacao } from "@/lib/types";

const STATUS_VALIDOS: StatusSolicitacao[] = ["solicitado", "demo agendada", "realizada", "cancelada"];

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

    if (!solicitacao) {
      return NextResponse.json({ error: "Erro ao atualizar status" }, { status: 500 });
    }

    let emailResult;
    if (status === "realizada") {
      emailResult = await solicitarNps(solicitacao);
    }

    return NextResponse.json({ solicitacao, email: emailResult });
  } catch (error) {
    console.error("Erro ao atualizar status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
