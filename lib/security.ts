const DEFAULT_ALLOWED_EMAIL_DOMAINS = ["mv.com.br"];

function parseCsvEnv(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseBooleanEnv(raw: string | undefined): boolean {
  return (raw || "").trim().toLowerCase() === "true";
}

export function getAllowedEmailDomains(): string[] {
  const configured = parseCsvEnv(process.env.ALLOWED_LOGIN_DOMAINS).map((d) => d.toLowerCase());
  return configured.length > 0 ? configured : DEFAULT_ALLOWED_EMAIL_DOMAINS;
}

export function getAllowedLoginEmails(): string[] {
  return parseCsvEnv(process.env.ALLOWED_LOGIN_EMAILS).map((email) => email.toLowerCase());
}

export function isLoginDomainRestrictionEnabled(): boolean {
  // Seguro por padrão: restrição fica ligada a menos que explicitamente desativada.
  return !parseBooleanEnv(process.env.DISABLE_LOGIN_DOMAIN_RESTRICTION);
}

export function isEmailAllowed(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) {
    return false;
  }

  if (!isLoginDomainRestrictionEnabled()) {
    return true;
  }

  if (getAllowedLoginEmails().includes(normalized)) {
    return true;
  }

  const domain = normalized.split("@")[1];
  if (!domain) {
    return false;
  }

  return getAllowedEmailDomains().includes(domain);
}
