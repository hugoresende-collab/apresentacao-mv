import { useState } from "react";

interface CodigoCopivelProps {
  codigo: string;
}

export function CodigoCopivel({ codigo }: CodigoCopivelProps) {
  const [copiado, setCopiado] = useState(false);

  const handleCopiar = () => {
    navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <button
      onClick={handleCopiar}
      className="ml-2 inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono font-normal text-slate-500 hover:bg-slate-200 transition-colors"
      title="Copiar código"
    >
      <span>{codigo}</span>
      <svg
        className={`h-3 w-3 flex-shrink-0 transition-all ${
          copiado ? "text-green-600" : "text-slate-400"
        }`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        {copiado ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        ) : (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </>
        )}
      </svg>
    </button>
  );
}
