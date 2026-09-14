import { NextResponse } from "next/server";
import { contarSolicitacoesPorStatus } from "@/lib/repo";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/types";

export async function GET() {
  const user = await getSessionUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const [countSolicitado, countRemarcacao] = await Promise.all([
    contarSolicitacoesPorStatus("solicitado"),
    contarSolicitacoesPorStatus("remarcacao"),
  ]);
  return NextResponse.json({ count: countSolicitado + countRemarcacao });
}
