"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { FormField, TextInput, TextArea, Select } from "@/components/FormField";
import { SuccessToast } from "@/components/SuccessToast";
import { ErrorToast } from "@/components/ErrorToast";
import {
  UNIDADES_REGIONAIS,
  TIPOS_UNIDADE,
  NATUREZAS,
  PORTES,
  TIPOS_OPORTUNIDADE,
  TIPOS_PROJETO,
  PRODUTOS,
  TIPOS_APRESENTACAO,
  PERIODOS,
  NUMERO_VISITAS_OPCOES,
  SOLUCOES_ATUAIS,
  PERCENTUAIS_EVOLUCAO_CRM,
} from "@/lib/types";

function estadoInicial(nome: string, email: string) {
  return {
    gerente_conta_nome: nome,
    gerente_conta_email: email,
    unidade_regional: "",
    nome_instituicao: "",
    natureza_instituicao: "",
    porte_instituicao: "",
    cidade: "",
    tipo_unidade: "",
    solucao_atual: "",
    solucao_atual_outros: "",
    tipo_oportunidade: "",
    tipo_projeto: "",
    produto_apresentar: "",
    observacao_apresentacao: "",
    nome_patrocinador: "",
    email_patrocinador: "",
    codigo_oportunidade: "",
    numero_visitas: "",
    valor_aproximado_projeto: "",
    percentual_evolucao_crm: "",
    atende_sus: false,
    atende_convenio_particular: false,
    possui_pronto_socorro: false,
    possui_ambulatorio: false,
    dor_prospect: "",
    problemas_atendimento_paciente: "",
    problemas_area_assistencial: "",
    problemas_suprimentos: "",
    problemas_faturamento: "",
    problemas_financeiro_contabil: "",
    problemas_diagnostico_terapia: "",
    tipo_apresentacao: "",
    endereco_apresentacao: "",
    data_desejada: "",
    data_desejada_2: "",
    data_desejada_3: "",
    periodo: "",
    horario_inicio_desejado: "",
    horario_fim_desejado: "",
    observacoes: "",
  };
}

type EstadoFormulario = ReturnType<typeof estadoInicial>;

export default function NovaSolicitacaoForm({
  nomeUsuario,
  emailUsuario,
}: {
  nomeUsuario: string;
  emailUsuario: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState<EstadoFormulario>(estadoInicial(nomeUsuario, emailUsuario));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [mostrarData2, setMostrarData2] = useState(false);
  const [mostrarData3, setMostrarData3] = useState(false);
  const qualificacaoObrigatoria = form.tipo_oportunidade === "Cliente Novo";

  useEffect(() => {
    if (erro) {
      const timer = setTimeout(() => setErro(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [erro]);

  function getMinDataPresencial(): string {
    const hoje = new Date();
    const min = new Date(hoje);
    min.setDate(min.getDate() + 10);
    return min.toISOString().split("T")[0];
  }

  function update<K extends keyof EstadoFormulario>(campo: K, valor: EstadoFormulario[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  function formatarValorDigitado(valorDigitado: string): string {
    const digitos = valorDigitado.replace(/\D/g, "");
    if (!digitos) return "";
    const numero = Number(digitos) / 100;
    return numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function valorFormatadoParaNumero(valorFormatado: string): string {
    if (!valorFormatado) return "";
    return valorFormatado.replace(/\./g, "").replace(",", ".");
  }

  const CAMPOS_QUALIFICACAO: (keyof EstadoFormulario)[] = [
    "dor_prospect",
    "problemas_atendimento_paciente",
    "problemas_area_assistencial",
    "problemas_suprimentos",
    "problemas_faturamento",
    "problemas_financeiro_contabil",
    "problemas_diagnostico_terapia",
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    // Validar 10 dias para demonstrações presenciais (considera as até 3 datas sugeridas)
    if (form.tipo_apresentacao === "Presencial") {
      const datasSugeridas = [form.data_desejada, form.data_desejada_2, form.data_desejada_3].filter(Boolean);
      const hoje = new Date();
      const dataMinima = new Date(hoje);
      dataMinima.setDate(dataMinima.getDate() + 10);

      const dataInvalida = datasSugeridas.some((data) => new Date(data) < dataMinima);
      if (dataInvalida) {
        setErro("Demonstrações presenciais precisam ser solicitadas com pelo menos 10 dias de antecedência. Verifique todas as datas sugeridas.");
        return;
      }
    }

    if (form.solucao_atual === "Outros" && !form.solucao_atual_outros.trim()) {
      setErro("Informe qual é a solução atual utilizada pelo cliente/prospect.");
      return;
    }

    if (qualificacaoObrigatoria) {
      const curto = CAMPOS_QUALIFICACAO.some((campo) => (form[campo] as string).trim().length < 50);
      if (curto) {
        setErro(
          "Para oportunidades do tipo 'Cliente Novo', todos os campos da seção Dores e qualificação são obrigatórios e precisam ter no mínimo 50 caracteres."
        );
        return;
      }
    }

    setEnviando(true);

    const payload = {
      ...form,
      valor_aproximado_projeto: valorFormatadoParaNumero(form.valor_aproximado_projeto),
    };

    const res = await fetch("/api/solicitacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || "Erro ao enviar solicitação.");
      setEnviando(false);
      return;
    }

    setEnviado(true);
    setTimeout(() => {
      router.push("/minhas-solicitacoes");
    }, 2500);
  }

  return (
    <div className="space-y-6">
      {enviado && (
        <SuccessToast
          titulo="Solicitação enviada com sucesso!"
          mensagem="Em breve você receberá um retorno sobre o agendamento da sua demonstração."
        />
      )}

      {erro && (
        <ErrorToast
          titulo="Erro ao enviar solicitação"
          mensagem={erro}
        />
      )}

      <PageHeader
        titulo="Solicitar demonstração"
        subtitulo="Preencha os dados abaixo. O administrativo receberá a solicitação e fará o agendamento."
      />

      <form onSubmit={handleSubmit} className={`space-y-8 ${enviado ? "pointer-events-none opacity-60" : ""}`}>
        <Secao titulo="Solicitante e instituição">
          <FormField label="Unidade regional" required>
            <Select
              required
              options={UNIDADES_REGIONAIS}
              value={form.unidade_regional}
              onChange={(e) => update("unidade_regional", e.target.value)}
            />
          </FormField>
          <FormField label="Nome da instituição" required>
            <TextInput
              required
              value={form.nome_instituicao}
              onChange={(e) => update("nome_instituicao", e.target.value)}
            />
          </FormField>
          <FormField label="Cidade" required>
            <TextInput required value={form.cidade} onChange={(e) => update("cidade", e.target.value)} />
          </FormField>
          <FormField label="Natureza da instituição" required>
            <Select
              required
              options={NATUREZAS}
              value={form.natureza_instituicao}
              onChange={(e) => update("natureza_instituicao", e.target.value)}
            />
          </FormField>
          <FormField label="Porte" required>
            <Select
              required
              options={PORTES}
              value={form.porte_instituicao}
              onChange={(e) => update("porte_instituicao", e.target.value)}
            />
          </FormField>
          <FormField label="Tipo de unidade" required>
            <Select
              required
              options={TIPOS_UNIDADE}
              value={form.tipo_unidade}
              onChange={(e) => update("tipo_unidade", e.target.value)}
            />
          </FormField>
        </Secao>

        <Secao titulo="Contexto comercial">
          <FormField label="Solução atual do prospect">
            <Select
              value={form.solucao_atual}
              onChange={(e) => update("solucao_atual", e.target.value)}
              options={SOLUCOES_ATUAIS}
            />
          </FormField>
          {form.solucao_atual === "Outros" && (
            <FormField label="Qual solução atual?" required>
              <TextInput
                required
                value={form.solucao_atual_outros}
                onChange={(e) => update("solucao_atual_outros", e.target.value)}
                placeholder="Informe qual é a solução utilizada atualmente"
              />
            </FormField>
          )}
          <FormField label="Tipo de oportunidade" required>
            <Select
              required
              options={TIPOS_OPORTUNIDADE}
              value={form.tipo_oportunidade}
              onChange={(e) => update("tipo_oportunidade", e.target.value)}
            />
          </FormField>
          <FormField label="Tipo de projeto">
            <Select
              options={TIPOS_PROJETO}
              value={form.tipo_projeto}
              onChange={(e) => update("tipo_projeto", e.target.value)}
            />
          </FormField>
          <FormField label="Produto a apresentar" required>
            <Select
              required
              options={PRODUTOS}
              value={form.produto_apresentar}
              onChange={(e) => update("produto_apresentar", e.target.value)}
            />
          </FormField>
          <FormField label="Observação da apresentação">
            <TextArea
              value={form.observacao_apresentacao}
              onChange={(e) => update("observacao_apresentacao", e.target.value)}
              placeholder="Ex: especificar qual módulo, escopo da apresentação, etc."
            />
          </FormField>
          <FormField label="Código da oportunidade">
            <TextInput
              value={form.codigo_oportunidade}
              onChange={(e) => update("codigo_oportunidade", e.target.value)}
            />
          </FormField>
          <FormField label="Número de visitas já realizadas">
            <Select
              options={NUMERO_VISITAS_OPCOES}
              value={form.numero_visitas}
              onChange={(e) => update("numero_visitas", e.target.value)}
            />
          </FormField>
          <FormField label="Valor aproximado do projeto (R$)">
            <TextInput
              type="text"
              inputMode="numeric"
              value={form.valor_aproximado_projeto}
              onChange={(e) => update("valor_aproximado_projeto", formatarValorDigitado(e.target.value))}
              placeholder="Ex: 50.000,00"
            />
          </FormField>
          <FormField label="% de evolução no CRM">
            <Select
              options={PERCENTUAIS_EVOLUCAO_CRM}
              value={form.percentual_evolucao_crm}
              onChange={(e) => update("percentual_evolucao_crm", e.target.value)}
            />
          </FormField>
          <FormField label="Nome do patrocinador (sponsor)">
            <TextInput
              value={form.nome_patrocinador}
              onChange={(e) => update("nome_patrocinador", e.target.value)}
            />
          </FormField>
          <FormField label="Email do patrocinador">
            <TextInput
              type="email"
              value={form.email_patrocinador}
              onChange={(e) => update("email_patrocinador", e.target.value)}
            />
          </FormField>
        </Secao>

        <Secao titulo="Perfil de serviços do prospect">
          <div className="col-span-full flex flex-wrap gap-4">
            <Checkbox
              label="Atende SUS"
              checked={form.atende_sus}
              onChange={(v) => update("atende_sus", v)}
            />
            <Checkbox
              label="Atende convênio/particular"
              checked={form.atende_convenio_particular}
              onChange={(v) => update("atende_convenio_particular", v)}
            />
            <Checkbox
              label="Possui pronto socorro"
              checked={form.possui_pronto_socorro}
              onChange={(v) => update("possui_pronto_socorro", v)}
            />
            <Checkbox
              label="Possui ambulatório"
              checked={form.possui_ambulatorio}
              onChange={(v) => update("possui_ambulatorio", v)}
            />
          </div>
        </Secao>

        <Secao titulo="Dores e qualificação">
          <FormField label="Dor do prospect / motivo de buscar nova solução" required={qualificacaoObrigatoria}>
            <TextArea
              required={qualificacaoObrigatoria}
              minLength={qualificacaoObrigatoria ? 50 : undefined}
              value={form.dor_prospect}
              onChange={(e) => update("dor_prospect", e.target.value)}
            />
          </FormField>
          <FormField
            label="Problemas Identificados na Qualificação Em Relação a Area de Atendimento Ao Paciente"
            required={qualificacaoObrigatoria}
          >
            <TextArea
              required={qualificacaoObrigatoria}
              minLength={qualificacaoObrigatoria ? 50 : undefined}
              value={form.problemas_atendimento_paciente}
              onChange={(e) => update("problemas_atendimento_paciente", e.target.value)}
            />
          </FormField>
          <FormField
            label="Problemas Identificados na Qualificação Em Relação a Area Clinica e Assistencial"
            required={qualificacaoObrigatoria}
          >
            <TextArea
              required={qualificacaoObrigatoria}
              minLength={qualificacaoObrigatoria ? 50 : undefined}
              value={form.problemas_area_assistencial}
              onChange={(e) => update("problemas_area_assistencial", e.target.value)}
            />
          </FormField>
          <FormField
            label="Problemas Identificados na Qualificação Em Relação a Area de Suprimentos"
            required={qualificacaoObrigatoria}
          >
            <TextArea
              required={qualificacaoObrigatoria}
              minLength={qualificacaoObrigatoria ? 50 : undefined}
              value={form.problemas_suprimentos}
              onChange={(e) => update("problemas_suprimentos", e.target.value)}
            />
          </FormField>
          <FormField
            label="Problemas Identificados na Qualificação Em Relação a Area de Faturamento"
            required={qualificacaoObrigatoria}
          >
            <TextArea
              required={qualificacaoObrigatoria}
              minLength={qualificacaoObrigatoria ? 50 : undefined}
              value={form.problemas_faturamento}
              onChange={(e) => update("problemas_faturamento", e.target.value)}
            />
          </FormField>
          <FormField
            label="Problemas Identificados na Qualificação Em Relação a Area de Financeiro/Contábil"
            required={qualificacaoObrigatoria}
          >
            <TextArea
              required={qualificacaoObrigatoria}
              minLength={qualificacaoObrigatoria ? 50 : undefined}
              value={form.problemas_financeiro_contabil}
              onChange={(e) => update("problemas_financeiro_contabil", e.target.value)}
            />
          </FormField>
          <FormField
            label="Problemas Identificados na Qualificação Em Relação a Area de Diagnóstico/Terapia"
            required={qualificacaoObrigatoria}
          >
            <TextArea
              required={qualificacaoObrigatoria}
              minLength={qualificacaoObrigatoria ? 50 : undefined}
              value={form.problemas_diagnostico_terapia}
              onChange={(e) => update("problemas_diagnostico_terapia", e.target.value)}
            />
          </FormField>
        </Secao>

        <Secao titulo="Agendamento">
          <FormField label="Tipo de apresentação" required>
            <Select
              required
              options={TIPOS_APRESENTACAO}
              value={form.tipo_apresentacao}
              onChange={(e) => update("tipo_apresentacao", e.target.value)}
            />
          </FormField>
          {form.tipo_apresentacao === "Presencial" && (
            <>
              <div className="col-span-1 sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900 mb-1">⚠️ Atenção:</p>
                <p className="text-sm text-amber-800">
                  Demonstrações presenciais precisam ser solicitadas com <strong>pelo menos 10 dias de antecedência</strong> por conta de possível viagem ou deslocamento.
                </p>
              </div>
              <FormField label="Endereço" required>
                <TextInput
                  required
                  value={form.endereco_apresentacao}
                  onChange={(e) => update("endereco_apresentacao", e.target.value)}
                  placeholder="Ex: Av. Paulista, 1000, São Paulo - SP"
                />
              </FormField>
            </>
          )}
          <FormField label="Data desejada" required>
            <TextInput
              type="date"
              required
              value={form.data_desejada}
              onChange={(e) => update("data_desejada", e.target.value)}
              min={form.tipo_apresentacao === "Presencial" ? getMinDataPresencial() : undefined}
            />
          </FormField>

          {!mostrarData2 ? (
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setMostrarData2(true)}
                className="text-sm font-medium text-[#008C77] hover:underline"
              >
                + Adicionar outra data sugerida
              </button>
            </div>
          ) : (
            <FormField label="2ª data sugerida (opcional)">
              <div className="flex items-center gap-2">
                <TextInput
                  type="date"
                  value={form.data_desejada_2}
                  onChange={(e) => update("data_desejada_2", e.target.value)}
                  min={form.tipo_apresentacao === "Presencial" ? getMinDataPresencial() : undefined}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    setMostrarData2(false);
                    setMostrarData3(false);
                    update("data_desejada_2", "");
                    update("data_desejada_3", "");
                  }}
                  className="text-sm text-slate-400 hover:text-red-600"
                  aria-label="Remover 2ª data sugerida"
                >
                  ✕
                </button>
              </div>
            </FormField>
          )}

          {mostrarData2 && !mostrarData3 && (
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setMostrarData3(true)}
                className="text-sm font-medium text-[#008C77] hover:underline"
              >
                + Adicionar outra data sugerida
              </button>
            </div>
          )}

          {mostrarData2 && mostrarData3 && (
            <FormField label="3ª data sugerida (opcional)">
              <div className="flex items-center gap-2">
                <TextInput
                  type="date"
                  value={form.data_desejada_3}
                  onChange={(e) => update("data_desejada_3", e.target.value)}
                  min={form.tipo_apresentacao === "Presencial" ? getMinDataPresencial() : undefined}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => {
                    setMostrarData3(false);
                    update("data_desejada_3", "");
                  }}
                  className="text-sm text-slate-400 hover:text-red-600"
                  aria-label="Remover 3ª data sugerida"
                >
                  ✕
                </button>
              </div>
            </FormField>
          )}

          <FormField label="Período">
            <Select
              options={PERIODOS}
              value={form.periodo}
              onChange={(e) => update("periodo", e.target.value)}
            />
          </FormField>
          <FormField label="Horário de início desejado">
            <TextInput
              type="time"
              value={form.horario_inicio_desejado}
              onChange={(e) => update("horario_inicio_desejado", e.target.value)}
            />
          </FormField>
          <FormField label="Horário de fim desejado">
            <TextInput
              type="time"
              value={form.horario_fim_desejado}
              onChange={(e) => update("horario_fim_desejado", e.target.value)}
            />
          </FormField>
          <FormField label="Observações">
            <TextArea value={form.observacoes} onChange={(e) => update("observacoes", e.target.value)} />
          </FormField>
        </Secao>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-[#008C77] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#007a66] active:bg-[#006652] disabled:opacity-50 transition-colors shadow-md hover:shadow-lg cursor-pointer"
        >
          {enviando ? "Enviando..." : "Enviar solicitação"}
        </button>
      </form>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
      <legend className="px-1 text-sm font-semibold text-slate-800">{titulo}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
