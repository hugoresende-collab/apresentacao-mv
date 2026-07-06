import { createHmac } from "crypto";

export const OAUTH_STATE_COOKIE_NAME = "google-oauth-state";

function signState(nonce: string): string {
  const secret = process.env.SESSION_SECRET || "";
  return createHmac("sha256", secret).update(nonce).digest("base64url");
}

export function buildState(nonce: string): string {
  return `${nonce}.${signState(nonce)}`;
}

export function verifyState(state: string | null, expectedNonce: string | undefined): boolean {
  if (!state || !expectedNonce) return false;
  const [nonce, signature] = state.split(".");
  if (!nonce || !signature || nonce !== expectedNonce) return false;
  return signature === signState(nonce);
}
