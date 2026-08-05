import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getDb } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { isAdmin } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user || !isAdmin(user.email)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const apresentadorId = searchParams.get("apresentadorId");
    const dataInicio = searchParams.get("dataInicio"); // YYYY-MM-DD
    const dataFim = searchParams.get("dataFim"); // YYYY-MM-DD

    if (!apresentadorId || !dataInicio || !dataFim) {
      return NextResponse.json(
        { error: "apresentadorId, dataInicio e dataFim são obrigatórios" },
        { status: 400 }
      );
    }

    const db = getDb();
    console.log("Buscando apresentador:", { apresentadorId, dataInicio, dataFim });

    const { data: apresentador, error } = await db
      .from("apresentadores")
      .select("*")
      .eq("id", apresentadorId)
      .single();

    if (error) {
      console.error("Erro ao buscar apresentador:", error);
      return NextResponse.json(
        { error: "Apresentador não encontrado", details: error.message },
        { status: 404 }
      );
    }

    if (!apresentador) {
      return NextResponse.json(
        { error: "Apresentador não encontrado" },
        { status: 404 }
      );
    }

    if (!apresentador.google_calendar_token) {
      return NextResponse.json(
        { error: "Apresentador não tem Google Calendar autorizado" },
        { status: 400 }
      );
    }

    // Criar cliente OAuth com tokens do apresentador
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error("Google OAuth não está configurado");
      return NextResponse.json(
        { error: "Google OAuth não está configurado" },
        { status: 500 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/apresentadores/google-oauth/callback`
    );

    oauth2Client.setCredentials({
      access_token: apresentador.google_calendar_token,
      refresh_token: apresentador.google_calendar_refresh_token,
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    console.log("Buscando eventos do Google Calendar:", {
      calendarId: apresentador.google_calendar_id,
      timeMin: new Date(dataInicio).toISOString(),
      timeMax: new Date(dataFim + "T23:59:59").toISOString(),
    });

    // Buscar eventos do calendário
    const eventos = await calendar.events.list({
      calendarId: apresentador.google_calendar_id || "primary",
      timeMin: new Date(dataInicio).toISOString(),
      timeMax: new Date(dataFim + "T23:59:59").toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    console.log("Eventos encontrados:", eventos.data.items?.length || 0);

    return NextResponse.json({
      eventos: eventos.data.items || [],
      calendarId: apresentador.google_calendar_id,
    });
  } catch (error) {
    console.error("Erro ao buscar eventos do Google Calendar:", error);
    return NextResponse.json(
      {
        error: "Erro ao buscar eventos do Google Calendar",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
