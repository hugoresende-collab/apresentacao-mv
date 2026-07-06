import { NextRequest, NextResponse } from "next/server";
import { criarSolicitacao, listarSolicitacoes } from "@/lib/repo";
import { notificarNovaSolicitacao } from "@/lib/email";
import type { NovaSolicitacaoInput } from "@/lib/repo";

export async function GET() {
  const solicitacoes = listarSolicitacoes();
  return NextResponse.json({ solicitacoes });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as NovaSolicitacaoInput;

  const camposObrigatorios: (keyof NovaSolicitacaoInput)[] = [
    "gerente_conta_nome",
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

  const solicitacao = criarSolicitacao(body);
  const emailResult = await notificarNovaSolicitacao(solicitacao);

  return NextResponse.json({ solicitacao, email: emailResult }, { status: 201 });
}
