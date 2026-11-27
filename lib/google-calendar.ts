import { google } from "googleapis";

const calendar = google.calendar("v3");

export async function getAvailableSlots(
  accessToken: string,
  calendarId: string,
  date: string
): Promise<{ start: string; end: string; display: string }[]> {
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const response = await calendar.events.list({
      auth,
      calendarId,
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    const events = response.data.items || [];

    const slots = [
      { start: "09:00", end: "10:00" },
      { start: "10:00", end: "11:00" },
      { start: "11:00", end: "12:00" },
      { start: "14:00", end: "15:00" },
      { start: "15:00", end: "16:00" },
      { start: "16:00", end: "17:00" },
    ];

    const availableSlots = slots.filter((slot) => {
      const slotStart = new Date(`${date}T${slot.start}:00`);
      const slotEnd = new Date(`${date}T${slot.end}:00`);

      return !events.some((event) => {
        const eventStart = new Date(event.start?.dateTime || "");
        const eventEnd = new Date(event.end?.dateTime || "");
        return (
          (slotStart >= eventStart && slotStart < eventEnd) ||
          (slotEnd > eventStart && slotEnd <= eventEnd) ||
          (slotStart <= eventStart && slotEnd >= eventEnd)
        );
      });
    });

    return availableSlots.map((slot) => ({
      start: `${date}T${slot.start}:00`,
      end: `${date}T${slot.end}:00`,
      display: `${slot.start} - ${slot.end}`,
    }));
  } catch (error) {
    console.error("Erro ao buscar slots disponíveis:", error);
    return [];
  }
}

export async function cancelCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventId: string,
  refreshOptions?: {
    refreshToken: string | null;
    onTokenRefreshed?: (novoAccessToken: string) => Promise<void> | void;
  }
): Promise<void> {
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshOptions?.refreshToken || undefined,
    });

    if (refreshOptions?.onTokenRefreshed) {
      auth.on("tokens", (tokens) => {
        if (tokens.access_token) {
          Promise.resolve(refreshOptions.onTokenRefreshed!(tokens.access_token)).catch((e) =>
            console.error("Erro ao persistir access_token renovado:", e)
          );
        }
      });
    }

    await calendar.events.delete({
      auth,
      calendarId,
      eventId,
    });
  } catch (error) {
    console.error("Erro ao cancelar evento no Google Calendar:", error);
    throw error;
  }
}

export async function createCalendarEvent(
  accessToken: string,
  calendarId: string,
  eventData: {
    summary: string;
    description?: string;
    start: string;
    end: string;
    location?: string;
    attendees?: { email: string; displayName?: string }[];
  },
  refreshOptions?: {
    refreshToken: string | null;
    onTokenRefreshed?: (novoAccessToken: string) => Promise<void> | void;
  }
): Promise<{ link: string; meetLink: string | null; eventId: string }> {
  try {
    // O access_token de um apresentador expira ~1h após a autorização. Sem
    // client id/secret + refresh_token aqui, o OAuth2Client não consegue
    // renovar sozinho e a chamada falha com "invalid authentication credentials".
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({
      access_token: accessToken,
      refresh_token: refreshOptions?.refreshToken || undefined,
    });

    if (refreshOptions?.onTokenRefreshed) {
      auth.on("tokens", (tokens) => {
        if (tokens.access_token) {
          Promise.resolve(refreshOptions.onTokenRefreshed!(tokens.access_token)).catch((e) =>
            console.error("Erro ao persistir access_token renovado:", e)
          );
        }
      });
    }

    const response = await calendar.events.insert({
      auth,
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary: eventData.summary,
        description: eventData.description,
        start: { dateTime: eventData.start, timeZone: "America/Sao_Paulo" },
        end: { dateTime: eventData.end, timeZone: "America/Sao_Paulo" },
        location: eventData.location,
        attendees: eventData.attendees?.map((a) => ({
          email: a.email,
          displayName: a.displayName,
        })),
        conferenceData: {
          createRequest: {
            requestId: crypto.randomUUID(),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const meetLink =
      response.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")?.uri ||
      null;

    return {
      link: response.data.htmlLink || "",
      meetLink,
      eventId: response.data.id || ""
    };
  } catch (error) {
    console.error("Erro ao criar evento no Google Calendar:", error);
    throw error;
  }
}

function linhaApresentador(descricao: string | null | undefined, nome: string): string {
  const linha = `Apresentador: ${nome}`;
  const base = descricao || "";
  if (/^Apresentador:.*$/m.test(base)) return base.replace(/^Apresentador:.*$/m, linha);
  return base ? `${base}\n${linha}` : linha;
}

/**
 * Troca o apresentador de um evento JÁ EXISTENTE, sem apagá-lo (convidados que o gerente
 * adicionou e o link do Meet são preservados).
 *
 * 1) Tenta MOVER o evento para a agenda do novo apresentador (ele passa a ser o organizador e
 *    o evento sai da agenda do anterior). Exige que o dono atual do evento tenha permissão de
 *    edição na agenda do novo apresentador.
 * 2) Se não for possível, mantém o evento onde está e troca os PARTICIPANTES: adiciona o novo
 *    apresentador e remove o anterior, quando ele é apenas convidado (o organizador, dono da
 *    agenda, não pode ser removido por API).
 */
export async function trocarApresentadorNoEvento(params: {
  accessToken: string;
  refreshToken: string | null;
  onTokenRefreshed?: (novoAccessToken: string) => Promise<void> | void;
  calendarIdAtual: string;
  eventId: string;
  novoCalendarId: string;
  novoEmail: string;
  novoNome: string;
  emailAnterior?: string | null;
}): Promise<{ modo: "movido" | "convidado"; motivoFallback?: string }> {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({
    access_token: params.accessToken,
    refresh_token: params.refreshToken || undefined,
  });
  if (params.onTokenRefreshed) {
    auth.on("tokens", (tokens) => {
      if (tokens.access_token) {
        Promise.resolve(params.onTokenRefreshed!(tokens.access_token)).catch((e) =>
          console.error("Erro ao persistir access_token renovado:", e)
        );
      }
    });
  }

  const emailAnterior = (params.emailAnterior || "").toLowerCase();
  const novoEmail = params.novoEmail.toLowerCase();

  const evento = (
    await calendar.events.get({ auth, calendarId: params.calendarIdAtual, eventId: params.eventId })
  ).data;
  const descricao = linhaApresentador(evento.description, params.novoNome);

  // Participantes: remove o apresentador anterior (se for só convidado)
  const participantesBase = (evento.attendees || []).filter(
    (a) => a.organizer || !emailAnterior || (a.email || "").toLowerCase() !== emailAnterior
  );

  // 1) Tenta mover o evento para a agenda do novo apresentador
  let motivoFallback: string | undefined;
  try {
    await calendar.events.move({
      auth,
      calendarId: params.calendarIdAtual,
      eventId: params.eventId,
      destination: params.novoCalendarId,
      sendUpdates: "none",
    });

    try {
      await calendar.events.patch({
        auth,
        calendarId: params.novoCalendarId,
        eventId: params.eventId,
        sendUpdates: "none",
        requestBody: {
          description: descricao,
          attendees: participantesBase.filter((a) => (a.email || "").toLowerCase() !== novoEmail),
        },
      });
    } catch (e) {
      console.error("Evento movido, mas falhou ao atualizar descrição/participantes:", e);
    }
    return { modo: "movido" };
  } catch (error) {
    motivoFallback = error instanceof Error ? error.message : String(error);
    console.warn("Não foi possível mover o evento para o novo apresentador; trocando participantes:", motivoFallback);
  }

  // 2) Mantém o evento e troca os participantes
  const jaConvidado = participantesBase.some((a) => (a.email || "").toLowerCase() === novoEmail);
  const participantes = jaConvidado
    ? participantesBase
    : [...participantesBase, { email: params.novoEmail, displayName: params.novoNome }];

  await calendar.events.patch({
    auth,
    calendarId: params.calendarIdAtual,
    eventId: params.eventId,
    sendUpdates: "none",
    requestBody: { description: descricao, attendees: participantes },
  });

  return { modo: "convidado", motivoFallback };
}
