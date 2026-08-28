"use client";

import { useEffect, useState, useLayoutEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TextInput, TextArea } from "@/components/FormField";
import { GoogleCalendarPicker } from "@/components/GoogleCalendarPicker";
import { ErrorToast } from "@/components/ErrorToast";
import { SolicitacaoDetalhes } from "@/components/SolicitacaoDetalhes";
import { Avatar } from "@/components/Avatar";
import type { SolicitacaoDemo, StatusSolicitacao, Apresentador } from "@/lib/types";

function somarMinutos(dataHora: string, minutos: number): string {
  const [dataParte, horaParte] = dataHora.split("T");
  const [ano, mes, dia] = dataParte.split("-").map(Number);
  const [hora, minuto] = horaParte.split(":").map(Number);

  const totalMinutos = hora * 60 + minuto + minutos;
  const diasAdicionais = Math.floor(totalMinutos / (24 * 60));
  const minutosNoDia = ((totalMinutos % (24 * 60)) + 24 * 60) % (24 * 60);
  const horaFim = Math.floor(minutosNoDia / 60);
  const minutoFim = minutosNoDia % 60;

  const dataFim = new Date(Date.UTC(ano, mes - 1, dia + diasAdicionais));
  const dataFimStr = `${dataFim.getUTCFullYear()}-${String(dataFim.getUTCMonth() + 1).padStart(2, "0")}-${String(dataFim.getUTCDate()).padStart(2, "0")}`;

  return `${dataFimStr}T${String(horaFim).padStart(2, "0")}:${String(minutoFim).padStart(2, "0")}`;
}

function calcularDataHoraFimPadrao(dataHoraInicio: string, solicitacao: SolicitacaoDemo): string {
  if (solicitacao.data_hora_agendada_fim) return solicitacao.data_hora_agendada_fim.slice(0, 16);
  if (solicitacao.data_desejada && solicitacao.horario_fim_desejado) {
    const dataHoraSugerida = `${solicitacao.data_desejada}T${solicitacao.horario_fim_desejado}`;
    if (dataHoraSugerida > dataHoraInicio) return dataHoraSugerida;
  }
  return somarMinutos(dataHoraInicio, 60);
}

const MOTIVOS_CANCELAMENTO = [
  "A pedido do cliente",
  "Ausência do cliente e/ou GC",
  "Necessidade interna",
  "Falta de informações suficientes",
  "Outro motivo",
] as const;

export default function GestaoPageClient({ nomeUsuario }: { nomeUsuario: string }) {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoDemo[]>([]);
  const [apresentadores, setApresentadores] = useState<Apresentador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<StatusSolicitacao | "todos">("todos");
  const [buscaCodigo, setBuscaCodigo] = useState("");

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

  const filtradas = solicitacoes.filter((s) => {
    const matchStatus = filtro === "todos" || s.status === filtro;
    const matchCodigo = buscaCodigo === "" || (s.codigo_solicitacao?.toLowerCase().includes(buscaCodigo.toLowerCase()));
    return matchStatus && matchCodigo;
  });

  const contadores = {
    todos: solicitacoes.length,
    solicitado: solicitacoes.filter((s) => s.status === "solicitado").length,
    "demo agendada": solicitacoes.filter((s) => s.status === "demo agendada").length,
    realizada: solicitacoes.filter((s) => s.status === "realizada").length,
    cancelada: solicitacoes.filter((s) => s.status === "cancelada").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader titulo="Gestão de demonstrações" />

      <TextInput
        type="text"
        placeholder="Buscar por código da solicitação..."
        value={buscaCodigo}
        onChange={(e) => setBuscaCodigo(e.target.value)}
        className="max-w-xs"
      />

      <div className="flex gap-2 text-sm flex-wrap">
        {(["todos", "solicitado", "demo agendada", "realizada", "cancelada"] as const).map((s) => {
          const contagem = contadores[s as keyof typeof contadores];
          const alertaSolicitado = s === "solicitado" && contagem > 0;
          return (
            <button
              key={s}
              onClick={() => setFiltro(s as any)}
              className={`rounded-full px-3 py-1 flex items-center gap-2 ${
                alertaSolicitado
                  ? `bg-red-600 text-white animate-pulse ${filtro === s ? "ring-2 ring-red-900" : ""}`
                  : filtro === s
                  ? "bg-slate-900 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              <span>{s === "todos" ? "Todos" : s[0].toUpperCase() + s.slice(1)}</span>
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold ${
                  alertaSolicitado ? "bg-red-800" : filtro === s ? "bg-slate-700" : "bg-slate-300"
                }`}
              >
                {contagem}
              </span>
            </button>
          );
        })}
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
  const [dataHora, setDataHora] = useState(
    solicitacao.data_hora_agendada?.slice(0, 16) ||
      (solicitacao.data_desejada ? `${solicitacao.data_desejada}T09:00` : "")
  );
  const [dataHoraFim, setDataHoraFim] = useState(() =>
    calcularDataHoraFimPadrao(
      solicitacao.data_hora_agendada?.slice(0, 16) ||
        (solicitacao.data_desejada ? `${solicitacao.data_desejada}T09:00` : ""),
      solicitacao
    )
  );
  const [agendadoPor, setAgendadoPor] = useState(solicitacao.agendado_por || nomeUsuario);
  const [linkOuLocal, setLinkOuLocal] = useState(solicitacao.link_ou_local || "");
  const [apresentador, setApresentador] = useState(solicitacao.apresentador || "");
  const [apresentadorId, setApresentadorId] = useState(() => {
    if (solicitacao.apresentador) {
      const apres = apresentadores.find(a => a.nome === solicitacao.apresentador);
      return apres?.id || "";
    }
    return "";
  });
  const [salvando, setSalvando] = useState(false);
  const [confirmaCancelar, setConfirmaCancelar] = useState<"confirmar" | "motivo" | false>(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [remarcar, setRemarcar] = useState(false);
  const [novaDataDesejada, setNovaDataDesejada] = useState(solicitacao.data_desejada);
  const [horarioInicioRemarcar, setHorarioInicioRemarcar] = useState(solicitacao.horario_inicio_desejado || "");
  const [horarioFimRemarcar, setHorarioFimRemarcar] = useState(solicitacao.horario_fim_desejado || "");
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [motivoSelecionado, setMotivoSelecionado] = useState<string | null>(null);

  useEffect(() => {
    if (erroAcao) {
      const timer = setTimeout(() => setErroAcao(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [erroAcao]);

  useLayoutEffect(() => {
    setSolicitacao(initialSolicitacao);
    const dataHoraInicial =
      initialSolicitacao.data_hora_agendada?.slice(0, 16) ||
      (initialSolicitacao.data_desejada ? `${initialSolicitacao.data_desejada}T09:00` : "");
    setDataHora(dataHoraInicial);
    setDataHoraFim(calcularDataHoraFimPadrao(dataHoraInicial, initialSolicitacao));
    setAgendadoPor(initialSolicitacao.agendado_por || nomeUsuario);
    setLinkOuLocal(initialSolicitacao.link_ou_local || "");
    setApresentador(initialSolicitacao.apresentador || "");
    setNovaDataDesejada(initialSolicitacao.data_desejada);
    setHorarioInicioRemarcar(initialSolicitacao.horario_inicio_desejado || "");
    setHorarioFimRemarcar(initialSolicitacao.horario_fim_desejado || "");
  }, [initialSolicitacao, nomeUsuario]);

  async function handleAgendar() {
    if (dataHoraFim <= dataHora) {
      setErroAcao("O horário de término deve ser depois do horário de início");
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacao.id}/agendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data_hora_agendada: dataHora,
          data_hora_agendada_fim: dataHoraFim,
          agendado_por: agendadoPor,
          link_ou_local: linkOuLocal,
          apresentador: apresentador,
          apresentador_id: apresentadorId,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data?.solicitacao) {
        setErroAcao(data?.error || "Não foi possível confirmar o agendamento. Tente novamente.");
        setSalvando(false);
        return;
      }

      setSolicitacao({ ...data.solicitacao });
      setAberto(true);

      if (!data.calendarEvento?.criado) {
        setErroAcao(
          `Agendamento confirmado, mas não foi possível criar o evento no Google Calendar do apresentador (${data.calendarEvento?.motivo || "motivo desconhecido"}). Marque manualmente.`
        );
      }

      setTimeout(() => onAtualizado(), 500);
    } catch (e) {
      console.error("Erro ao confirmar agendamento:", e);
      setErroAcao("Não foi possível confirmar o agendamento. Tente novamente.");
    }
    setSalvando(false);
  }

  async function handleRemarcar() {
    setSalvando(true);
    const res = await fetch(`/api/solicitacoes/${solicitacao.id}/remarcar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nova_data_desejada: novaDataDesejada,
        horario_inicio_desejado: horarioInicioRemarcar,
        horario_fim_desejado: horarioFimRemarcar,
      }),
    });
    const data = await res.json();
    setSolicitacao({ ...data.solicitacao });
    setNovaDataDesejada(data.solicitacao.data_desejada);
    setHorarioInicioRemarcar(data.solicitacao.horario_inicio_desejado || "");
    setHorarioFimRemarcar(data.solicitacao.horario_fim_desejado || "");
    setSalvando(false);
    setRemarcar(false);
    setTimeout(() => onAtualizado(), 500);
  }

  async function handleStatus(status: StatusSolicitacao, motivoCancelamentoInformado?: string) {
    setSalvando(true);
    const body: any = { status };
    if (status === "realizada" && apresentador) {
      body.apresentador = apresentador;
    }
    if (status === "cancelada" && motivoCancelamentoInformado) {
      body.motivo_cancelamento = motivoCancelamentoInformado;
    }

    try {
      const res = await fetch(`/api/solicitacoes/${solicitacao.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok || !data?.solicitacao) {
        setErroAcao(data?.error || "Não foi possível atualizar o status da solicitação. Tente novamente.");
        setSalvando(false);
        return;
      }

      setSolicitacao(data.solicitacao);
      setAberto(true);
    } catch (e) {
      console.error("Erro ao atualizar status:", e);
      setErroAcao("Não foi possível atualizar o status da solicitação. Tente novamente.");
    }
    setSalvando(false);
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      {erroAcao && <ErrorToast titulo="Erro" mensagem={erroAcao} />}

      <button className="flex w-full items-start justify-between gap-4 text-left" onClick={() => setAberto(!aberto)}>
        <div className="flex-1">
          <p className="font-medium text-slate-900">
            {solicitacao.nome_instituicao} — {solicitacao.produto_apresentar}
            {solicitacao.codigo_solicitacao && (
              <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono font-normal text-slate-500">
                {solicitacao.codigo_solicitacao}
              </span>
            )}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <Avatar nome={solicitacao.gerente_conta_nome} url={solicitacao.gerente_conta_avatar_url} size={18} />
            {solicitacao.gerente_conta_nome} · {solicitacao.cidade} · desejado{" "}
            {[solicitacao.data_desejada, solicitacao.data_desejada_2, solicitacao.data_desejada_3]
              .filter(Boolean)
              .join(" / ")}
          </p>
          {solicitacao.apresentador && (
            <div className="mt-1 space-y-1">
              <p className="text-xs font-semibold text-emerald-600">
                👤 Apresentador: {solicitacao.apresentador}
              </p>
              {solicitacao.data_hora_agendada && (
                <p className="text-xs text-blue-600 font-medium">
                  📅 Agendado para: {new Date(solicitacao.data_hora_agendada).toLocaleString("pt-BR")}
                  {solicitacao.data_hora_agendada_fim &&
                    ` até ${new Date(solicitacao.data_hora_agendada_fim).toLocaleTimeString("pt-BR")}`}
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
          <SolicitacaoDetalhes solicitacao={solicitacao} />

          {solicitacao.status !== "cancelada" && (
            <div className="space-y-3">
              {(solicitacao.horario_inicio_desejado || solicitacao.horario_fim_desejado) && (
                <p className="text-xs text-slate-600">
                  Horário sugerido pelo solicitante: {solicitacao.horario_inicio_desejado || "-"} às{" "}
                  {solicitacao.horario_fim_desejado || "-"}
                </p>
              )}
              <div className="grid grid-cols-1 gap-3 rounded-md bg-slate-50 p-3 sm:grid-cols-4">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-700">Data/hora início</span>
                  <TextInput
                    type="datetime-local"
                    value={dataHora}
                    onChange={(e) => setDataHora(e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-slate-700">Data/hora término</span>
                  <TextInput
                    type="datetime-local"
                    value={dataHoraFim}
                    onChange={(e) => setDataHoraFim(e.target.value)}
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
                      dataSelecionada={dataHora ? dataHora.slice(0, 10) : solicitacao.data_desejada}
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
                disabled={salvando || !dataHora || !dataHoraFim || dataHoraFim <= dataHora || !apresentador}
                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
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
                onClick={() => setConfirmaCancelar("confirmar")}
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
      {confirmaCancelar === "confirmar" && (
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
                onClick={() => setConfirmaCancelar("motivo")}
                disabled={salvando}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Sim, continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de motivo do cancelamento */}
      {confirmaCancelar === "motivo" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl max-w-md">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Motivo do cancelamento</h2>
            <p className="text-sm text-slate-600 mb-4">Por favor, selecione o motivo:</p>

            <div className="space-y-2 mb-6">
              {MOTIVOS_CANCELAMENTO.map((motivo) => (
                <button
                  key={motivo}
                  onClick={() => {
                    setMotivoSelecionado(motivo);
                    if (motivo !== "Outro motivo") {
                      setMotivoCancelamento(motivo);
                    }
                  }}
                  className={`w-full px-4 py-2 text-left rounded-md text-sm font-medium transition-colors ${
                    motivoSelecionado === motivo
                      ? "bg-red-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {motivo}
                </button>
              ))}
            </div>

            {motivoSelecionado === "Outro motivo" && (
              <label className="mb-6 flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Descreva o motivo:</span>
                <TextArea
                  value={motivoCancelamento}
                  onChange={(e) => setMotivoCancelamento(e.target.value)}
                  placeholder="Escreva o motivo do cancelamento..."
                  rows={4}
                />
              </label>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setConfirmaCancelar(false);
                  setMotivoCancelamento("");
                  setMotivoSelecionado(null);
                }}
                disabled={salvando}
                className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                onClick={async () => {
                  const motivoFinal = motivoSelecionado === "Outro motivo"
                    ? motivoCancelamento
                    : (motivoSelecionado || "");
                  await handleStatus("cancelada", motivoFinal);
                  setConfirmaCancelar(false);
                  setMotivoCancelamento("");
                  setMotivoSelecionado(null);
                }}
                disabled={salvando || !motivoSelecionado || (motivoSelecionado === "Outro motivo" && !motivoCancelamento.trim())}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirmar cancelamento
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
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Horário de início</span>
                <TextInput
                  type="time"
                  value={horarioInicioRemarcar}
                  onChange={(e) => setHorarioInicioRemarcar(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Horário de fim</span>
                <TextInput
                  type="time"
                  value={horarioFimRemarcar}
                  onChange={(e) => setHorarioFimRemarcar(e.target.value)}
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
