import { Suspense } from "react";
import LoginErrorBanner from "./LoginErrorBanner";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-sm space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">Solicitação de Demonstrações</h1>
          <p className="mt-1 text-sm text-slate-600">Acesse com sua conta corporativa da MV.</p>
        </div>

        <Suspense fallback={null}>
          <LoginErrorBanner />
        </Suspense>

        <a
          href="/api/google/auth"
          className="flex h-12 w-full items-center justify-center gap-3 rounded-full border-2 border-slate-100 bg-white font-semibold text-slate-800 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.88c2.27-2.09 3.57-5.17 3.57-8.8z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-2.98c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.74-2.1-6.68-4.92H1.32v3.07C3.29 21.3 7.31 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.32 14.35A7.2 7.2 0 0 1 4.94 12c0-.82.14-1.61.38-2.35V6.58H1.32A11.97 11.97 0 0 0 0 12c0 1.93.46 3.76 1.32 5.42l4-3.07z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.29 2.7 1.32 6.58l4 3.07C6.26 6.85 8.89 4.75 12 4.75z"
            />
          </svg>
          Entrar com Google
        </a>

        <p className="text-center text-xs text-slate-400">
          Apenas contas do domínio @mv.com.br têm acesso.
        </p>
      </div>
    </div>
  );
}
