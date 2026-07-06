"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FormField, TextInput, TextArea, Select } from "@/components/FormField";
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
} from "@/lib/types";

const ESTADO_INICIAL = {
  gerente_conta_nome: "",
  unidade_regional: "",
  nome_instituicao: "",
  natureza_instituicao: "",
  porte_instituicao: "",
  cidade: "",
  tipo_unidade: "",
  solucao_atual: "",
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
  data_desejada: "",
  periodo: "",
  horario_inicio_desejado: "",
  horario_fim_desejado: "",
  observacoes: "",
};

export default function NovaSolicitacaoPage() {
  const router = useRouter();
  const [form, setForm] = useState(ESTADO_INICIAL);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const qualificacaoObrigatoria = form.tipo_oportunidade === "Cliente Novo";

  function update<K extends keyof typeof ESTADO_INICIAL>(campo: K, valor: (typeof ESTADO_INICIAL)[K]) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  const CAMPOS_QUALIFICACAO: (keyof typeof ESTADO_INICIAL)[] = [
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

    const res = await fetch("/api/solicitacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setErro(data.error || "Erro ao enviar solicitação.");
      setEnviando(false);
      return;
    }

    router.push("/agendar?enviado=1");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Solicitar demonstração</h1>
        <p className="text-sm text-slate-600">
          Preencha os dados abaixo. A Barbara receberá a solicitação e fará o agendamento.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Secao titulo="Solicitante e instituição">
          <FormField label="Seu nome (gerente de conta)" required>
            <TextInput
              required
              value={form.gerente_conta_nome}
              onChange={(e) => update("gerente_conta_nome", e.target.value)}
            />
          </FormField>
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
            <TextInput
              value={form.solucao_atual}
              onChange={(e) => update("solucao_atual", e.target.value)}
              placeholder="Ex: MV2000, TOTVS, Philips Tasy..."
            />
          </FormField>
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
              type="number"
              step="0.01"
              min="0"
              value={form.valor_aproximado_projeto}
              onChange={(e) => update("valor_aproximado_projeto", e.target.value)}
              placeholder="Ex: 50000"
            />
          </FormField>
          <FormField label="% de evolução no CRM">
            <TextInput
              value={form.percentual_evolucao_crm}
              onChange={(e) => update("percentual_evolucao_crm", e.target.value)}
              placeholder="Ex: 20"
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

        <Secao titulo="Logística da demonstração">
          <FormField label="Tipo de apresentação" required>
            <Select
              required
              options={TIPOS_APRESENTACAO}
              value={form.tipo_apresentacao}
              onChange={(e) => update("tipo_apresentacao", e.target.value)}
            />
          </FormField>
          <FormField label="Data desejada" required>
            <TextInput
              type="date"
              required
              value={form.data_desejada}
              onChange={(e) => update("data_desejada", e.target.value)}
            />
          </FormField>
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
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
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
