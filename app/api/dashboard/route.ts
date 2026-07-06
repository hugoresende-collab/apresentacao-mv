import { NextResponse } from "next/server";
import { listarSolicitacoes, listarNps, listarResultadosComerciais } from "@/lib/repo";

export async function GET() {
  const solicitacoes = listarSolicitacoes();
  const npsList = listarNps();
  const resultados = listarResultadosComerciais();

  const total = solicitacoes.length;
  const porStatus = {
    solicitado: solicitacoes.filter((s) => s.status === "solicitado").length,
    agendado: solicitacoes.filter((s) => s.status === "agendado").length,
    realizado: solicitacoes.filter((s) => s.status === "realizado").length,
    cancelado: solicitacoes.filter((s) => s.status === "cancelado").length,
  };

  const baseTaxaRealizacao = porStatus.agendado + porStatus.realizado + porStatus.cancelado;
  const percentualRealizadas =
    baseTaxaRealizacao > 0 ? (porStatus.realizado / baseTaxaRealizacao) * 100 : 0;

  const percentualNpsRespondido =
    porStatus.realizado > 0 ? (npsList.length / porStatus.realizado) * 100 : 0;

  const npsMedio =
    npsList.length > 0 ? npsList.reduce((acc, n) => acc + n.nota, 0) / npsList.length : null;

  const promotores = npsList.filter((n) => n.nota >= 9).length;
  const neutros = npsList.filter((n) => n.nota >= 7 && n.nota <= 8).length;
  const detratores = npsList.filter((n) => n.nota <= 6).length;

  const propostasGeradas = resultados.filter((r) => r.proposta_gerada === 1).length;
  const propostasFechadas = resultados.filter((r) => r.proposta_fechada === 1).length;
  const contratosCancelados = resultados.filter((r) => r.contrato_cancelado === 1).length;
  const valorTotalFechado = resultados
    .filter((r) => r.proposta_fechada === 1 && r.valor_proposta)
    .reduce((acc, r) => acc + (r.valor_proposta || 0), 0);

  const porUnidadeRegional: Record<string, number> = {};
  const porProduto: Record<string, number> = {};
  for (const s of solicitacoes) {
    porUnidadeRegional[s.unidade_regional] = (porUnidadeRegional[s.unidade_regional] || 0) + 1;
    porProduto[s.produto_apresentar] = (porProduto[s.produto_apresentar] || 0) + 1;
  }

  const temposAgendamento = solicitacoes
    .filter((s) => s.data_hora_agendada)
    .map((s) => new Date(s.updated_at).getTime() - new Date(s.created_at).getTime());
  const tempoMedioAgendamentoHoras =
    temposAgendamento.length > 0
      ? temposAgendamento.reduce((acc, t) => acc + t, 0) / temposAgendamento.length / (1000 * 60 * 60)
      : null;

  return NextResponse.json({
    total,
    porStatus,
    percentualRealizadas: Number(percentualRealizadas.toFixed(1)),
    percentualNpsRespondido: Number(percentualNpsRespondido.toFixed(1)),
    npsMedio: npsMedio !== null ? Number(npsMedio.toFixed(1)) : null,
    npsRespostas: npsList.length,
    distribuicaoNps: { promotores, neutros, detratores },
    propostasGeradas,
    propostasFechadas,
    contratosCancelados,
    valorTotalFechado,
    porUnidadeRegional,
    porProduto,
    tempoMedioAgendamentoHoras:
      tempoMedioAgendamentoHoras !== null ? Number(tempoMedioAgendamentoHoras.toFixed(1)) : null,
  });
}
