import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();

    // Criar tabela de apresentadores se não existir
    const { error } = await db.rpc("exec", {
      sql: `
        CREATE TABLE IF NOT EXISTS apresentadores (
          id TEXT PRIMARY KEY,
          nome TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL,
          google_calendar_id TEXT,
          google_calendar_token TEXT,
          google_calendar_refresh_token TEXT,
          autorizado_por TEXT,
          data_autorizacao TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now()
        );

        CREATE INDEX IF NOT EXISTS idx_apresentadores_nome ON apresentadores(nome);
        CREATE INDEX IF NOT EXISTS idx_apresentadores_email ON apresentadores(email);
      `,
    });

    if (error) {
      console.log("Nota: Pode ser normal se a tabela já existe:", error);
    }

    return NextResponse.json({ success: true, message: "Tabelas inicializadas" });
  } catch (error) {
    console.error("Erro ao inicializar:", error);
    return NextResponse.json(
      { error: "Erro ao inicializar banco de dados" },
      { status: 500 }
    );
  }
}
