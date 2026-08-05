import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getSessionUser } from "@/lib/session";
import { NpsPendenteFetcher } from "@/components/NpsPendenteFetcher";
import { Sidebar } from "@/components/Sidebar";
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
  icons: {
    icon: "/favicon.png",
  },
};


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
        {user && <Sidebar user={user} />}
        <main className="flex-1 px-8 py-8">{children}</main>
      </body>
    </html>
  );
}
