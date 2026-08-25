import { NextResponse } from "next/server";
import { contarSolicitacoesPorStatus } from "@/lib/repo";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const count = await contarSolicitacoesPorStatus("solicitado");
  return NextResponse.json({ count });
}
