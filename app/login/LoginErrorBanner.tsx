"use client";

import { useSearchParams } from "next/navigation";

const MENSAGENS_ERRO: Record<string, string> = {
  invalid_state: "Sessão de login expirou ou é inválida. Tente novamente.",
  domain_not_allowed: "Apenas contas do domínio @mv.com.br podem acessar esta ferramenta.",
  auth_failed: "Não foi possível concluir o login com Google. Tente novamente.",
};

export default function LoginErrorBanner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  const mensagem = MENSAGENS_ERRO[error] || "Ocorreu um erro ao tentar entrar.";

  return (
    <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
      {mensagem}
    </div>
  );
}
