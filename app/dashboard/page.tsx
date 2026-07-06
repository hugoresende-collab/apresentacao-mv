"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  total: number;
  porStatus: { solicitado: number; agendado: number; realizado: number; cancelado: number };
  percentualRealizadas: number;
  percentualNpsRespondido: number;
  npsMedio: number | null;
  npsRespostas: number;
  distribuicaoNps: { promotores: number; neutros: number; detratores: number };
  propostasGeradas: number;
  propostasFechadas: number;
  contratosCancelados: number;
  valorTotalFechado: number;
  porUnidadeRegional: Record<string, number>;
  porProduto: Record<string, number>;
  tempoMedioAgendamentoHoras: number | null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData);
  }, []);

  if (!data) return <p className="text-sm text-slate-500">Carregando...</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard de indicadores</h1>
        <p className="text-sm text-slate-600">Visão consolidada do funil de demonstrações.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Total de solicitações" value={data.total.toString()} />
        <Metric label="% apresentações realizadas" value={`${data.percentualRealizadas}%`} />
        <Metric label="% NPS respondido" value={`${data.percentualNpsRespondido}%`} />
        <Metric label="NPS médio" value={data.npsMedio !== null ? data.npsMedio.toString() : "-"} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Propostas geradas" value={data.propostasGeradas.toString()} />
        <Metric label="Propostas fechadas" value={data.propostasFechadas.toString()} />
        <Metric label="Contratos cancelados" value={data.contratosCancelados.toString()} tone="danger" />
        <Metric
          label="Valor total fechado"
          value={data.valorTotalFechado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        />
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">Status das solicitações</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Solicitado" value={data.porStatus.solicitado.toString()} compact />
          <Metric label="Agendado" value={data.porStatus.agendado.toString()} compact />
          <Metric label="Realizado" value={data.porStatus.realizado.toString()} compact />
          <Metric label="Cancelado" value={data.porStatus.cancelado.toString()} compact />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-800">
          Distribuição de NPS ({data.npsRespostas} respostas)
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Promotores (9-10)" value={data.distribuicaoNps.promotores.toString()} compact tone="success" />
          <Metric label="Neutros (7-8)" value={data.distribuicaoNps.neutros.toString()} compact />
          <Metric label="Detratores (0-6)" value={data.distribuicaoNps.detratores.toString()} compact tone="danger" />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <BreakdownTable titulo="Solicitações por unidade regional" dados={data.porUnidadeRegional} />
        <BreakdownTable titulo="Solicitações por produto" dados={data.porProduto} />
      </div>

      {data.tempoMedioAgendamentoHoras !== null && (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-800">Agilidade de agendamento</h2>
          <p className="mt-1 text-2xl font-semibold text-slate-900">
            {data.tempoMedioAgendamentoHoras}h
            <span className="ml-2 text-sm font-normal text-slate-500">tempo médio entre solicitação e agendamento</span>
          </p>
        </section>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  compact,
  tone,
}: {
  label: string;
  value: string;
  compact?: boolean;
  tone?: "success" | "danger";
}) {
  const toneClass = tone === "success" ? "text-emerald-700" : tone === "danger" ? "text-red-700" : "text-slate-900";
  return (
    <div className={`rounded-lg border border-slate-200 bg-white ${compact ? "p-3" : "p-5"}`}>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 font-semibold ${toneClass} ${compact ? "text-lg" : "text-2xl"}`}>{value}</p>
    </div>
  );
}

function BreakdownTable({ titulo, dados }: { titulo: string; dados: Record<string, number> }) {
  const entradas = Object.entries(dados).sort((a, b) => b[1] - a[1]);
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">{titulo}</h2>
      {entradas.length === 0 ? (
        <p className="text-sm text-slate-400">Sem dados ainda.</p>
      ) : (
        <ul className="space-y-1 text-sm">
          {entradas.map(([chave, valor]) => (
            <li key={chave} className="flex justify-between text-slate-600">
              <span>{chave}</span>
              <span className="font-medium text-slate-900">{valor}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
