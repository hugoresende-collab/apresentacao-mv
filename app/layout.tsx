import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
      <body className="min-h-full flex flex-row bg-slate-50 text-slate-900">
        {user && <NpsPendenteFetcher />}
        {user && (
          <aside className="w-48 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0">
            <div className="border-b border-slate-200 p-4">
              <p className="font-semibold text-slate-800 text-sm">Solicitações de Demonstrações</p>
              <p className="text-xs text-slate-500">Área Hospitalar</p>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-slate-200 p-3 space-y-2">
              <div className="text-xs px-3">
                <p className="font-semibold text-slate-700">{user.nome}</p>
                <p className="text-slate-500 truncate">{user.email}</p>
              </div>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="w-full px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-md transition-colors text-left">
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
