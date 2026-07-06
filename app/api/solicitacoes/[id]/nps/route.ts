import { NextRequest, NextResponse } from "next/server";
import { buscarSolicitacao, registrarNps } from "@/lib/repo";

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
  const nota = Number(body.nota);

  if (Number.isNaN(nota) || nota < 0 || nota > 10) {
    return NextResponse.json({ error: "Nota deve ser um número entre 0 e 10" }, { status: 400 });
  }

  const nps = await registrarNps(id, { nota, comentario: body.comentario || null });
  return NextResponse.json({ nps });
}
