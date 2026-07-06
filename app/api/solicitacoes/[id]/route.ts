import { NextRequest, NextResponse } from "next/server";
import { buscarSolicitacao, buscarNps, buscarResultadoComercial } from "@/lib/repo";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const solicitacao = buscarSolicitacao(id);
  if (!solicitacao) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }
  const nps = buscarNps(id);
  const resultado = buscarResultadoComercial(id);
  return NextResponse.json({ solicitacao, nps, resultado });
}
