import { NextResponse } from "next/server";
import { listarSolicitacoes, listarNps, listarResultadosComerciais } from "@/lib/repo";

interface GerenteStats {
  solicitacoes: number;
  canceladas: number;
  realizadas: number;
  taxaCancelamento: number;
}

interface RegionalStats {
  solicitacoes: number;
  canceladas: number;
  realizadas: number;
  taxaCancelamento: number;
}

interface ApresentadorStats {
  demos: number;
  npsMedio: number | null;
  taxaNps: number;
}

export async function GET() {
  try {
    const [solicitacoes, npsList, resultados] = await Promise.all([
      listarSolicitacoes(),
      listarNps(),
      listarResultadosComerciais(),
    ]);

  // ===== STATUS GERAL =====
  const total = solicitacoes.length;
  const porStatus = {
    solicitado: solicitacoes.filter((s) => s.status === "solicitado").length,
    remarcacao: solicitacoes.filter((s) => s.status === "remarcacao").length,
    "demo agendada": solicitacoes.filter((s) => s.status === "demo agendada").length,
    realizada: solicitacoes.filter((s) => s.status === "realizada").length,
    cancelada: solicitacoes.filter((s) => s.status === "cancelada").length,
  };

  // ===== NPS =====
  const percentualNpsRespondido =
    porStatus.realizada > 0 ? (npsList.length / porStatus.realizada) * 100 : 0;
  const npsMedio =
    npsList.length > 0 ? npsList.reduce((acc, n) => acc + n.nota, 0) / npsList.length : null;
  const promotores = npsList.filter((n) => n.nota >= 9).length;
  const neutros = npsList.filter((n) => n.nota >= 7 && n.nota <= 8).length;
  const detratores = npsList.filter((n) => n.nota <= 6).length;

  // ===== PERFORMANCE GERENTES =====
  const porGerente: Record<string, GerenteStats> = {};
  for (const s of solicitacoes) {
    if (!porGerente[s.gerente_conta_nome]) {
      porGerente[s.gerente_conta_nome] = {
        solicitacoes: 0,
        canceladas: 0,
        realizadas: 0,
        taxaCancelamento: 0,
      };
    }
    porGerente[s.gerente_conta_nome].solicitacoes++;
    if (s.status === "cancelada") porGerente[s.gerente_conta_nome].canceladas++;
    if (s.status === "realizada") porGerente[s.gerente_conta_nome].realizadas++;
  }
  for (const gerente in porGerente) {
    const stats = porGerente[gerente];
    stats.taxaCancelamento = stats.solicitacoes > 0
      ? Number(((stats.canceladas / stats.solicitacoes) * 100).toFixed(1))
      : 0;
  }

  // ===== PERFORMANCE REGIONAIS =====
  const porRegional: Record<string, RegionalStats> = {};
  for (const s of solicitacoes) {
    if (!porRegional[s.unidade_regional]) {
      porRegional[s.unidade_regional] = {
        solicitacoes: 0,
        canceladas: 0,
        realizadas: 0,
        taxaCancelamento: 0,
      };
    }
    porRegional[s.unidade_regional].solicitacoes++;
    if (s.status === "cancelada") porRegional[s.unidade_regional].canceladas++;
    if (s.status === "realizada") porRegional[s.unidade_regional].realizadas++;
  }
  for (const regional in porRegional) {
    const stats = porRegional[regional];
    stats.taxaCancelamento = stats.solicitacoes > 0
      ? Number(((stats.canceladas / stats.solicitacoes) * 100).toFixed(1))
      : 0;
  }

  // ===== PERFORMANCE APRESENTADORES =====
  const realizadas = solicitacoes.filter((s) => s.status === "realizada");
  const porApresentador: Record<string, ApresentadorStats> = {};
  for (const s of realizadas) {
    if (!s.apresentador) continue;
    if (!porApresentador[s.apresentador]) {
      porApresentador[s.apresentador] = { demos: 0, npsMedio: null, taxaNps: 0 };
    }
    porApresentador[s.apresentador].demos++;
  }

  for (const apresentador in porApresentador) {
    const npsDoApresentador = npsList.filter((n) => {
      const sol = solicitacoes.find((s) => s.id === n.solicitacao_id);
      return sol?.apresentador === apresentador;
    });

    const media =
      npsDoApresentador.length > 0
        ? npsDoApresentador.reduce((acc, n) => acc + n.nota, 0) / npsDoApresentador.length
        : null;

    porApresentador[apresentador].npsMedio = media ? Number(media.toFixed(1)) : null;
    porApresentador[apresentador].taxaNps =
      porApresentador[apresentador].demos > 0
        ? Number(((npsDoApresentador.length / porApresentador[apresentador].demos) * 100).toFixed(1))
        : 0;
  }

  // ===== PERFORMANCE SOLICITANTES =====
  const porSolicitante: Record<string, any> = {};
  for (const s of solicitacoes) {
    const key = `${s.gerente_conta_nome} (${s.gerente_conta_email})`;
    if (!porSolicitante[key]) {
      porSolicitante[key] = {
        total: 0,
        realizadas: 0,
        canceladas: 0,
        taxaAprovacao: 0,
      };
    }
    porSolicitante[key].total++;
    if (s.status === "realizada") porSolicitante[key].realizadas++;
    if (s.status === "cancelada") porSolicitante[key].canceladas++;
  }
  for (const solicitante in porSolicitante) {
    const stats = porSolicitante[solicitante];
    stats.taxaAprovacao = stats.total > 0
      ? Number(((stats.realizadas / stats.total) * 100).toFixed(1))
      : 0;
  }

  // ===== REMARCAÇÕES =====
  const porRemarcacao: Record<string, any> = {};
  const remarcacoes = solicitacoes.filter((s) => s.status === "remarcacao");
  for (const s of remarcacoes) {
    const key = `${s.gerente_conta_nome} (${s.gerente_conta_email})`;
    if (!porRemarcacao[key]) {
      porRemarcacao[key] = {
        total: 0,
        realizadas: 0,
        canceladas: 0,
        taxaAprovacao: 0,
      };
    }
    porRemarcacao[key].total++;
    // Quando uma remarcação é confirmada, volta para "demo agendada"
    if (s.status === "demo agendada") porRemarcacao[key].realizadas++;
    if (s.status === "cancelada") porRemarcacao[key].canceladas++;
  }
  for (const remarcacao in porRemarcacao) {
    const stats = porRemarcacao[remarcacao];
    stats.taxaAprovacao = stats.total > 0
      ? Number(((stats.realizadas / stats.total) * 100).toFixed(1))
      : 0;
  }

  // ===== TICKET MÉDIO =====
  const temposRealizacao = realizadas
    .filter((s) => s.created_at && s.data_hora_realizada)
    .map((s) => new Date(s.data_hora_realizada!).getTime() - new Date(s.created_at).getTime());

  const ticketMedioDias =
    temposRealizacao.length > 0
      ? temposRealizacao.reduce((acc, t) => acc + t, 0) / temposRealizacao.length / (1000 * 60 * 60 * 24)
      : null;

  // ===== TAXA DE OCUPAÇÃO =====
  const diasComDemo = new Set(
    solicitacoes
      .filter((s) => s.data_hora_agendada)
      .map((s) => new Date(s.data_hora_agendada!).toISOString().split("T")[0])
  ).size;

  const diasUltimos90 = 90;
  const taxaOcupacao = diasComDemo > 0 ? Number(((diasComDemo / diasUltimos90) * 100).toFixed(1)) : 0;

  // ===== OUTROS =====
  const propostasGeradas = resultados.filter((r) => Boolean(r.proposta_gerada)).length;
  const propostasFechadas = resultados.filter((r) => Boolean(r.proposta_fechada)).length;

    return NextResponse.json({
      resumo: {
        total,
        porStatus,
        percentualNpsRespondido: Number(percentualNpsRespondido.toFixed(1)),
        npsMedio: npsMedio !== null ? Number(npsMedio.toFixed(1)) : null,
        npsRespostas: npsList.length,
        distribuicaoNps: { promotores, neutros, detratores },
      },
      gerentes: porGerente,
      regionais: porRegional,
      apresentadores: porApresentador,
      solicitantes: porSolicitante,
      remarcacoes: porRemarcacao,
      metricas: {
        ticketMedioDias: ticketMedioDias ? Number(ticketMedioDias.toFixed(1)) : null,
        taxaOcupacaoAgenda: taxaOcupacao,
        diasComDemo,
        propostasGeradas,
        propostasFechadas,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar dashboard:", error);
    return NextResponse.json(
      { error: "Erro ao carregar dashboard", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
