import { NextRequest, NextResponse } from "next/server";
import { atualizarResultadoComercial, buscarSolicitacao } from "@/lib/repo";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existente = buscarSolicitacao(id);
  if (!existente) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  const body = await request.json();

  const resultado = atualizarResultadoComercial(id, {
    proposta_gerada: Boolean(body.proposta_gerada),
    proposta_fechada: Boolean(body.proposta_fechada),
    valor_proposta: body.valor_proposta ? Number(body.valor_proposta) : null,
    contrato_cancelado: Boolean(body.contrato_cancelado),
    atualizado_por: body.atualizado_por || null,
  });

  return NextResponse.json({ resultado });
}
