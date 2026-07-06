import { NextRequest, NextResponse } from "next/server";
import { agendarSolicitacao, buscarSolicitacao } from "@/lib/repo";
import { notificarAgendamentoConfirmado } from "@/lib/email";

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
  const { data_hora_agendada, agendado_por, link_ou_local } = body;

  if (!data_hora_agendada || !agendado_por) {
    return NextResponse.json(
      { error: "data_hora_agendada e agendado_por são obrigatórios" },
      { status: 400 }
    );
  }

  const solicitacao = await agendarSolicitacao(id, {
    data_hora_agendada,
    agendado_por,
    link_ou_local: link_ou_local || null,
  });

  const emailResult = await notificarAgendamentoConfirmado(solicitacao!);
  return NextResponse.json({ solicitacao, email: emailResult });
}
