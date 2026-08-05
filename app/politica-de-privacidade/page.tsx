"use client";

import Link from "next/link";

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link href="/login" className="mb-6 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>

        <h1 className="mb-8 text-3xl font-bold text-slate-900">Política de Privacidade</h1>

        <div className="space-y-6 text-slate-700">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">1. Introdução</h2>
            <p>
              A MV está comprometida com a proteção de seus dados pessoais. Esta Política de Privacidade descreve como
              coletamos, usamos e protegemos os dados pessoais fornecidos na plataforma de Solicitação de Demonstrações.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">2. Dados Coletados</h2>
            <p>Coletamos os seguintes dados pessoais:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Nome e email (via Google OAuth)</li>
              <li>Informações de solicitações de demonstração (instituição, cidade, produtos, datas, etc.)</li>
              <li>Dados de agendamento e feedback (NPS)</li>
              <li>Resultado comercial das demonstrações</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">3. Finalidade do Tratamento</h2>
            <p>Utilizamos seus dados para:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Processar e acompanhar solicitações de demonstração de produtos</li>
              <li>Agendar demonstrações e enviar confirmações</li>
              <li>Coletar feedback via NPS</li>
              <li>Acompanhar resultados comerciais</li>
              <li>Melhorar a plataforma e os serviços prestados</li>
              <li>Cumprir obrigações legais e regulatórias</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">4. Compartilhamento de Dados</h2>
            <p>
              Seus dados podem ser compartilhados internamente com equipes administrativas e comerciais autorizadas da MV
              apenas para fins relacionados ao processamento de sua solicitação. Não compartilhamos dados com terceiros
              externos sem seu consentimento expresso, exceto quando legalmente obrigados.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">5. Segurança dos Dados</h2>
            <p>
              Implementamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado,
              alteração, divulgação ou destruição. Incluindo:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Criptografia de dados em trânsito (HTTPS)</li>
              <li>Autenticação segura via Google OAuth</li>
              <li>Controle de acesso baseado em domínio (@mv.com.br)</li>
              <li>Armazenamento seguro em servidores certificados</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">6. Retenção de Dados</h2>
            <p>
              Mantemos seus dados pessoais enquanto sua conta estiver ativa e pelos períodos necessários para cumprir
              obrigações legais. Você pode solicitar a exclusão de seus dados a qualquer momento entrando em contato com
              administrativo@mv.com.br
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">7. Seus Direitos</h2>
            <p>Você tem o direito de:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Acessar seus dados pessoais armazenados</li>
              <li>Solicitar correção de dados incorretos</li>
              <li>Solicitar exclusão de dados (direito ao esquecimento)</li>
              <li>Receber uma cópia de seus dados em formato portável</li>
              <li>Objetar ao tratamento de seus dados</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">8. Cookies e Tecnologias de Rastreamento</h2>
            <p>
              A plataforma utiliza cookies httpOnly seguros para gerenciar sessões de usuário. Esses cookies são
              essenciais para o funcionamento da plataforma e não podem ser desativados sem perder a funcionalidade de
              login.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">9. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta Política de Privacidade a qualquer momento. As mudanças entrarão em vigor
              imediatamente após a publicação. Recomendamos que você revise periodicamente esta política.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-semibold text-slate-900">10. Contato</h2>
            <p>Para exercer seus direitos ou esclarecer dúvidas sobre privacidade, entre em contato com:</p>
            <p className="mt-2 font-medium">administrativo@mv.com.br</p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-200">
          <p className="text-sm text-slate-500">Última atualização: 2026-07-06</p>
        </div>
      </div>
    </div>
  );
}
