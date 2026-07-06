import Database from "better-sqlite3";
import path from "path";
import { randomUUID } from "crypto";

const DB_PATH = path.join(process.cwd(), "data", "app.db");

function createConnection(): Database.Database {
  const fs = require("fs") as typeof import("fs");
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS solicitacoes_demo (
      id TEXT PRIMARY KEY,
      gerente_conta_nome TEXT NOT NULL,
      unidade_regional TEXT NOT NULL,
      nome_instituicao TEXT NOT NULL,
      natureza_instituicao TEXT NOT NULL,
      porte_instituicao TEXT NOT NULL,
      cidade TEXT NOT NULL,
      tipo_unidade TEXT NOT NULL,
      solucao_atual TEXT,
      tipo_oportunidade TEXT NOT NULL,
      tipo_projeto TEXT,
      produto_apresentar TEXT NOT NULL,
      observacao_apresentacao TEXT,
      nome_patrocinador TEXT,
      email_patrocinador TEXT,
      codigo_oportunidade TEXT,
      numero_visitas TEXT,
      valor_aproximado_projeto REAL,
      percentual_evolucao_crm TEXT,
      atende_sus INTEGER NOT NULL DEFAULT 0,
      atende_convenio_particular INTEGER NOT NULL DEFAULT 0,
      possui_pronto_socorro INTEGER NOT NULL DEFAULT 0,
      possui_ambulatorio INTEGER NOT NULL DEFAULT 0,
      dor_prospect TEXT,
      problemas_atendimento_paciente TEXT,
      problemas_area_assistencial TEXT,
      problemas_suprimentos TEXT,
      problemas_faturamento TEXT,
      problemas_financeiro_contabil TEXT,
      problemas_diagnostico_terapia TEXT,
      tipo_apresentacao TEXT NOT NULL,
      data_desejada TEXT NOT NULL,
      periodo TEXT,
      horario_inicio_desejado TEXT,
      horario_fim_desejado TEXT,
      observacoes TEXT,
      status TEXT NOT NULL DEFAULT 'solicitado',
      data_hora_agendada TEXT,
      agendado_por TEXT,
      link_ou_local TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS nps_demo (
      id TEXT PRIMARY KEY,
      solicitacao_id TEXT NOT NULL UNIQUE REFERENCES solicitacoes_demo(id) ON DELETE CASCADE,
      nota INTEGER NOT NULL,
      comentario TEXT,
      respondido_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resultado_comercial (
      id TEXT PRIMARY KEY,
      solicitacao_id TEXT NOT NULL UNIQUE REFERENCES solicitacoes_demo(id) ON DELETE CASCADE,
      proposta_gerada INTEGER NOT NULL DEFAULT 0,
      proposta_fechada INTEGER NOT NULL DEFAULT 0,
      valor_proposta REAL,
      contrato_cancelado INTEGER NOT NULL DEFAULT 0,
      atualizado_por TEXT,
      data_atualizacao TEXT NOT NULL
    );
  `);

  const colunasExistentes = new Set(
    (db.prepare(`PRAGMA table_info(solicitacoes_demo)`).all() as { name: string }[]).map(
      (col) => col.name
    )
  );
  const colunasNovas: [string, string][] = [
    ["observacao_apresentacao", "TEXT"],
    ["valor_aproximado_projeto", "REAL"],
  ];
  for (const [nome, tipo] of colunasNovas) {
    if (!colunasExistentes.has(nome)) {
      db.exec(`ALTER TABLE solicitacoes_demo ADD COLUMN ${nome} ${tipo}`);
    }
  }

  return db;
}

declare global {
  var __demoDb: Database.Database | undefined;
}

export function getDb(): Database.Database {
  if (!global.__demoDb) {
    global.__demoDb = createConnection();
  }
  return global.__demoDb;
}

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
