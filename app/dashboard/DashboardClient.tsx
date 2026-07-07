"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  resumo: any;
  gerentes: Record<string, any>;
  regionais: Record<string, any>;
  apresentadores: Record<string, any>;
  solicitantes: Record<string, any>;
  metricas: any;
}

export default function DashboardClient() {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<"resumo" | "gerentes" | "regionais" | "apresentadores" | "solicitantes">("resumo");

  useEffect(() => {
    const carregar = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const data = await res.json();
        setDados(data);
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  if (carregando) return <p className="text-gray-500">Carregando dashboard...</p>;
  if (!dados) return <p className="text-red-600">Erro ao carregar dados</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard de Demonstrações</h1>
        <p className="text-sm text-gray-600">Métricas e performance</p>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {(
          [
            { id: "resumo", label: "📊 Resumo Geral" },
            { id: "gerentes", label: "👤 Por Gerente" },
            { id: "regionais", label: "🗺️ Por Regional" },
            { id: "apresentadores", label: "🎤 Apresentadores" },
            { id: "solicitantes", label: "📝 Solicitantes" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAba(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              aba === tab.id
                ? "border-[#008C77] text-[#008C77]"
                : "border-transparent text-gray-600 hover:text-[#214B63]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Resumo Geral */}
      {aba === "resumo" && <ResumoGeral dados={dados.resumo} metricas={dados.metricas} />}

      {/* Por Gerente */}
      {aba === "gerentes" && <TabelaGerentes dados={dados.gerentes} />}

      {/* Por Regional */}
      {aba === "regionais" && <TabelaRegionais dados={dados.regionais} />}

      {/* Apresentadores */}
      {aba === "apresentadores" && <TabelaApresentadores dados={dados.apresentadores} />}

      {/* Solicitantes */}
      {aba === "solicitantes" && <TabelaSolicitantes dados={dados.solicitantes} />}
    </div>
  );
}

function ResumoGeral({ dados, metricas }: any) {
  return (
    <div className="space-y-6">
      {/* Cards principais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          titulo="Total de Solicitações"
          valor={dados.total}
          cor="bg-blue-50 text-[#214B63]"
        />
        <Card
          titulo="Realizadas"
          valor={dados.porStatus.realizada}
          subtitulo={`${dados.percentualNpsRespondido}% com NPS`}
          cor="bg-green-50 text-[#008C77]"
        />
        <Card
          titulo="NPS Médio"
          valor={dados.npsMedio || "-"}
          subtitulo={`${dados.npsRespostas} respostas`}
          cor="bg-purple-50 text-purple-700"
        />
        <Card
          titulo="Taxa de Ocupação"
          valor={`${metricas.taxaOcupacaoAgenda}%`}
          subtitulo={`${metricas.diasComDemo} dias`}
          cor="bg-orange-50 text-orange-700"
        />
      </div>

      {/* Status e Ticket Médio */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Status</h3>
          <div className="space-y-2">
            {Object.entries(dados.porStatus).map(([status, count]: any) => (
              <div key={status} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">{status}:</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Distribuição NPS</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-green-600">Promotores (9-10):</span>
              <span className="font-medium">{dados.distribuicaoNps.promotores}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-yellow-600">Neutros (7-8):</span>
              <span className="font-medium">{dados.distribuicaoNps.neutros}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-600">Detratores (0-6):</span>
              <span className="font-medium">{dados.distribuicaoNps.detratores}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Médio */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-slate-900 mb-4">⏱️ Ticket Médio</h3>
        <p className="text-3xl font-bold text-[#008C77]">
          {metricas.ticketMedioDias ? `${metricas.ticketMedioDias} dias` : "N/A"}
        </p>
        <p className="text-sm text-gray-600">Tempo médio entre solicitação e demo realizada</p>
      </div>
    </div>
  );
}

function TabelaGerentes({ dados }: any) {
  const ordenado = Object.entries(dados)
    .map(([nome, stats]: any) => ({ nome, ...stats }))
    .sort((a, b) => b.solicitacoes - a.solicitacoes);

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-slate-900">Gerente</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">Solicitações</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">Realizadas</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">Canceladas</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">% Cancelamento</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {ordenado.map((item: any) => (
            <tr key={item.nome} className="hover:bg-gray-50">
              <td className="px-6 py-3 text-slate-900">{item.nome}</td>
              <td className="px-6 py-3 text-right">{item.solicitacoes}</td>
              <td className="px-6 py-3 text-right text-green-600 font-medium">{item.realizadas}</td>
              <td className="px-6 py-3 text-right text-red-600 font-medium">{item.canceladas}</td>
              <td className="px-6 py-3 text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  item.taxaCancelamento > 30 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}>
                  {item.taxaCancelamento}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabelaRegionais({ dados }: any) {
  const ordenado = Object.entries(dados)
    .map(([regional, stats]: any) => ({ regional, ...stats }))
    .sort((a, b) => b.solicitacoes - a.solicitacoes);

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-slate-900">Regional</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">Solicitações</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">Realizadas</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">Canceladas</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">% Cancelamento</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {ordenado.map((item: any) => (
            <tr key={item.regional} className="hover:bg-gray-50">
              <td className="px-6 py-3 text-slate-900">{item.regional}</td>
              <td className="px-6 py-3 text-right">{item.solicitacoes}</td>
              <td className="px-6 py-3 text-right text-green-600 font-medium">{item.realizadas}</td>
              <td className="px-6 py-3 text-right text-red-600 font-medium">{item.canceladas}</td>
              <td className="px-6 py-3 text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  item.taxaCancelamento > 30 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}>
                  {item.taxaCancelamento}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabelaApresentadores({ dados }: any) {
  const ordenado = Object.entries(dados)
    .map(([apresentador, stats]: any) => ({ apresentador, ...stats }))
    .sort((a, b) => b.demos - a.demos);

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-slate-900">Apresentador</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">Demos Realizadas</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">NPS Médio</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">% Com NPS</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {ordenado.map((item: any) => (
            <tr key={item.apresentador} className="hover:bg-gray-50">
              <td className="px-6 py-3 text-slate-900">{item.apresentador}</td>
              <td className="px-6 py-3 text-right font-medium">{item.demos}</td>
              <td className="px-6 py-3 text-right">
                <span className={`font-medium ${
                  item.npsMedio && item.npsMedio >= 8 ? "text-green-600" : "text-gray-700"
                }`}>
                  {item.npsMedio ? item.npsMedio : "-"}
                </span>
              </td>
              <td className="px-6 py-3 text-right">{item.taxaNps}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabelaSolicitantes({ dados }: any) {
  const ordenado = Object.entries(dados)
    .map(([solicitante, stats]: any) => ({ solicitante, ...stats }))
    .sort((a, b) => b.total - a.total);

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-slate-900">Solicitante</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">Total</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">Realizadas</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">Canceladas</th>
            <th className="px-6 py-3 text-right font-semibold text-slate-900">% Aprovação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {ordenado.map((item: any) => (
            <tr key={item.solicitante} className="hover:bg-gray-50">
              <td className="px-6 py-3 text-slate-900 text-xs">{item.solicitante}</td>
              <td className="px-6 py-3 text-right">{item.total}</td>
              <td className="px-6 py-3 text-right text-green-600 font-medium">{item.realizadas}</td>
              <td className="px-6 py-3 text-right text-red-600 font-medium">{item.canceladas}</td>
              <td className="px-6 py-3 text-right">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  item.taxaAprovacao >= 70 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                }`}>
                  {item.taxaAprovacao}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Card({ titulo, valor, subtitulo, cor }: any) {
  return (
    <div className={`rounded-lg ${cor} p-6`}>
      <p className="text-sm font-medium opacity-75">{titulo}</p>
      <p className="text-3xl font-bold mt-2">{valor}</p>
      {subtitulo && <p className="text-xs opacity-60 mt-2">{subtitulo}</p>}
    </div>
  );
}
