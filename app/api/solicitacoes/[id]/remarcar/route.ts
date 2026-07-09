import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

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

    const res = await db
      .from("solicitacoes_demo")
      .update({
        data_desejada: nova_data_desejada,
        horario_inicio_desejado: horario_inicio_desejado || null,
        horario_fim_desejado: horario_fim_desejado || null,
        status: "solicitado",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (res.error) throw res.error;

    return NextResponse.json({ solicitacao: res.data });
  } catch (error) {
    console.error("Erro ao remarcar:", error);
    return NextResponse.json(
      { error: "Erro ao remarcar demonstração" },
      { status: 500 }
    );
  }
}
