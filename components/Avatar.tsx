"use client";

import { useState } from "react";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const letras = partes.length > 1 ? [partes[0][0], partes[partes.length - 1][0]] : [partes[0]?.[0] || "?"];
  return letras.join("").toUpperCase();
}

export function Avatar({
  nome,
  url,
  size = 32,
}: {
  nome: string;
  url?: string | null;
  size?: number;
}) {
  const [falhou, setFalhou] = useState(false);

  if (url && !falhou) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={nome}
        width={size}
        height={size}
        onError={() => setFalhou(true)}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-[#214B63] text-white font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {iniciais(nome)}
    </div>
  );
}
