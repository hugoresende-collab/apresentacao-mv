import { getDb, nowIso } from "./db";
import type { NpsDemo, ResultadoComercial, SolicitacaoDemo, StatusSolicitacao } from "./types";

export type NovaSolicitacaoInput = Omit<
  SolicitacaoDemo,
  "id" | "status" | "data_hora_agendada" | "agendado_por" | "link_ou_local" | "created_at" | "updated_at"
>;

const CAMPOS_OPCIONAIS_TEXTO: (keyof NovaSolicitacaoInput)[] = [
  "solucao_atual",
  "tipo_projeto",
  "observacao_apresentacao",
  "nome_patrocinador",
  "email_patrocinador",
  "codigo_oportunidade",
  "numero_visitas",
  "percentual_evolucao_crm",
  "dor_prospect",
  "problemas_atendimento_paciente",
  "problemas_area_assistencial",
  "problemas_suprimentos",
  "problemas_faturamento",
  "problemas_financeiro_contabil",
  "problemas_diagnostico_terapia",
  "periodo",
  "horario_inicio_desejado",
  "horario_fim_desejado",
  "observacoes",
];

const CAMPOS_BOOLEANOS: (keyof NovaSolicitacaoInput)[] = [
  "atende_sus",
  "atende_convenio_particular",
  "possui_pronto_socorro",
  "possui_ambulatorio",
];

function normalizarNovaSolicitacao(input: NovaSolicitacaoInput): Record<string, unknown> {
  const normalizado = { ...input } as Record<string, unknown>;
  for (const campo of CAMPOS_OPCIONAIS_TEXTO) {
    if (normalizado[campo] === undefined || normalizado[campo] === "") {
      normalizado[campo] = null;
    }
  }
  for (const campo of CAMPOS_BOOLEANOS) {
    normalizado[campo] = Boolean(normalizado[campo]);
  }
  normalizado.valor_aproximado_projeto =
    normalizado.valor_aproximado_projeto === undefined ||
    normalizado.valor_aproximado_projeto === null ||
    normalizado.valor_aproximado_projeto === ""
      ? null
      : Number(normalizado.valor_aproximado_projeto);
  return normalizado;
}

function lancarSeErro<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) {
    throw new Error(result.error.message);
  }
  return result.data;
}

export async function criarSolicitacao(rawInput: NovaSolicitacaoInput): Promise<SolicitacaoDemo> {
  const db = getDb();
  const input = normalizarNovaSolicitacao(rawInput);
  const now = nowIso();

  const result = await db
    .from("solicitacoes_demo")
    .insert({ ...input, status: "solicitado", created_at: now, updated_at: now })
    .select()
    .single();

  return lancarSeErro(result) as SolicitacaoDemo;
}

export async function listarSolicitacoes(filtro?: { gerenteContaEmail?: string }): Promise<SolicitacaoDemo[]> {
  const db = getDb();
  let query = db.from("solicitacoes_demo").select("*").order("created_at", { ascending: false });
  if (filtro?.gerenteContaEmail) {
    query = query.eq("gerente_conta_email", filtro.gerenteContaEmail);
  }
  const result = await query;
  return lancarSeErro(result) as SolicitacaoDemo[];
}

export async function buscarSolicitacao(id: string): Promise<SolicitacaoDemo | undefined> {
  const db = getDb();
  const result = await db.from("solicitacoes_demo").select("*").eq("id", id).maybeSingle();
  return (lancarSeErro(result) as SolicitacaoDemo | null) ?? undefined;
}

export async function agendarSolicitacao(
  id: string,
  data: { data_hora_agendada: string; agendado_por: string; link_ou_local: string | null; apresentador: string }
): Promise<SolicitacaoDemo | undefined> {
  const db = getDb();
  const result = await db
    .from("solicitacoes_demo")
    .update({ ...data, status: "demo agendada", updated_at: nowIso() })
    .eq("id", id)
    .select()
    .maybeSingle();
  return (lancarSeErro(result) as SolicitacaoDemo | null) ?? undefined;
}

export async function atualizarStatus(
  id: string,
  status: StatusSolicitacao,
  apresentador?: string | null,
  motivo_cancelamento?: string | null
): Promise<SolicitacaoDemo | undefined> {
  const db = getDb();
  const update: any = { status, updated_at: nowIso() };

  if (status === "realizada") {
    update.data_hora_realizada = nowIso();
  }

  if (status === "cancelada" && motivo_cancelamento) {
    update.motivo_cancelamento = motivo_cancelamento;
  }

  if (apresentador) {
    update.apresentador = apresentador;
  }

  const result = await db
    .from("solicitacoes_demo")
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  return (lancarSeErro(result) as SolicitacaoDemo | null) ?? undefined;
}

export async function registrarNps(
  solicitacaoId: string,
  data: { nota: number; comentario: string | null }
): Promise<NpsDemo> {
  const db = getDb();
  const result = await db
    .from("nps_demo")
    .upsert(
      { solicitacao_id: solicitacaoId, ...data, respondido_em: nowIso() },
      { onConflict: "solicitacao_id" }
    )
    .select()
    .single();
  return lancarSeErro(result) as NpsDemo;
}

export async function buscarNps(solicitacaoId: string): Promise<NpsDemo | undefined> {
  const db = getDb();
  const result = await db
    .from("nps_demo")
    .select("*")
    .eq("solicitacao_id", solicitacaoId)
    .maybeSingle();
  return (lancarSeErro(result) as NpsDemo | null) ?? undefined;
}

export async function listarNps(): Promise<NpsDemo[]> {
  const db = getDb();
  const result = await db.from("nps_demo").select("*");
  return lancarSeErro(result) as NpsDemo[];
}

export async function atualizarResultadoComercial(
  solicitacaoId: string,
  data: {
    proposta_gerada: boolean;
    proposta_fechada: boolean;
    valor_proposta: number | null;
    contrato_cancelado: boolean;
    atualizado_por: string | null;
  }
): Promise<ResultadoComercial> {
  const db = getDb();
  const result = await db
    .from("resultado_comercial")
    .upsert(
      { solicitacao_id: solicitacaoId, ...data, data_atualizacao: nowIso() },
      { onConflict: "solicitacao_id" }
    )
    .select()
    .single();
  return lancarSeErro(result) as ResultadoComercial;
}

export async function buscarResultadoComercial(
  solicitacaoId: string
): Promise<ResultadoComercial | undefined> {
  const db = getDb();
  const result = await db
    .from("resultado_comercial")
    .select("*")
    .eq("solicitacao_id", solicitacaoId)
    .maybeSingle();
  return (lancarSeErro(result) as ResultadoComercial | null) ?? undefined;
}

export async function listarResultadosComerciais(): Promise<ResultadoComercial[]> {
  const db = getDb();
  const result = await db.from("resultado_comercial").select("*");
  return lancarSeErro(result) as ResultadoComercial[];
}
