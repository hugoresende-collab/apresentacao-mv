import { getDb, nowIso, withRetry } from "./db";
import type { NpsDemo, ResultadoComercial, SolicitacaoDemo, StatusSolicitacao } from "./types";

async function fetchSupabase<T>(
  table: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  options?: {
    select?: string;
    filters?: Record<string, string>;
    data?: any;
  }
): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase credentials");
  }

  const baseUrl = `${url}/rest/v1/${table}`;
  let queryUrl = baseUrl;

  if (options?.select) {
    queryUrl += `?select=${encodeURIComponent(options.select)}`;
  }

  const response = await fetch(queryUrl, {
    method,
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
      "apikey": key,
    },
    body: options?.data ? JSON.stringify(options.data) : undefined,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error: ${error}`);
  }

  return response.json();
}

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
  const input = normalizarNovaSolicitacao(rawInput);
  const now = nowIso();

  return withRetry(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Missing Supabase credentials");
    }

    const response = await fetch(`${url}/rest/v1/solicitacoes_demo?select=*`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "apikey": key,
        "Prefer": "return=representation",
      },
      body: JSON.stringify({
        ...input,
        status: "solicitado",
        created_at: now,
        updated_at: now,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create solicitacao: ${error}`);
    }

    const results = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error("No data returned from insert");
    }

    return results[0] as SolicitacaoDemo;
  });
}

export async function listarSolicitacoes(filtro?: { gerenteContaEmail?: string }): Promise<SolicitacaoDemo[]> {
  return withRetry(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Missing Supabase credentials");
    }

    let endpoint = `${url}/rest/v1/solicitacoes_demo?select=*&order=created_at.desc`;

    if (filtro?.gerenteContaEmail) {
      endpoint += `&gerente_conta_email=eq.${encodeURIComponent(filtro.gerenteContaEmail)}`;
    }

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "apikey": key,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list solicitacoes: ${error}`);
    }

    return response.json() as Promise<SolicitacaoDemo[]>;
  });
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
  return withRetry(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Missing Supabase credentials");
    }

    const response = await fetch(`${url}/rest/v1/nps_demo?select=*`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "apikey": key,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list NPS: ${error}`);
    }

    return response.json() as Promise<NpsDemo[]>;
  });
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
  return withRetry(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Missing Supabase credentials");
    }

    const response = await fetch(`${url}/rest/v1/resultado_comercial?select=*`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "apikey": key,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list resultados: ${error}`);
    }

    return response.json() as Promise<ResultadoComercial[]>;
  });
}
