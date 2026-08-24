export type StatusSolicitacao = "solicitado" | "demo agendada" | "realizada" | "cancelada";
export type UserRole = "colaborador" | "admin" | "apresentador";

export interface Apresentador {
  id: string;
  nome: string;
  email: string;
  google_calendar_id: string | null;
  google_calendar_token: string | null;
  google_calendar_refresh_token: string | null;
  autorizado_por: string | null;
  data_autorizacao: string | null;
  created_at: string;
  updated_at: string;
}

export interface SolicitacaoDemo {
  id: string;
  gerente_conta_nome: string;
  gerente_conta_email: string;
  unidade_regional: string;
  nome_instituicao: string;
  natureza_instituicao: string;
  porte_instituicao: string;
  cidade: string;
  tipo_unidade: string;
  solucao_atual: string | null;
  tipo_oportunidade: string;
  tipo_projeto: string | null;
  produto_apresentar: string;
  observacao_apresentacao: string | null;
  nome_patrocinador: string | null;
  email_patrocinador: string | null;
  codigo_oportunidade: string | null;
  codigo_solicitacao: string | null;
  numero_visitas: string | null;
  valor_aproximado_projeto: number | null;
  percentual_evolucao_crm: string | null;
  solucao_atual_outros: string | null;
  atende_sus: boolean;
  atende_convenio_particular: boolean;
  possui_pronto_socorro: boolean;
  possui_ambulatorio: boolean;
  dor_prospect: string | null;
  problemas_atendimento_paciente: string | null;
  problemas_area_assistencial: string | null;
  problemas_suprimentos: string | null;
  problemas_faturamento: string | null;
  problemas_financeiro_contabil: string | null;
  problemas_diagnostico_terapia: string | null;
  tipo_apresentacao: string;
  endereco_apresentacao: string | null;
  data_desejada: string;
  data_desejada_2: string | null;
  data_desejada_3: string | null;
  periodo: string | null;
  horario_inicio_desejado: string | null;
  horario_fim_desejado: string | null;
  observacoes: string | null;
  status: StatusSolicitacao;
  data_hora_agendada: string | null;
  data_hora_agendada_fim: string | null;
  agendado_por: string | null;
  link_ou_local: string | null;
  apresentador: string | null;
  data_hora_realizada: string | null;
  motivo_cancelamento: string | null;
  created_at: string;
  updated_at: string;
}

export interface NpsDemo {
  id: string;
  solicitacao_id: string;
  nota: number;
  comentario: string | null;
  respondido_em: string;
}

export interface ResultadoComercial {
  id: string;
  solicitacao_id: string;
  proposta_gerada: boolean;
  proposta_fechada: boolean;
  valor_proposta: number | null;
  contrato_cancelado: boolean;
  atualizado_por: string | null;
  data_atualizacao: string;
}

export const UNIDADES_REGIONAIS = [
  "Sul",
  "São Paulo",
  "Minas Gerais",
  "Centro-Oeste",
  "Nordeste",
  "Norte",
  "Internacional",
  "Inside Sales",
  "Medicina Diagnóstica",
  "Saúde Pública",
] as const;

export const TIPOS_UNIDADE = [
  "Hospital",
  "Pronto Atendimento",
  "Centro de Imagens",
  "Laboratório",
  "Centro Clínico",
  "Ambulatório de Atenção Primária",
] as const;

export const NATUREZAS = [
  "Privada",
  "Filantrópica",
  "Pública Municipal",
  "Pública Estadual",
  "Pública Federal",
] as const;

export const PORTES = ["Pequeno", "Médio", "Grande", "Extra Grande"] as const;

export const TIPOS_OPORTUNIDADE = [
  "Cliente Novo",
  "Venda Base - Novo Produto",
  "Venda Base - Migração",
  "Venda Base - Migração SIGH > SoulMV",
  "Venda Base - Novo Módulo",
  "Venda Base - Mobilidade",
] as const;

export const TIPOS_PROJETO = [
  "Custom",
  "Leap",
  "Leap Max",
  "Novo Módulo",
  "App Mobilidade",
  "App Médico",
] as const;

export const PRODUTOS = [
  "SOULMV",
  "PEP",
  "Mobilidade",
  "Orçamento",
  "Contratos",
  "Módulo (especificar na observação)",
  "APS",
  "SIGH",
  "Medic APP",
] as const;

export const NUMERO_VISITAS_OPCOES = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "10+",
] as const;

export const TIPOS_APRESENTACAO = ["Remota", "Presencial"] as const;

export const PERIODOS = ["Manhã", "Tarde", "Dia todo"] as const;

export const APRESENTADORES = [
  "Valmir",
  "Barbara Moutinho",
  "Ana Mendonça",
  "Gabriel Arcanjo",
  "produto teste",
] as const;

export const SOLUCOES_ATUAIS = [
  "MV 2000",
  "Soul MV",
  "Soul Java Flex",
  "Pixeon",
  "DGS",
  "Bionexo Tasy",
  "TOTVS",
  "Outros",
] as const;

export const PERCENTUAIS_EVOLUCAO_CRM = [
  "0%",
  "5%",
  "10%",
  "20%",
  "40%",
  "80%",
  "90%",
  "95%",
] as const;

export const ADMIN_EMAILS = [
  "hugo.resende@mv.com.br",
  "rafael.bloise@mv.com.br",
  "vjunior@mv.com.br",
  "barbara.moutinho@mv.com.br",
  "ana.mendonca@mv.com.br",
] as const;

export function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email as any);
}
