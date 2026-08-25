"use client";

import { useEffect, useState, useLayoutEffect } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TextInput, TextArea } from "@/components/FormField";
import { useRouter } from "next/navigation";
import { NpsModal } from "@/components/NpsModal";
import { ErrorToast } from "@/components/ErrorToast";
import { SolicitacaoDetalhes } from "@/components/SolicitacaoDetalhes";
import { DUPLICAR_STORAGE_KEY } from "@/lib/types";
import type { SolicitacaoDemo } from "@/lib/types";

export default function MinhasSolicitacoesClient() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoDemo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    try {
      const res = await fetch("/api/solicitacoes?minhas=1");
      const data = await res.json();
      if (data.error) {
        setErro(data.error);
        return;
      }
      setSolicitacoes(data.solicitacoes);
    } catch (e) {
      console.error("Erro ao carregar solicitações:", e);
    }
  };

  useEffect(() => {
    carregar();

    let interval: ReturnType<typeof setInterval> | null = null;

    function iniciarPolling() {
      if (interval) return;
      interval = setInterval(carregar, 30000);
    }

    function pararPolling() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        pararPolling();
      } else {
        carregar();
        iniciarPolling();
      }
    }

    if (!document.hidden) {
      iniciarPolling();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      pararPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Minhas solicitações"
        subtitulo="Acompanhe o status das demonstrações que você solicitou."
      />

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      {!solicitacoes && !erro ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : solicitacoes && solicitacoes.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          Você ainda não solicitou nenhuma demonstração.{" "}
          <Link href="/" className="text-slate-900 underline">
            Solicitar agora
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {solicitacoes?.map((s) => (
            <SolicitacaoRow key={s.id} solicitacao={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function SolicitacaoRow({ solicitacao: initialSolicitacao }: { solicitacao: SolicitacaoDemo }) {
  const router = useRouter();
  const [solicitacao, setSolicitacao] = useState(initialSolicitacao);
  const [aberto, setAberto] = useState(false);
  const [confirmaCancelar, setConfirmaCancelar] = useState<"confirmar" | "motivo" | false>(false);
  const [cancelando, setCancelando] = useState(false);
  const [npsDados, setNpsDados] = useState<{ nota: number } | null>(null);
  const [carregandoNps, setCarregandoNps] = useState(false);
  const [remarcar, setRemarcar] = useState(false);
  const [novaDataDesejada, setNovaDataDesejada] = useState(initialSolicitacao.data_desejada);
  const [horarioInicio, setHorarioInicio] = useState(initialSolicitacao.horario_inicio_desejado || "");
  const [horarioFim, setHorarioFim] = useState(initialSolicitacao.horario_fim_desejado || "");
  const [remarcarloading, setRemarcarLoading] = useState(false);
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  useEffect(() => {
    if (erroAcao) {
      const timer = setTimeout(() => setErroAcao(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [erroAcao]);

  useLayoutEffect(() => {
    setSolicitacao(initialSolicitacao);
    setNovaDataDesejada(initialSolicitacao.data_desejada);
    setHorarioInicio(initialSolicitacao.horario_inicio_desejado || "");
    setHorarioFim(initialSolicitacao.horario_fim_desejado || "");
  }, [initialSolicitacao]);

  useEffect(() => {
    if (solicitacao.status === "realizada") {
      carregarNps();
    }
  }, [solicitacao.id, solicitacao.status]);

  async function carregarNps() {
    setCarregandoNps(true);
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacao.id}/nps`);
      const data = await res.json();
      if (data.nps) {
        setNpsDados(data.nps);
      }
    } catch (error) {
      console.error("Erro ao carregar NPS:", error);
    } finally {
      setCarregandoNps(false);
    }
  }

  async function handleCancelar() {
    setCancelando(true);
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacao.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelada",
          motivo_cancelamento: motivoCancelamento,
        }),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      if (!res.ok || !data?.solicitacao) {
        setErroAcao(data?.error || "Não foi possível cancelar a solicitação. Tente novamente.");
        setCancelando(false);
        return;
      }

      setSolicitacao(data.solicitacao);
      setMotivoCancelamento("");
      setConfirmaCancelar(false);
    } catch (e) {
      console.error("Erro ao cancelar:", e);
      setErroAcao("Não foi possível cancelar a solicitação. Tente novamente.");
    }
    setCancelando(false);
  }

  async function handleRemarcar() {
    setRemarcarLoading(true);
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacao.id}/remarcar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nova_data_desejada: novaDataDesejada,
          horario_inicio_desejado: horarioInicio,
          horario_fim_desejado: horarioFim,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.solicitacao) {
        setErroAcao(data?.error || "Não foi possível remarcar a solicitação. Tente novamente.");
        setRemarcarLoading(false);
        return;
      }

      setSolicitacao(data.solicitacao);
      setNovaDataDesejada(data.solicitacao.data_desejada);
      setHorarioInicio(data.solicitacao.horario_inicio_desejado || "");
      setHorarioFim(data.solicitacao.horario_fim_desejado || "");
      setRemarcar(false);
    } catch (e) {
      console.error("Erro ao remarcar:", e);
      setErroAcao("Não foi possível remarcar a solicitação. Tente novamente.");
    }
    setRemarcarLoading(false);
  }

  function handleDuplicar() {
    const {
      unidade_regional,
      nome_instituicao,
      natureza_instituicao,
      porte_instituicao,
      cidade,
      tipo_unidade,
      solucao_atual,
      solucao_atual_outros,
      tipo_oportunidade,
      tipo_projeto,
      produto_apresentar,
      observacao_apresentacao,
      nome_patrocinador,
      email_patrocinador,
      codigo_oportunidade,
      numero_visitas,
      valor_aproximado_projeto,
      percentual_evolucao_crm,
      atende_sus,
      atende_convenio_particular,
      possui_pronto_socorro,
      possui_ambulatorio,
      dor_prospect,
      problemas_atendimento_paciente,
      problemas_area_assistencial,
      problemas_suprimentos,
      problemas_faturamento,
      problemas_financeiro_contabil,
      problemas_diagnostico_terapia,
      tipo_apresentacao,
      endereco_apresentacao,
      periodo,
      horario_inicio_desejado,
      horario_fim_desejado,
      observacoes,
    } = solicitacao;

    sessionStorage.setItem(
      DUPLICAR_STORAGE_KEY,
      JSON.stringify({
        unidade_regional,
        nome_instituicao,
        natureza_instituicao,
        porte_instituicao,
        cidade,
        tipo_unidade,
        solucao_atual,
        solucao_atual_outros,
        tipo_oportunidade,
        tipo_projeto,
        produto_apresentar,
        observacao_apresentacao,
        nome_patrocinador,
        email_patrocinador,
        codigo_oportunidade,
        numero_visitas,
        valor_aproximado_projeto,
        percentual_evolucao_crm,
        atende_sus,
        atende_convenio_particular,
        possui_pronto_socorro,
        possui_ambulatorio,
        dor_prospect,
        problemas_atendimento_paciente,
        problemas_area_assistencial,
        problemas_suprimentos,
        problemas_faturamento,
        problemas_financeiro_contabil,
        problemas_diagnostico_terapia,
        tipo_apresentacao,
        endereco_apresentacao,
        periodo,
        horario_inicio_desejado,
        horario_fim_desejado,
        observacoes,
      })
    );
    router.push("/");
  }

  return (
    <>
      {erroAcao && <ErrorToast titulo="Erro" mensagem={erroAcao} />}

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <button
          className="flex w-full items-start justify-between gap-4 text-left"
          onClick={() => setAberto(!aberto)}
        >
          <div className="flex-1">
            <p className="font-medium text-slate-900">
              {solicitacao.nome_instituicao} — {solicitacao.produto_apresentar}
              {solicitacao.codigo_solicitacao && (
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono font-normal text-slate-500">
                  {solicitacao.codigo_solicitacao}
                </span>
              )}
            </p>
            <p className="text-sm text-slate-500">
              {solicitacao.cidade} · solicitado em{" "}
              {new Date(solicitacao.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div className="flex-shrink-0 pt-1">
            <StatusBadge status={solicitacao.status} />
          </div>
        </button>

        {aberto && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <SolicitacaoDetalhes solicitacao={solicitacao} />
          </div>
        )}

        {solicitacao.status === "demo agendada" || solicitacao.status === "realizada" ? (
          <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-sm">
            <Info
              label="Data/hora agendada"
              value={
                solicitacao.data_hora_agendada
                  ? new Date(solicitacao.data_hora_agendada).toLocaleString("pt-BR")
                  : "-"
              }
            />
            <Info label="Local/link" value={solicitacao.link_ou_local || "-"} />
          </dl>
        ) : (
          <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-500">
            Data(s) sugerida(s): {[solicitacao.data_desejada, solicitacao.data_desejada_2, solicitacao.data_desejada_3].filter(Boolean).join(", ")}
            {solicitacao.periodo ? ` (${solicitacao.periodo})` : ""}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {solicitacao.status === "realizada" && (
            <div className="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 flex items-center gap-1">
              {carregandoNps ? "Carregando..." : npsDados ? (
                <>
                  Avaliação: <span className="font-semibold">{npsDados.nota}</span>/10
                </>
              ) : (
                "Nenhuma avaliação registrada"
              )}
            </div>
          )}
          {solicitacao.status === "demo agendada" && (
            <button
              onClick={() => setRemarcar(true)}
              className="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200"
            >
              Remarcar
            </button>
          )}
          {solicitacao.status === "solicitado" && (
            <button
              onClick={() => setRemarcar(true)}
              className="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200"
            >
              Remarcar
            </button>
          )}
          {solicitacao.status !== "cancelada" && solicitacao.status !== "realizada" && (
            <button
              onClick={() => setConfirmaCancelar("confirmar")}
              className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
            >
              Cancelar solicitação
            </button>
          )}
          <button
            onClick={handleDuplicar}
            className="rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
          >
            Duplicar
          </button>
        </div>
      </div>

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
                  value={horarioInicio}
                  onChange={(e) => setHorarioInicio(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-700">Horário de fim</span>
                <TextInput
                  type="time"
                  value={horarioFim}
                  onChange={(e) => setHorarioFim(e.target.value)}
                />
              </label>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRemarcar(false)}
                disabled={remarcarloading}
                className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemarcar}
                disabled={remarcarloading || !novaDataDesejada}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de cancelamento */}
      {confirmaCancelar === "confirmar" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl max-w-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Confirmar cancelamento</h2>
            <p className="text-sm text-slate-600 mb-4">
              Tem certeza que deseja cancelar a solicitação de demonstração para <b>{solicitacao.nome_instituicao}</b>?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmaCancelar(false)}
                disabled={cancelando}
                className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
              >
                Não, voltar
              </button>
              <button
                onClick={() => setConfirmaCancelar("motivo")}
                disabled={cancelando}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Sim, continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de motivo de cancelamento */}
      {confirmaCancelar === "motivo" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl max-w-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Motivo do cancelamento</h2>
            <p className="text-sm text-slate-600 mb-4">
              Por favor, informe o motivo do cancelamento:
            </p>
            <label className="flex flex-col gap-2 mb-6">
              <TextArea
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Ex: Cliente não mais interessado, mudança de prioridade, etc..."
                rows={4}
              />
            </label>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setConfirmaCancelar(false);
                  setMotivoCancelamento("");
                }}
                disabled={cancelando}
                className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                onClick={handleCancelar}
                disabled={cancelando || !motivoCancelamento.trim()}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Confirmar cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
