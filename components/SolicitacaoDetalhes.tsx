import type { SolicitacaoDemo } from "@/lib/types";

export function SolicitacaoDetalhes({ solicitacao }: { solicitacao: SolicitacaoDemo }) {
  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-2 text-slate-600">
        <Info label="Código da solicitação" value={solicitacao.codigo_solicitacao || "-"} />
        <Info label="Email do gerente de conta" value={solicitacao.gerente_conta_email || "-"} />
        <Info label="Unidade regional" value={solicitacao.unidade_regional || "-"} />
        <Info label="Natureza da instituição" value={solicitacao.natureza_instituicao || "-"} />
        <Info label="Porte" value={solicitacao.porte_instituicao || "-"} />
        <Info label="Tipo de unidade" value={solicitacao.tipo_unidade || "-"} />
        <Info
          label="Perfil de serviços"
          value={
            [
              solicitacao.atende_sus ? "Atende SUS" : null,
              solicitacao.atende_convenio_particular ? "Atende convênio/particular" : null,
              solicitacao.possui_pronto_socorro ? "Possui pronto socorro" : null,
              solicitacao.possui_ambulatorio ? "Possui ambulatório" : null,
            ]
              .filter(Boolean)
              .join(", ") || "-"
          }
        />
        <Info
          label="Solução atual"
          value={
            solicitacao.solucao_atual === "Outros"
              ? `Outros (${solicitacao.solucao_atual_outros || "não especificado"})`
              : solicitacao.solucao_atual || "-"
          }
        />
        <Info label="Tipo de oportunidade" value={solicitacao.tipo_oportunidade || "-"} />
        <Info label="Tipo de projeto" value={solicitacao.tipo_projeto || "-"} />
        <Info label="Código da oportunidade" value={solicitacao.codigo_oportunidade || "-"} />
        <Info label="% de evolução no CRM" value={solicitacao.percentual_evolucao_crm || "-"} />
        <Info label="Apresentador" value={solicitacao.apresentador || "-"} />
        <Info label="Tipo de apresentação" value={solicitacao.tipo_apresentacao} />
        {solicitacao.tipo_apresentacao === "Presencial" && (
          <Info label="Endereço" value={solicitacao.endereco_apresentacao || "-"} />
        )}
        <Info label="Observação da apresentação" value={solicitacao.observacao_apresentacao || "-"} />
        <Info
          label="Outras datas sugeridas"
          value={[solicitacao.data_desejada_2, solicitacao.data_desejada_3].filter(Boolean).join(", ") || "-"}
        />
        <Info label="Período desejado" value={solicitacao.periodo || "-"} />
        <Info
          label="Horário desejado"
          value={`${solicitacao.horario_inicio_desejado || "-"} a ${solicitacao.horario_fim_desejado || "-"}`}
        />
        <Info label="Patrocinador" value={solicitacao.nome_patrocinador || "-"} />
        <Info label="Email patrocinador" value={solicitacao.email_patrocinador || "-"} />
        <Info label="Número de visitas" value={solicitacao.numero_visitas || "-"} />
        <Info
          label="Valor aproximado do projeto"
          value={
            solicitacao.valor_aproximado_projeto
              ? solicitacao.valor_aproximado_projeto.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })
              : "-"
          }
        />
        <Info label="Observações" value={solicitacao.observacoes || "-"} />
        {solicitacao.status === "cancelada" && (
          <Info label="Motivo do cancelamento" value={solicitacao.motivo_cancelamento || "-"} />
        )}
      </dl>

      {[
        solicitacao.dor_prospect,
        solicitacao.problemas_atendimento_paciente,
        solicitacao.problemas_area_assistencial,
        solicitacao.problemas_suprimentos,
        solicitacao.problemas_faturamento,
        solicitacao.problemas_financeiro_contabil,
        solicitacao.problemas_diagnostico_terapia,
      ].some((campo) => campo && campo.trim()) && (
        <div className="rounded-md bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold text-slate-700">Dores e qualificação</p>
          <dl className="grid grid-cols-1 gap-2 text-slate-600 sm:grid-cols-2">
            <Info label="Dor do prospect" value={solicitacao.dor_prospect || "-"} />
            <Info
              label="Problemas em atendimento ao paciente"
              value={solicitacao.problemas_atendimento_paciente || "-"}
            />
            <Info
              label="Problemas na área clínica/assistencial"
              value={solicitacao.problemas_area_assistencial || "-"}
            />
            <Info label="Problemas em suprimentos" value={solicitacao.problemas_suprimentos || "-"} />
            <Info label="Problemas em faturamento" value={solicitacao.problemas_faturamento || "-"} />
            <Info
              label="Problemas financeiro/contábil"
              value={solicitacao.problemas_financeiro_contabil || "-"}
            />
            <Info
              label="Problemas em diagnóstico/terapia"
              value={solicitacao.problemas_diagnostico_terapia || "-"}
            />
          </dl>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  );
}
