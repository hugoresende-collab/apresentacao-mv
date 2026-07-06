"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import type { SolicitacaoDemo } from "@/lib/types";

export default function MinhasSolicitacoesClient() {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoDemo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/solicitacoes?minhas=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setErro(data.error);
          return;
        }
        setSolicitacoes(data.solicitacoes);
      });
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

function SolicitacaoRow({ solicitacao }: { solicitacao: SolicitacaoDemo }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-medium text-slate-900">
            {solicitacao.nome_instituicao} — {solicitacao.produto_apresentar}
          </p>
          <p className="text-sm text-slate-500">
            {solicitacao.cidade} · solicitado em{" "}
            {new Date(solicitacao.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
        <StatusBadge status={solicitacao.status} />
      </div>

      {solicitacao.status === "agendado" || solicitacao.status === "realizado" ? (
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

      {solicitacao.status === "realizado" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/nps/${solicitacao.id}`}
            className="rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700"
          >
            Responder NPS
          </Link>
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
