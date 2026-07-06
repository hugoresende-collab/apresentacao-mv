import type { StatusSolicitacao } from "@/lib/types";

const CORES: Record<StatusSolicitacao, string> = {
  solicitado: "bg-amber-100 text-amber-800",
  agendado: "bg-blue-100 text-blue-800",
  realizado: "bg-emerald-100 text-emerald-800",
  cancelado: "bg-red-100 text-red-800",
};

const LABELS: Record<StatusSolicitacao, string> = {
  solicitado: "Solicitado",
  agendado: "Agendado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};

export function StatusBadge({ status }: { status: StatusSolicitacao }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CORES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
