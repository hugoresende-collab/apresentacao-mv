"use client";

import Link from "next/link";

export default function TermosDeusoPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>

        <h1 className="mb-8 text-3xl font-bold text-slate-900">Termos de Uso</h1>

        <div className="space-y-6 text-slate-700">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">1. Aceitação dos Termos</h2>
            <p>
              Ao acessar e utilizar a plataforma de Solicitação de Demonstrações da MV, você concorda em estar vinculado
              aos presentes Termos de Uso. Se você não concorda com qualquer parte destes termos, não acesse ou use a
              plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">2. Uso Autorizado</h2>
            <p>
              Esta plataforma é destinada exclusivamente para uso interno pela MV e suas contas autorizadas (@mv.com.br).
              Você concorda em:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Usar a plataforma apenas para fins comerciais legítimos relacionados à demonstração de produtos MV</li>
              <li>Não utilizar a plataforma para fins ilegais, fraudulentos ou prejudiciais</li>
              <li>Não compartilhar credenciais de acesso com terceiros não autorizados</li>
              <li>Respeitar a propriedade intelectual da MV</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">3. Responsabilidade do Usuário</h2>
            <p>
              Você é responsável por manter a confidencialidade de suas credenciais de login e por todas as atividades
              realizadas sob sua conta. Notifique imediatamente a MV sobre qualquer acesso não autorizado.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">4. Limitação de Responsabilidade</h2>
            <p>
              A plataforma é fornecida "como está". A MV não se responsabiliza por interrupções, erros ou perdas de dados
              decorrentes do uso ou impossibilidade de uso da plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">5. Modificações dos Termos</h2>
            <p>
              A MV reserva-se o direito de modificar estes termos a qualquer momento. As mudanças entrarão em vigor
              imediatamente após serem publicadas na plataforma.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">6. Contato</h2>
            <p>Para dúvidas sobre estes Termos de Uso, entre em contato com administrativo@mv.com.br</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-500">Última atualização: 2026-07-06</p>
        </div>
      </div>
    </div>
  );
}
