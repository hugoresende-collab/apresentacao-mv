import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apresentador = searchParams.get("apresentador");

    if (!apresentador) {
      return NextResponse.json(
        { error: "apresentador é obrigatório" },
        { status: 400 }
      );
    }

    // Validar variáveis de ambiente
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("Variáveis de ambiente do Google não configuradas");
      return NextResponse.json(
        { error: "Google OAuth não está configurado. Contacte o administrador." },
        { status: 500 }
      );
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/apresentadores/google-oauth/callback`;

    console.log("OAuth Config:", {
      clientId: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + "...",
      redirectUri,
    });

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectUri
    );

    const scopes = [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
      include_granted_scopes: true,
      state: Buffer.from(JSON.stringify({ apresentador })).toString("base64"),
    });

    console.log("Generated Auth URL:", authUrl.substring(0, 100) + "...");

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Erro ao gerar URL de autorização:", error);
    return NextResponse.json(
      {
        error: "Erro ao gerar URL de autorização",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
