import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { getSessionUser } from "@/lib/session";
import { NpsPendenteFetcher } from "@/components/NpsPendenteFetcher";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solicitação de Demonstrações — MV",
  description: "Ferramenta interna para solicitação e acompanhamento de demonstrações de produto",
};

const NAV_ITEMS = [
  { href: "/", label: "Nova solicitação" },
  { href: "/minhas-solicitacoes", label: "Minhas solicitações" },
  { href: "/gestao", label: "Gestão" },
  { href: "/dashboard", label: "Dashboard" },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-row bg-gray-50 text-slate-900">
        {user && <NpsPendenteFetcher />}
        {user && (
          <aside className="w-48 border-r border-gray-200 bg-white flex flex-col h-screen sticky top-0">
            <div className="border-b border-gray-200 p-4 flex items-center gap-3">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/logo.webp"
                  alt="MV Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-[#008C77] text-sm truncate">Solicitações de Demo</p>
                <p className="text-xs text-gray-500">Área Hospitalar</p>
              </div>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-xs font-medium text-gray-600 hover:bg-blue-50 hover:text-[#214B63] rounded-md transition-colors"
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
                <button type="submit" className="w-full px-3 py-2 text-xs font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors text-left">
                  Sair
                </button>
              </form>
            </div>
          </aside>
        )}
        <main className="flex-1 px-8 py-8">{children}</main>
      </body>
    </html>
  );
}
