import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import NovaSolicitacaoForm from "./NovaSolicitacaoForm";

export default async function NovaSolicitacaoPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login");
  }

  return <NovaSolicitacaoForm nomeUsuario={user.nome} emailUsuario={user.email} />;
}
