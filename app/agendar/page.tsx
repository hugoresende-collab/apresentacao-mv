"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { TextInput } from "@/components/FormField";
import type { SolicitacaoDemo, StatusSolicitacao } from "@/lib/types";

export default function AgendarPage() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoDemo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<StatusSolicitacao | "todos">("todos");

  async function carregar() {
    setCarregando(true);
    const res = await fetch("/api/solicitacoes");
    const data = await res.json();
    setSolicitacoes(data.solicitacoes);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtradas = solicitacoes.filter((s) => filtro === "todos" || s.status === filtro);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Agendamento de demonstrações</h1>
        <p className="text-sm text-slate-600">Visão da Barbara: confirme data/hora e acompanhe o status.</p>
      </div>

      <div className="flex gap-2 text-sm">
        {(["todos", "solicitado", "agendado", "realizado", "cancelado"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className={`rounded-full px-3 py-1 ${
              filtro === s ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {s === "todos" ? "Todos" : s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {carregando ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : filtradas.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma solicitação encontrada.</p>
      ) : (
        <div className="space-y-4">
          {filtradas.map((s) => (
            <SolicitacaoCard key={s.id} solicitacao={s} onAtualizado={carregar} />
          ))}
        </div>
      )}
    </div>
  );
}

function SolicitacaoCard({
  solicitacao,
  onAtualizado,
}: {
  solicitacao: SolicitacaoDemo;
  onAtualizado: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [dataHora, setDataHora] = useState(solicitacao.data_hora_agendada?.slice(0, 16) || "");
  const [agendadoPor, setAgendadoPor] = useState(solicitacao.agendado_por || "Barbara");
  const [linkOuLocal, setLinkOuLocal] = useState(solicitacao.link_ou_local || "");
  const [salvando, setSalvando] = useState(false);

  async function handleAgendar() {
    setSalvando(true);
    await fetch(`/api/solicitacoes/${solicitacao.id}/agendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data_hora_agendada: dataHora,
        agendado_por: agendadoPor,
        link_ou_local: linkOuLocal,
      }),
    });
    setSalvando(false);
    onAtualizado();
  }

  async function handleStatus(status: StatusSolicitacao) {
    setSalvando(true);
    await fetch(`/api/solicitacoes/${solicitacao.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSalvando(false);
    onAtualizado();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <button className="flex w-full items-center justify-between text-left" onClick={() => setAberto(!aberto)}>
        <div>
          <p className="font-medium text-slate-900">
            {solicitacao.nome_instituicao} — {solicitacao.produto_apresentar}
          </p>
          <p className="text-sm text-slate-500">
            {solicitacao.gerente_conta_nome} · {solicitacao.cidade} · desejado {solicitacao.data_desejada}
          </p>
        </div>
        <StatusBadge status={solicitacao.status} />
      </button>

      {aberto && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 text-sm">
          <dl className="grid grid-cols-2 gap-2 text-slate-600">
            <Info label="Tipo de apresentação" value={solicitacao.tipo_apresentacao} />
            <Info label="Observação da apresentação" value={solicitacao.observacao_apresentacao || "-"} />
            <Info label="Período desejado" value={solicitacao.periodo || "-"} />
            <Info
              label="Horário desejado"
              value={`${solicitacao.horario_inicio_desejado || "-"} a ${solicitacao.horario_fim_desejado || "-"}`}
            />
            <Info label="Patrocinador" value={solicitacao.nome_patrocinador || "-"} />
            <Info label="Email patrocinador" value={solicitacao.email_patrocinador || "-"} />
            <Info label="Número de visitas" value={solicitacao.numero_visitas || "-"} />
            <Info
              label="Valor aproximado do projeto"
              value={
                solicitacao.valor_aproximado_projeto
                  ? solicitacao.valor_aproximado_projeto.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  : "-"
              }
            />
            <Info label="Observações" value={solicitacao.observacoes || "-"} />
          </dl>

          {solicitacao.status !== "cancelado" && (
            <div className="grid grid-cols-1 gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">Data/hora agendada</span>
                <TextInput
                  type="datetime-local"
                  value={dataHora}
                  onChange={(e) => setDataHora(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">Agendado por</span>
                <TextInput value={agendadoPor} onChange={(e) => setAgendadoPor(e.target.value)} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-700">Link ou local</span>
                <TextInput value={linkOuLocal} onChange={(e) => setLinkOuLocal(e.target.value)} />
              </label>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {solicitacao.status !== "cancelado" && (
              <button
                onClick={handleAgendar}
                disabled={salvando || !dataHora}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                Confirmar agendamento
              </button>
            )}
            {solicitacao.status === "agendado" && (
              <button
                onClick={() => handleStatus("realizado")}
                disabled={salvando}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                Marcar como realizado
              </button>
            )}
            {solicitacao.status !== "cancelado" && solicitacao.status !== "realizado" && (
              <button
                onClick={() => handleStatus("cancelado")}
                disabled={salvando}
                className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
            {solicitacao.status === "realizado" && (
              <>
                <Link
                  href={`/nps/${solicitacao.id}`}
                  className="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700"
                >
                  Responder NPS
                </Link>
                <Link
                  href={`/resultado/${solicitacao.id}`}
                  className="rounded-md bg-purple-100 px-3 py-1.5 text-xs font-medium text-purple-700"
                >
                  Atualizar resultado comercial
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  );
}
