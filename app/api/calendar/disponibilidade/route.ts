import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/google-calendar";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get("token");
    const calendarId = searchParams.get("calendarId");
    const date = searchParams.get("date");
    const apresentador = searchParams.get("apresentador");

    if (!date) {
      return NextResponse.json(
        { error: "date é obrigatória" },
        { status: 400 }
      );
    }

    // Se temos token e calendarId, usa o Google Calendar
    if (accessToken && calendarId) {
      const slots = await getAvailableSlots(accessToken, calendarId, date);
      return NextResponse.json({ slots, source: "google_calendar" });
    }

    // Caso contrário, retorna horários sugeridos
    const slots = [
      { start: `${date}T09:00:00`, end: `${date}T10:00:00`, display: "09:00 - 10:00" },
      { start: `${date}T10:00:00`, end: `${date}T11:00:00`, display: "10:00 - 11:00" },
      { start: `${date}T11:00:00`, end: `${date}T12:00:00`, display: "11:00 - 12:00" },
      { start: `${date}T14:00:00`, end: `${date}T15:00:00`, display: "14:00 - 15:00" },
      { start: `${date}T15:00:00`, end: `${date}T16:00:00`, display: "15:00 - 16:00" },
      { start: `${date}T16:00:00`, end: `${date}T17:00:00`, display: "16:00 - 17:00" },
    ];

    return NextResponse.json({
      slots,
      source: "suggested",
      message: `Horários sugeridos para ${apresentador || "o apresentador"}. Para ver disponibilidade real do calendário, configure as credenciais do Google Calendar.`,
    });
  } catch (error) {
    console.error("Erro ao buscar disponibilidade:", error);
    return NextResponse.json(
      { error: "Erro ao buscar disponibilidade" },
      { status: 500 }
    );
  }
}
