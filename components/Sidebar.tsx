"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { isAdmin } from "@/lib/types";
import { Avatar } from "@/components/Avatar";

interface SidebarProps {
  user: {
    nome: string;
    email: string;
    avatarUrl?: string;
  };
}

type IconeNome = "solicitar" | "historico" | "gestao" | "dashboard" | "apresentadores";

const ITEMS_COLABORADOR: { href: string; label: string; icone: IconeNome }[] = [
  { href: "/", label: "Solicitar", icone: "solicitar" },
  { href: "/minhas-solicitacoes", label: "Histórico", icone: "historico" },
];

const ITEMS_ADMIN: { href: string; label: string; icone: IconeNome }[] = [
  { href: "/", label: "Solicitar", icone: "solicitar" },
  { href: "/minhas-solicitacoes", label: "Histórico", icone: "historico" },
  { href: "/gestao", label: "Gestão", icone: "gestao" },
  { href: "/dashboard", label: "Dashboard", icone: "dashboard" },
  { href: "/gerenciar-apresentadores", label: "Apresentadores", icone: "apresentadores" },
];

function IconeMenu({ nome }: { nome: IconeNome }) {
  const props = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
  switch (nome) {
    case "solicitar":
      return (
        <svg {...props} className="h-4 w-4 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
      );
    case "historico":
      return (
        <svg {...props} className="h-4 w-4 flex-shrink-0">
          <circle cx="12" cy="12" r="9" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5l3 3" />
        </svg>
      );
    case "gestao":
      return (
        <svg {...props} className="h-4 w-4 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 13l2 2 4-4" />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...props} className="h-4 w-4 flex-shrink-0">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      );
    case "apresentadores":
      return (
        <svg {...props} className="h-4 w-4 flex-shrink-0">
          <circle cx="9" cy="8" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <circle cx="17" cy="8" r="2.5" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.5 14.2c2.3.4 4 2.4 4 4.8" />
        </svg>
      );
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userIsAdmin = isAdmin(user.email);
  const navItems = userIsAdmin ? ITEMS_ADMIN : ITEMS_COLABORADOR;
  const [solicitadosPendentes, setSolicitadosPendentes] = useState(0);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    if (!userIsAdmin) return;

    const verificarPendentes = async () => {
      try {
        const res = await fetch("/api/solicitacoes/contagem-solicitado");
        const data = await res.json();
        setSolicitadosPendentes(data.count || 0);
      } catch (error) {
        console.error("Erro ao verificar solicitações pendentes:", error);
      }
    };

    verificarPendentes();
    const interval = setInterval(verificarPendentes, 30000);
    return () => clearInterval(interval);
  }, [userIsAdmin]);

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        className="fixed left-3 top-3 z-[60] flex h-10 w-10 items-center justify-center rounded-md border border-gray-200 bg-white shadow-sm md:hidden"
      >
        {mobileOpen ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-[#214B63]">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5 text-[#214B63]">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-48 flex-col border-r border-gray-200 bg-white transition-transform duration-200 md:sticky md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="pt-1 px-3 pb-1.5 flex flex-col items-center">
          <div className="relative flex-shrink-0" style={{ width: "121px", height: "121px" }}>
            <Image
              src="/Soul Hospitalar Webp.webp"
              alt="MV Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>
        <nav className="flex-1 px-3 py-1 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3 py-2 text-sm font-bold rounded-md transition-colors ${
                isActive(item.href)
                  ? "bg-[#214B63] text-white"
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#214B63]"
              }`}
            >
              <span className="flex items-center gap-2">
                <IconeMenu nome={item.icone} />
                {item.label}
              </span>
              {item.href === "/gestao" && solicitadosPendentes > 0 && (
                <span className="h-2 w-2 rounded-full bg-red-500" aria-label="Solicitações pendentes" />
              )}
            </Link>
          ))}
        </nav>
        <div className="border-t border-gray-200 p-3 space-y-2">
          <div className="flex items-center gap-2 px-3">
            <Avatar nome={user.nome} url={user.avatarUrl} size={32} />
            <div className="text-xs min-w-0">
              <p className="font-semibold text-[#214B63] truncate">{user.nome}</p>
              <p className="text-gray-500 truncate text-xs">{user.email}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full px-3 py-2 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors text-left cursor-pointer">
              Sair
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
