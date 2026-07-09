import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/types";
import GerenciarApresentadoresClient from "./GerenciarApresentadoresClient";

export default async function GerenciarApresentadoresPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  if (!isAdmin(user.email)) {
    redirect("/");
  }

  return <GerenciarApresentadoresClient nomeUsuario={user.nome} />;
}
