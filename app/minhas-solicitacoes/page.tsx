import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import MinhasSolicitacoesClient from "./MinhasSolicitacoesClient";

export default async function MinhasSolicitacoesPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return <MinhasSolicitacoesClient />;
}
