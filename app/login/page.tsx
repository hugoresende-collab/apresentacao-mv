import { Suspense } from "react";
import Image from "next/image";
import LoginErrorBanner from "./LoginErrorBanner";

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Content principal - comprimido */}
      <div className="flex items-center justify-center px-4 py-4">
        <div className="w-full max-w-sm space-y-4">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Image src="/logo.webp" alt="Logo MV" width={80} height={80} className="h-16 w-auto" />
          </div>

          {/* Card de login */}
          <div className="space-y-2 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="text-center">
              <h1 className="text-lg font-semibold text-slate-900">Solicitação de Demonstrações</h1>
            </div>

            <Suspense fallback={null}>
              <LoginErrorBanner />
            </Suspense>

            <a
              href="/api/google/auth"
              className="flex h-14 w-full items-center justify-center gap-3 rounded-full border-2 border-slate-100 bg-white font-semibold text-slate-800 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
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

            <p className="text-center text-xs text-slate-600 mb-0">
              Acesse com sua conta corporativa da MV.
            </p>
          </div>
        </div>
      </div>

      {/* Footer links sticky no fundo */}
      <div className="px-4 py-4 border-t border-slate-100 bg-slate-50">
        <div className="flex justify-center gap-6 text-center">
          <a href="/termos-de-uso" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
            Termos de Uso
          </a>
          <span className="text-slate-300">·</span>
          <a href="/politica-de-privacidade" className="text-xs text-slate-500 hover:text-slate-700 transition-colors">
            Política de Privacidade
          </a>
        </div>
      </div>
    </div>
  );
}
