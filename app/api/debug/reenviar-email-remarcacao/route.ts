import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { notificarRemarcacao } from "@/lib/email";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/types";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { codigo_solicitacao } = await request.json();

  if (!codigo_solicitacao) {
    return NextResponse.json(
      { error: "codigo_solicitacao é obrigatório" },
      { status: 400 }
    );
  }

  const db = getDb();
  const { data: solicitacao, error } = await db
    .from("solicitacoes_demo")
    .select("*")
    .eq("codigo_solicitacao", codigo_solicitacao)
    .single();

  if (error || !solicitacao) {
    return NextResponse.json(
      { error: "Solicitação não encontrada" },
      { status: 404 }
    );
  }

  try {
    await notificarRemarcacao(
      solicitacao,
      solicitacao.data_desejada,
      solicitacao.horario_inicio_desejado,
      solicitacao.horario_fim_desejado
    );

    return NextResponse.json({
      sucesso: true,
      mensagem: `Email de remarcação reenviado para todos os admins. Solicitação: ${codigo_solicitacao}`,
    });
  } catch (error) {
    console.error("Erro ao reenviar email:", error);
    return NextResponse.json(
      { error: "Erro ao reenviar email" },
      { status: 500 }
    );
  }
}
