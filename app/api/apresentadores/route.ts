import { NextRequest, NextResponse } from "next/server";
import { getDb, nowIso } from "@/lib/db";
import { randomUUID } from "crypto";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const db = getDb();

    const { data: apresentadores, error } = await db
      .from("apresentadores")
      .select("*")
      .order("nome");

    if (error) throw error;

    return NextResponse.json({ apresentadores });
  } catch (error) {
    console.error("Erro ao listar apresentadores:", error);
    return NextResponse.json(
      { error: "Erro ao listar apresentadores" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { nome, email } = body;

    if (!nome?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Nome e email são obrigatórios" },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = randomUUID();

    const { data: apresentador, error } = await db
      .from("apresentadores")
      .insert({
        id,
        nome,
        email,
        created_at: nowIso(),
        updated_at: nowIso(),
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes("duplicate")) {
        return NextResponse.json(
          { error: "Apresentador com este nome já existe" },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json({ apresentador }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar apresentador:", error);
    return NextResponse.json(
      { error: "Erro ao criar apresentador" },
      { status: 500 }
    );
  }
}
