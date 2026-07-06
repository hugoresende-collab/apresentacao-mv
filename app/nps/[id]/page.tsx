"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { TextArea } from "@/components/FormField";
import type { NpsDemo, SolicitacaoDemo } from "@/lib/types";

export default function NpsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [solicitacao, setSolicitacao] = useState<SolicitacaoDemo | null>(null);
  const [npsExistente, setNpsExistente] = useState<NpsDemo | null>(null);
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/solicitacoes/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setErro(data.error);
          return;
        }
        setSolicitacao(data.solicitacao);
        if (data.nps) {
          setNpsExistente(data.nps);
          setNota(data.nps.nota);
          setComentario(data.nps.comentario || "");
        }
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nota === null) return;

    setEnviando(true);
    const res = await fetch(`/api/solicitacoes/${id}/nps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nota, comentario }),
    });
    setEnviando(false);

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || "Erro ao enviar avaliação.");
      return;
    }
    setEnviado(true);
  }

  if (erro) return <p className="text-sm text-red-600">{erro}</p>;
  if (!solicitacao) return <p className="text-sm text-slate-500">Carregando...</p>;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Como foi a demonstração?</h1>
        <p className="text-sm text-slate-600">
          {solicitacao.nome_instituicao} — {solicitacao.produto_apresentar}
        </p>
      </div>

      {enviado || npsExistente ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Obrigado pela avaliação! Nota registrada: <b>{nota}</b>.
          <button
            onClick={() => router.push("/agendar")}
            className="ml-2 underline"
          >
            Voltar
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">
              Em uma escala de 0 a 10, o quanto você recomendaria esta demonstração?
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setNota(n)}
                  className={`h-9 w-9 rounded-md text-sm font-medium ${
                    nota === n ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Comentário (opcional)</span>
            <TextArea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={4} />
          </label>

          <button
            type="submit"
            disabled={nota === null || enviando}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {enviando ? "Enviando..." : "Enviar avaliação"}
          </button>
        </form>
      )}
    </div>
  );
}
