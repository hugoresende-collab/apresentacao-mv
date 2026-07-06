import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
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
  { href: "/agendar", label: "Agendar" },
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
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {user && (
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
              <span className="font-semibold text-slate-800">Solicitação de Demonstrações</span>
              <nav className="flex items-center gap-4 text-sm">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-slate-600 hover:text-slate-900 hover:underline"
                  >
                    {item.label}
                  </Link>
                ))}
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">{user.nome}</span>
                <form action="/api/auth/logout" method="POST">
                  <button type="submit" className="text-slate-600 hover:text-slate-900 hover:underline">
                    Sair
                  </button>
                </form>
              </nav>
            </div>
          </header>
        )}
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
