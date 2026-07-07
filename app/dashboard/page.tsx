import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard — Demonstrações MV",
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return <DashboardClient />;
}
