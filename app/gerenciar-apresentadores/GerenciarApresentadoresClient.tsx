"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TextInput } from "@/components/FormField";
import type { Apresentador } from "@/lib/types";

export default function GerenciarApresentadoresClient({ nomeUsuario }: { nomeUsuario: string }) {
  const [apresentadores, setApresentadores] = useState<Apresentador[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [deletando, setDeletando] = useState<string | null>(null);
  const [autorizando, setAutorizando] = useState<string | null>(null);

  useEffect(() => {
    carregarApresentadores();

    // Listener para quando a página recebe foco (volta do redirect do Google OAuth)
    const handleFocus = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get("sucesso") === "true") {
        console.log("Sucesso detectado, recarregando...");
        // Remover parâmetro da URL
        window.history.replaceState({}, document.title, window.location.pathname);
        // Recarregar apresentadores para refletir a mudança
        setTimeout(() => carregarApresentadores(), 300);
      }
    };

    window.addEventListener("focus", handleFocus);

    // Verificar imediatamente ao carregar
    const params = new URLSearchParams(window.location.search);
    if (params.get("sucesso") === "true") {
      console.log("Sucesso na carga inicial");
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => carregarApresentadores(), 300);
    }

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  async function carregarApresentadores() {
    setCarregando(true);
    try {
      const res = await fetch("/api/apresentadores");
      const data = await res.json();
      console.log("Apresentadores carregados:", data.apresentadores);
      setApresentadores(data.apresentadores || []);
    } catch (error) {
      console.error("Erro ao carregar apresentadores:", error);
    }
    setCarregando(false);
  }

  async function adicionarApresentador() {
    if (!novoNome.trim() || !novoEmail.trim()) {
      alert("Nome e email são obrigatórios");
      return;
    }

    setAdicionando(true);
    try {
      const res = await fetch("/api/apresentadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: novoNome,
          email: novoEmail,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao adicionar apresentador");
        return;
      }

      setNovoNome("");
      setNovoEmail("");
      await carregarApresentadores();
    } catch (error) {
      console.error("Erro ao adicionar apresentador:", error);
      alert("Erro ao adicionar apresentador");
    } finally {
      setAdicionando(false);
    }
  }

  async function removerApresentador(id: string) {
    if (!confirm("Tem certeza que deseja remover este apresentador?")) {
      return;
    }

    setDeletando(id);
    try {
      const res = await fetch(`/api/apresentadores/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erro ao remover apresentador");
        return;
      }

      await carregarApresentadores();
    } catch (error) {
      console.error("Erro ao remover apresentador:", error);
      alert("Erro ao remover apresentador");
    } finally {
      setDeletando(null);
    }
  }

  async function autorizarGoogleCalendar(apresentadorNome: string) {
    try {
      setAutorizando(apresentadorNome);
      // Redireciona para o endpoint de autorização
      window.location.href = `/api/apresentadores/google-oauth/auth?apresentador=${encodeURIComponent(apresentadorNome)}`;
    } catch (error) {
      console.error("Erro ao iniciar autorização:", error);
      setAutorizando(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Gerenciar Apresentadores"
        subtitulo="Adicione, remova e configure as credenciais do Google Calendar para cada apresentador."
      />

      {/* Formulário de adição */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="font-semibold text-slate-900 mb-4">Adicionar Novo Apresentador</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700">Nome *</span>
            <TextInput
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Ex: João Silva"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-700">Email *</span>
            <TextInput
              type="email"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="Ex: joao@mv.com.br"
            />
          </label>
          <label className="flex flex-col gap-1 sm:pt-6">
            <button
              onClick={adicionarApresentador}
              disabled={adicionando}
              className="px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {adicionando ? "Adicionando..." : "Adicionar"}
            </button>
          </label>
        </div>
      </div>

      {/* Lista de apresentadores */}
      {carregando ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : apresentadores.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum apresentador cadastrado ainda.</p>
      ) : (
        <div className="space-y-4">
          {apresentadores.map((apresentador) => {
            const autorizado = !!apresentador.google_calendar_token;

            return (
              <div key={apresentador.id} className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{apresentador.nome}</p>
                    <p className="text-sm text-slate-500">{apresentador.email}</p>
                    {autorizado && (
                      <p className="text-xs text-emerald-600 mt-2">
                        ✅ Google Calendar autorizado em{" "}
                        {apresentador.data_autorizacao
                          ? new Date(apresentador.data_autorizacao).toLocaleString("pt-BR")
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => autorizarGoogleCalendar(apresentador.nome)}
                      disabled={autorizando === apresentador.nome}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        autorizando === apresentador.nome
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : autorizado
                          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      }`}
                    >
                      {autorizando === apresentador.nome
                        ? "Autorizando..."
                        : autorizado
                        ? "✅ Reautorizar Google Calendar"
                        : "Autorizar Google Calendar"}
                    </button>
                    <button
                      onClick={() => removerApresentador(apresentador.id)}
                      disabled={deletando === apresentador.id}
                      className="px-4 py-2 rounded-md text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
                    >
                      {deletando === apresentador.id ? "Removendo..." : "Remover"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
