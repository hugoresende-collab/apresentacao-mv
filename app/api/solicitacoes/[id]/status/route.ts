import { NextRequest, NextResponse } from "next/server";
import { atualizarStatus, buscarSolicitacao } from "@/lib/repo";
import { solicitarNps } from "@/lib/email";
import type { StatusSolicitacao } from "@/lib/types";

const STATUS_VALIDOS: StatusSolicitacao[] = ["solicitado", "agendado", "realizado", "cancelado"];

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existente = await buscarSolicitacao(id);
  if (!existente) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  const body = await request.json();
  const status: StatusSolicitacao = body.status;

  if (!STATUS_VALIDOS.includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }

  const solicitacao = await atualizarStatus(id, status);

  let emailResult;
  if (status === "realizado") {
    emailResult = await solicitarNps(solicitacao!);
  }

  return NextResponse.json({ solicitacao, email: emailResult });
}
