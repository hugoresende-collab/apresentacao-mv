import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/types";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSessionUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }
    const db = getDb();

    const { error } = await db
      .from("apresentadores")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover apresentador:", error);
    return NextResponse.json(
      { error: "Erro ao remover apresentador" },
      { status: 500 }
    );
  }
}
