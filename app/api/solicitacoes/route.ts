import { NextRequest, NextResponse } from "next/server";
import { criarSolicitacao, listarSolicitacoes } from "@/lib/repo";
import {
  notificarNovaSolicitacaoAoSolicitante,
  notificarNovaSolicitacaoAoAdministrativo,
} from "@/lib/email";
import { notificarNovaSolicitacaoNoChat } from "@/lib/googlechat";
import { getSessionUser } from "@/lib/session";
import type { NovaSolicitacaoInput } from "@/lib/repo";

async function notificarComFallback<T>(
  label: string,
  promise: Promise<T>
): Promise<T | { sent: false; reason: string }> {
  try {
    return await promise;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`Falha ao notificar (${label}): ${reason}`);
    return { sent: false, reason };
  }
}

export async function GET(request: NextRequest) {
  try {
    const apenasMinhas = request.nextUrl.searchParams.get("minhas") === "1";

    if (apenasMinhas) {
      const user = await getSessionUser();
      if (!user) {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
      }
      const solicitacoes = await listarSolicitacoes({ gerenteContaEmail: user.email });
      return NextResponse.json({ solicitacoes });
    }

    const solicitacoes = await listarSolicitacoes();
    return NextResponse.json({ solicitacoes });
  } catch (error) {
    console.error("GET /api/solicitacoes error:", error);
    return NextResponse.json(
      { error: "Erro ao listar solicitações", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as NovaSolicitacaoInput;

    const camposObrigatorios: (keyof NovaSolicitacaoInput)[] = [
      "gerente_conta_nome",
      "gerente_conta_email",
      "unidade_regional",
      "nome_instituicao",
      "natureza_instituicao",
      "porte_instituicao",
      "cidade",
      "tipo_unidade",
      "tipo_oportunidade",
      "produto_apresentar",
      "tipo_apresentacao",
      "data_desejada",
    ];

    const faltando = camposObrigatorios.filter((campo) => !body[campo]);
    if (faltando.length > 0) {
      return NextResponse.json(
        { error: `Campos obrigatórios faltando: ${faltando.join(", ")}` },
        { status: 400 }
      );
    }

    const solicitacao = await criarSolicitacao(body);

    const [emailSolicitante, emailAdministrativo, googleChat] = await Promise.all([
      notificarComFallback("email solicitante", notificarNovaSolicitacaoAoSolicitante(solicitacao)),
      notificarComFallback("email administrativo", notificarNovaSolicitacaoAoAdministrativo(solicitacao)),
      notificarComFallback("google chat", notificarNovaSolicitacaoNoChat(solicitacao)),
    ]);

    return NextResponse.json(
      { solicitacao, notificacoes: { emailSolicitante, emailAdministrativo, googleChat } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/solicitacoes error:", error);
    return NextResponse.json(
      { error: "Erro ao criar solicitação", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
