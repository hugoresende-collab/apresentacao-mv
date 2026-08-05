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

    // Busca solicitações realizada sem NPS usando LEFT JOIN
    const { data, error } = await db
      .from("solicitacoes_demo")
      .select("id, nome_instituicao, produto_apresentar")
      .eq("gerente_conta_email", session.email)
      .eq("status", "realizada")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Filtrar apenas as que NÃO têm NPS preenchido
    const { data: npsRecords } = await db
      .from("nps_demo")
      .select("solicitacao_id");

    const npsIds = new Set(npsRecords?.map(n => n.solicitacao_id) || []);
    const nps_pendente = data?.find(s => !npsIds.has(s.id)) || null;

    return NextResponse.json({ nps_pendente });
  } catch (error) {
    console.error("Erro ao buscar NPS pendente:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
