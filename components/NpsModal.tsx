"use client";

import { useState } from "react";

interface NpsModalProps {
  isOpen: boolean;
  solicitacaoId: string;
  nomeInstituicao: string;
  onClose: () => void;
}

export function NpsModal({ isOpen, solicitacaoId, nomeInstituicao, onClose }: NpsModalProps) {
  const [nota, setNota] = useState<number | null>(null);
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async () => {
    if (nota === null) return;

    setEnviando(true);
    try {
      const res = await fetch(`/api/solicitacoes/${solicitacaoId}/nps`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nota, comentario: comentario || null }),
      });

      if (res.ok) {
        setEnviado(true);
        setTimeout(() => {
          setNota(null);
          setComentario("");
          setEnviado(false);
          onClose();
        }, 1500);
      } else {
        console.error("Erro ao enviar NPS:", await res.json());
        setEnviando(false);
      }
    } catch (error) {
      console.error("Erro ao enviar NPS:", error);
      setEnviando(false);
    }
  };


  if (!isOpen) return null;

  if (enviado) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 shadow-xl max-w-md text-center">
          <p className="text-2xl mb-2">✓</p>
          <h2 className="text-lg font-semibold text-emerald-900 mb-2">Avaliação enviada!</h2>
          <p className="text-sm text-emerald-700">Obrigado pelo seu feedback. Seus dados foram registrados com sucesso.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl max-w-md">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Como foi a demonstração?</h2>
        <p className="text-sm text-slate-600 mb-6">
          Sua avaliação para <b>{nomeInstituicao}</b> nos ajuda a melhorar continuamente.
        </p>

        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-3">Nota (0-10)</p>
          <div className="flex gap-2 justify-center flex-wrap">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <button
                key={num}
                onClick={() => setNota(num)}
                className={`w-10 h-10 rounded-md font-semibold transition-colors ${
                  nota === num
                    ? "bg-[#214B63] text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">0 = Não lhe agradou muito · 10 = Atendeu as expectativas</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Comentário (opcional)
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Deixe seu feedback..."
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleSubmit}
            disabled={enviando || nota === null}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Enviar avaliação
          </button>
        </div>
      </div>
    </div>
  );
}
