import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import GestaoPageClient from "./GestaoPageClient";

export default async function GestaoPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return <GestaoPageClient nomeUsuario={user.nome} />;
}
