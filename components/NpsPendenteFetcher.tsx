"use client";

import { useEffect, useState } from "react";
import { NpsModal } from "./NpsModal";

export function NpsPendenteFetcher() {
  const [npsPendente, setNpsPendente] = useState<{
    id: string;
    nome_instituicao: string;
    produto_apresentar: string;
  } | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const verificarNps = async () => {
      try {
        const res = await fetch("/api/solicitacoes/nps-pendente");
        const data = await res.json();
        setNpsPendente(data.nps_pendente);
      } catch (error) {
        console.error("Erro ao verificar NPS pendente:", error);
      } finally {
        setCarregando(false);
      }
    };

    verificarNps();
  }, []);

  if (carregando) return null;

  return (
    <NpsModal
      isOpen={!!npsPendente}
      solicitacaoId={npsPendente?.id || ""}
      nomeInstituicao={npsPendente?.nome_instituicao || ""}
      onClose={() => setNpsPendente(null)}
    />
  );
}
