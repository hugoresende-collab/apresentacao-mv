"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
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

const ITEMS_COLABORADOR = [
  { href: "/", label: "Nova demonstração" },
  { href: "/minhas-solicitacoes", label: "Minhas demonstrações" },
];

const ITEMS_ADMIN = [
  { href: "/", label: "Nova demonstração" },
  { href: "/minhas-solicitacoes", label: "Minhas demonstrações" },
  { href: "/gestao", label: "Gestão" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/gerenciar-apresentadores", label: "Apresentadores" },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const userIsAdmin = isAdmin(user.email);
  const navItems = userIsAdmin ? ITEMS_ADMIN : ITEMS_COLABORADOR;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

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
              className={`block px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                isActive(item.href)
                  ? "bg-[#214B63] text-white"
                  : "text-gray-600 hover:bg-blue-50 hover:text-[#214B63]"
              }`}
            >
              {item.label}
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
