import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard — Demonstrações MV",
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Dashboard"
        subtitulo="Métricas e performance de demonstrações"
      />
      <DashboardClient />
    </div>
  );
}
