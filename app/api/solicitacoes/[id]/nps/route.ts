import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();

  const { data: nps, error } = await db
    .from("nps_demo")
    .select("id, nota, comentario, respondido_em")
    .eq("solicitacao_id", id)
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ nps });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { nota, comentario } = body;

  if (nota === null || nota === undefined) {
    return NextResponse.json(
      { error: "nota é obrigatória" },
      { status: 400 }
    );
  }

  const db = getDb();
  const { data: nps, error } = await db
    .from("nps_demo")
    .insert({
      solicitacao_id: id,
      nota,
      comentario: comentario || null,
      respondido_em: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ nps });
}
