"use client";

import { useEffect, useState, useLayoutEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TextInput } from "@/components/FormField";
import { GoogleCalendarPicker } from "@/components/GoogleCalendarPicker";
import type { SolicitacaoDemo, StatusSolicitacao, Apresentador } from "@/lib/types";

export default function GestaoPageClient({ nomeUsuario }: { nomeUsuario: string }) {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoDemo[]>([]);
  const [apresentadores, setApresentadores] = useState<Apresentador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<StatusSolicitacao | "todos">("todos");

  async function carregar() {
    setCarregando(true);
    try {
      const [resSolicitacoes, resApresentadores] = await Promise.all([
        fetch("/api/solicitacoes"),
        fetch("/api/apresentadores"),
      ]);

      const dataSolicitacoes = await resSolicitacoes.json();
      const dataApresentadores = await resApresentadores.json();

      setSolicitacoes(dataSolicitacoes.solicitacoes);
      setApresentadores(dataApresentadores.apresentadores);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const filtradas = solicitacoes.filter((s) => filtro === "todos" || s.status === filtro);

  const contadores = {
    todos: solicitacoes.length,
    solicitado: solicitacoes.filter((s) => s.status === "solicitado").length,
    "demo agendada": solicitacoes.filter((s) => s.status === "demo agendada").length,
    realizada: solicitacoes.filter((s) => s.status === "realizada").length,
    cancelada: solicitacoes.filter((s) => s.status === "cancelada").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Gestão de demonstrações"
        subtitulo="Gerencie solicitações, confirme agendamentos e acompanhe status."
      />

      <div className="flex gap-2 text-sm flex-wrap">
        {(["todos", "solicitado", "demo agendada", "realizada", "cancelada"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s as any)}
            className={`rounded-full px-3 py-1 flex items-center gap-2 ${
              filtro === s ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            <span>{s === "todos" ? "Todos" : s[0].toUpperCase() + s.slice(1)}</span>
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold ${
              filtro === s ? "bg-slate-700" : "bg-slate-300"
            }`}>
              {contadores[s as keyof typeof contadores]}
            </span>
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
            <SolicitacaoCard
              key={s.id}
              solicitacao={s}
              nomeUsuario={nomeUsuario}
              apresentadores={apresentadores}
              onAtualizado={carregar}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SolicitacaoCard({
  solicitacao: initialSolicitacao,
  nomeUsuario,
  apresentadores,
  onAtualizado,
}: {
  solicitacao: SolicitacaoDemo;
  nomeUsuario: string;
  apresentadores: Apresentador[];
  onAtualizado: () => void;
}) {
  const [solicitacao, setSolicitacao] = useState(initialSolicitacao);
  const [aberto, setAberto] = useState(false);
  const [dataHora, setDataHora] = useState(solicitacao.data_hora_agendada?.slice(0, 16) || "");
  const [agendadoPor, setAgendadoPor] = useState(solicitacao.agendado_por || nomeUsuario);
  const [linkOuLocal, setLinkOuLocal] = useState(solicitacao.link_ou_local || "");
  const [apresentador, setApresentador] = useState(solicitacao.apresentador || "");
  const [apresentadorId, setApresentadorId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [confirmaCancelar, setConfirmaCancelar] = useState(false);
  const [remarcar, setRemarcar] = useState(false);
  const [novaDataDesejada, setNovaDataDesejada] = useState(solicitacao.data_desejada);

  useLayoutEffect(() => {
    setSolicitacao(initialSolicitacao);
    setDataHora(initialSolicitacao.data_hora_agendada?.slice(0, 16) || "");
    setAgendadoPor(initialSolicitacao.agendado_por || nomeUsuario);
    setLinkOuLocal(initialSolicitacao.link_ou_local || "");
    setApresentador(initialSolicitacao.apresentador || "");
    setNovaDataDesejada(initialSolicitacao.data_desejada);
  }, [initialSolicitacao, nomeUsuario]);

  async function handleAgendar() {
    setSalvando(true);
    const res = await fetch(`/api/solicitacoes/${solicitacao.id}/agendar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data_hora_agendada: dataHora,
        agendado_por: agendadoPor,
        link_ou_local: linkOuLocal,
        apresentador: apresentador,
      }),
    });
    const data = await res.json();
    setSolicitacao({ ...data.solicitacao });
    setSalvando(false);
    setAberto(true);
    setTimeout(() => onAtualizado(), 500);
  }

  async function handleRemarcar() {
    setSalvando(true);
    const res = await fetch(`/api/solicitacoes/${solicitacao.id}/remarcar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nova_data_desejada: novaDataDesejada,
      }),
    });
    const data = await res.json();
    setSolicitacao({ ...data.solicitacao });
    setNovaDataDesejada(data.solicitacao.data_desejada);
    setSalvando(false);
    setRemarcar(false);
    setTimeout(() => onAtualizado(), 500);
  }

  async function handleStatus(status: StatusSolicitacao) {
    setSalvando(true);
    const body: any = { status };
    if (status === "realizada" && apresentador) {
      body.apresentador = apresentador;
    }
    const res = await fetch(`/api/solicitacoes/${solicitacao.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSolicitacao(data.solicitacao);
    setSalvando(false);
    setAberto(true);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <button className="flex w-full items-start justify-between gap-4 text-left" onClick={() => setAberto(!aberto)}>
        <div className="flex-1">
          <p className="font-medium text-slate-900">
            {solicitacao.nome_instituicao} — {solicitacao.produto_apresentar}
          </p>
          <p className="text-sm text-slate-500">
            {solicitacao.gerente_conta_nome} · {solicitacao.cidade} · desejado {solicitacao.data_desejada}
          </p>
          {solicitacao.apresentador && (
            <div className="mt-1 space-y-1">
              <p className="text-xs font-semibold text-emerald-600">
                👤 Apresentador: {solicitacao.apresentador}
              </p>
              {solicitacao.data_hora_agendada && (
                <p className="text-xs text-blue-600 font-medium">
                  📅 Agendado para: {new Date(solicitacao.data_hora_agendada).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="flex-shrink-0">
          <StatusBadge status={solicitacao.status} />
        </div>
      </button>

      {aberto && (
        <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 text-sm">
          <dl className="grid grid-cols-2 gap-2 text-slate-600">
            <Info label="Email do gerente de conta" value={solicitacao.gerente_conta_email || "-"} />
            <Info label="Apresentador" value={solicitacao.apresentador || "-"} />
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
            {solicitacao.status === "cancelada" && (
              <Info label="Motivo do cancelamento" value={solicitacao.motivo_cancelamento || "-"} />
            )}
          </dl>

          {solicitacao.status !== "cancelada" && (
            <div className="space-y-3">
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

              {solicitacao.status === "solicitado" && (
                <div className="space-y-3">
                  <div className="rounded-md bg-blue-50 p-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-medium text-slate-700">Apresentador *</span>
                      <select
                        value={apresentador}
                        onChange={(e) => {
                          const selecionado = apresentadores.find(a => a.nome === e.target.value);
                          setApresentador(e.target.value);
                          setApresentadorId(selecionado?.id || "");
                        }}
                        className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione um apresentador</option>
                        {apresentadores.map((a) => (
                          <option key={a.id} value={a.nome}>
                            {a.nome} {a.google_calendar_token ? "📅" : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {apresentador && apresentadorId && (
                    <GoogleCalendarPicker
                      apresentadorId={apresentadorId}
                      dataSelecionada={solicitacao.data_desejada}
                      onHorarioSelecionado={(dataHora) => setDataHora(dataHora)}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {solicitacao.status === "solicitado" && (
              <button
                onClick={handleAgendar}
                disabled={salvando || !dataHora || !apresentador}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                Confirmar agendamento
              </button>
            )}
            {solicitacao.status === "demo agendada" && (
              <>
                <button
                  onClick={() => handleStatus("realizada")}
                  disabled={salvando}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  Marcar como realizada
                </button>
                <button
                  onClick={() => setRemarcar(true)}
                  disabled={salvando}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  Remarcar
                </button>
              </>
            )}
            {solicitacao.status !== "cancelada" && solicitacao.status !== "realizada" && (
              <button
                onClick={() => setConfirmaCancelar(true)}
                disabled={salvando}
                className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmação de cancelamento */}
      {confirmaCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl max-w-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Confirmar cancelamento</h2>
            <p className="text-sm text-slate-600 mb-6">
              Tem certeza que deseja cancelar a demonstração para <b>{solicitacao.nome_instituicao}</b>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmaCancelar(false)}
                disabled={salvando}
                className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
              >
                Não, voltar
              </button>
              <button
                onClick={async () => {
                  setSalvando(true);
                  await handleStatus("cancelada");
                  setSalvando(false);
                  setConfirmaCancelar(false);
                }}
                disabled={salvando}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Sim, cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de remarcar */}
      {remarcar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl max-w-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Remarcar demonstração</h2>
            <p className="text-sm text-slate-600 mb-4">
              Informe os novos dados para <b>{solicitacao.nome_instituicao}</b>
            </p>
            <div className="space-y-3 mb-6">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Nova data desejada</span>
                <TextInput
                  type="date"
                  value={novaDataDesejada}
                  onChange={(e) => setNovaDataDesejada(e.target.value)}
                />
              </label>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRemarcar(false)}
                disabled={salvando}
                className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemarcar}
                disabled={salvando || !novaDataDesejada}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
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
