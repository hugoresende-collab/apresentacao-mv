import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAuthUrl } from "@/lib/google-auth";
import { OAUTH_STATE_COOKIE_NAME, buildState } from "@/lib/oauth-state";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const nonce = randomUUID();
  const state = buildState(nonce);

  const authUrl = getAuthUrl(baseUrl, state);
  const response = NextResponse.redirect(authUrl);
  response.cookies.set(OAUTH_STATE_COOKIE_NAME, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
