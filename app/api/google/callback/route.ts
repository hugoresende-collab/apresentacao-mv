import { NextRequest, NextResponse } from "next/server";
import { getUserInfo } from "@/lib/google-auth";
import { isEmailAllowed } from "@/lib/security";
import { setSessionCookie } from "@/lib/session";
import { OAUTH_STATE_COOKIE_NAME, verifyState } from "@/lib/oauth-state";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedNonce = request.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;

  if (!code || !verifyState(state, expectedNonce)) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", baseUrl));
  }

  try {
    const userInfo = await getUserInfo(code, baseUrl);

    if (!isEmailAllowed(userInfo.email)) {
      return NextResponse.redirect(new URL("/login?error=domain_not_allowed", baseUrl));
    }

    const response = NextResponse.redirect(new URL("/", baseUrl));
    setSessionCookie(response, {
      email: userInfo.email.toLowerCase(),
      nome: userInfo.name,
      avatarUrl: userInfo.picture,
    });
    response.cookies.delete(OAUTH_STATE_COOKIE_NAME);
    return response;
  } catch (error) {
    console.error("Falha no login com Google:", error);
    return NextResponse.redirect(new URL("/login?error=auth_failed", baseUrl));
  }
}
