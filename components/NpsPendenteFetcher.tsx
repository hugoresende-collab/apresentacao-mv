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

  const verificarNps = async () => {
    try {
      const res = await fetch("/api/solicitacoes/nps-pendente");
      const data = await res.json();
      setNpsPendente(data.nps_pendente);
    } catch (error) {
      console.error("Erro ao verificar NPS pendente:", error);
    }
  };

  useEffect(() => {
    const carregar = async () => {
      await verificarNps();
      setCarregando(false);
    };
    carregar();
  }, []);

  const handleClose = () => {
    setNpsPendente(null);
    // Recarrega a query após fechar o modal
    setTimeout(() => {
      verificarNps();
    }, 2000);
  };

  if (carregando) return null;

  return (
    <NpsModal
      isOpen={!!npsPendente}
      solicitacaoId={npsPendente?.id || ""}
      nomeInstituicao={npsPendente?.nome_instituicao || ""}
      onClose={handleClose}
    />
  );
}
