import { NextRequest, NextResponse } from "next/server";
import { createCalendarEvent } from "@/lib/google-calendar";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, calendarId, summary, description, start, end, location, attendees } = body;

    if (!accessToken || !calendarId || !summary || !start || !end) {
      return NextResponse.json(
        { error: "accessToken, calendarId, summary, start e end são obrigatórios" },
        { status: 400 }
      );
    }

    const eventLink = await createCalendarEvent(accessToken, calendarId, {
      summary,
      description,
      start,
      end,
      location,
      attendees,
    });

    return NextResponse.json({ eventLink });
  } catch (error) {
    console.error("Erro ao criar evento:", error);
    return NextResponse.json(
      { error: "Erro ao criar evento no calendário" },
      { status: 500 }
    );
  }
}
