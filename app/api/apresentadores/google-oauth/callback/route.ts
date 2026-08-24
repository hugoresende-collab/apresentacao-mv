import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getDb } from "@/lib/db";
import { nowIso } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/gerenciar-apresentadores?erro=codigo_ausente", request.url)
      );
    }

    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const apresentadorNome = stateData.apresentador;

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/apresentadores/google-oauth/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Obter o calendarId (email do usuário autenticado)
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    const calendarList = await calendar.calendarList.list();
    const primaryCalendar = calendarList.data.items?.find((cal) => cal.primary);
    const calendarId = primaryCalendar?.id;

    console.log("OAuth Callback - Tokens recebidos:", {
      apresentadorNome,
      calendarId,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
    });

    // Salvar no banco de dados
    const db = getDb();

    // Primeiro, buscar o apresentador existente (a coluna "nome" não tem
    // constraint UNIQUE, então upsert com onConflict não funciona aqui)
    const { data: apresentadorExistente } = await db
      .from("apresentadores")
      .select("id, email")
      .eq("nome", apresentadorNome)
      .single();

    const dadosCalendario = {
      google_calendar_id: calendarId,
      google_calendar_token: tokens.access_token,
      google_calendar_refresh_token: tokens.refresh_token || null,
      autorizado_por: user.email,
      data_autorizacao: nowIso(),
      updated_at: nowIso(),
    };

    const { data: apresentador, error } = apresentadorExistente
      ? await db
          .from("apresentadores")
          .update(dadosCalendario)
          .eq("id", apresentadorExistente.id)
          .select()
          .single()
      : await db
          .from("apresentadores")
          .insert({
            id: crypto.randomUUID(),
            nome: apresentadorNome,
            email: "unknown@mv.com.br",
            ...dadosCalendario,
          })
          .select()
          .single();

    if (error) {
      console.error("Erro ao salvar apresentador:", error);
      return NextResponse.redirect(
        new URL("/gerenciar-apresentadores?erro=salvar", request.url)
      );
    }

    console.log("Apresentador atualizado:", {
      id: apresentador?.id,
      nome: apresentador?.nome,
      hasToken: !!apresentador?.google_calendar_token,
    });

    return NextResponse.redirect(
      new URL("/gerenciar-apresentadores?sucesso=true", request.url)
    );
  } catch (error) {
    console.error("Erro no callback de OAuth:", error);
    return NextResponse.redirect(
      new URL("/gerenciar-apresentadores?erro=autenticacao", request.url)
    );
  }
}
