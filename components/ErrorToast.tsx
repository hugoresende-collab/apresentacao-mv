"use client";

export function ErrorToast({
  titulo,
  mensagem,
}: {
  titulo: string;
  mensagem: string;
}) {
  return (
    <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
      <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-white px-5 py-4 shadow-xl">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{titulo}</p>
          <p className="text-sm text-slate-600">{mensagem}</p>
        </div>
      </div>
    </div>
  );
}
