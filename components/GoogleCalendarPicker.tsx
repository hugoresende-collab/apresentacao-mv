"use client";

import { useEffect, useState } from "react";

interface Evento {
  id: string;
  summary: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

export function GoogleCalendarPicker({
  apresentadorId,
  dataSelecionada,
  onHorarioSelecionado,
}: {
  apresentadorId: string;
  dataSelecionada: string; // YYYY-MM-DD
  onHorarioSelecionado: (dataHora: string) => void;
}) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [horarioSelecionado, setHorarioSelecionado] = useState("");

  useEffect(() => {
    if (!dataSelecionada || !apresentadorId) return;

    carregarEventos();
  }, [dataSelecionada, apresentadorId]);

  async function carregarEventos() {
    setCarregando(true);
    setErro(null);
    try {
      // Buscar eventos para a semana da data selecionada
      const dataSelecionadaObj = new Date(dataSelecionada);
      const dataInicio = new Date(dataSelecionadaObj);
      dataInicio.setDate(dataInicio.getDate() - dataInicio.getDay()); // Início da semana (domingo)

      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataFim.getDate() + 7); // Próximos 7 dias

      const dataInicioStr = dataInicio.toISOString().split("T")[0];
      const dataFimStr = dataFim.toISOString().split("T")[0];

      const url = `/api/apresentadores/calendar?apresentadorId=${apresentadorId}&dataInicio=${dataInicioStr}&dataFim=${dataFimStr}`;
      console.log("Buscando eventos:", { url, apresentadorId, dataInicioStr, dataFimStr });

      const res = await fetch(url);

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Erro na resposta:", errorData);
        throw new Error(errorData.error || errorData.details || `Erro ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      console.log("Eventos carregados:", data.eventos?.length || 0);
      setEventos(data.eventos || []);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      setErro(error instanceof Error ? error.message : "Erro ao carregar agenda");
    }
    setCarregando(false);
  }

  // Gerar horários disponíveis (ex: 09:00, 09:30, 10:00, etc.)
  const horarios = gerarHorarios();
  const horariosOcupados = getHorariosOcupados();

  function gerarHorarios(): string[] {
    const horarios = [];
    for (let h = 8; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        horarios.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return horarios;
  }

  function getHorariosOcupados(): Set<string> {
    const ocupados = new Set<string>();
    eventos.forEach((evento) => {
      const inicio = evento.start?.dateTime || evento.start?.date;
      const fim = evento.end?.dateTime || evento.end?.date;

      if (inicio && fim) {
        const inicioDate = new Date(inicio);
        const fimDate = new Date(fim);

        // Marcar todos os slots de 30 min entre início e fim como ocupados
        let current = new Date(inicioDate);
        while (current < fimDate) {
          const h = String(current.getHours()).padStart(2, "0");
          const m = String(current.getMinutes()).padStart(2, "0");
          ocupados.add(`${h}:${m}`);
          current.setMinutes(current.getMinutes() + 30);
        }
      }
    });
    return ocupados;
  }

  return (
    <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
      <h4 className="font-semibold text-slate-900 mb-3">📅 Agenda do apresentador</h4>

      {carregando && <p className="text-sm text-slate-600">Carregando agenda...</p>}

      {erro && <p className="text-sm text-red-600">⚠️ {erro}</p>}

      {!carregando && !erro && (
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-700 mb-2">Horários disponíveis para {dataSelecionada}:</p>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {horarios.map((horario) => {
                const disponivel = !horariosOcupados.has(horario);
                return (
                  <button
                    key={horario}
                    onClick={() => {
                      if (disponivel) {
                        setHorarioSelecionado(horario);
                        const dataHora = `${dataSelecionada}T${horario}`;
                        onHorarioSelecionado(dataHora);
                      }
                    }}
                    disabled={!disponivel}
                    className={`px-2 py-2 rounded-md text-xs font-medium transition-colors ${
                      disponivel
                        ? horarioSelecionado === horario
                          ? "bg-emerald-600 text-white"
                          : "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    {horario}
                  </button>
                );
              })}
            </div>
          </div>

          {eventos.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">Eventos já marcados:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {eventos.map((evento) => (
                  <div key={evento.id} className="text-xs bg-white border border-slate-200 rounded px-2 py-1">
                    <p className="font-medium text-slate-900">{evento.summary}</p>
                    {evento.start?.dateTime && (
                      <p className="text-slate-500">
                        {new Date(evento.start.dateTime).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
