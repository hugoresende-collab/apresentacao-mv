export interface ApresentadorConfig {
  nome: string;
  email: string;
  calendarId?: string;
  accessToken?: string;
}

export const APRESENTADORES_CONFIG: Record<string, ApresentadorConfig> = {
  "Valmir": {
    nome: "Valmir",
    email: "vjunior@mv.com.br",
  },
  "Barbara Moutinho": {
    nome: "Barbara Moutinho",
    email: "barbara.moutinho@mv.com.br",
  },
  "Ana Mendonça": {
    nome: "Ana Mendonça",
    email: "ana.mendonca@mv.com.br",
  },
  "Gabriel Arcanjo": {
    nome: "Gabriel Arcanjo",
    email: "gabriel.arcanjo@mv.com.br",
  },
  "produto teste": {
    nome: "produto teste",
    email: "produto@mv.com.br",
  },
};

export function getApresentadorEmail(nome: string): string | undefined {
  return APRESENTADORES_CONFIG[nome]?.email;
}
