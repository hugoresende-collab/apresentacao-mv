"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { NpsModal } from "@/components/NpsModal";
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
    const interval = setInterval(carregar, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Minhas solicitações</h1>
        <p className="text-sm text-slate-600">Acompanhe o status das demonstrações que você solicitou.</p>
      </div>

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
  const [solicitacao, setSolicitacao] = useState(initialSolicitacao);
  const [confirmaCancelar, setConfirmaCancelar] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [npsAberto, setNpsAberto] = useState(false);
  const [npsRespondido, setNpsRespondido] = useState(false);

  async function handleCancelar() {
    setCancelando(true);
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacao.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelada" }),
      });

      const text = await res.text();
      console.log("Response status:", res.status);
      console.log("Response text:", text);

      if (!text) {
        console.error("Resposta vazia do servidor");
        setCancelando(false);
        setConfirmaCancelar(false);
        return;
      }

      const data = JSON.parse(text);
      if (data.solicitacao) {
        setSolicitacao(data.solicitacao);
      }
    } catch (e) {
      console.error("Erro ao cancelar:", e);
    }
    setCancelando(false);
    setConfirmaCancelar(false);
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium text-slate-900">
              {solicitacao.nome_instituicao} — {solicitacao.produto_apresentar}
            </p>
            <p className="text-sm text-slate-500">
              {solicitacao.cidade} · solicitado em{" "}
              {new Date(solicitacao.created_at).toLocaleDateString("pt-BR")}
            </p>
          </div>
          <div className="flex-shrink-0 pt-1">
            <StatusBadge status={solicitacao.status} />
          </div>
        </div>

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
            Data desejada: {solicitacao.data_desejada}
            {solicitacao.periodo ? ` (${solicitacao.periodo})` : ""}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {solicitacao.status === "realizada" && (
            <Link
              href={`/nps/${solicitacao.id}`}
              className="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700"
            >
              Responder NPS
            </Link>
          )}
          {solicitacao.status !== "cancelada" && solicitacao.status !== "realizada" && (
            <button
              onClick={() => setConfirmaCancelar(true)}
              className="rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
            >
              Cancelar solicitação
            </button>
          )}
        </div>
      </div>

      {/* Modal de confirmação de cancelamento */}
      {confirmaCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl max-w-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Confirmar cancelamento</h2>
            <p className="text-sm text-slate-600 mb-6">
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
                onClick={handleCancelar}
                disabled={cancelando}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Sim, cancelar
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
