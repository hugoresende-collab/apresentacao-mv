"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { TextInput } from "@/components/FormField";
import type { ResultadoComercial, SolicitacaoDemo } from "@/lib/types";

export default function ResultadoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [solicitacao, setSolicitacao] = useState<SolicitacaoDemo | null>(null);
  const [propostaGerada, setPropostaGerada] = useState(false);
  const [propostaFechada, setPropostaFechada] = useState(false);
  const [valorProposta, setValorProposta] = useState("");
  const [contratoCancelado, setContratoCancelado] = useState(false);
  const [atualizadoPor, setAtualizadoPor] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/solicitacoes/${id}`)
      .then((res) => res.json())
      .then((data: { solicitacao?: SolicitacaoDemo; resultado?: ResultadoComercial; error?: string }) => {
        if (data.error) {
          setErro(data.error);
          return;
        }
        setSolicitacao(data.solicitacao!);
        if (data.resultado) {
          setPropostaGerada(!!data.resultado.proposta_gerada);
          setPropostaFechada(!!data.resultado.proposta_fechada);
          setValorProposta(data.resultado.valor_proposta?.toString() || "");
          setContratoCancelado(!!data.resultado.contrato_cancelado);
          setAtualizadoPor(data.resultado.atualizado_por || "");
        }
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);

    const res = await fetch(`/api/solicitacoes/${id}/resultado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposta_gerada: propostaGerada,
        proposta_fechada: propostaFechada,
        valor_proposta: valorProposta || null,
        contrato_cancelado: contratoCancelado,
        atualizado_por: atualizadoPor || null,
      }),
    });

    setSalvando(false);
    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || "Erro ao salvar.");
      return;
    }
    setSalvo(true);
  }

  if (erro && !solicitacao) return <p className="text-sm text-red-600">{erro}</p>;
  if (!solicitacao) return <p className="text-sm text-slate-500">Carregando...</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Resultado comercial</h1>
        <p className="text-sm text-slate-600">
          {solicitacao.nome_instituicao} — {solicitacao.produto_apresentar}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={propostaGerada}
            onChange={(e) => setPropostaGerada(e.target.checked)}
          />
          Proposta gerada
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={propostaFechada}
            onChange={(e) => setPropostaFechada(e.target.checked)}
          />
          Proposta fechada
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Valor da proposta (R$)</span>
          <TextInput
            type="number"
            step="0.01"
            value={valorProposta}
            onChange={(e) => setValorProposta(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={contratoCancelado}
            onChange={(e) => setContratoCancelado(e.target.checked)}
          />
          Contrato cancelado após esta demo
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Atualizado por</span>
          <TextInput value={atualizadoPor} onChange={(e) => setAtualizadoPor(e.target.value)} />
        </label>

        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {salvo && <p className="text-sm text-emerald-700">Resultado salvo com sucesso.</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/agendar")}
            className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Voltar
          </button>
        </div>
      </form>
    </div>
  );
}
