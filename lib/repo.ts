import { getDb, newId, nowIso } from "./db";
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

function normalizarNovaSolicitacao(input: NovaSolicitacaoInput): NovaSolicitacaoInput {
  const normalizado = { ...input } as Record<string, unknown>;
  for (const campo of CAMPOS_OPCIONAIS_TEXTO) {
    if (normalizado[campo] === undefined || normalizado[campo] === "") {
      normalizado[campo] = null;
    }
  }
  for (const campo of CAMPOS_BOOLEANOS) {
    normalizado[campo] = normalizado[campo] ? 1 : 0;
  }
  normalizado.valor_aproximado_projeto =
    normalizado.valor_aproximado_projeto === undefined ||
    normalizado.valor_aproximado_projeto === null ||
    normalizado.valor_aproximado_projeto === ""
      ? null
      : Number(normalizado.valor_aproximado_projeto);
  return normalizado as unknown as NovaSolicitacaoInput;
}

export function criarSolicitacao(rawInput: NovaSolicitacaoInput): SolicitacaoDemo {
  const db = getDb();
  const id = newId();
  const now = nowIso();
  const input = normalizarNovaSolicitacao(rawInput);

  db.prepare(
    `INSERT INTO solicitacoes_demo (
      id, gerente_conta_nome, unidade_regional, nome_instituicao, natureza_instituicao,
      porte_instituicao, cidade, tipo_unidade, solucao_atual, tipo_oportunidade, tipo_projeto,
      produto_apresentar, observacao_apresentacao, nome_patrocinador, email_patrocinador, codigo_oportunidade,
      numero_visitas, valor_aproximado_projeto, percentual_evolucao_crm, atende_sus, atende_convenio_particular,
      possui_pronto_socorro, possui_ambulatorio, dor_prospect, problemas_atendimento_paciente,
      problemas_area_assistencial, problemas_suprimentos, problemas_faturamento,
      problemas_financeiro_contabil, problemas_diagnostico_terapia, tipo_apresentacao,
      data_desejada, periodo, horario_inicio_desejado, horario_fim_desejado, observacoes,
      status, created_at, updated_at
    ) VALUES (
      @id, @gerente_conta_nome, @unidade_regional, @nome_instituicao, @natureza_instituicao,
      @porte_instituicao, @cidade, @tipo_unidade, @solucao_atual, @tipo_oportunidade, @tipo_projeto,
      @produto_apresentar, @observacao_apresentacao, @nome_patrocinador, @email_patrocinador, @codigo_oportunidade,
      @numero_visitas, @valor_aproximado_projeto, @percentual_evolucao_crm, @atende_sus, @atende_convenio_particular,
      @possui_pronto_socorro, @possui_ambulatorio, @dor_prospect, @problemas_atendimento_paciente,
      @problemas_area_assistencial, @problemas_suprimentos, @problemas_faturamento,
      @problemas_financeiro_contabil, @problemas_diagnostico_terapia, @tipo_apresentacao,
      @data_desejada, @periodo, @horario_inicio_desejado, @horario_fim_desejado, @observacoes,
      'solicitado', @created_at, @updated_at
    )`
  ).run({ ...input, id, created_at: now, updated_at: now });

  return buscarSolicitacao(id)!;
}

export function listarSolicitacoes(): SolicitacaoDemo[] {
  const db = getDb();
  return db.prepare(`SELECT * FROM solicitacoes_demo ORDER BY created_at DESC`).all() as SolicitacaoDemo[];
}

export function buscarSolicitacao(id: string): SolicitacaoDemo | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM solicitacoes_demo WHERE id = ?`).get(id) as SolicitacaoDemo | undefined;
}

export function agendarSolicitacao(
  id: string,
  data: { data_hora_agendada: string; agendado_por: string; link_ou_local: string | null }
): SolicitacaoDemo | undefined {
  const db = getDb();
  db.prepare(
    `UPDATE solicitacoes_demo
     SET status = 'agendado', data_hora_agendada = @data_hora_agendada,
         agendado_por = @agendado_por, link_ou_local = @link_ou_local, updated_at = @updated_at
     WHERE id = @id`
  ).run({ ...data, id, updated_at: nowIso() });
  return buscarSolicitacao(id);
}

export function atualizarStatus(id: string, status: StatusSolicitacao): SolicitacaoDemo | undefined {
  const db = getDb();
  db.prepare(`UPDATE solicitacoes_demo SET status = ?, updated_at = ? WHERE id = ?`).run(status, nowIso(), id);
  return buscarSolicitacao(id);
}

export function registrarNps(
  solicitacaoId: string,
  data: { nota: number; comentario: string | null }
): NpsDemo {
  const db = getDb();
  const id = newId();
  const respondido_em = nowIso();
  db.prepare(
    `INSERT INTO nps_demo (id, solicitacao_id, nota, comentario, respondido_em)
     VALUES (@id, @solicitacao_id, @nota, @comentario, @respondido_em)
     ON CONFLICT(solicitacao_id) DO UPDATE SET
       nota = excluded.nota, comentario = excluded.comentario, respondido_em = excluded.respondido_em`
  ).run({ id, solicitacao_id: solicitacaoId, ...data, respondido_em });
  return db.prepare(`SELECT * FROM nps_demo WHERE solicitacao_id = ?`).get(solicitacaoId) as NpsDemo;
}

export function buscarNps(solicitacaoId: string): NpsDemo | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM nps_demo WHERE solicitacao_id = ?`).get(solicitacaoId) as NpsDemo | undefined;
}

export function listarNps(): NpsDemo[] {
  const db = getDb();
  return db.prepare(`SELECT * FROM nps_demo`).all() as NpsDemo[];
}

export function atualizarResultadoComercial(
  solicitacaoId: string,
  data: {
    proposta_gerada: boolean;
    proposta_fechada: boolean;
    valor_proposta: number | null;
    contrato_cancelado: boolean;
    atualizado_por: string | null;
  }
): ResultadoComercial {
  const db = getDb();
  const id = newId();
  const data_atualizacao = nowIso();
  db.prepare(
    `INSERT INTO resultado_comercial (
       id, solicitacao_id, proposta_gerada, proposta_fechada, valor_proposta,
       contrato_cancelado, atualizado_por, data_atualizacao
     ) VALUES (
       @id, @solicitacao_id, @proposta_gerada, @proposta_fechada, @valor_proposta,
       @contrato_cancelado, @atualizado_por, @data_atualizacao
     )
     ON CONFLICT(solicitacao_id) DO UPDATE SET
       proposta_gerada = excluded.proposta_gerada,
       proposta_fechada = excluded.proposta_fechada,
       valor_proposta = excluded.valor_proposta,
       contrato_cancelado = excluded.contrato_cancelado,
       atualizado_por = excluded.atualizado_por,
       data_atualizacao = excluded.data_atualizacao`
  ).run({
    id,
    solicitacao_id: solicitacaoId,
    proposta_gerada: data.proposta_gerada ? 1 : 0,
    proposta_fechada: data.proposta_fechada ? 1 : 0,
    valor_proposta: data.valor_proposta,
    contrato_cancelado: data.contrato_cancelado ? 1 : 0,
    atualizado_por: data.atualizado_por,
    data_atualizacao,
  });
  return db
    .prepare(`SELECT * FROM resultado_comercial WHERE solicitacao_id = ?`)
    .get(solicitacaoId) as ResultadoComercial;
}

export function buscarResultadoComercial(solicitacaoId: string): ResultadoComercial | undefined {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM resultado_comercial WHERE solicitacao_id = ?`)
    .get(solicitacaoId) as ResultadoComercial | undefined;
}

export function listarResultadosComerciais(): ResultadoComercial[] {
  const db = getDb();
  return db.prepare(`SELECT * FROM resultado_comercial`).all() as ResultadoComercial[];
}
