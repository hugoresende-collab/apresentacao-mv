"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

interface SidebarProps {
  user: {
    nome: string;
    email: string;
  };
}

const NAV_ITEMS = [
  { href: "/", label: "Nova demonstração" },
  { href: "/minhas-solicitacoes", label: "Minhas demonstrações" },
  { href: "/gestao", label: "Gestão" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-48 border-r border-gray-200 bg-white flex flex-col h-screen sticky top-0">
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
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
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
        <div className="text-xs px-3">
          <p className="font-semibold text-[#214B63]">{user.nome}</p>
          <p className="text-gray-500 truncate text-xs">{user.email}</p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="w-full px-3 py-2 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors text-left cursor-pointer">
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}
