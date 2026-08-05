import { nowIso, withRetry } from "./db";
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

async function supabaseRest<T>(table: string, method: string, options?: any): Promise<T> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase credentials");
  }

  const headers: Record<string, string> = {
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json",
    "apikey": key,
  };

  let endpoint = `${url}/rest/v1/${table}`;
  if (options?.select) {
    endpoint += `?select=${encodeURIComponent(options.select)}`;
  }
  if (options?.filters) {
    for (const [key, value] of Object.entries(options.filters)) {
      const filterStr = `${key}=eq.${encodeURIComponent(value as string)}`;
      endpoint += endpoint.includes("?") ? `&${filterStr}` : `?${filterStr}`;
    }
  }

  if (options?.data && (method === "POST" || method === "PATCH")) {
    headers["Prefer"] = "return=representation";
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  if (options?.data) {
    fetchOptions.body = JSON.stringify(options.data);
  }

  const response = await fetch(endpoint, fetchOptions);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase REST error: ${error}`);
  }

  return response.json();
}

export async function criarSolicitacao(rawInput: NovaSolicitacaoInput): Promise<SolicitacaoDemo> {
  const input = normalizarNovaSolicitacao(rawInput);
  const now = nowIso();

  return withRetry(async () => {
    const results = await supabaseRest<SolicitacaoDemo[]>("solicitacoes_demo", "POST", {
      data: { ...input, status: "solicitado", created_at: now, updated_at: now },
      select: "*",
    });

    if (!Array.isArray(results) || results.length === 0) {
      throw new Error("No data returned from insert");
    }

    return results[0];
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
      headers: {
        "Authorization": `Bearer ${key}`,
        "apikey": key,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to list solicitacoes");
    }

    return response.json();
  });
}

export async function buscarSolicitacao(id: string): Promise<SolicitacaoDemo | undefined> {
  return withRetry(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) throw new Error("Missing credentials");

    const response = await fetch(
      `${url}/rest/v1/solicitacoes_demo?id=eq.${encodeURIComponent(id)}&select=*`,
      { headers: { "Authorization": `Bearer ${key}`, "apikey": key } }
    );

    if (!response.ok) throw new Error("Failed to fetch");
    const data = await response.json();
    return data[0];
  });
}

export async function agendarSolicitacao(
  id: string,
  data: { data_hora_agendada: string; agendado_por: string; link_ou_local: string | null; apresentador: string }
): Promise<SolicitacaoDemo | undefined> {
  return withRetry(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) throw new Error("Missing credentials");

    const response = await fetch(
      `${url}/rest/v1/solicitacoes_demo?id=eq.${encodeURIComponent(id)}&select=*`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${key}`,
          "apikey": key,
          "Content-Type": "application/json",
          "Prefer": "return=representation",
        },
        body: JSON.stringify({ ...data, status: "demo agendada", updated_at: nowIso() }),
      }
    );

    if (!response.ok) throw new Error("Failed to update");
    const result = await response.json();
    return result[0];
  });
}

export async function atualizarStatus(
  id: string,
  status: StatusSolicitacao,
  apresentador?: string | null,
  motivo_cancelamento?: string | null
): Promise<SolicitacaoDemo | undefined> {
  return withRetry(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) throw new Error("Missing credentials");

    const update: any = { status, updated_at: nowIso() };
    if (status === "realizada") update.data_hora_realizada = nowIso();
    if (status === "cancelada" && motivo_cancelamento) update.motivo_cancelamento = motivo_cancelamento;
    if (apresentador) update.apresentador = apresentador;

    const response = await fetch(
      `${url}/rest/v1/solicitacoes_demo?id=eq.${encodeURIComponent(id)}&select=*`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${key}`,
          "apikey": key,
          "Content-Type": "application/json",
          "Prefer": "return=representation",
        },
        body: JSON.stringify(update),
      }
    );

    if (!response.ok) throw new Error("Failed to update status");
    const result = await response.json();
    return result[0];
  });
}

export async function registrarNps(
  solicitacaoId: string,
  data: { nota: number; comentario: string | null }
): Promise<NpsDemo> {
  return withRetry(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) throw new Error("Missing credentials");

    const response = await fetch(`${url}/rest/v1/nps_demo?select=*`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "apikey": key,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({ solicitacao_id: solicitacaoId, ...data, respondido_em: nowIso() }),
    });

    if (!response.ok) throw new Error("Failed to register NPS");
    const result = await response.json();
    return result[0];
  });
}

export async function buscarNps(solicitacaoId: string): Promise<NpsDemo | undefined> {
  return withRetry(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) throw new Error("Missing credentials");

    const response = await fetch(
      `${url}/rest/v1/nps_demo?solicitacao_id=eq.${encodeURIComponent(solicitacaoId)}&select=*`,
      { headers: { "Authorization": `Bearer ${key}`, "apikey": key } }
    );

    if (!response.ok) throw new Error("Failed to fetch NPS");
    const data = await response.json();
    return data[0];
  });
}

export async function listarNps(): Promise<NpsDemo[]> {
  return withRetry(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) throw new Error("Missing credentials");

    const response = await fetch(`${url}/rest/v1/nps_demo?select=*`, {
      headers: { "Authorization": `Bearer ${key}`, "apikey": key },
    });

    if (!response.ok) throw new Error("Failed to list NPS");
    return response.json();
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
  return withRetry(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) throw new Error("Missing credentials");

    const response = await fetch(`${url}/rest/v1/resultado_comercial?select=*`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "apikey": key,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
      },
      body: JSON.stringify({ solicitacao_id: solicitacaoId, ...data, data_atualizacao: nowIso() }),
    });

    if (!response.ok) throw new Error("Failed to update resultado");
    const result = await response.json();
    return result[0];
  });
}

export async function buscarResultadoComercial(solicitacaoId: string): Promise<ResultadoComercial | undefined> {
  return withRetry(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) throw new Error("Missing credentials");

    const response = await fetch(
      `${url}/rest/v1/resultado_comercial?solicitacao_id=eq.${encodeURIComponent(solicitacaoId)}&select=*`,
      { headers: { "Authorization": `Bearer ${key}`, "apikey": key } }
    );

    if (!response.ok) throw new Error("Failed to fetch resultado");
    const data = await response.json();
    return data[0];
  });
}

export async function listarResultadosComerciais(): Promise<ResultadoComercial[]> {
  return withRetry(async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) throw new Error("Missing credentials");

    const response = await fetch(`${url}/rest/v1/resultado_comercial?select=*`, {
      headers: { "Authorization": `Bearer ${key}`, "apikey": key },
    });

    if (!response.ok) throw new Error("Failed to list resultados");
    return response.json();
  });
}
