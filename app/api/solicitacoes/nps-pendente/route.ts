import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const db = getDb();
    const { data: nps_pendente, error } = await db
      .from("solicitacoes_demo")
      .select(
        `
        id,
        nome_instituicao,
        produto_apresentar,
        nps_demo(id)
      `
      )
      .eq("gerente_conta_email", session.email)
      .eq("status", "realizada")
      .is("nps_demo.id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({ nps_pendente: nps_pendente || null });
  } catch (error) {
    console.error("Erro ao buscar NPS pendente:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
