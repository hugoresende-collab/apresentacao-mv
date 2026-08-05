"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const MENSAGENS_ERRO: Record<string, string> = {
  invalid_state: "Sessão de login expirou ou é inválida. Tente novamente.",
  domain_not_allowed: "Apenas contas do domínio @mv.com.br podem acessar esta ferramenta.",
  auth_failed: "Não foi possível concluir o login com Google. Tente novamente.",
};

export default function LoginErrorBanner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [visivel, setVisivel] = useState(!!error);

  useEffect(() => {
    if (error) {
      setVisivel(true);
      const timer = setTimeout(() => setVisivel(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!error || !visivel) return null;

  const mensagem = MENSAGENS_ERRO[error] || "Ocorreu um erro ao tentar entrar.";

  return (
    <div className="fixed top-4 left-4 right-4 max-w-md mx-auto z-50 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 shadow-lg flex items-start gap-3">
        <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
        <div className="flex-1">
          {mensagem}
        </div>
        <button
          onClick={() => setVisivel(false)}
          className="flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
