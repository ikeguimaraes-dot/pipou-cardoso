-- Operational schema, no source customer rows. All RPCs use caller RLS.
SET LOCAL search_path = public, extensions, pg_catalog;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;
CREATE TABLE public."candidate_feedback_operacional" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "candidate_id" uuid NOT NULL,
 "agendamento_id" uuid,
 "postura_apresentacao" numeric(3,1),
 "ritmo_sob_pressao" numeric(3,1),
 "dominio_tecnico" numeric(3,1),
 "higiene_seguranca" numeric(3,1),
 "trabalho_em_equipe" numeric(3,1),
 "nota_final" numeric(4,2) GENERATED ALWAYS AS ((((((COALESCE(postura_apresentacao, (0)::numeric) + COALESCE(ritmo_sob_pressao, (0)::numeric)) + COALESCE(dominio_tecnico, (0)::numeric)) + COALESCE(higiene_seguranca, (0)::numeric)) + COALESCE(trabalho_em_equipe, (0)::numeric)) / 5.0)) STORED,
 "parecer" text,
 "avaliador_id" uuid,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."interviews" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "candidate_id" uuid NOT NULL,
 "job_opening_id" uuid,
 "entrevistador_id" uuid,
 "data_entrevista" timestamp with time zone NOT NULL,
 "formato" text DEFAULT 'presencial'::text NOT NULL,
 "status" text DEFAULT 'agendada'::text NOT NULL,
 "feedback" text,
 "nota" numeric(3,1),
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."access_requests" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid,
 "email" text NOT NULL,
 "cpf" text NOT NULL,
 "status" text DEFAULT 'pending'::text NOT NULL,
 "approver_tier" text NOT NULL,
 "approver_id" uuid,
 "approved_at" timestamp with time zone,
 "rejected_reason" text,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."gorjeta_periodos" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid,
 "data" date NOT NULL,
 "receita_bruta" numeric(12,2) NOT NULL,
 "imposto_pct" numeric(5,2) DEFAULT 20.00 NOT NULL,
 "receita_liquida" numeric(12,2) GENERATED ALWAYS AS (round((receita_bruta * ((1)::numeric - (imposto_pct / 100.0))), 2)) STORED,
 "total_pontos" integer NOT NULL,
 "valor_ponto" numeric(10,4) GENERATED ALWAYS AS (round(((receita_bruta * ((1)::numeric - (imposto_pct / 100.0))) / (total_pontos)::numeric), 4)) STORED,
 "fonte" text DEFAULT 'manual'::text NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."employee_availability" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "unit_id" uuid NOT NULL,
 "data" date NOT NULL,
 "disponivel" boolean DEFAULT false NOT NULL,
 "motivo" text,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."onboarding_tarefas" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "template_id" uuid NOT NULL,
 "titulo" text NOT NULL,
 "descricao" text,
 "responsavel" text NOT NULL,
 "prazo_dias" integer DEFAULT 1 NOT NULL,
 "ordem" integer DEFAULT 0 NOT NULL
);
CREATE TABLE public."pdi_metas" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "pdi_id" uuid NOT NULL,
 "descricao" text NOT NULL,
 "prazo" date,
 "status" text DEFAULT 'pendente'::text NOT NULL,
 "progresso" integer DEFAULT 0,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."candidates" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "job_opening_id" uuid,
 "full_name" text NOT NULL,
 "email" text,
 "phone" text,
 "access_code" text DEFAULT (gen_random_uuid())::text NOT NULL,
 "status" text DEFAULT 'novo'::text NOT NULL,
 "interview_status" text DEFAULT 'pendente'::text NOT NULL,
 "created_at" timestamp with time zone DEFAULT now(),
 "unit_id" uuid,
 "origem" text DEFAULT 'manual'::text NOT NULL,
 "area_interesse" text,
 "nota_maya" numeric(3,1),
 "conversa_id" uuid,
 "disc_profile" text,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 "responsavel_id" uuid,
 "entrevistador_id" uuid,
 "observacoes" text,
 "welcome_message_sid" text,
 "welcome_delivery_status" text,
 "welcome_sent_at" timestamp with time zone,
 "welcome_error_code" text,
 "origem_id" uuid,
 "cidade" text,
 "escolaridade_nivel" text,
 "pretensao_salarial" numeric(10,2),
 "disponibilidade_inicio" date,
 "turnos_disponiveis" text[] DEFAULT '{}'::text[],
 "bairro" text,
 "cv_storage_path" text,
 "experiencias" jsonb DEFAULT '[]'::jsonb,
 "formacoes" jsonb DEFAULT '[]'::jsonb,
 "idiomas" jsonb DEFAULT '[]'::jsonb,
 "habilidades" text[] DEFAULT '{}'::text[],
 "cargo_id" uuid,
 "requer_entrevista_diretoria" boolean,
 "employee_id" uuid,
 "promovido_em" timestamp with time zone
);
CREATE TABLE public."payroll_fechamento_periodo" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid NOT NULL,
 "competencia" text NOT NULL,
 "tipo_processo" text DEFAULT '11'::text NOT NULL,
 "status" text DEFAULT 'ABERTO'::text NOT NULL,
 "custo_total_folha" numeric(14,2),
 "gerado_por" uuid,
 "gerado_em" timestamp with time zone DEFAULT now() NOT NULL,
 "cod_empresa" text
);
CREATE TABLE public."theo_tickets" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid,
 "categoria" text NOT NULL,
 "descricao" text,
 "status" text DEFAULT 'aberto'::text NOT NULL,
 "created_at" timestamp with time zone DEFAULT now(),
 "updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."onboarding_runs" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid NOT NULL,
 "employee_id" uuid NOT NULL,
 "template_id" uuid NOT NULL,
 "status" text DEFAULT 'em_andamento'::text NOT NULL,
 "data_inicio" date DEFAULT CURRENT_DATE NOT NULL,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."performance_templates" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "brand_id" uuid NOT NULL,
 "unit_id" uuid,
 "nome" text NOT NULL,
 "descricao" text,
 "funcao" text,
 "periodicidade" text NOT NULL,
 "criterios" jsonb DEFAULT '[]'::jsonb NOT NULL,
 "ativo" boolean DEFAULT true,
 "created_by" uuid,
 "created_at" timestamp with time zone DEFAULT now(),
 "updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."gorjeta_dias" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid,
 "employee_id" uuid,
 "periodo_id" uuid,
 "data" date NOT NULL,
 "cargo" text NOT NULL,
 "pontos" integer DEFAULT 0 NOT NULL,
 "presente" boolean DEFAULT true NOT NULL,
 "valor_calculado" numeric(10,2) DEFAULT 0 NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."job_openings" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "brand_id" uuid,
 "unit_id" uuid,
 "title" text NOT NULL,
 "description" text,
 "is_active" boolean DEFAULT true,
 "created_by" uuid,
 "created_at" timestamp with time zone DEFAULT now(),
 "status" text DEFAULT 'aberta'::text NOT NULL,
 "recrutador" text,
 "sla_dias" integer DEFAULT 30,
 "status_prazo" text,
 "motivo" text,
 "horario" text,
 "salario" numeric(10,2),
 "fonte_recrutamento" text,
 "data_admissao" date,
 "candidato_aprovado" text,
 "fechamento_previsto" date,
 "observacoes" text,
 "area" text,
 "cargo" text,
 "data_solicitacao" date,
 "observacao" text,
 "responsavel_id" uuid,
 "entrevistador_id" uuid,
 "prioridade" text DEFAULT 'media'::text,
 "salario_min" numeric(10,2),
 "salario_max" numeric(10,2),
 "must_have" text,
 "nice_to_have" text,
 "cargo_grupo_id" uuid,
 "motivo_estruturado" text,
 "horario_escala" text,
 "forma_contratacao" text,
 "substituido_id" uuid,
 "periodo_exp_dias" integer DEFAULT 90,
 "congelada" boolean DEFAULT false NOT NULL,
 "cancelada" boolean DEFAULT false NOT NULL,
 "motivo_congelamento" text,
 "congelada_em" timestamp with time zone,
 "cancelada_em" timestamp with time zone,
 "cargo_id" uuid,
 "nivel" integer,
 "data_recrutamento" date
);
CREATE TABLE public."quadro_ideal" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid NOT NULL,
 "departamento" text,
 "cargo" text,
 "cargo_grupo_id" uuid,
 "qtd_alvo" integer NOT NULL,
 "vigente_desde" date DEFAULT ((now() AT TIME ZONE 'America/Sao_Paulo'::text))::date NOT NULL,
 "vigente_ate" date,
 "created_at" timestamp with time zone DEFAULT now(),
 "cargo_id" uuid,
 "alvo_manha" integer DEFAULT 0 NOT NULL,
 "alvo_tarde" integer DEFAULT 0 NOT NULL,
 "alvo_noite" integer DEFAULT 0 NOT NULL,
 "alvo_madrugada" integer DEFAULT 0 NOT NULL,
 "alvo_intermediario" integer DEFAULT 0 NOT NULL,
 "reporta_a_cargo_id" uuid
);
CREATE TABLE public."training_templates" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "brand_id" uuid NOT NULL,
 "unit_id" uuid,
 "nome" text NOT NULL,
 "descricao" text,
 "funcao" text,
 "obrigatorio" boolean DEFAULT false,
 "validade_dias" integer,
 "ativo" boolean DEFAULT true,
 "created_by" uuid,
 "created_at" timestamp with time zone DEFAULT now(),
 "updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."score_events" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "tipo" text NOT NULL,
 "delta" integer NOT NULL,
 "descricao" text,
 "referencia_id" uuid,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."cargo_grupos" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "nome" text NOT NULL,
 "sla_dias_uteis" integer NOT NULL,
 "descricao" text,
 "ativo" boolean DEFAULT true NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."payslips" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "competencia" date NOT NULL,
 "salario_base" numeric(10,2) NOT NULL,
 "horas_extras" numeric(10,2) DEFAULT 0,
 "adicional_noturno" numeric(10,2) DEFAULT 0,
 "gorjeta" numeric(10,2) DEFAULT 0,
 "dsr_gorjeta" numeric(10,2) DEFAULT 0,
 "desconto_inss" numeric(10,2) DEFAULT 0,
 "desconto_irrf" numeric(10,2) DEFAULT 0,
 "desconto_vale_transporte" numeric(10,2) DEFAULT 0,
 "desconto_vale_refeicao" numeric(10,2) DEFAULT 0,
 "outros_descontos" numeric(10,2) DEFAULT 0,
 "outros_acrescimos" numeric(10,2) DEFAULT 0,
 "liquido" numeric(10,2) NOT NULL,
 "status" text DEFAULT 'rascunho'::text,
 "pdf_url" text,
 "created_at" timestamp with time zone DEFAULT now(),
 "fgts_base" numeric(10,2),
 "fgts_mes" numeric(10,2),
 "faixa_irrf" text,
 "employee_code" text,
 "unit_id" uuid,
 "nome" text,
 "tipo" text,
 "cargo" text,
 "bonus" numeric(10,2),
 "horas_trabalhadas" numeric DEFAULT 0,
 "adiantamento" numeric DEFAULT 0,
 "vt" numeric DEFAULT 0,
 "vr" numeric DEFAULT 0,
 "inss" numeric DEFAULT 0,
 "fgts" numeric DEFAULT 0,
 "valor_liquido" numeric DEFAULT 0,
 "observacoes" text
);
CREATE TABLE public."ponto_mensal" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid NOT NULL,
 "employee_id" uuid,
 "matricula" text,
 "nome" text NOT NULL,
 "cpf" text,
 "cargo" text,
 "departamento" text,
 "periodo" text NOT NULL,
 "horas_previstas" text,
 "horas_trabalhadas" text,
 "horas_negativas" text,
 "horas_positivas" text,
 "saldo" text,
 "banco_horas_acumulado" text,
 "banco_horas_mes" text,
 "compensacao_bh" text,
 "adicional_noturno" text,
 "falta_injustificada_horas" text,
 "falta_injustificada_dias" integer DEFAULT 0,
 "afastamentos_horas" text,
 "afastamentos_dias" integer DEFAULT 0,
 "ferias_horas" text,
 "ferias_dias" integer DEFAULT 0,
 "inss_horas" text,
 "inss_dias" integer DEFAULT 0,
 "atestado_medico" text,
 "abonado_horas" text,
 "abonado_dias" integer DEFAULT 0,
 "folga_domingo" text,
 "folga_feriado" text,
 "feriados_dias" integer DEFAULT 0,
 "confraternizacao" text,
 "licenca_paternidade_horas" text,
 "licenca_paternidade_dias" integer DEFAULT 0,
 "data_admissao" text,
 "data_demissao" text,
 "importado_em" timestamp with time zone DEFAULT now(),
 "created_at" timestamp with time zone DEFAULT now(),
 "updated_at" timestamp with time zone DEFAULT now(),
 "hora_extra_100" text,
 "hora_extra_100_noturno" text,
 "feriado_trabalhado_horas" text
);
CREATE TABLE public."hour_bank" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid,
 "employee_id" uuid,
 "nome" text,
 "competencia" date,
 "horas_extras" numeric(6,2),
 "horas_debito" numeric(6,2),
 "saldo" numeric(6,2),
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."notifications" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "user_id" uuid NOT NULL,
 "tipo" text NOT NULL,
 "titulo" text NOT NULL,
 "mensagem" text,
 "link" text,
 "lida" boolean DEFAULT false NOT NULL,
 "criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."payroll_dominio_empresa" (
 "cod_empresa" text NOT NULL,
 "razao_social" text NOT NULL,
 "cnpj" text,
 "ativa" boolean DEFAULT true NOT NULL,
 "observacao" text,
 "criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."payroll_fechamento_linha" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "periodo_id" uuid NOT NULL,
 "employee_id" uuid NOT NULL,
 "cod_folha" text,
 "rubrica_id" uuid NOT NULL,
 "valor" numeric(14,4),
 "valor_horas" interval,
 "origem_lancamento" text DEFAULT 'AUTO'::text NOT NULL,
 "observacao" text,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."time_bank_balance" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "saldo_minutos" integer DEFAULT 0,
 "ultimo_calculo" date,
 "updated_at" timestamp with time zone DEFAULT now(),
 "source" text DEFAULT 'kph'::text,
 "observacao" text
);
CREATE TABLE public."time_clock_punches" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "tipo" text NOT NULL,
 "timestamp_punch" timestamp with time zone DEFAULT now() NOT NULL,
 "latitude" numeric(10,7),
 "longitude" numeric(10,7),
 "device_info" text,
 "aprovado" boolean,
 "created_at" timestamp with time zone DEFAULT now(),
 "distance_meters" integer,
 "aprovado_por" uuid,
 "gps_failed" boolean DEFAULT false
);
CREATE TABLE public."training_records" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "template_id" uuid NOT NULL,
 "status" text DEFAULT 'pendente'::text NOT NULL,
 "data_inicio" date,
 "data_conclusao" date,
 "validade_dias_snapshot" integer,
 "validade_ate" date GENERATED ALWAYS AS (
CASE
    WHEN ((data_conclusao IS NULL) OR (validade_dias_snapshot IS NULL)) THEN NULL::date
    ELSE (data_conclusao + validade_dias_snapshot)
END) STORED,
 "observacoes" text,
 "created_by" uuid,
 "created_at" timestamp with time zone DEFAULT now(),
 "updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."onboarding_checklist" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "run_id" uuid NOT NULL,
 "tarefa_id" uuid NOT NULL,
 "status" text DEFAULT 'pendente'::text NOT NULL,
 "concluido_em" timestamp with time zone,
 "concluido_por" uuid
);
CREATE TABLE public."overtime_records" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "unit_id" uuid NOT NULL,
 "date" date NOT NULL,
 "hours" numeric(5,2) NOT NULL,
 "type" text NOT NULL,
 "reason" text,
 "approved" boolean,
 "approved_by" uuid,
 "periodo" text,
 "source" text DEFAULT 'manual'::text,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."contatos_kph" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "telefone" text NOT NULL,
 "nome" text,
 "tipo" text DEFAULT 'externo'::text,
 "area_interesse" text,
 "primeiro_contato" timestamp with time zone DEFAULT now(),
 "ultimo_contato" timestamp with time zone DEFAULT now(),
 "total_conversas" integer DEFAULT 1,
 "agentes_usados" text[] DEFAULT '{}'::text[],
 "employee_id" uuid,
 "candidate_id" uuid,
 "created_at" timestamp with time zone DEFAULT now(),
 "updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."cargos" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "nome" text NOT NULL,
 "setor" text NOT NULL,
 "grupo" text NOT NULL,
 "tem_nivel" boolean DEFAULT false NOT NULL,
 "sinonimos" text[] DEFAULT '{}'::text[] NOT NULL,
 "ativo" boolean DEFAULT true NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "reporta_a_cargo_id" uuid,
 "ordem_hierarquia" integer,
 "requer_entrevista_diretoria" boolean DEFAULT false NOT NULL
);
CREATE TABLE public."ponto_ahgora_arquivos" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "company_id" text NOT NULL,
 "unit_id" uuid,
 "tipo" text NOT NULL,
 "arquivo" text NOT NULL,
 "sha256" text NOT NULL,
 "source_url" text NOT NULL,
 "consulta_inicio" date NOT NULL,
 "consulta_fim" date NOT NULL,
 "inclui_desligados" boolean NOT NULL,
 "filtros" jsonb DEFAULT '{}'::jsonb NOT NULL,
 "linhas" jsonb NOT NULL,
 "resultado" jsonb DEFAULT '{}'::jsonb NOT NULL,
 "criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."candidate_agendamentos" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "candidate_id" uuid NOT NULL,
 "tipo" text NOT NULL,
 "data_hora" timestamp with time zone NOT NULL,
 "duracao_min" integer DEFAULT 30 NOT NULL,
 "modalidade" text,
 "local" text,
 "unit_id" uuid,
 "responsavel_id" uuid,
 "status" text DEFAULT 'agendado'::text NOT NULL,
 "observacoes" text,
 "google_event_id" text,
 "google_meet_link" text,
 "transcricao_drive_id" text,
 "resumo_ia" text,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 "roteiro_entrevista" jsonb
);
CREATE TABLE public."hos_runs" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "job_id" uuid,
 "status" text DEFAULT 'pending'::text NOT NULL,
 "triggered_by" text DEFAULT 'webhook'::text NOT NULL,
 "payload" jsonb DEFAULT '{}'::jsonb,
 "logs" jsonb DEFAULT '[]'::jsonb,
 "created_at" timestamp with time zone DEFAULT now(),
 "updated_at" timestamp with time zone DEFAULT now(),
 "archived_at" timestamp with time zone,
 "deployment_id" text,
 "title" text,
 "employee_id" uuid,
 "result_data" jsonb
);
CREATE TABLE public."avaliacao_ciclos" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid NOT NULL,
 "nome" text NOT NULL,
 "template_id" uuid,
 "status" text DEFAULT 'aberto'::text NOT NULL,
 "data_inicio" date NOT NULL,
 "data_fim" date NOT NULL,
 "created_by" uuid,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."payroll_rubricas" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "cod_kph" text NOT NULL,
 "grupo" text NOT NULL,
 "descricao" text NOT NULL,
 "tipo" text NOT NULL,
 "natureza_esocial" text,
 "inc_inss" boolean,
 "inc_irrf" boolean,
 "inc_fgts" boolean,
 "unidade" text NOT NULL,
 "origem_dado" text NOT NULL,
 "cod_dominio" text,
 "ativo" boolean DEFAULT true NOT NULL,
 "observacao" text,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "exporta_txt" boolean DEFAULT false NOT NULL
);
CREATE TABLE public."avaliacao_participantes" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "ciclo_id" uuid NOT NULL,
 "avaliado_id" uuid NOT NULL,
 "avaliador_id" uuid NOT NULL,
 "tipo_avaliador" text NOT NULL,
 "status" text DEFAULT 'pendente'::text,
 "review_id" uuid
);
CREATE TABLE public."reunioes_1on1" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid NOT NULL,
 "gestor_id" uuid NOT NULL,
 "colaborador_id" uuid NOT NULL,
 "data_reuniao" timestamp with time zone NOT NULL,
 "duracao_min" integer DEFAULT 30,
 "status" text DEFAULT 'agendada'::text NOT NULL,
 "notas" text,
 "created_by" uuid,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."candidatos_maya" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "nome" text NOT NULL,
 "telefone" text NOT NULL,
 "area_interesse" text,
 "cargo_interesse" text,
 "status" text DEFAULT 'novo'::text NOT NULL,
 "source" text DEFAULT 'whatsapp'::text NOT NULL,
 "created_at" timestamp with time zone DEFAULT now(),
 "updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."time_records" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "unit_id" uuid NOT NULL,
 "periodo" text NOT NULL,
 "horas_previstas" text,
 "horas_trabalhadas" text,
 "banco_horas_positivo" text,
 "banco_horas_negativo" text,
 "saldo_banco" text,
 "banco_horas_acumulado" text,
 "faltas_injustificadas_dias" integer DEFAULT 0,
 "atestado_horas" text,
 "afastamentos_dias" integer DEFAULT 0,
 "ferias_dias" integer DEFAULT 0,
 "adicional_noturno" text,
 "fonte" text DEFAULT 'totvs'::text,
 "notes" text,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."candidate_pipeline" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "candidate_id" uuid NOT NULL,
 "etapa" text,
 "status" text DEFAULT 'pendente'::text,
 "responsavel_id" uuid,
 "data_agendamento" timestamp with time zone,
 "feedback" text,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "de_status" text,
 "para_status" text,
 "motivo" text,
 "autor_id" uuid
);
CREATE TABLE public."origens_candidato" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "codigo" text NOT NULL,
 "label" text NOT NULL,
 "automatica" boolean DEFAULT false NOT NULL,
 "ativo" boolean DEFAULT true NOT NULL,
 "ordem" integer DEFAULT 99 NOT NULL
);
CREATE TABLE public."vacations" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "unit_id" uuid NOT NULL,
 "start_date" date NOT NULL,
 "end_date" date NOT NULL,
 "acquisitive_period_start" date,
 "acquisitive_period_end" date,
 "days_entitled" integer DEFAULT 30,
 "days_taken" integer,
 "abono_days" integer DEFAULT 0,
 "is_double_pay" boolean DEFAULT false,
 "status" text DEFAULT 'agendada'::text NOT NULL,
 "notes" text,
 "created_by" uuid,
 "created_at" timestamp with time zone DEFAULT now(),
 "updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."kph_insights" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "modulo" text NOT NULL,
 "semana" date NOT NULL,
 "insight_text" text NOT NULL,
 "dados_referencia" jsonb,
 "gerado_por" text DEFAULT 'claude-sonnet-4-6'::text,
 "aprovado" boolean DEFAULT false,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."disciplinary_actions" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid,
 "employee_id" uuid,
 "nome" text,
 "tipo" text,
 "data" date,
 "motivo" text,
 "documento_ref" text,
 "created_at" timestamp with time zone DEFAULT now(),
 "data_ocorrencia" date,
 "medida" text,
 "gestor" text,
 "reincidencia" boolean,
 "assinou" boolean,
 "testemunha" text,
 "observacoes" text,
 "cargo" text,
 "origem" text
);
CREATE TABLE public."agent_conversations" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "agent" text NOT NULL,
 "phone" text NOT NULL,
 "messages" jsonb DEFAULT '[]'::jsonb NOT NULL,
 "last_activity" timestamp with time zone DEFAULT now(),
 "created_at" timestamp with time zone DEFAULT now(),
 "status" text DEFAULT 'ativa'::text,
 "operator_id" uuid,
 "operator_name" text,
 "session_type" text DEFAULT 'whatsapp'::text NOT NULL
);
CREATE TABLE public."candidate_avaliacao" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "candidate_id" uuid NOT NULL,
 "aderencia_skills" numeric(3,1),
 "experiencia" numeric(3,1),
 "entrevista_tec" numeric(3,1),
 "entrevista_comp" numeric(3,1),
 "aderencia_ia_sugerida" boolean DEFAULT false,
 "experiencia_ia_sugerida" boolean DEFAULT false,
 "nota_final" numeric(3,1) GENERATED ALWAYS AS (((((COALESCE(aderencia_skills, (0)::numeric) + COALESCE(experiencia, (0)::numeric)) + COALESCE(entrevista_tec, (0)::numeric)) + COALESCE(entrevista_comp, (0)::numeric)) / (4)::numeric)) STORED,
 "avaliador_id" uuid,
 "created_at" timestamp with time zone DEFAULT now(),
 "updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."job_descriptions" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "cargo" text NOT NULL,
 "area" text NOT NULL,
 "responsabilidades" text,
 "requisitos" text,
 "beneficios" text,
 "brand_id" uuid,
 "created_by" uuid,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 "status" text DEFAULT 'draft'::text NOT NULL,
 "tipo_contrato" text DEFAULT 'clt'::text NOT NULL,
 "modalidade" text DEFAULT 'presencial'::text NOT NULL,
 "reporte_direto" text,
 "objetivo_cargo" text,
 "resp_gestao_operacional" text,
 "resp_gestao_pessoas" text,
 "resp_estoque_custos" text,
 "resp_qualidade_experiencia" text,
 "indicadores_performance" text,
 "req_formacao" text,
 "req_experiencia" text,
 "req_conhecimentos_tecnicos" text,
 "req_competencias_comportamentais" text,
 "responsabilidades_sobre_pessoas" text,
 "condicoes_trabalho" text,
 "indicadores_sucesso" text,
 "cargo_id" uuid
);
CREATE TABLE public."punch_adjustment_requests" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "data_referencia" date NOT NULL,
 "horario_saida_almoco" time without time zone NOT NULL,
 "horario_retorno_almoco" time without time zone NOT NULL,
 "motivo" text NOT NULL,
 "status" text DEFAULT 'pendente'::text NOT NULL,
 "aprovado_por" uuid,
 "aprovado_em" timestamp with time zone,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."shifts" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "unit_id" uuid NOT NULL,
 "data" date NOT NULL,
 "hora_inicio" time without time zone NOT NULL,
 "hora_fim" time without time zone NOT NULL,
 "tipo" text DEFAULT 'normal'::text,
 "labor_cost" numeric(10,2),
 "observacao" text,
 "created_at" timestamp with time zone DEFAULT now(),
 "area" text
);
CREATE TABLE public."sick_leaves" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid,
 "employee_id" uuid,
 "nome" text,
 "data_inicio" date,
 "data_fim" date,
 "total_dias" integer,
 "tipo" text DEFAULT 'atestado'::text,
 "cid" text,
 "medico" text,
 "documento_ref" text,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."agent_metrics" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "agent" text NOT NULL,
 "phone_last4" text,
 "input_tokens" integer,
 "output_tokens" integer,
 "cost_usd" numeric(10,6),
 "latency_ms" integer,
 "intencao" text,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."transport_vouchers" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "unit_id" uuid NOT NULL,
 "periodo" text NOT NULL,
 "dias_uteis" integer,
 "valor_diario" numeric(10,2),
 "total_bruto" numeric(10,2),
 "desconto_funcionario" numeric(10,2),
 "valor_empresa" numeric(10,2),
 "operadora" text,
 "observacoes" text,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."onboarding_templates" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid NOT NULL,
 "nome" text NOT NULL,
 "descricao" text,
 "ativo" boolean DEFAULT true,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."reuniao_action_items" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "reuniao_id" uuid NOT NULL,
 "descricao" text NOT NULL,
 "responsavel_id" uuid,
 "prazo" date,
 "status" text DEFAULT 'pendente'::text NOT NULL,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."performance_reviews" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "template_id" uuid NOT NULL,
 "avaliador_id" uuid,
 "periodo" text NOT NULL,
 "status" text DEFAULT 'rascunho'::text NOT NULL,
 "nota_geral" numeric(4,2),
 "respostas" jsonb DEFAULT '{}'::jsonb NOT NULL,
 "pontos_fortes" text,
 "pontos_melhoria" text,
 "plano_acao" text,
 "data_avaliacao" date,
 "created_at" timestamp with time zone DEFAULT now(),
 "updated_at" timestamp with time zone DEFAULT now(),
 "tipo_avaliador" text DEFAULT 'gestor'::text,
 "anonimo" boolean DEFAULT false
);
CREATE TABLE public."feedbacks" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid NOT NULL,
 "de_employee_id" uuid NOT NULL,
 "para_employee_id" uuid NOT NULL,
 "tipo" text NOT NULL,
 "categoria" text NOT NULL,
 "mensagem" text NOT NULL,
 "anonimo" boolean DEFAULT false,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."vacation_schedules" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid,
 "employee_id" uuid,
 "nome" text,
 "total_dias" integer,
 "data_inicio" date,
 "data_fim" date,
 "data_retorno" date,
 "status" text DEFAULT 'agendado'::text,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."hos_jobs" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "name" text NOT NULL,
 "slug" text NOT NULL,
 "description" text,
 "is_active" boolean DEFAULT true,
 "created_at" timestamp with time zone DEFAULT now(),
 "auto_approve" boolean DEFAULT false NOT NULL,
 "unit_id" uuid,
 "funcao" text,
 "descricao" text
);
CREATE TABLE public."warnings" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "nivel" text NOT NULL,
 "descricao" text NOT NULL,
 "score_impact" integer DEFAULT 0,
 "documento_path" text,
 "data" date DEFAULT CURRENT_DATE NOT NULL,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."kph_intelligence_scores" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "semana" date NOT NULL,
 "score" integer NOT NULL,
 "cmv_score" integer,
 "ebitda_score" integer,
 "metas_score" integer,
 "adocao_score" integer,
 "bugs_score" integer,
 "breakdown" jsonb,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "modulo" text,
 "score_oficial" integer,
 "cap_razao" text,
 "confiabilidade" text,
 "confiabilidade_detalhe" text
);
CREATE TABLE public."kph_learning_proposals" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "modulo" text NOT NULL,
 "tipo" text NOT NULL,
 "prioridade" text NOT NULL,
 "titulo" text NOT NULL,
 "descricao" text NOT NULL,
 "evidencia" text,
 "impacto_estimado" text,
 "status" text DEFAULT 'pending'::text NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "executed_at" timestamp with time zone,
 "severidade" text
);
CREATE TABLE public."payroll_dominio_cadastro" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "cod_empresa" text NOT NULL,
 "cod_colaborador" integer NOT NULL,
 "nome" text NOT NULL,
 "nome_norm" text NOT NULL,
 "cargo_codigo" integer,
 "cargo_nome" text,
 "data_admissao" date,
 "salario" numeric(12,2),
 "cpf" text,
 "employee_id" uuid,
 "origem_match" text,
 "vigente_desde" date DEFAULT '2026-07-01'::date NOT NULL,
 "criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."agent_prompt_versions" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "agent" text NOT NULL,
 "version" text NOT NULL,
 "system_prompt" text NOT NULL,
 "ativado_em" timestamp with time zone DEFAULT now() NOT NULL,
 "ativado_por" uuid,
 "nota" text,
 "ativo" boolean DEFAULT false NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."absences" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "employee_id" uuid NOT NULL,
 "data" date NOT NULL,
 "tipo" text NOT NULL,
 "motivo" text,
 "score_impact" integer DEFAULT 0,
 "atestado_path" text,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."gorjeta_distribuicao" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid NOT NULL,
 "mes" smallint NOT NULL,
 "ano" smallint NOT NULL,
 "employee_id" uuid NOT NULL,
 "nome" text NOT NULL,
 "cargo" text NOT NULL,
 "dias_trabalhados" integer NOT NULL,
 "pontuacao" numeric(10,4) NOT NULL,
 "percentual" numeric(10,8) DEFAULT 0 NOT NULL,
 "valor_bruto" numeric(12,2) DEFAULT 0 NOT NULL,
 "valor_liquido" numeric(12,2) DEFAULT 0 NOT NULL,
 "recibo_gerado_at" timestamp with time zone,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
 "recibo_url" text,
 "periodo" text,
 "colaborador_id" uuid
);
CREATE TABLE public."pdis" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid NOT NULL,
 "employee_id" uuid NOT NULL,
 "criado_por" uuid,
 "titulo" text NOT NULL,
 "descricao" text,
 "status" text DEFAULT 'ativo'::text NOT NULL,
 "data_inicio" date NOT NULL,
 "data_fim" date NOT NULL,
 "avaliacao_id" uuid,
 "created_at" timestamp with time zone DEFAULT now(),
 "updated_at" timestamp with time zone DEFAULT now(),
 "created_by" uuid
);
CREATE TABLE public."gorjeta_cargo_pontos" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid,
 "cargo" text NOT NULL,
 "pontos" integer NOT NULL,
 "ativo" boolean DEFAULT true NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."cargo_salarios" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "cargo_id" uuid NOT NULL,
 "nivel" integer,
 "unit_id" uuid,
 "salario_min" numeric(10,2),
 "salario_ref" numeric(10,2),
 "salario_max" numeric(10,2),
 "observacao" text,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public."climate_questions" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "survey_id" uuid NOT NULL,
 "ordem" integer DEFAULT 1 NOT NULL,
 "texto" text NOT NULL,
 "tipo" text DEFAULT 'escala'::text NOT NULL,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."climate_surveys" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "unit_id" uuid,
 "titulo" text NOT NULL,
 "descricao" text,
 "status" text DEFAULT 'rascunho'::text,
 "data_inicio" date,
 "data_fim" date,
 "anonimo" boolean DEFAULT true,
 "created_by" uuid,
 "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public."employee_codigos_dominio" (
 "employee_id" uuid NOT NULL,
 "unit_id" uuid NOT NULL,
 "cod_folha" text NOT NULL,
 "ativo" boolean DEFAULT true NOT NULL,
 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
 "cbo" text
);
CREATE TABLE public."climate_responses" (
 "id" uuid DEFAULT gen_random_uuid() NOT NULL,
 "survey_id" uuid NOT NULL,
 "question_id" uuid NOT NULL,
 "employee_id" uuid NOT NULL,
 "valor_escala" integer,
 "texto_livre" text,
 "respondido_em" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."access_requests" ADD CONSTRAINT "access_requests_approver_tier_check" CHECK ((approver_tier = ANY (ARRAY['T2A'::text, 'T3'::text, 'T4'::text, 'T5'::text, 'T6'::text])));
ALTER TABLE public."agent_prompt_versions" ADD CONSTRAINT "agent_prompt_versions_agent_check" CHECK ((agent = ANY (ARRAY['maya'::text, 'theo'::text])));
ALTER TABLE public."agent_prompt_versions" ADD CONSTRAINT "agent_prompt_versions_pkey" PRIMARY KEY (id);
ALTER TABLE public."shifts" ADD CONSTRAINT "shifts_pkey" PRIMARY KEY (id);
ALTER TABLE public."shifts" ADD CONSTRAINT "shifts_employee_id_data_key" UNIQUE (employee_id, data);
ALTER TABLE public."time_clock_punches" ADD CONSTRAINT "time_clock_punches_pkey" PRIMARY KEY (id);
ALTER TABLE public."time_bank_balance" ADD CONSTRAINT "time_bank_balance_pkey" PRIMARY KEY (id);
ALTER TABLE public."time_bank_balance" ADD CONSTRAINT "time_bank_balance_employee_id_key" UNIQUE (employee_id);
ALTER TABLE public."payslips" ADD CONSTRAINT "payslips_pkey" PRIMARY KEY (id);
ALTER TABLE public."absences" ADD CONSTRAINT "absences_pkey" PRIMARY KEY (id);
ALTER TABLE public."warnings" ADD CONSTRAINT "warnings_pkey" PRIMARY KEY (id);
ALTER TABLE public."score_events" ADD CONSTRAINT "score_events_pkey" PRIMARY KEY (id);
ALTER TABLE public."transport_vouchers" ADD CONSTRAINT "transport_vouchers_pkey" PRIMARY KEY (id);
ALTER TABLE public."transport_vouchers" ADD CONSTRAINT "transport_vouchers_employee_id_periodo_key" UNIQUE (employee_id, periodo);
ALTER TABLE public."time_records" ADD CONSTRAINT "time_records_pkey" PRIMARY KEY (id);
ALTER TABLE public."vacations" ADD CONSTRAINT "vacations_status_check" CHECK ((status = ANY (ARRAY['agendada'::text, 'em_andamento'::text, 'concluida'::text, 'cancelada'::text])));
ALTER TABLE public."vacations" ADD CONSTRAINT "vacations_pkey" PRIMARY KEY (id);
ALTER TABLE public."overtime_records" ADD CONSTRAINT "overtime_records_type_check" CHECK ((type = ANY (ARRAY['50'::text, '100'::text, 'banco'::text])));
ALTER TABLE public."overtime_records" ADD CONSTRAINT "overtime_records_source_check" CHECK ((source = ANY (ARRAY['manual'::text, 'totvs'::text])));
ALTER TABLE public."overtime_records" ADD CONSTRAINT "overtime_records_pkey" PRIMARY KEY (id);
ALTER TABLE public."job_openings" ADD CONSTRAINT "job_openings_pkey" PRIMARY KEY (id);
ALTER TABLE public."candidates" ADD CONSTRAINT "candidates_interview_status_check" CHECK ((interview_status = ANY (ARRAY['pendente'::text, 'em_andamento'::text, 'concluido'::text])));
ALTER TABLE public."candidates" ADD CONSTRAINT "candidates_pkey" PRIMARY KEY (id);
ALTER TABLE public."candidates" ADD CONSTRAINT "candidates_access_code_key" UNIQUE (access_code);
ALTER TABLE public."training_templates" ADD CONSTRAINT "training_templates_pkey" PRIMARY KEY (id);
ALTER TABLE public."training_records" ADD CONSTRAINT "training_records_status_check" CHECK ((status = ANY (ARRAY['pendente'::text, 'em_andamento'::text, 'concluido'::text, 'vencido'::text])));
ALTER TABLE public."training_records" ADD CONSTRAINT "training_records_pkey" PRIMARY KEY (id);
ALTER TABLE public."training_records" ADD CONSTRAINT "training_records_employee_id_template_id_key" UNIQUE (employee_id, template_id);
ALTER TABLE public."performance_templates" ADD CONSTRAINT "performance_templates_periodicidade_check" CHECK ((periodicidade = ANY (ARRAY['mensal'::text, 'trimestral'::text, 'semestral'::text, 'anual'::text])));
ALTER TABLE public."performance_templates" ADD CONSTRAINT "performance_templates_pkey" PRIMARY KEY (id);
ALTER TABLE public."performance_reviews" ADD CONSTRAINT "performance_reviews_status_check" CHECK ((status = ANY (ARRAY['rascunho'::text, 'concluida'::text, 'aprovada'::text])));
ALTER TABLE public."performance_reviews" ADD CONSTRAINT "performance_reviews_pkey" PRIMARY KEY (id);
ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_pkey" PRIMARY KEY (id);
ALTER TABLE public."hos_jobs" ADD CONSTRAINT "hos_jobs_pkey" PRIMARY KEY (id);
ALTER TABLE public."hos_jobs" ADD CONSTRAINT "hos_jobs_slug_key" UNIQUE (slug);
ALTER TABLE public."hos_runs" ADD CONSTRAINT "hos_runs_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'awaiting_approval'::text, 'approved'::text, 'rejected'::text, 'failed'::text])));
ALTER TABLE public."hos_runs" ADD CONSTRAINT "hos_runs_triggered_by_check" CHECK ((triggered_by = ANY (ARRAY['webhook'::text, 'cron'::text, 'discord'::text, 'manual'::text])));
ALTER TABLE public."hos_runs" ADD CONSTRAINT "hos_runs_pkey" PRIMARY KEY (id);
ALTER TABLE public."ponto_mensal" ADD CONSTRAINT "ponto_mensal_pkey" PRIMARY KEY (id);
ALTER TABLE public."ponto_mensal" ADD CONSTRAINT "ponto_mensal_unit_id_periodo_matricula_key" UNIQUE (unit_id, periodo, matricula);
ALTER TABLE public."candidatos_maya" ADD CONSTRAINT "candidatos_maya_pkey" PRIMARY KEY (id);
ALTER TABLE public."gorjeta_cargo_pontos" ADD CONSTRAINT "gorjeta_cargo_pontos_pontos_check" CHECK ((pontos >= 0));
ALTER TABLE public."gorjeta_cargo_pontos" ADD CONSTRAINT "gorjeta_cargo_pontos_pkey" PRIMARY KEY (id);
ALTER TABLE public."gorjeta_cargo_pontos" ADD CONSTRAINT "gorjeta_cargo_pontos_unit_id_cargo_key" UNIQUE (unit_id, cargo);
ALTER TABLE public."gorjeta_periodos" ADD CONSTRAINT "gorjeta_periodos_receita_bruta_check" CHECK ((receita_bruta >= (0)::numeric));
ALTER TABLE public."gorjeta_periodos" ADD CONSTRAINT "gorjeta_periodos_imposto_pct_check" CHECK (((imposto_pct >= (0)::numeric) AND (imposto_pct <= (100)::numeric)));
ALTER TABLE public."gorjeta_periodos" ADD CONSTRAINT "gorjeta_periodos_total_pontos_check" CHECK ((total_pontos > 0));
ALTER TABLE public."gorjeta_periodos" ADD CONSTRAINT "gorjeta_periodos_fonte_check" CHECK ((fonte = ANY (ARRAY['manual'::text, 'lorean'::text, 'import'::text])));
ALTER TABLE public."gorjeta_periodos" ADD CONSTRAINT "gorjeta_periodos_pkey" PRIMARY KEY (id);
ALTER TABLE public."gorjeta_periodos" ADD CONSTRAINT "gorjeta_periodos_unit_id_data_key" UNIQUE (unit_id, data);
ALTER TABLE public."gorjeta_dias" ADD CONSTRAINT "gorjeta_dias_pontos_check" CHECK ((pontos >= 0));
ALTER TABLE public."gorjeta_dias" ADD CONSTRAINT "gorjeta_dias_pkey" PRIMARY KEY (id);
ALTER TABLE public."gorjeta_dias" ADD CONSTRAINT "gorjeta_dias_unit_id_employee_id_data_key" UNIQUE (unit_id, employee_id, data);
ALTER TABLE public."job_openings" ADD CONSTRAINT "job_openings_status_prazo_check" CHECK ((status_prazo = ANY (ARRAY['no_prazo'::text, 'atencao'::text, 'atrasado'::text, 'congelada'::text])));
ALTER TABLE public."theo_tickets" ADD CONSTRAINT "theo_tickets_pkey" PRIMARY KEY (id);
ALTER TABLE public."candidatos_maya" ADD CONSTRAINT "candidatos_maya_status_check" CHECK ((status = ANY (ARRAY['novo'::text, 'triagem'::text, 'entrevista'::text, 'aprovado'::text, 'reprovado'::text, 'desistiu'::text])));
ALTER TABLE public."agent_conversations" ADD CONSTRAINT "agent_conversations_pkey" PRIMARY KEY (id);
ALTER TABLE public."feedbacks" ADD CONSTRAINT "feedbacks_tipo_check" CHECK ((tipo = ANY (ARRAY['positivo'::text, 'desenvolvimento'::text])));
ALTER TABLE public."feedbacks" ADD CONSTRAINT "feedbacks_categoria_check" CHECK ((categoria = ANY (ARRAY['atendimento'::text, 'trabalho_em_equipe'::text, 'lideranca'::text, 'pontualidade'::text, 'tecnico'::text, 'comportamento'::text, 'outro'::text])));
ALTER TABLE public."feedbacks" ADD CONSTRAINT "feedback_nao_proprio" CHECK ((de_employee_id <> para_employee_id));
ALTER TABLE public."feedbacks" ADD CONSTRAINT "feedbacks_pkey" PRIMARY KEY (id);
ALTER TABLE public."agent_metrics" ADD CONSTRAINT "agent_metrics_pkey" PRIMARY KEY (id);
ALTER TABLE public."performance_reviews" ADD CONSTRAINT "performance_reviews_tipo_avaliador_check" CHECK ((tipo_avaliador = ANY (ARRAY['autoavaliacao'::text, 'par'::text, 'gestor'::text, 'liderado'::text])));
ALTER TABLE public."avaliacao_ciclos" ADD CONSTRAINT "avaliacao_ciclos_status_check" CHECK ((status = ANY (ARRAY['aberto'::text, 'em_andamento'::text, 'encerrado'::text])));
ALTER TABLE public."avaliacao_ciclos" ADD CONSTRAINT "avaliacao_ciclos_pkey" PRIMARY KEY (id);
ALTER TABLE public."avaliacao_participantes" ADD CONSTRAINT "avaliacao_participantes_tipo_avaliador_check" CHECK ((tipo_avaliador = ANY (ARRAY['autoavaliacao'::text, 'par'::text, 'gestor'::text, 'liderado'::text])));
ALTER TABLE public."avaliacao_participantes" ADD CONSTRAINT "avaliacao_participantes_status_check" CHECK ((status = ANY (ARRAY['pendente'::text, 'concluido'::text])));
ALTER TABLE public."avaliacao_participantes" ADD CONSTRAINT "avaliacao_participantes_pkey" PRIMARY KEY (id);
ALTER TABLE public."avaliacao_participantes" ADD CONSTRAINT "avaliacao_unica" UNIQUE (ciclo_id, avaliado_id, avaliador_id);
ALTER TABLE public."pdis" ADD CONSTRAINT "pdis_status_check" CHECK ((status = ANY (ARRAY['ativo'::text, 'concluido'::text, 'cancelado'::text])));
ALTER TABLE public."pdis" ADD CONSTRAINT "pdis_pkey" PRIMARY KEY (id);
ALTER TABLE public."pdi_metas" ADD CONSTRAINT "pdi_metas_status_check" CHECK ((status = ANY (ARRAY['pendente'::text, 'em_andamento'::text, 'concluida'::text, 'cancelada'::text])));
ALTER TABLE public."pdi_metas" ADD CONSTRAINT "pdi_metas_progresso_check" CHECK (((progresso >= 0) AND (progresso <= 100)));
ALTER TABLE public."pdi_metas" ADD CONSTRAINT "pdi_metas_pkey" PRIMARY KEY (id);
ALTER TABLE public."reunioes_1on1" ADD CONSTRAINT "reunioes_1on1_status_check" CHECK ((status = ANY (ARRAY['agendada'::text, 'realizada'::text, 'cancelada'::text])));
ALTER TABLE public."reunioes_1on1" ADD CONSTRAINT "reuniao_diferentes" CHECK ((gestor_id <> colaborador_id));
ALTER TABLE public."reunioes_1on1" ADD CONSTRAINT "reunioes_1on1_pkey" PRIMARY KEY (id);
ALTER TABLE public."reuniao_action_items" ADD CONSTRAINT "reuniao_action_items_status_check" CHECK ((status = ANY (ARRAY['pendente'::text, 'concluido'::text, 'cancelado'::text])));
ALTER TABLE public."reuniao_action_items" ADD CONSTRAINT "reuniao_action_items_pkey" PRIMARY KEY (id);
ALTER TABLE public."onboarding_templates" ADD CONSTRAINT "onboarding_templates_pkey" PRIMARY KEY (id);
ALTER TABLE public."onboarding_tarefas" ADD CONSTRAINT "onboarding_tarefas_responsavel_check" CHECK ((responsavel = ANY (ARRAY['rh'::text, 'gestor'::text, 'colaborador'::text, 'ti'::text])));
ALTER TABLE public."onboarding_tarefas" ADD CONSTRAINT "onboarding_tarefas_pkey" PRIMARY KEY (id);
ALTER TABLE public."onboarding_runs" ADD CONSTRAINT "onboarding_runs_status_check" CHECK ((status = ANY (ARRAY['em_andamento'::text, 'concluido'::text, 'cancelado'::text])));
ALTER TABLE public."onboarding_runs" ADD CONSTRAINT "onboarding_runs_pkey" PRIMARY KEY (id);
ALTER TABLE public."onboarding_checklist" ADD CONSTRAINT "onboarding_checklist_status_check" CHECK ((status = ANY (ARRAY['pendente'::text, 'concluido'::text, 'ignorado'::text])));
ALTER TABLE public."onboarding_checklist" ADD CONSTRAINT "onboarding_checklist_pkey" PRIMARY KEY (id);
ALTER TABLE public."gorjeta_distribuicao" ADD CONSTRAINT "gorjeta_distribuicao_periodo_emp_uq" UNIQUE (unit_id, periodo, employee_id);
ALTER TABLE public."job_descriptions" ADD CONSTRAINT "job_descriptions_pkey" PRIMARY KEY (id);
ALTER TABLE public."gorjeta_distribuicao" ADD CONSTRAINT "gorjeta_distribuicao_mes_check" CHECK (((mes >= 1) AND (mes <= 12)));
ALTER TABLE public."gorjeta_distribuicao" ADD CONSTRAINT "gorjeta_distribuicao_ano_check" CHECK ((ano >= 2024));
ALTER TABLE public."gorjeta_distribuicao" ADD CONSTRAINT "gorjeta_distribuicao_pkey" PRIMARY KEY (id);
ALTER TABLE public."agent_conversations" ADD CONSTRAINT "agent_conversations_session_type_check" CHECK ((session_type = ANY (ARRAY['whatsapp'::text, 'web'::text])));
ALTER TABLE public."job_descriptions" ADD CONSTRAINT "job_descriptions_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])));
ALTER TABLE public."job_descriptions" ADD CONSTRAINT "job_descriptions_tipo_contrato_check" CHECK ((tipo_contrato = ANY (ARRAY['clt'::text, 'pj'::text, 'estagio'::text, 'temporario'::text, 'intermitente'::text])));
ALTER TABLE public."job_descriptions" ADD CONSTRAINT "job_descriptions_modalidade_check" CHECK ((modalidade = ANY (ARRAY['presencial'::text, 'hibrido'::text, 'remoto'::text])));
ALTER TABLE public."kph_intelligence_scores" ADD CONSTRAINT "kph_intelligence_scores_score_check" CHECK (((score >= 0) AND (score <= 100)));
ALTER TABLE public."kph_intelligence_scores" ADD CONSTRAINT "kph_intelligence_scores_cmv_score_check" CHECK (((cmv_score >= 0) AND (cmv_score <= 100)));
ALTER TABLE public."kph_intelligence_scores" ADD CONSTRAINT "kph_intelligence_scores_ebitda_score_check" CHECK (((ebitda_score >= 0) AND (ebitda_score <= 100)));
ALTER TABLE public."kph_intelligence_scores" ADD CONSTRAINT "kph_intelligence_scores_metas_score_check" CHECK (((metas_score >= 0) AND (metas_score <= 100)));
ALTER TABLE public."kph_intelligence_scores" ADD CONSTRAINT "kph_intelligence_scores_adocao_score_check" CHECK (((adocao_score >= 0) AND (adocao_score <= 100)));
ALTER TABLE public."kph_intelligence_scores" ADD CONSTRAINT "kph_intelligence_scores_bugs_score_check" CHECK (((bugs_score >= 0) AND (bugs_score <= 100)));
ALTER TABLE public."kph_intelligence_scores" ADD CONSTRAINT "kph_intelligence_scores_pkey" PRIMARY KEY (id);
ALTER TABLE public."kph_insights" ADD CONSTRAINT "kph_insights_pkey" PRIMARY KEY (id);
ALTER TABLE public."access_requests" ADD CONSTRAINT "access_requests_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));
ALTER TABLE public."access_requests" ADD CONSTRAINT "access_requests_pkey" PRIMARY KEY (id);
ALTER TABLE public."kph_intelligence_scores" ADD CONSTRAINT "kph_intelligence_scores_modulo_semana_key" UNIQUE (modulo, semana);
ALTER TABLE public."payslips" ADD CONSTRAINT "payslips_emp_comp_tipo_key" UNIQUE (employee_id, competencia, tipo);
ALTER TABLE public."vacation_schedules" ADD CONSTRAINT "vacation_schedules_pkey" PRIMARY KEY (id);
ALTER TABLE public."vacation_schedules" ADD CONSTRAINT "vacation_schedules_employee_id_data_inicio_key" UNIQUE (employee_id, data_inicio);
ALTER TABLE public."hour_bank" ADD CONSTRAINT "hour_bank_pkey" PRIMARY KEY (id);
ALTER TABLE public."hour_bank" ADD CONSTRAINT "hour_bank_employee_id_competencia_key" UNIQUE (employee_id, competencia);
ALTER TABLE public."sick_leaves" ADD CONSTRAINT "sick_leaves_pkey" PRIMARY KEY (id);
ALTER TABLE public."disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_pkey" PRIMARY KEY (id);
ALTER TABLE public."kph_learning_proposals" ADD CONSTRAINT "kph_learning_proposals_tipo_check" CHECK ((tipo = ANY (ARRAY['faq'::text, 'prompt'::text, 'processo'::text, 'integracao'::text])));
ALTER TABLE public."kph_learning_proposals" ADD CONSTRAINT "kph_learning_proposals_prioridade_check" CHECK ((prioridade = ANY (ARRAY['alta'::text, 'media'::text, 'baixa'::text])));
ALTER TABLE public."kph_learning_proposals" ADD CONSTRAINT "kph_learning_proposals_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'dismissed'::text])));
ALTER TABLE public."kph_learning_proposals" ADD CONSTRAINT "kph_learning_proposals_pkey" PRIMARY KEY (id);
ALTER TABLE public."candidate_pipeline" ADD CONSTRAINT "candidate_pipeline_pkey" PRIMARY KEY (id);
ALTER TABLE public."interviews" ADD CONSTRAINT "interviews_formato_check" CHECK ((formato = ANY (ARRAY['presencial'::text, 'video'::text, 'telefone'::text])));
ALTER TABLE public."interviews" ADD CONSTRAINT "interviews_status_check" CHECK ((status = ANY (ARRAY['agendada'::text, 'realizada'::text, 'cancelada'::text, 'no_show'::text])));
ALTER TABLE public."interviews" ADD CONSTRAINT "interviews_nota_check" CHECK (((nota >= (0)::numeric) AND (nota <= (10)::numeric)));
ALTER TABLE public."interviews" ADD CONSTRAINT "interviews_pkey" PRIMARY KEY (id);
ALTER TABLE public."kph_learning_proposals" ADD CONSTRAINT "kph_learning_proposals_severidade_check" CHECK (((severidade IS NULL) OR (severidade = ANY (ARRAY['CRITICO'::text, 'ALTO'::text, 'MEDIO'::text, 'BAIXO'::text]))));
ALTER TABLE public."kph_intelligence_scores" ADD CONSTRAINT "kph_intelligence_scores_score_oficial_check" CHECK (((score_oficial IS NULL) OR ((score_oficial >= 0) AND (score_oficial <= 100))));
ALTER TABLE public."payroll_fechamento_periodo" ADD CONSTRAINT "payroll_fechamento_periodo_competencia_fmt" CHECK ((competencia ~ '^\d{2}/\d{4}$'::text));
ALTER TABLE public."job_openings" ADD CONSTRAINT "job_openings_prioridade_check" CHECK ((prioridade = ANY (ARRAY['alta'::text, 'media'::text, 'baixa'::text])));
ALTER TABLE public."contatos_kph" ADD CONSTRAINT "contatos_kph_tipo_check" CHECK ((tipo = ANY (ARRAY['candidato'::text, 'colaborador'::text, 'externo'::text])));
ALTER TABLE public."contatos_kph" ADD CONSTRAINT "contatos_kph_pkey" PRIMARY KEY (id);
ALTER TABLE public."contatos_kph" ADD CONSTRAINT "contatos_kph_telefone_key" UNIQUE (telefone);
ALTER TABLE public."shifts" ADD CONSTRAINT "shifts_area_check" CHECK (((area IS NULL) OR (area = ANY (ARRAY['Adm'::text, 'Salão'::text, 'Cozinha'::text, 'Limpeza'::text, 'Bar'::text, 'Hostess & Segurança'::text, 'Cozinha de Apoio'::text, 'Estoque'::text]))));
ALTER TABLE public."employee_availability" ADD CONSTRAINT "employee_availability_pkey" PRIMARY KEY (id);
ALTER TABLE public."employee_availability" ADD CONSTRAINT "employee_availability_employee_id_data_key" UNIQUE (employee_id, data);
ALTER TABLE public."punch_adjustment_requests" ADD CONSTRAINT "punch_adjustment_requests_motivo_check" CHECK ((motivo = ANY (ARRAY['Esqueci de registrar'::text, 'Estava em atendimento'::text, 'Sistema indisponível'::text, 'Saí para entrega/serviço externo'::text, 'Outro'::text])));
ALTER TABLE public."punch_adjustment_requests" ADD CONSTRAINT "punch_adjustment_requests_status_check" CHECK ((status = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'rejeitado'::text])));
ALTER TABLE public."punch_adjustment_requests" ADD CONSTRAINT "punch_adjustment_requests_pkey" PRIMARY KEY (id);
ALTER TABLE public."job_openings" ADD CONSTRAINT "job_openings_forma_contratacao_check" CHECK (((forma_contratacao IS NULL) OR (forma_contratacao = ANY (ARRAY['CLT'::text, 'PJ'::text, 'freelance'::text, 'temporario'::text, 'estagio'::text]))));
ALTER TABLE public."cargo_grupos" ADD CONSTRAINT "cargo_grupos_sla_dias_uteis_check" CHECK ((sla_dias_uteis > 0));
ALTER TABLE public."cargo_grupos" ADD CONSTRAINT "cargo_grupos_pkey" PRIMARY KEY (id);
ALTER TABLE public."cargo_grupos" ADD CONSTRAINT "cargo_grupos_nome_key" UNIQUE (nome);
ALTER TABLE public."origens_candidato" ADD CONSTRAINT "origens_candidato_pkey" PRIMARY KEY (id);
ALTER TABLE public."origens_candidato" ADD CONSTRAINT "origens_candidato_codigo_key" UNIQUE (codigo);
ALTER TABLE public."candidates" ADD CONSTRAINT "candidates_origem_check" CHECK (((origem IS NULL) OR (origem = ANY (ARRAY['maya'::text, 'portal'::text, 'indicacao_colaborador'::text, 'indicacao'::text, 'linkedin'::text, 'indeed'::text, 'catho'::text, 'vagas_com_br'::text, 'infojobs'::text, 'instagram'::text, 'mutirao'::text, 'busca_ativa'::text, 'banco_talentos_reativado'::text, 'escola'::text, 'sindicato'::text, 'abordagem'::text, 'manual'::text, 'outro'::text, 'maya_whatsapp'::text, 'portal_kph'::text]))));
ALTER TABLE public."ponto_mensal" ADD CONSTRAINT "chk_ponto_mensal_periodo_format" CHECK ((periodo ~ '^\d{2}/\d{4}$'::text));
ALTER TABLE public."candidate_pipeline" ADD CONSTRAINT "candidate_pipeline_status_check" CHECK (((status IS NULL) OR (status = ANY (ARRAY['pendente'::text, 'aprovado'::text, 'reprovado'::text]))));
ALTER TABLE public."job_openings" ADD CONSTRAINT "job_openings_motivo_estruturado_check" CHECK (((motivo_estruturado IS NULL) OR (motivo_estruturado = ANY (ARRAY['abertura_casa'::text, 'aumento_quadro'::text, 'adequacao_quadro'::text, 'substituicao_desligamento'::text, 'substituicao_promocao'::text, 'substituicao_licenca'::text]))));
ALTER TABLE public."payroll_dominio_empresa" ADD CONSTRAINT "payroll_dominio_empresa_pkey" PRIMARY KEY (cod_empresa);
ALTER TABLE public."payroll_dominio_cadastro" ADD CONSTRAINT "payroll_dominio_cadastro_pkey" PRIMARY KEY (id);
ALTER TABLE public."payroll_dominio_cadastro" ADD CONSTRAINT "uq_dom_cadastro" UNIQUE (cod_empresa, cod_colaborador);
ALTER TABLE public."payroll_rubricas" ADD CONSTRAINT "payroll_rubricas_tipo_check" CHECK ((tipo = ANY (ARRAY['PROVENTO'::text, 'DESCONTO'::text, 'INFORMATIVA'::text, 'FLAG'::text, 'BASE'::text])));
ALTER TABLE public."payroll_rubricas" ADD CONSTRAINT "payroll_rubricas_unidade_check" CHECK ((unidade = ANY (ARRAY['R$'::text, 'HORAS'::text, 'DIAS'::text, 'QTD'::text, 'PERCENT'::text, 'FLAG'::text, 'TEXTO'::text])));
ALTER TABLE public."payroll_rubricas" ADD CONSTRAINT "payroll_rubricas_origem_dado_check" CHECK ((origem_dado = ANY (ARRAY['AUTO_PONTO'::text, 'AUTO_CADASTRO'::text, 'AUTO'::text, 'MANUAL_RH'::text, 'JUDICIAL'::text, 'EXTERNO'::text, 'CALCULADO'::text])));
ALTER TABLE public."payroll_rubricas" ADD CONSTRAINT "payroll_rubricas_pkey" PRIMARY KEY (id);
ALTER TABLE public."payroll_rubricas" ADD CONSTRAINT "payroll_rubricas_cod_kph_key" UNIQUE (cod_kph);
ALTER TABLE public."payroll_fechamento_periodo" ADD CONSTRAINT "payroll_fechamento_periodo_tipo_processo_check" CHECK ((tipo_processo = ANY (ARRAY['11'::text, '41'::text, '42'::text, '51'::text, '52'::text])));
ALTER TABLE public."payroll_fechamento_periodo" ADD CONSTRAINT "payroll_fechamento_periodo_status_check" CHECK ((status = ANY (ARRAY['ABERTO'::text, 'EM_CONFERENCIA'::text, 'ENVIADO_ESCRITORIO'::text, 'APROVADO'::text, 'FECHADO'::text])));
ALTER TABLE public."payroll_fechamento_periodo" ADD CONSTRAINT "payroll_fechamento_periodo_pkey" PRIMARY KEY (id);
ALTER TABLE public."payroll_fechamento_periodo" ADD CONSTRAINT "payroll_fechamento_periodo_unit_id_competencia_tipo_process_key" UNIQUE (unit_id, competencia, tipo_processo);
ALTER TABLE public."payroll_fechamento_linha" ADD CONSTRAINT "payroll_fechamento_linha_origem_lancamento_check" CHECK ((origem_lancamento = ANY (ARRAY['AUTO'::text, 'MANUAL'::text, 'AJUSTE'::text])));
ALTER TABLE public."payroll_fechamento_linha" ADD CONSTRAINT "payroll_fechamento_linha_pkey" PRIMARY KEY (id);
ALTER TABLE public."payroll_fechamento_linha" ADD CONSTRAINT "payroll_fechamento_linha_periodo_id_employee_id_rubrica_id_key" UNIQUE (periodo_id, employee_id, rubrica_id);
ALTER TABLE public."quadro_ideal" ADD CONSTRAINT "quadro_ideal_qtd_alvo_check" CHECK ((qtd_alvo >= 0));
ALTER TABLE public."quadro_ideal" ADD CONSTRAINT "quadro_ideal_pkey" PRIMARY KEY (id);
ALTER TABLE public."candidate_avaliacao" ADD CONSTRAINT "candidate_avaliacao_aderencia_skills_check" CHECK (((aderencia_skills >= (0)::numeric) AND (aderencia_skills <= (10)::numeric)));
ALTER TABLE public."candidate_avaliacao" ADD CONSTRAINT "candidate_avaliacao_experiencia_check" CHECK (((experiencia >= (0)::numeric) AND (experiencia <= (10)::numeric)));
ALTER TABLE public."candidate_avaliacao" ADD CONSTRAINT "candidate_avaliacao_entrevista_tec_check" CHECK (((entrevista_tec >= (0)::numeric) AND (entrevista_tec <= (10)::numeric)));
ALTER TABLE public."candidate_avaliacao" ADD CONSTRAINT "candidate_avaliacao_entrevista_comp_check" CHECK (((entrevista_comp >= (0)::numeric) AND (entrevista_comp <= (10)::numeric)));
ALTER TABLE public."candidate_avaliacao" ADD CONSTRAINT "candidate_avaliacao_pkey" PRIMARY KEY (id);
ALTER TABLE public."candidate_avaliacao" ADD CONSTRAINT "candidate_avaliacao_candidate_id_key" UNIQUE (candidate_id);
ALTER TABLE public."cargos" ADD CONSTRAINT "cargos_setor_chk" CHECK ((setor = ANY (ARRAY['Gerência'::text, 'Bar'::text, 'Salão'::text, 'Limpeza'::text, 'Cozinha'::text, 'Estoque'::text])));
ALTER TABLE public."cargos" ADD CONSTRAINT "cargos_grupo_chk" CHECK ((grupo = ANY (ARRAY['Operacional'::text, 'Tático'::text, 'Estratégico'::text, 'Executivo-Liderança'::text])));
ALTER TABLE public."cargos" ADD CONSTRAINT "cargos_pkey" PRIMARY KEY (id);
ALTER TABLE public."cargos" ADD CONSTRAINT "cargos_nome_unique" UNIQUE (nome);
ALTER TABLE public."payroll_rubricas" ADD CONSTRAINT "payroll_rubricas_grupo_check" CHECK ((grupo = ANY (ARRAY['IDENTIFICACAO'::text, 'PROVENTO_FIXO'::text, 'PROVENTO_VARIAVEL'::text, 'DESCONTO'::text, 'INFORMATIVA'::text, 'BENEFICIO'::text, 'BASE'::text, 'RETORNO'::text])));
ALTER TABLE public."candidate_agendamentos" ADD CONSTRAINT "candidate_agendamentos_tipo_check" CHECK ((tipo = ANY (ARRAY['entrevista'::text, 'teste_pratico'::text])));
ALTER TABLE public."candidate_agendamentos" ADD CONSTRAINT "candidate_agendamentos_modalidade_check" CHECK ((modalidade = ANY (ARRAY['presencial'::text, 'video'::text, 'telefone'::text])));
ALTER TABLE public."candidate_agendamentos" ADD CONSTRAINT "candidate_agendamentos_status_check" CHECK ((status = ANY (ARRAY['agendado'::text, 'realizado'::text, 'cancelado'::text, 'nao_compareceu'::text])));
ALTER TABLE public."candidate_agendamentos" ADD CONSTRAINT "candidate_agendamentos_pkey" PRIMARY KEY (id);
ALTER TABLE public."candidate_feedback_operacional" ADD CONSTRAINT "candidate_feedback_operacional_pkey" PRIMARY KEY (id);
ALTER TABLE public."candidate_feedback_operacional" ADD CONSTRAINT "cand_feedback_op_unique" UNIQUE (candidate_id);
ALTER TABLE public."candidates" ADD CONSTRAINT "candidates_status_check" CHECK ((status = ANY (ARRAY['novo'::text, 'triagem'::text, 'agendamento'::text, 'entrevista'::text, 'avaliacao_administrativa'::text, 'entrevista_diretoria'::text, 'agendamento_teste'::text, 'feedback_operacional'::text, 'decisao'::text, 'aprovado'::text, 'contratado'::text, 'reprovado'::text, 'desistiu'::text, 'banco_talentos'::text])));
ALTER TABLE public."candidate_pipeline" ADD CONSTRAINT "candidate_pipeline_de_status_check" CHECK (((de_status IS NULL) OR (de_status = ANY (ARRAY['novo'::text, 'triagem'::text, 'agendamento'::text, 'entrevista'::text, 'avaliacao_administrativa'::text, 'entrevista_diretoria'::text, 'agendamento_teste'::text, 'feedback_operacional'::text, 'decisao'::text, 'aprovado'::text, 'contratado'::text, 'banco_talentos'::text, 'reprovado'::text, 'desistiu'::text]))));
ALTER TABLE public."candidate_pipeline" ADD CONSTRAINT "candidate_pipeline_para_status_check" CHECK (((para_status IS NULL) OR (para_status = ANY (ARRAY['novo'::text, 'triagem'::text, 'agendamento'::text, 'entrevista'::text, 'avaliacao_administrativa'::text, 'entrevista_diretoria'::text, 'agendamento_teste'::text, 'feedback_operacional'::text, 'decisao'::text, 'aprovado'::text, 'contratado'::text, 'banco_talentos'::text, 'reprovado'::text, 'desistiu'::text]))));
ALTER TABLE public."candidates" ADD CONSTRAINT "candidates_escolaridade_nivel_check" CHECK (((escolaridade_nivel IS NULL) OR (escolaridade_nivel = ANY (ARRAY['analfabeto'::text, 'fundamental_5_incompleto'::text, 'fundamental_5_completo'::text, 'fundamental_6_9'::text, 'fundamental_completo'::text, 'medio_incompleto'::text, 'medio_completo'::text, 'superior_incompleto'::text, 'superior_completo'::text, 'pos_graduacao'::text]))));
ALTER TABLE public."job_openings" ADD CONSTRAINT "job_openings_status_canonical" CHECK ((status = ANY (ARRAY['aberta'::text, 'fechada'::text, 'congelada'::text, 'cancelada'::text, 'em_admissao'::text, 'teste'::text])));
ALTER TABLE public."candidates" ADD CONSTRAINT "candidates_phone_job_unique" UNIQUE (phone, job_opening_id);
ALTER TABLE public."kph_intelligence_scores" ADD CONSTRAINT "kph_intelligence_scores_confiabilidade_check" CHECK ((confiabilidade = ANY (ARRAY['alta'::text, 'media'::text, 'baixa'::text])));
ALTER TABLE public."kph_insights" ADD CONSTRAINT "kph_insights_modulo_check" CHECK ((modulo = ANY (ARRAY['wbr'::text, 'metas'::text, 'cross'::text, 'adocao'::text, 'orquestrador'::text, 'geral'::text, 'pessoas'::text, 'financeiro'::text, 'operacao'::text, 'compras'::text, 'comercial'::text, 'marca'::text, 'agentes'::text, 'rh'::text, 'theo'::text, 'maya'::text, 'serena'::text, 'sac'::text])));
ALTER TABLE public."ponto_ahgora_arquivos" ADD CONSTRAINT "ponto_ahgora_arquivos_tipo_check" CHECK ((tipo = ANY (ARRAY['totais'::text, 'batidas'::text])));
ALTER TABLE public."ponto_ahgora_arquivos" ADD CONSTRAINT "ponto_ahgora_arquivos_sha256_check" CHECK ((sha256 ~ '^[a-f0-9]{64}$'::text));
ALTER TABLE public."ponto_ahgora_arquivos" ADD CONSTRAINT "ponto_ahgora_arquivos_check" CHECK ((consulta_fim >= consulta_inicio));
ALTER TABLE public."ponto_ahgora_arquivos" ADD CONSTRAINT "ponto_ahgora_arquivos_linhas_check" CHECK ((jsonb_typeof(linhas) = 'array'::text));
ALTER TABLE public."ponto_ahgora_arquivos" ADD CONSTRAINT "ponto_ahgora_arquivos_pkey" PRIMARY KEY (id);
ALTER TABLE public."ponto_ahgora_arquivos" ADD CONSTRAINT "ponto_ahgora_arquivos_company_id_tipo_sha256_key" UNIQUE (company_id, tipo, sha256);
ALTER TABLE public."cargo_salarios" ADD CONSTRAINT "cargo_salarios_pkey" PRIMARY KEY (id);
ALTER TABLE public."cargo_salarios" ADD CONSTRAINT "chk_faixa" CHECK (((salario_min IS NULL) OR (salario_max IS NULL) OR (salario_min <= salario_max)));
ALTER TABLE public."cargo_salarios" ADD CONSTRAINT "chk_nivel_valido" CHECK (((nivel IS NULL) OR ((nivel >= 1) AND (nivel <= 3))));
ALTER TABLE public."climate_questions" ADD CONSTRAINT "climate_questions_pkey" PRIMARY KEY (id);
ALTER TABLE public."climate_questions" ADD CONSTRAINT "climate_questions_tipo_check" CHECK ((tipo = ANY (ARRAY['escala'::text, 'texto_livre'::text])));
ALTER TABLE public."climate_surveys" ADD CONSTRAINT "climate_surveys_pkey" PRIMARY KEY (id);
ALTER TABLE public."employee_codigos_dominio" ADD CONSTRAINT "employee_codigos_dominio_pkey" PRIMARY KEY (employee_id, unit_id);
ALTER TABLE public."climate_responses" ADD CONSTRAINT "climate_responses_pkey" PRIMARY KEY (id);
ALTER TABLE public."climate_responses" ADD CONSTRAINT "climate_responses_question_id_employee_id_key" UNIQUE (question_id, employee_id);
ALTER TABLE public."climate_responses" ADD CONSTRAINT "climate_responses_valor_escala_check" CHECK (((valor_escala >= 1) AND (valor_escala <= 5)));
ALTER TABLE public."agent_prompt_versions" ADD CONSTRAINT "agent_prompt_versions_ativado_por_fkey" FOREIGN KEY (ativado_por) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."shifts" ADD CONSTRAINT "shifts_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."shifts" ADD CONSTRAINT "shifts_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."time_clock_punches" ADD CONSTRAINT "time_clock_punches_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."time_bank_balance" ADD CONSTRAINT "time_bank_balance_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."payslips" ADD CONSTRAINT "payslips_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."absences" ADD CONSTRAINT "absences_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."warnings" ADD CONSTRAINT "warnings_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."score_events" ADD CONSTRAINT "score_events_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."transport_vouchers" ADD CONSTRAINT "transport_vouchers_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."transport_vouchers" ADD CONSTRAINT "transport_vouchers_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."time_records" ADD CONSTRAINT "time_records_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."time_records" ADD CONSTRAINT "time_records_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."vacations" ADD CONSTRAINT "vacations_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."vacations" ADD CONSTRAINT "vacations_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."vacations" ADD CONSTRAINT "vacations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public."overtime_records" ADD CONSTRAINT "overtime_records_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."overtime_records" ADD CONSTRAINT "overtime_records_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."overtime_records" ADD CONSTRAINT "overtime_records_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES auth.users(id);
ALTER TABLE public."job_openings" ADD CONSTRAINT "job_openings_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE public."job_openings" ADD CONSTRAINT "job_openings_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."job_openings" ADD CONSTRAINT "job_openings_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public."candidates" ADD CONSTRAINT "candidates_job_opening_id_fkey" FOREIGN KEY (job_opening_id) REFERENCES job_openings(id) ON DELETE CASCADE;
ALTER TABLE public."training_templates" ADD CONSTRAINT "training_templates_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE public."training_templates" ADD CONSTRAINT "training_templates_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."training_templates" ADD CONSTRAINT "training_templates_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public."training_records" ADD CONSTRAINT "training_records_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."training_records" ADD CONSTRAINT "training_records_template_id_fkey" FOREIGN KEY (template_id) REFERENCES training_templates(id);
ALTER TABLE public."training_records" ADD CONSTRAINT "training_records_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public."performance_templates" ADD CONSTRAINT "performance_templates_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES brands(id);
ALTER TABLE public."performance_templates" ADD CONSTRAINT "performance_templates_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."performance_templates" ADD CONSTRAINT "performance_templates_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public."performance_reviews" ADD CONSTRAINT "performance_reviews_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."performance_reviews" ADD CONSTRAINT "performance_reviews_template_id_fkey" FOREIGN KEY (template_id) REFERENCES performance_templates(id);
ALTER TABLE public."performance_reviews" ADD CONSTRAINT "performance_reviews_avaliador_id_fkey" FOREIGN KEY (avaliador_id) REFERENCES auth.users(id);
ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public."pdis" ADD CONSTRAINT "pdis_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."hos_jobs" ADD CONSTRAINT "hos_jobs_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE public."ponto_mensal" ADD CONSTRAINT "ponto_mensal_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE public."hos_runs" ADD CONSTRAINT "hos_runs_job_id_fkey" FOREIGN KEY (job_id) REFERENCES hos_jobs(id);
ALTER TABLE public."ponto_mensal" ADD CONSTRAINT "ponto_mensal_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE public."gorjeta_cargo_pontos" ADD CONSTRAINT "gorjeta_cargo_pontos_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE public."gorjeta_periodos" ADD CONSTRAINT "gorjeta_periodos_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE public."gorjeta_dias" ADD CONSTRAINT "gorjeta_dias_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE public."gorjeta_dias" ADD CONSTRAINT "gorjeta_dias_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."gorjeta_dias" ADD CONSTRAINT "gorjeta_dias_periodo_id_fkey" FOREIGN KEY (periodo_id) REFERENCES gorjeta_periodos(id) ON DELETE CASCADE;
ALTER TABLE public."avaliacao_ciclos" ADD CONSTRAINT "avaliacao_ciclos_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."avaliacao_ciclos" ADD CONSTRAINT "avaliacao_ciclos_template_id_fkey" FOREIGN KEY (template_id) REFERENCES performance_templates(id);
ALTER TABLE public."theo_tickets" ADD CONSTRAINT "theo_tickets_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE public."feedbacks" ADD CONSTRAINT "feedbacks_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."feedbacks" ADD CONSTRAINT "feedbacks_de_employee_id_fkey" FOREIGN KEY (de_employee_id) REFERENCES employees(id);
ALTER TABLE public."feedbacks" ADD CONSTRAINT "feedbacks_para_employee_id_fkey" FOREIGN KEY (para_employee_id) REFERENCES employees(id);
ALTER TABLE public."avaliacao_ciclos" ADD CONSTRAINT "avaliacao_ciclos_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public."avaliacao_participantes" ADD CONSTRAINT "avaliacao_participantes_ciclo_id_fkey" FOREIGN KEY (ciclo_id) REFERENCES avaliacao_ciclos(id) ON DELETE CASCADE;
ALTER TABLE public."avaliacao_participantes" ADD CONSTRAINT "avaliacao_participantes_avaliado_id_fkey" FOREIGN KEY (avaliado_id) REFERENCES employees(id);
ALTER TABLE public."avaliacao_participantes" ADD CONSTRAINT "avaliacao_participantes_avaliador_id_fkey" FOREIGN KEY (avaliador_id) REFERENCES employees(id);
ALTER TABLE public."avaliacao_participantes" ADD CONSTRAINT "avaliacao_participantes_review_id_fkey" FOREIGN KEY (review_id) REFERENCES performance_reviews(id);
ALTER TABLE public."pdis" ADD CONSTRAINT "pdis_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."pdis" ADD CONSTRAINT "pdis_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE public."pdis" ADD CONSTRAINT "pdis_criado_por_fkey" FOREIGN KEY (criado_por) REFERENCES auth.users(id);
ALTER TABLE public."pdis" ADD CONSTRAINT "pdis_avaliacao_id_fkey" FOREIGN KEY (avaliacao_id) REFERENCES performance_reviews(id);
ALTER TABLE public."onboarding_tarefas" ADD CONSTRAINT "onboarding_tarefas_template_id_fkey" FOREIGN KEY (template_id) REFERENCES onboarding_templates(id) ON DELETE CASCADE;
ALTER TABLE public."hos_runs" ADD CONSTRAINT "hos_runs_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE public."pdi_metas" ADD CONSTRAINT "pdi_metas_pdi_id_fkey" FOREIGN KEY (pdi_id) REFERENCES pdis(id) ON DELETE CASCADE;
ALTER TABLE public."reunioes_1on1" ADD CONSTRAINT "reunioes_1on1_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."reunioes_1on1" ADD CONSTRAINT "reunioes_1on1_gestor_id_fkey" FOREIGN KEY (gestor_id) REFERENCES employees(id);
ALTER TABLE public."reunioes_1on1" ADD CONSTRAINT "reunioes_1on1_colaborador_id_fkey" FOREIGN KEY (colaborador_id) REFERENCES employees(id);
ALTER TABLE public."reunioes_1on1" ADD CONSTRAINT "reunioes_1on1_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id);
ALTER TABLE public."reuniao_action_items" ADD CONSTRAINT "reuniao_action_items_reuniao_id_fkey" FOREIGN KEY (reuniao_id) REFERENCES reunioes_1on1(id) ON DELETE CASCADE;
ALTER TABLE public."reuniao_action_items" ADD CONSTRAINT "reuniao_action_items_responsavel_id_fkey" FOREIGN KEY (responsavel_id) REFERENCES employees(id);
ALTER TABLE public."onboarding_templates" ADD CONSTRAINT "onboarding_templates_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."onboarding_runs" ADD CONSTRAINT "onboarding_runs_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."onboarding_runs" ADD CONSTRAINT "onboarding_runs_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE public."onboarding_runs" ADD CONSTRAINT "onboarding_runs_template_id_fkey" FOREIGN KEY (template_id) REFERENCES onboarding_templates(id);
ALTER TABLE public."onboarding_checklist" ADD CONSTRAINT "onboarding_checklist_run_id_fkey" FOREIGN KEY (run_id) REFERENCES onboarding_runs(id) ON DELETE CASCADE;
ALTER TABLE public."onboarding_checklist" ADD CONSTRAINT "onboarding_checklist_tarefa_id_fkey" FOREIGN KEY (tarefa_id) REFERENCES onboarding_tarefas(id);
ALTER TABLE public."onboarding_checklist" ADD CONSTRAINT "onboarding_checklist_concluido_por_fkey" FOREIGN KEY (concluido_por) REFERENCES auth.users(id);
ALTER TABLE public."job_openings" ADD CONSTRAINT "job_openings_responsavel_id_fkey" FOREIGN KEY (responsavel_id) REFERENCES employees(id);
ALTER TABLE public."job_descriptions" ADD CONSTRAINT "job_descriptions_brand_id_fkey" FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL;
ALTER TABLE public."job_descriptions" ADD CONSTRAINT "job_descriptions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public."gorjeta_distribuicao" ADD CONSTRAINT "gorjeta_distribuicao_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE public."gorjeta_distribuicao" ADD CONSTRAINT "gorjeta_distribuicao_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."vacation_schedules" ADD CONSTRAINT "vacation_schedules_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."vacation_schedules" ADD CONSTRAINT "vacation_schedules_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE public."access_requests" ADD CONSTRAINT "access_requests_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."access_requests" ADD CONSTRAINT "access_requests_approver_id_fkey" FOREIGN KEY (approver_id) REFERENCES employees(id);
ALTER TABLE public."payslips" ADD CONSTRAINT "payslips_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."hour_bank" ADD CONSTRAINT "hour_bank_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."hour_bank" ADD CONSTRAINT "hour_bank_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE public."gorjeta_distribuicao" ADD CONSTRAINT "gorjeta_distribuicao_colaborador_id_fkey" FOREIGN KEY (colaborador_id) REFERENCES employees(id);
ALTER TABLE public."sick_leaves" ADD CONSTRAINT "sick_leaves_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."sick_leaves" ADD CONSTRAINT "sick_leaves_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE public."disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."disciplinary_actions" ADD CONSTRAINT "disciplinary_actions_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE public."job_openings" ADD CONSTRAINT "job_openings_entrevistador_id_fkey" FOREIGN KEY (entrevistador_id) REFERENCES employees(id);
ALTER TABLE public."candidate_pipeline" ADD CONSTRAINT "candidate_pipeline_candidate_id_fkey" FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE public."candidate_pipeline" ADD CONSTRAINT "candidate_pipeline_responsavel_id_fkey" FOREIGN KEY (responsavel_id) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE public."interviews" ADD CONSTRAINT "interviews_candidate_id_fkey" FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE public."interviews" ADD CONSTRAINT "interviews_job_opening_id_fkey" FOREIGN KEY (job_opening_id) REFERENCES job_openings(id) ON DELETE SET NULL;
ALTER TABLE public."interviews" ADD CONSTRAINT "interviews_entrevistador_id_fkey" FOREIGN KEY (entrevistador_id) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE public."candidates" ADD CONSTRAINT "candidates_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;
ALTER TABLE public."candidates" ADD CONSTRAINT "candidates_responsavel_id_fkey" FOREIGN KEY (responsavel_id) REFERENCES employees(id);
ALTER TABLE public."candidates" ADD CONSTRAINT "candidates_entrevistador_id_fkey" FOREIGN KEY (entrevistador_id) REFERENCES employees(id);
ALTER TABLE public."contatos_kph" ADD CONSTRAINT "contatos_kph_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE public."contatos_kph" ADD CONSTRAINT "contatos_kph_candidate_id_fkey" FOREIGN KEY (candidate_id) REFERENCES candidates(id);
ALTER TABLE public."employee_availability" ADD CONSTRAINT "employee_availability_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."employee_availability" ADD CONSTRAINT "employee_availability_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE public."time_clock_punches" ADD CONSTRAINT "time_clock_punches_aprovado_por_fkey" FOREIGN KEY (aprovado_por) REFERENCES employees(id);
ALTER TABLE public."punch_adjustment_requests" ADD CONSTRAINT "punch_adjustment_requests_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."punch_adjustment_requests" ADD CONSTRAINT "punch_adjustment_requests_aprovado_por_fkey" FOREIGN KEY (aprovado_por) REFERENCES auth.users(id);
ALTER TABLE public."job_openings" ADD CONSTRAINT "job_openings_substituido_id_fkey" FOREIGN KEY (substituido_id) REFERENCES employees(id);
ALTER TABLE public."candidate_pipeline" ADD CONSTRAINT "candidate_pipeline_autor_id_fkey" FOREIGN KEY (autor_id) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE public."cargos" ADD CONSTRAINT "cargos_reporta_a_cargo_id_fkey" FOREIGN KEY (reporta_a_cargo_id) REFERENCES cargos(id);
ALTER TABLE public."job_openings" ADD CONSTRAINT "job_openings_cargo_id_fkey" FOREIGN KEY (cargo_id) REFERENCES cargos(id);
ALTER TABLE public."job_descriptions" ADD CONSTRAINT "job_descriptions_cargo_id_fkey" FOREIGN KEY (cargo_id) REFERENCES cargos(id);
ALTER TABLE public."job_openings" ADD CONSTRAINT "job_openings_cargo_grupo_id_fkey" FOREIGN KEY (cargo_grupo_id) REFERENCES cargo_grupos(id);
ALTER TABLE public."candidates" ADD CONSTRAINT "candidates_origem_id_fkey" FOREIGN KEY (origem_id) REFERENCES origens_candidato(id);
ALTER TABLE public."candidates" ADD CONSTRAINT "candidates_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE public."candidates" ADD CONSTRAINT "candidates_cargo_id_fkey" FOREIGN KEY (cargo_id) REFERENCES cargos(id);
ALTER TABLE public."payroll_dominio_cadastro" ADD CONSTRAINT "payroll_dominio_cadastro_cod_empresa_fkey" FOREIGN KEY (cod_empresa) REFERENCES payroll_dominio_empresa(cod_empresa);
ALTER TABLE public."payroll_dominio_cadastro" ADD CONSTRAINT "payroll_dominio_cadastro_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE public."payroll_fechamento_periodo" ADD CONSTRAINT "payroll_fechamento_periodo_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."payroll_fechamento_periodo" ADD CONSTRAINT "payroll_fechamento_periodo_gerado_por_fkey" FOREIGN KEY (gerado_por) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE public."payroll_fechamento_linha" ADD CONSTRAINT "payroll_fechamento_linha_periodo_id_fkey" FOREIGN KEY (periodo_id) REFERENCES payroll_fechamento_periodo(id) ON DELETE CASCADE;
ALTER TABLE public."payroll_fechamento_linha" ADD CONSTRAINT "payroll_fechamento_linha_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE public."payroll_fechamento_linha" ADD CONSTRAINT "payroll_fechamento_linha_rubrica_id_fkey" FOREIGN KEY (rubrica_id) REFERENCES payroll_rubricas(id);
ALTER TABLE public."quadro_ideal" ADD CONSTRAINT "quadro_ideal_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."quadro_ideal" ADD CONSTRAINT "quadro_ideal_cargo_grupo_id_fkey" FOREIGN KEY (cargo_grupo_id) REFERENCES cargo_grupos(id);
ALTER TABLE public."quadro_ideal" ADD CONSTRAINT "quadro_ideal_cargo_id_fkey" FOREIGN KEY (cargo_id) REFERENCES cargos(id);
ALTER TABLE public."candidate_avaliacao" ADD CONSTRAINT "candidate_avaliacao_candidate_id_fkey" FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE public."quadro_ideal" ADD CONSTRAINT "quadro_ideal_reporta_a_cargo_id_fkey" FOREIGN KEY (reporta_a_cargo_id) REFERENCES cargos(id);
ALTER TABLE public."candidate_agendamentos" ADD CONSTRAINT "candidate_agendamentos_candidate_id_fkey" FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE public."candidate_agendamentos" ADD CONSTRAINT "candidate_agendamentos_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."candidate_feedback_operacional" ADD CONSTRAINT "candidate_feedback_operacional_candidate_id_fkey" FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE;
ALTER TABLE public."candidate_feedback_operacional" ADD CONSTRAINT "candidate_feedback_operacional_agendamento_id_fkey" FOREIGN KEY (agendamento_id) REFERENCES candidate_agendamentos(id);
ALTER TABLE public."ponto_ahgora_arquivos" ADD CONSTRAINT "ponto_ahgora_arquivos_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."cargo_salarios" ADD CONSTRAINT "cargo_salarios_cargo_id_fkey" FOREIGN KEY (cargo_id) REFERENCES cargos(id) ON DELETE CASCADE;
ALTER TABLE public."cargo_salarios" ADD CONSTRAINT "cargo_salarios_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE public."climate_questions" ADD CONSTRAINT "climate_questions_survey_id_fkey" FOREIGN KEY (survey_id) REFERENCES climate_surveys(id) ON DELETE CASCADE;
ALTER TABLE public."climate_surveys" ADD CONSTRAINT "climate_surveys_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public."employee_codigos_dominio" ADD CONSTRAINT "employee_codigos_dominio_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public."employee_codigos_dominio" ADD CONSTRAINT "employee_codigos_dominio_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE public."climate_responses" ADD CONSTRAINT "climate_responses_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE public."climate_responses" ADD CONSTRAINT "climate_responses_question_id_fkey" FOREIGN KEY (question_id) REFERENCES climate_questions(id);
ALTER TABLE public."climate_responses" ADD CONSTRAINT "climate_responses_survey_id_fkey" FOREIGN KEY (survey_id) REFERENCES climate_surveys(id);
CREATE INDEX idx_score_events_employee ON public.score_events USING btree (employee_id, created_at DESC);
CREATE INDEX idx_training_tmpl_brand ON public.training_templates USING btree (brand_id);
CREATE INDEX idx_training_templates_funcao ON public.training_templates USING btree (funcao);
CREATE INDEX idx_training_templates_unit ON public.training_templates USING btree (unit_id);
CREATE INDEX idx_training_templates_brand ON public.training_templates USING btree (brand_id);
CREATE INDEX idx_gorjeta_dias_employee ON public.gorjeta_dias USING btree (employee_id);
CREATE INDEX idx_gorjeta_dias_unit_data ON public.gorjeta_dias USING btree (unit_id, data);
CREATE INDEX idx_gorjeta_dias_periodo ON public.gorjeta_dias USING btree (periodo_id);
CREATE INDEX idx_shifts_unit_data ON public.shifts USING btree (unit_id, data);
CREATE INDEX idx_shifts_employee_data ON public.shifts USING btree (employee_id, data);
CREATE INDEX idx_punches_employee ON public.time_clock_punches USING btree (employee_id, timestamp_punch DESC);
CREATE INDEX idx_absences_employee ON public.absences USING btree (employee_id, data DESC);
CREATE INDEX idx_gorjeta_periodo_emp ON public.gorjeta_distribuicao USING btree (unit_id, periodo);
CREATE INDEX idx_gorjeta_recibo_pendente ON public.gorjeta_distribuicao USING btree (unit_id, mes, ano) WHERE (recibo_gerado_at IS NULL);
CREATE INDEX gorjeta_distribuicao_employee_idx ON public.gorjeta_distribuicao USING btree (employee_id);
CREATE INDEX gorjeta_distribuicao_unit_period_idx ON public.gorjeta_distribuicao USING btree (unit_id, mes, ano);
CREATE INDEX idx_vt_employee_periodo ON public.transport_vouchers USING btree (employee_id, periodo);
CREATE INDEX idx_time_records_employee_periodo ON public.time_records USING btree (employee_id, periodo);
CREATE INDEX idx_overtime_employee_periodo ON public.overtime_records USING btree (employee_id, periodo);
CREATE INDEX idx_warnings_employee ON public.warnings USING btree (employee_id, data DESC);
CREATE INDEX idx_vacations_status ON public.vacations USING btree (status);
CREATE INDEX idx_vacations_employee ON public.vacations USING btree (employee_id);
CREATE INDEX idx_perf_templates_brand ON public.performance_templates USING btree (brand_id);
CREATE INDEX idx_performance_templates_ativo ON public.performance_templates USING btree (ativo);
CREATE INDEX idx_performance_templates_funcao ON public.performance_templates USING btree (funcao);
CREATE INDEX idx_performance_templates_unit ON public.performance_templates USING btree (unit_id);
CREATE INDEX idx_performance_templates_brand ON public.performance_templates USING btree (brand_id);
CREATE INDEX idx_notifications_user_created ON public.notifications USING btree (user_id, criado_em DESC);
CREATE INDEX idx_notifications_user_lida ON public.notifications USING btree (user_id, lida, criado_em DESC);
CREATE INDEX hos_runs_employee_id_idx ON public.hos_runs USING btree (employee_id);
CREATE UNIQUE INDEX hos_runs_deployment_id_job_idx ON public.hos_runs USING btree (deployment_id, job_id) WHERE (deployment_id IS NOT NULL);
CREATE INDEX hos_runs_active_idx ON public.hos_runs USING btree (created_at DESC) WHERE (archived_at IS NULL);
CREATE INDEX idx_theo_tickets_status ON public.theo_tickets USING btree (status);
CREATE INDEX idx_theo_tickets_employee ON public.theo_tickets USING btree (employee_id);
CREATE INDEX idx_candidatos_maya_status ON public.candidatos_maya USING btree (status);
CREATE INDEX idx_candidatos_maya_telefone ON public.candidatos_maya USING btree (telefone);
CREATE INDEX agent_metrics_agent_created ON public.agent_metrics USING btree (agent, created_at DESC);
CREATE INDEX idx_perf_reviews_template ON public.performance_reviews USING btree (template_id);
CREATE INDEX idx_perf_reviews_employee ON public.performance_reviews USING btree (employee_id);
CREATE INDEX idx_performance_reviews_data ON public.performance_reviews USING btree (data_avaliacao DESC);
CREATE INDEX idx_performance_reviews_status ON public.performance_reviews USING btree (status);
CREATE INDEX idx_performance_reviews_periodo ON public.performance_reviews USING btree (periodo);
CREATE INDEX idx_performance_reviews_avaliador ON public.performance_reviews USING btree (avaliador_id);
CREATE INDEX idx_performance_reviews_template ON public.performance_reviews USING btree (template_id);
CREATE INDEX idx_performance_reviews_employee ON public.performance_reviews USING btree (employee_id);
CREATE INDEX idx_av_ciclos_unit ON public.avaliacao_ciclos USING btree (unit_id);
CREATE INDEX idx_feedbacks_unit ON public.feedbacks USING btree (unit_id);
CREATE INDEX idx_feedbacks_de ON public.feedbacks USING btree (de_employee_id);
CREATE INDEX idx_feedbacks_para ON public.feedbacks USING btree (para_employee_id);
CREATE INDEX feedbacks_unit ON public.feedbacks USING btree (unit_id);
CREATE INDEX feedbacks_para_employee ON public.feedbacks USING btree (para_employee_id);
CREATE INDEX idx_reunioes_data ON public.reunioes_1on1 USING btree (data_reuniao DESC);
CREATE INDEX idx_reunioes_colaborador ON public.reunioes_1on1 USING btree (colaborador_id);
CREATE INDEX idx_reunioes_gestor ON public.reunioes_1on1 USING btree (gestor_id);
CREATE INDEX reunioes_data ON public.reunioes_1on1 USING btree (data_reuniao);
CREATE INDEX reunioes_colaborador ON public.reunioes_1on1 USING btree (colaborador_id);
CREATE INDEX reunioes_gestor ON public.reunioes_1on1 USING btree (gestor_id);
CREATE INDEX idx_action_items_reuniao ON public.reuniao_action_items USING btree (reuniao_id);
CREATE INDEX action_items_reuniao ON public.reuniao_action_items USING btree (reuniao_id);
CREATE INDEX idx_gorjeta_periodos_unit_data ON public.gorjeta_periodos USING btree (unit_id, data);
CREATE INDEX idx_agent_conversations_last_activity ON public.agent_conversations USING btree (last_activity DESC);
CREATE INDEX idx_agent_conversations_agent_status ON public.agent_conversations USING btree (agent, status, last_activity DESC);
CREATE UNIQUE INDEX agent_conversations_agent_phone ON public.agent_conversations USING btree (agent, phone);
CREATE INDEX idx_ob_templates_unit ON public.onboarding_templates USING btree (unit_id);
CREATE INDEX idx_ob_tarefas_template ON public.onboarding_tarefas USING btree (template_id, ordem);
CREATE INDEX idx_par_status ON public.punch_adjustment_requests USING btree (status);
CREATE INDEX idx_par_employee_data ON public.punch_adjustment_requests USING btree (employee_id, data_referencia);
CREATE INDEX idx_payslips_employee_code ON public.payslips USING btree (employee_code);
CREATE INDEX idx_payslips_employee ON public.payslips USING btree (employee_id, competencia DESC);
CREATE INDEX idx_job_openings_cargo_grupo ON public.job_openings USING btree (cargo_grupo_id);
CREATE INDEX idx_job_openings_ativas ON public.job_openings USING btree (unit_id, status) WHERE ((congelada = false) AND (cancelada = false));
CREATE INDEX idx_candidates_pretensao ON public.candidates USING btree (pretensao_salarial) WHERE (pretensao_salarial IS NOT NULL);
CREATE INDEX idx_candidates_cidade ON public.candidates USING btree (cidade) WHERE (cidade IS NOT NULL);
CREATE INDEX idx_candidates_escolaridade ON public.candidates USING btree (escolaridade_nivel) WHERE (escolaridade_nivel IS NOT NULL);
CREATE INDEX idx_candidates_origem ON public.candidates USING btree (origem);
CREATE INDEX idx_candidates_opening ON public.candidates USING btree (job_opening_id);
CREATE INDEX idx_candidates_unit ON public.candidates USING btree (unit_id);
CREATE INDEX idx_candidates_status ON public.candidates USING btree (status);
CREATE UNIQUE INDEX idx_candidates_welcome_sid ON public.candidates USING btree (welcome_message_sid) WHERE (welcome_message_sid IS NOT NULL);
CREATE INDEX idx_candidates_job_opening ON public.candidates USING btree (job_opening_id);
CREATE INDEX idx_candidates_access_code ON public.candidates USING btree (access_code);
CREATE INDEX idx_av_part_avaliado ON public.avaliacao_participantes USING btree (avaliado_id);
CREATE INDEX idx_av_part_ciclo ON public.avaliacao_participantes USING btree (ciclo_id);
CREATE INDEX idx_contatos_kph_telefone ON public.contatos_kph USING btree (telefone);
CREATE INDEX idx_contatos_kph_candidate ON public.contatos_kph USING btree (candidate_id);
CREATE INDEX idx_contatos_kph_employee ON public.contatos_kph USING btree (employee_id);
CREATE INDEX idx_contatos_kph_tipo ON public.contatos_kph USING btree (tipo);
CREATE INDEX idx_ob_runs_unit ON public.onboarding_runs USING btree (unit_id);
CREATE INDEX idx_ob_runs_employee ON public.onboarding_runs USING btree (employee_id);
CREATE INDEX access_requests_employee_idx ON public.access_requests USING btree (employee_id);
CREATE INDEX access_requests_status_idx ON public.access_requests USING btree (status, approver_tier);
CREATE INDEX idx_agent_prompt_versions_ativo ON public.agent_prompt_versions USING btree (agent, ativo);
CREATE INDEX idx_agent_prompt_versions_agent ON public.agent_prompt_versions USING btree (agent);
CREATE INDEX idx_pdis_unit ON public.pdis USING btree (unit_id);
CREATE INDEX idx_pdis_employee ON public.pdis USING btree (employee_id);
CREATE INDEX pdis_employee ON public.pdis USING btree (employee_id);
CREATE INDEX idx_pdi_metas_pdi ON public.pdi_metas USING btree (pdi_id);
CREATE INDEX pdi_metas_pdi ON public.pdi_metas USING btree (pdi_id);
CREATE INDEX idx_kph_learning_proposals_created_at ON public.kph_learning_proposals USING btree (created_at DESC);
CREATE INDEX idx_kph_learning_proposals_modulo_status ON public.kph_learning_proposals USING btree (modulo, status);
CREATE INDEX idx_klp_modulo_sev_pending ON public.kph_learning_proposals USING btree (modulo, severidade) WHERE (status = 'pending'::text);
CREATE INDEX idx_ob_checklist_run ON public.onboarding_checklist USING btree (run_id);
CREATE INDEX idx_hos_jobs_unit ON public.hos_jobs USING btree (unit_id);
CREATE INDEX idx_training_records_tmpl ON public.training_records USING btree (template_id);
CREATE INDEX idx_training_records_emp ON public.training_records USING btree (employee_id);
CREATE INDEX idx_training_records_status ON public.training_records USING btree (status);
CREATE INDEX idx_training_records_template ON public.training_records USING btree (template_id);
CREATE INDEX idx_training_records_employee ON public.training_records USING btree (employee_id);
CREATE INDEX idx_training_records_validade ON public.training_records USING btree (validade_ate);
CREATE INDEX employee_availability_unit_data_idx ON public.employee_availability USING btree (unit_id, data);
CREATE INDEX idx_kph_insights_aprovado ON public.kph_insights USING btree (aprovado);
CREATE INDEX idx_kph_insights_semana ON public.kph_insights USING btree (semana DESC);
CREATE INDEX idx_kph_insights_modulo ON public.kph_insights USING btree (modulo);
CREATE INDEX idx_interviews_candidate ON public.interviews USING btree (candidate_id);
CREATE INDEX idx_interviews_data ON public.interviews USING btree (data_entrevista DESC);
CREATE INDEX idx_pipeline_created_at ON public.candidate_pipeline USING btree (created_at DESC);
CREATE INDEX idx_pipeline_autor_id ON public.candidate_pipeline USING btree (autor_id);
CREATE INDEX idx_pipeline_para_status ON public.candidate_pipeline USING btree (para_status);
CREATE INDEX idx_pipeline_etapa ON public.candidate_pipeline USING btree (etapa);
CREATE INDEX idx_pipeline_candidate ON public.candidate_pipeline USING btree (candidate_id);
CREATE INDEX idx_pfl_employee ON public.payroll_fechamento_linha USING btree (employee_id);
CREATE INDEX idx_pfl_periodo ON public.payroll_fechamento_linha USING btree (periodo_id);
CREATE INDEX idx_pfp_unit_comp ON public.payroll_fechamento_periodo USING btree (unit_id, competencia);
CREATE UNIQUE INDEX payroll_fechamento_periodo_comp_unit_uq ON public.payroll_fechamento_periodo USING btree (competencia, unit_id, tipo_processo);
CREATE INDEX idx_quadro_ideal_unit_vigente ON public.quadro_ideal USING btree (unit_id) WHERE (vigente_ate IS NULL);
CREATE UNIQUE INDEX idx_quadro_unit_cargo_ativo ON public.quadro_ideal USING btree (unit_id, cargo_id) WHERE ((vigente_ate IS NULL) AND (cargo_id IS NOT NULL));
CREATE UNIQUE INDEX uq_jd_cargo ON public.job_descriptions USING btree (cargo_id) WHERE (cargo_id IS NOT NULL);
CREATE INDEX idx_job_descriptions_brand_status ON public.job_descriptions USING btree (brand_id, status, created_at DESC);
CREATE INDEX job_descriptions_cargo_idx ON public.job_descriptions USING btree (cargo);
CREATE INDEX job_descriptions_brand_id_idx ON public.job_descriptions USING btree (brand_id);
CREATE INDEX idx_cand_agend_data ON public.candidate_agendamentos USING btree (data_hora);
CREATE INDEX idx_cand_agend_cand_tipo ON public.candidate_agendamentos USING btree (candidate_id, tipo);
CREATE INDEX idx_agendamentos_data_hora ON public.candidate_agendamentos USING btree (data_hora);
CREATE INDEX idx_agendamentos_candidate_tipo ON public.candidate_agendamentos USING btree (candidate_id, tipo);
CREATE INDEX ix_dom_cad_cpf ON public.payroll_dominio_cadastro USING btree (cpf);
CREATE INDEX ix_dom_cad_emp ON public.payroll_dominio_cadastro USING btree (employee_id);
CREATE INDEX ix_dom_cad_norm ON public.payroll_dominio_cadastro USING btree (nome_norm);
CREATE INDEX idx_kis_modulo ON public.kph_intelligence_scores USING btree (modulo);
CREATE INDEX idx_intelligence_score_semana ON public.kph_intelligence_scores USING btree (semana DESC);
CREATE INDEX ponto_ahgora_arquivos_unit_idx ON public.ponto_ahgora_arquivos USING btree (unit_id, criado_em DESC);
CREATE UNIQUE INDEX uq_cargo_salario ON public.cargo_salarios USING btree (cargo_id, COALESCE(nivel, 0), COALESCE(unit_id, '00000000-0000-0000-0000-000000000000'::uuid));
CREATE INDEX idx_ecd_unit ON public.employee_codigos_dominio USING btree (unit_id);
CREATE INDEX idx_ecd_folha ON public.employee_codigos_dominio USING btree (cod_folha);

CREATE OR REPLACE FUNCTION public.promover_candidato(p_candidate_id uuid, p_unit_id uuid, p_cpf text, p_funcao text, p_salario_base numeric, p_data_admissao date DEFAULT CURRENT_DATE)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
declare
  v_candidate record;
  v_employee_id uuid;
  v_cpf_norm text := lpad(regexp_replace(coalesce(p_cpf,''),'\D','','g'),11,'0');
begin
  select * into v_candidate from public.candidates where id = p_candidate_id;
  if v_candidate is null then
    raise exception 'candidato não encontrado: %', p_candidate_id;
  end if;
  if v_candidate.employee_id is not null then
    raise exception 'candidato já foi promovido (employee_id=%)', v_candidate.employee_id;
  end if;
  if v_cpf_norm = '00000000000' or length(v_cpf_norm) <> 11 then
    raise exception 'CPF inválido: %', p_cpf;
  end if;
  if exists (select 1 from public.employees where lpad(regexp_replace(coalesce(cpf,''),'\D','','g'),11,'0') = v_cpf_norm) then
    raise exception 'já existe employee com esse CPF — não duplica';
  end if;

  insert into public.employees
    (unit_id, nome, sobrenome, cpf, funcao, salario_base, data_admissao, ativo, score)
  values
    (p_unit_id,
     split_part(v_candidate.full_name, ' ', 1),
     coalesce(nullif(regexp_replace(v_candidate.full_name, '^\S+\s*', ''), ''), ''),
     v_cpf_norm, p_funcao, p_salario_base, p_data_admissao, true, 0)
  returning id into v_employee_id;

  update public.candidates
  set employee_id = v_employee_id, promovido_em = now(), status = 'contratado'
  where id = p_candidate_id;

  return v_employee_id;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
begin
  new.updated_at = now();
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.fn_recalc_status_prazo()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
declare v_dias integer;
begin
  -- normaliza caixa: os dados gravam 'Fechada', 'Congelada', 'Aberta'
  if lower(coalesce(new.status,'')) = 'congelada' then
    new.status_prazo := 'congelada';

  -- FECHADA: mede o que de fato aconteceu (solicitação → recrutamento)
  elsif lower(coalesce(new.status,'')) = 'fechada' then
    if new.data_recrutamento is not null and new.data_solicitacao is not null
       and new.sla_dias is not null then
      new.status_prazo := case
        when (new.data_recrutamento - new.data_solicitacao) <= new.sla_dias
          then 'no_prazo' else 'atrasado' end;
    else
      new.status_prazo := null;  -- sem dados para julgar
    end if;

  -- EM ABERTO: mede o tempo corrido desde a SOLICITAÇÃO (não desde created_at)
  elsif new.sla_dias is not null and new.data_solicitacao is not null then
    v_dias := (current_date - new.data_solicitacao);
    new.status_prazo := case
      when v_dias <= new.sla_dias * 0.6 then 'no_prazo'
      when v_dias <= new.sla_dias       then 'atencao'
      else                                   'atrasado'
    end;
  else
    new.status_prazo := null;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$;

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.revert_candidate_on_employee_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
BEGIN
  UPDATE candidates
  SET status     = 'aprovado',
      employee_id = NULL,
      updated_at  = NOW()
  WHERE employee_id = OLD.id;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_payroll_gerar_txt_dominio(p_competencia text, p_cod_empresa text, p_unit_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
DECLARE
  v_ano text; v_mes text; v_periodo_id uuid; v_tipo_proc text;
  v_cod_empresa_periodo text; v_qtd int;
  v_sem_rubrica text; v_wl_incoerente text; v_sem_vinculo text;
  v_negativo text; v_bad_len text; v_txt text;
BEGIN
  IF p_competencia !~ '^\d{2}/\d{4}$' THEN
    RAISE EXCEPTION 'Competência "%" fora do formato MM/YYYY.', p_competencia;
  END IF;


  v_mes := split_part(p_competencia,'/',1);
  v_ano := split_part(p_competencia,'/',2);

  IF to_date(p_competencia,'MM/YYYY') >
     date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo')::date) THEN
    RAISE EXCEPTION 'Competência "%" é futura.', p_competencia;
  END IF;

  SELECT count(*) INTO v_qtd FROM public.payroll_fechamento_periodo
   WHERE competencia = p_competencia AND unit_id = p_unit_id;
  IF v_qtd = 0 THEN
    RAISE EXCEPTION 'Período "%" não encontrado para a unidade %.', p_competencia, p_unit_id;
  ELSIF v_qtd > 1 THEN
    RAISE EXCEPTION 'Período "%" duplicado para a unidade % (% registros).', p_competencia, p_unit_id, v_qtd;
  END IF;

  SELECT id, lpad(coalesce(tipo_processo,'11'),2,'0'), cod_empresa
    INTO v_periodo_id, v_tipo_proc, v_cod_empresa_periodo
    FROM public.payroll_fechamento_periodo
   WHERE competencia = p_competencia AND unit_id = p_unit_id;

  -- Company is validated against the selected period.
  IF v_cod_empresa_periodo IS NULL THEN
    RAISE EXCEPTION 'Período "%" sem cod_empresa definido. Preencher antes de exportar.', p_competencia;
  END IF;

  IF lpad(v_cod_empresa_periodo,10,'0') <> lpad(p_cod_empresa,10,'0') THEN
    RAISE EXCEPTION 'Empresa divergente: período "%" pertence à empresa %, chamado com %.',
      p_competencia, v_cod_empresa_periodo, p_cod_empresa;
  END IF;

  SELECT string_agg(id::text, ', ') INTO v_sem_rubrica
    FROM public.payroll_fechamento_linha
   WHERE periodo_id = v_periodo_id AND rubrica_id IS NULL
     AND ((valor IS NOT NULL AND valor <> 0)
       OR (valor_horas IS NOT NULL AND valor_horas <> '00:00:00'::interval));
  IF v_sem_rubrica IS NOT NULL THEN
    RAISE EXCEPTION 'Linhas com conteúdo mas sem rubrica_id (IDs: %).', v_sem_rubrica;
  END IF;

  SELECT string_agg(DISTINCT pr.cod_kph || ' (' || pr.descricao || ')', ', ')
    INTO v_wl_incoerente
    FROM public.payroll_rubricas pr
   WHERE pr.exporta_txt AND (pr.cod_dominio IS NULL OR pr.ativo = false);
  IF v_wl_incoerente IS NOT NULL THEN
    RAISE EXCEPTION 'Rubricas com exporta_txt=true mas sem cod_dominio ou inativas: %.', v_wl_incoerente;
  END IF;

  SELECT string_agg(DISTINCT pfl.cod_folha, ', ') INTO v_sem_vinculo
    FROM public.payroll_fechamento_linha pfl
    JOIN public.payroll_rubricas pr ON pr.id = pfl.rubrica_id
   WHERE pfl.periodo_id = v_periodo_id
     AND pr.exporta_txt
     AND ((pfl.valor IS NOT NULL AND pfl.valor <> 0)
       OR (pfl.valor_horas IS NOT NULL AND pfl.valor_horas <> '00:00:00'::interval))
     AND (pfl.cod_folha IS NULL OR NOT EXISTS (
           SELECT 1 FROM public.payroll_dominio_cadastro pdc
            WHERE pdc.cod_empresa = v_cod_empresa_periodo
              AND pdc.cod_colaborador::text = pfl.cod_folha));
  IF v_sem_vinculo IS NOT NULL THEN
    RAISE EXCEPTION 'Matrículas sem cadastro na empresa %: %.', v_cod_empresa_periodo, v_sem_vinculo;
  END IF;

  SELECT string_agg(DISTINCT pr.cod_kph || ':' || pfl.cod_folha, ', ') INTO v_negativo
    FROM public.payroll_fechamento_linha pfl
    JOIN public.payroll_rubricas pr ON pr.id = pfl.rubrica_id
   WHERE pfl.periodo_id = v_periodo_id AND pr.exporta_txt
     AND ( (pr.unidade <> 'HORAS' AND pfl.valor < 0)
        OR (pr.unidade  = 'HORAS' AND pfl.valor_horas < '00:00:00'::interval) );
  IF v_negativo IS NOT NULL THEN
    RAISE EXCEPTION 'Valores negativos (o Domínio recebe módulo, sinal vem da rubrica): %.', v_negativo;
  END IF;

  WITH linhas AS (
    SELECT pdc.nome AS nome_ord,
           CASE pr.cod_dominio WHEN '254' THEN 1 WHEN '209' THEN 2 WHEN '200' THEN 3
                WHEN '1531' THEN 4 WHEN '266' THEN 5 WHEN '8069' THEN 6
                WHEN '8792' THEN 7 WHEN '8794' THEN 8 ELSE 9 END AS ord_rub,
           '10'
        || lpad(pdc.cod_colaborador::text, 10, '0')
        || v_ano || v_mes
        || lpad(pr.cod_dominio, 4, '0')
        || v_tipo_proc
        || lpad(
             CASE WHEN pr.unidade = 'HORAS'
               THEN ( floor(EXTRACT(EPOCH FROM pfl.valor_horas)/3600)::bigint * 100
                    + floor(mod(EXTRACT(EPOCH FROM pfl.valor_horas)::numeric,3600)/60)::bigint )::text
               ELSE round(pfl.valor * 100)::bigint::text
             END, 9, '0')
        || lpad(p_cod_empresa, 10, '0') AS linha
      FROM public.payroll_fechamento_linha pfl
      JOIN public.payroll_rubricas pr ON pr.id = pfl.rubrica_id
      JOIN public.payroll_dominio_cadastro pdc
        ON pdc.cod_empresa = v_cod_empresa_periodo
       AND pdc.cod_colaborador::text = pfl.cod_folha
     WHERE pfl.periodo_id = v_periodo_id
       AND pr.exporta_txt
       AND ( (pr.unidade <> 'HORAS' AND pfl.valor IS NOT NULL AND pfl.valor <> 0)
          OR (pr.unidade  = 'HORAS' AND pfl.valor_horas IS NOT NULL
              AND pfl.valor_horas <> '00:00:00'::interval) )
  )
  SELECT string_agg(linha, E'\n' ORDER BY nome_ord, ord_rub),
         string_agg(linha, ', ') FILTER (WHERE length(linha) <> 43)
    INTO v_txt, v_bad_len
    FROM linhas;

  IF v_bad_len IS NOT NULL THEN
    RAISE EXCEPTION 'Linhas com tamanho diferente de 43: %.', v_bad_len;
  END IF;

  IF v_txt IS NULL THEN
    RAISE EXCEPTION 'Nenhuma linha gerada para "%" na empresa %.', p_competencia, p_cod_empresa;
  END IF;

  RETURN v_txt;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_survey_results(p_survey_id uuid)
 RETURNS TABLE(question_id uuid, texto_pergunta text, total_respostas integer, media_escala numeric, distribuicao jsonb)
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT q.id, q.texto, COUNT(r.id)::int,
    ROUND(AVG(r.valor_escala), 1),
    jsonb_build_object('1',COUNT(r.id) FILTER (WHERE r.valor_escala=1),'2',COUNT(r.id) FILTER (WHERE r.valor_escala=2),'3',COUNT(r.id) FILTER (WHERE r.valor_escala=3),'4',COUNT(r.id) FILTER (WHERE r.valor_escala=4),'5',COUNT(r.id) FILTER (WHERE r.valor_escala=5))
  FROM climate_questions q LEFT JOIN climate_responses r ON r.question_id = q.id
  WHERE q.survey_id = p_survey_id GROUP BY q.id, q.texto ORDER BY q.ordem;
END;
$function$;

CREATE OR REPLACE FUNCTION public.resolve_punch_adjustment(p_request_id uuid, p_aprovado_por uuid, p_status text, p_inserir_punches boolean DEFAULT true)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
DECLARE
  v_req punch_adjustment_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_req
  FROM punch_adjustment_requests
  WHERE id = p_request_id AND status = 'pendente'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação % não encontrada ou já resolvida', p_request_id;
  END IF;

  UPDATE punch_adjustment_requests
  SET
    status      = p_status,
    aprovado_por = p_aprovado_por,
    aprovado_em  = now()
  WHERE id = p_request_id;

  -- Insere pontos retroativos apenas se aprovado e solicitado
  IF p_status = 'aprovado' AND p_inserir_punches THEN
    INSERT INTO time_clock_punches (employee_id, tipo, timestamp_punch, aprovado)
    VALUES
      -- Saída para almoço: data_referencia + horario_saida_almoco em SP → UTC
      (
        v_req.employee_id,
        'intervalo_inicio',
        (v_req.data_referencia::text || ' ' || v_req.horario_saida_almoco::text)::timestamp
          AT TIME ZONE 'America/Sao_Paulo',
        true
      ),
      -- Retorno do almoço
      (
        v_req.employee_id,
        'intervalo_fim',
        (v_req.data_referencia::text || ' ' || v_req.horario_retorno_almoco::text)::timestamp
          AT TIME ZONE 'America/Sao_Paulo',
        true
      );
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.payroll_parse_hhmm(v text)
 RETURNS interval
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
  SELECT
    CASE
      WHEN v IS NULL OR btrim(v) IN ('','00:00','00:00:00','0') THEN NULL
      WHEN v ~ '^\d+:\d{2}(:\d{2})?$' THEN
        make_interval(
          hours => split_part(v, ':', 1)::int,
          mins  => split_part(v, ':', 2)::int
        )
      ELSE NULL
    END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_payroll_listar_fechamento(p_periodo_id uuid)
 RETURNS TABLE(employee_id uuid, nome text, cod_folha text, cod_kph text, descricao_rubrica text, grupo text, tipo_rubrica text, valor numeric, valor_horas text, origem_lancamento text, unidade_rubrica text)
 LANGUAGE plpgsql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    pfl.employee_id,
    btrim(COALESCE(e.nome,'') || ' ' || COALESCE(e.sobrenome,'')) AS nome,
    pfl.cod_folha, pr.cod_kph, pr.descricao, pr.grupo, pr.tipo, pfl.valor,
    CASE WHEN pfl.valor_horas IS NOT NULL THEN
      lpad((extract(epoch FROM pfl.valor_horas)/3600)::int::text,2,'0') || ':' ||
      lpad((mod((extract(epoch FROM pfl.valor_horas)/60)::int,60))::text,2,'0')
    ELSE NULL END,
    pfl.origem_lancamento, pr.unidade
  FROM payroll_fechamento_linha pfl
  JOIN payroll_rubricas pr ON pr.id = pfl.rubrica_id
  JOIN employees        e  ON e.id  = pfl.employee_id
  WHERE pfl.periodo_id = p_periodo_id
  ORDER BY 2, pr.grupo, pr.cod_kph;
END;
$function$;

CREATE OR REPLACE FUNCTION public.normalize_ponto_mensal_periodo()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
DECLARE
  v_partes text[];
  v_mes_txt text;
  v_ano_txt text;
  v_mes int;
  v_ano int;
BEGIN
  -- Já está no formato correto MM/YYYY — passa direto
  IF NEW.periodo ~ '^\d{2}/\d{4}$' THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  v_partes := string_to_array(NEW.periodo, '/');
  IF array_length(v_partes, 1) != 2 THEN
    RAISE EXCEPTION 'ponto_mensal.periodo inválido: "%". Formato esperado: MM/YYYY.', NEW.periodo;
  END IF;

  v_mes_txt := lower(trim(v_partes[1]));
  v_ano_txt := trim(v_partes[2]);

  v_mes := CASE v_mes_txt
    WHEN 'jan' THEN 1  WHEN 'fev' THEN 2  WHEN 'mar' THEN 3
    WHEN 'abr' THEN 4  WHEN 'mai' THEN 5  WHEN 'jun' THEN 6
    WHEN 'jul' THEN 7  WHEN 'ago' THEN 8  WHEN 'set' THEN 9
    WHEN 'out' THEN 10 WHEN 'nov' THEN 11 WHEN 'dez' THEN 12
    ELSE NULL
  END;

  IF v_mes IS NULL THEN
    RAISE EXCEPTION 'ponto_mensal.periodo inválido: "%". Mês "%" não reconhecido.', NEW.periodo, v_mes_txt;
  END IF;

  v_ano := CASE
    WHEN length(v_ano_txt) = 2 THEN 2000 + v_ano_txt::int
    ELSE v_ano_txt::int
  END;

  NEW.periodo  := lpad(v_mes::text, 2, '0') || '/' || v_ano::text;
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.payroll_competencia_mes_ano(p_competencia text)
 RETURNS TABLE(mes integer, ano integer)
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
DECLARE
  v_mes_txt text := lower(split_part(p_competencia, '/', 1));
  v_ano_txt text := split_part(p_competencia, '/', 2);
BEGIN
  mes := CASE v_mes_txt
    WHEN 'jan' THEN 1  WHEN 'fev' THEN 2  WHEN 'mar' THEN 3
    WHEN 'abr' THEN 4  WHEN 'mai' THEN 5  WHEN 'jun' THEN 6
    WHEN 'jul' THEN 7  WHEN 'ago' THEN 8  WHEN 'set' THEN 9
    WHEN 'out' THEN 10 WHEN 'nov' THEN 11 WHEN 'dez' THEN 12
    WHEN '01'  THEN 1  WHEN '02'  THEN 2  WHEN '03'  THEN 3
    WHEN '04'  THEN 4  WHEN '05'  THEN 5  WHEN '06'  THEN 6
    WHEN '07'  THEN 7  WHEN '08'  THEN 8  WHEN '09'  THEN 9
    WHEN '10'  THEN 10 WHEN '11'  THEN 11 WHEN '12'  THEN 12
    ELSE NULL END;
  ano := CASE
    WHEN length(v_ano_txt) = 2 THEN 2000 + v_ano_txt::int
    ELSE v_ano_txt::int END;
  RETURN NEXT;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_payroll_coletar_periodo(p_unit_id uuid, p_competencia text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
DECLARE
  v_periodo_id    uuid;
  v_colabs        int := 0;
  v_linhas        int := 0;
  v_mes           int;
  v_ano           int;
  v_afast_genuino int;
  v_cod_empresa   text;
  v_he100         interval;
  v_empresas      text[];

  rid_pv01 uuid; rid_pv04 uuid; rid_pv05 uuid; rid_pv06 uuid;
  rid_ds03 uuid; rid_ds04 uuid;
  rid_pv07 uuid; rid_in02 uuid; rid_in05 uuid; rid_in07 uuid; rid_in08 uuid;

  r record;
BEGIN
  SELECT mes, ano INTO v_mes, v_ano FROM payroll_competencia_mes_ano(p_competencia);

  SELECT id INTO rid_pv01 FROM payroll_rubricas WHERE cod_kph = 'PV-01';
  SELECT id INTO rid_pv04 FROM payroll_rubricas WHERE cod_kph = 'PV-04';
  SELECT id INTO rid_pv05 FROM payroll_rubricas WHERE cod_kph = 'PV-05';
  SELECT id INTO rid_pv06 FROM payroll_rubricas WHERE cod_kph = 'PV-06';
  SELECT id INTO rid_ds03 FROM payroll_rubricas WHERE cod_kph = 'DS-03B';
  SELECT id INTO rid_ds04 FROM payroll_rubricas WHERE cod_kph = 'DS-04';
  SELECT id INTO rid_pv07 FROM payroll_rubricas WHERE cod_kph = 'PV-07';
  SELECT id INTO rid_in02 FROM payroll_rubricas WHERE cod_kph = 'IN-02';
  SELECT id INTO rid_in05 FROM payroll_rubricas WHERE cod_kph = 'IN-05';
  SELECT id INTO rid_in07 FROM payroll_rubricas WHERE cod_kph = 'IN-07';
  SELECT id INTO rid_in08 FROM payroll_rubricas WHERE cod_kph = 'IN-08';

  SELECT array_agg(DISTINCT pdc.cod_empresa ORDER BY pdc.cod_empresa) INTO v_empresas
  FROM payroll_dominio_cadastro pdc
  JOIN employee_codigos_dominio ecd ON ecd.employee_id = pdc.employee_id
  WHERE ecd.unit_id     = p_unit_id
    AND pdc.cod_empresa IS NOT NULL;

  IF array_length(v_empresas, 1) > 1 THEN
    RAISE EXCEPTION
      'Unidade % possui multiplas cod_empresa: [%]. Corrija payroll_dominio_cadastro antes de coletar.',
      p_unit_id, array_to_string(v_empresas, ', ');
  END IF;

  v_cod_empresa := v_empresas[1];

  INSERT INTO payroll_fechamento_periodo (unit_id, competencia, tipo_processo, status, cod_empresa)
  VALUES (p_unit_id, p_competencia, '11', 'ABERTO', v_cod_empresa)
  ON CONFLICT (unit_id, competencia, tipo_processo) DO UPDATE
    SET status      = payroll_fechamento_periodo.status,
        cod_empresa = COALESCE(payroll_fechamento_periodo.cod_empresa, EXCLUDED.cod_empresa)
  RETURNING id INTO v_periodo_id;

  FOR r IN
    SELECT pm.employee_id, ecd.cod_folha,
           pm.horas_trabalhadas, pm.horas_positivas, pm.banco_horas_mes,
           pm.adicional_noturno, pm.falta_injustificada_horas,
           pm.falta_injustificada_dias, pm.afastamentos_dias, pm.ferias_dias,
           pm.hora_extra_100, pm.hora_extra_100_noturno
    FROM ponto_mensal pm
    LEFT JOIN employee_codigos_dominio ecd
           ON ecd.employee_id = pm.employee_id
          AND ecd.unit_id     = pm.unit_id
          AND ecd.ativo       = true
    WHERE pm.unit_id = p_unit_id AND pm.periodo = p_competencia
      AND pm.employee_id IS NOT NULL
  LOOP
    v_colabs := v_colabs + 1;

    IF payroll_parse_hhmm(r.adicional_noturno) IS NOT NULL THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor_horas,origem_lancamento)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_pv04,payroll_parse_hhmm(r.adicional_noturno),'AUTO')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor_horas = EXCLUDED.valor_horas,
            cod_folha   = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    END IF;

    v_he100 := COALESCE(payroll_parse_hhmm(r.hora_extra_100),         '0'::interval)
             + COALESCE(payroll_parse_hhmm(r.hora_extra_100_noturno), '0'::interval);
    IF v_he100 > '0'::interval THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor_horas,origem_lancamento)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_pv06,v_he100,'AUTO')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor_horas = EXCLUDED.valor_horas,
            cod_folha   = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    END IF;

    IF payroll_parse_hhmm(r.falta_injustificada_horas) IS NOT NULL THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor_horas,origem_lancamento)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_ds03,payroll_parse_hhmm(r.falta_injustificada_horas),'AUTO')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor_horas = EXCLUDED.valor_horas,
            cod_folha   = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    END IF;

    IF COALESCE(r.falta_injustificada_dias,0) > 0 THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor,origem_lancamento)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_ds04,r.falta_injustificada_dias,'AUTO')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor     = EXCLUDED.valor,
            cod_folha = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    END IF;

    IF payroll_parse_hhmm(r.horas_trabalhadas) IS NOT NULL THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor_horas,origem_lancamento)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_in02,payroll_parse_hhmm(r.horas_trabalhadas),'AUTO')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor_horas = EXCLUDED.valor_horas,
            cod_folha   = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    END IF;

    IF payroll_parse_hhmm(r.banco_horas_mes) IS NOT NULL THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor_horas,origem_lancamento)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_in05,payroll_parse_hhmm(r.banco_horas_mes),'AUTO')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor_horas = EXCLUDED.valor_horas,
            cod_folha   = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    END IF;

    v_afast_genuino := GREATEST(COALESCE(r.afastamentos_dias,0) - COALESCE(r.ferias_dias,0), 0);
    IF v_afast_genuino > 0 THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor,origem_lancamento,observacao)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_in07,v_afast_genuino,'AUTO',
              'afastamento genuino = afastamentos_dias - ferias_dias')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor      = EXCLUDED.valor,
            observacao = EXCLUDED.observacao,
            cod_folha  = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    ELSE
      DELETE FROM payroll_fechamento_linha
      WHERE periodo_id = v_periodo_id AND employee_id = r.employee_id AND rubrica_id = rid_in07;
    END IF;

    IF COALESCE(r.ferias_dias,0) > 0 THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor,origem_lancamento)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_in08,r.ferias_dias,'AUTO')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor     = EXCLUDED.valor,
            cod_folha = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    END IF;
  END LOOP;

  DELETE FROM payroll_fechamento_linha
  WHERE periodo_id = v_periodo_id
    AND rubrica_id = rid_pv05
    AND origem_lancamento = 'AUTO';

  FOR r IN
    SELECT DISTINCT pfl.employee_id, pfl.cod_folha, e.salario_base
    FROM payroll_fechamento_linha pfl
    JOIN employees e ON e.id = pfl.employee_id
    WHERE pfl.periodo_id = v_periodo_id
      AND e.salario_base IS NOT NULL AND e.salario_base > 0
  LOOP
    INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor,origem_lancamento)
    VALUES (v_periodo_id, r.employee_id, r.cod_folha, rid_pv01, r.salario_base, 'AUTO')
    ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
      SET valor     = EXCLUDED.valor,
          cod_folha = EXCLUDED.cod_folha;
    v_linhas := v_linhas + 1;
  END LOOP;

  FOR r IN
    SELECT gd.employee_id, ecd.cod_folha, gd.valor_bruto
    FROM gorjeta_distribuicao gd
    LEFT JOIN employee_codigos_dominio ecd
           ON ecd.employee_id = gd.employee_id
          AND ecd.unit_id     = gd.unit_id
          AND ecd.ativo       = true
    WHERE gd.unit_id = p_unit_id AND gd.mes = v_mes AND gd.ano = v_ano
      AND gd.valor_bruto > 0
  LOOP
    INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor,origem_lancamento)
    VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_pv07,r.valor_bruto,'AUTO')
    ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
      SET valor     = EXCLUDED.valor,
          cod_folha = EXCLUDED.cod_folha;
    v_linhas := v_linhas + 1;
  END LOOP;

  DELETE FROM payroll_fechamento_linha pfl
  WHERE pfl.periodo_id = v_periodo_id AND pfl.rubrica_id = rid_pv07
    AND NOT EXISTS (
      SELECT 1 FROM gorjeta_distribuicao gd
      WHERE gd.employee_id = pfl.employee_id AND gd.unit_id = p_unit_id
        AND gd.mes = v_mes AND gd.ano = v_ano AND gd.valor_bruto > 0);

  UPDATE payroll_fechamento_periodo
  SET custo_total_folha = (
    SELECT COALESCE(SUM(pfl.valor),0)
    FROM payroll_fechamento_linha pfl
    JOIN payroll_rubricas pr ON pr.id = pfl.rubrica_id
    WHERE pfl.periodo_id = v_periodo_id
      AND pr.tipo='PROVENTO' AND pr.unidade='R$' AND pfl.valor IS NOT NULL)
  WHERE id = v_periodo_id;

  RETURN jsonb_build_object(
    'ok', true, 'periodo_id', v_periodo_id,
    'unit_id', p_unit_id, 'competencia', p_competencia,
    'mes', v_mes, 'ano', v_ano,
    'colabs', v_colabs, 'linhas', v_linhas
  );

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_payroll_upsert_lancamento_manual(p_periodo_id uuid, p_employee_id uuid, p_cod_kph text, p_valor numeric DEFAULT NULL::numeric, p_valor_horas text DEFAULT NULL::text, p_observacao text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
DECLARE
  v_rubrica_id uuid;
  v_cod_folha  text;
  v_status     text;
BEGIN
  SELECT status INTO v_status FROM payroll_fechamento_periodo WHERE id = p_periodo_id;
  IF v_status IN ('APROVADO','FECHADO') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Periodo ' || v_status || ' nao permite edicao');
  END IF;

  SELECT id INTO v_rubrica_id FROM payroll_rubricas WHERE cod_kph = p_cod_kph;
  IF v_rubrica_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Rubrica ' || p_cod_kph || ' inexistente');
  END IF;

  SELECT ecd.cod_folha INTO v_cod_folha
  FROM employee_codigos_dominio ecd
  JOIN payroll_fechamento_periodo p ON p.id = p_periodo_id
  WHERE ecd.employee_id = p_employee_id AND ecd.unit_id = p.unit_id;

  INSERT INTO payroll_fechamento_linha
    (periodo_id, employee_id, cod_folha, rubrica_id, valor, valor_horas, origem_lancamento, observacao)
  VALUES (p_periodo_id, p_employee_id, v_cod_folha, v_rubrica_id, p_valor,
          payroll_parse_hhmm(p_valor_horas), 'MANUAL', p_observacao)
  ON CONFLICT (periodo_id, employee_id, rubrica_id) DO UPDATE
    SET valor             = EXCLUDED.valor,
        valor_horas       = EXCLUDED.valor_horas,
        origem_lancamento = 'MANUAL',
        observacao        = EXCLUDED.observacao;

  UPDATE payroll_fechamento_periodo
  SET custo_total_folha = (
    SELECT COALESCE(SUM(pfl.valor),0)
    FROM payroll_fechamento_linha pfl
    JOIN payroll_rubricas pr ON pr.id = pfl.rubrica_id
    WHERE pfl.periodo_id = p_periodo_id
      AND pr.tipo = 'PROVENTO' AND pr.unidade = 'R$' AND pfl.valor IS NOT NULL)
  WHERE id = p_periodo_id;

  RETURN jsonb_build_object('ok', true, 'periodo_id', p_periodo_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$function$;

CREATE OR REPLACE FUNCTION public.buscar_talentos(p_statuses text[], p_termo text DEFAULT NULL::text, p_cargo text DEFAULT NULL::text, p_cidade text DEFAULT NULL::text, p_escolaridade text DEFAULT NULL::text, p_habilidade text DEFAULT NULL::text, p_turno text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, full_name text, area_interesse text, cidade text, escolaridade_nivel text, habilidades text[], cv_storage_path text, status text, origem text, created_at timestamp with time zone, total_count bigint)
 LANGUAGE sql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
  SELECT
    c.id,
    c.full_name,
    c.area_interesse,
    c.cidade,
    c.escolaridade_nivel,
    c.habilidades,
    c.cv_storage_path,
    c.status::text,
    c.origem,
    c.created_at,
    COUNT(*) OVER ()::bigint AS total_count
  FROM candidates c
  WHERE c.status = ANY(p_statuses)
    AND (p_termo        IS NULL OR c.full_name       ILIKE '%' || p_termo        || '%')
    AND (p_cargo        IS NULL OR c.area_interesse  ILIKE '%' || p_cargo        || '%')
    AND (p_cidade       IS NULL OR c.cidade          ILIKE '%' || p_cidade       || '%')
    AND (p_escolaridade IS NULL OR c.escolaridade_nivel = p_escolaridade)
    AND (p_habilidade   IS NULL OR EXISTS (
           SELECT 1 FROM unnest(c.habilidades) h
           WHERE h ILIKE '%' || p_habilidade || '%'
         ))
    AND (p_turno        IS NULL OR EXISTS (
           SELECT 1 FROM unnest(c.turnos_disponiveis) t
           WHERE t ILIKE '%' || p_turno || '%'
         ))
  ORDER BY c.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_payroll_listar_periodos(p_unit_id uuid)
 RETURNS TABLE(periodo_id uuid, competencia text, status text, custo_total_folha numeric, colabs bigint)
 LANGUAGE sql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
  SELECT p.id,
         p.competencia,
         p.status,
         p.custo_total_folha,
         (SELECT count(DISTINCT employee_id) FROM payroll_fechamento_linha WHERE periodo_id = p.id)
  FROM payroll_fechamento_periodo p
  WHERE p.unit_id = p_unit_id
  ORDER BY p.gerado_em DESC;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_avaliacao(p_candidate_id uuid, p_aderencia numeric, p_experiencia numeric, p_tec numeric, p_comp numeric, p_aderencia_ia boolean, p_experiencia_ia boolean)
 RETURNS candidate_avaliacao
 LANGUAGE plpgsql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
DECLARE r public.candidate_avaliacao;
BEGIN
  INSERT INTO public.candidate_avaliacao
    (candidate_id, aderencia_skills, experiencia, entrevista_tec, entrevista_comp,
     aderencia_ia_sugerida, experiencia_ia_sugerida)
  VALUES
    (p_candidate_id, p_aderencia, p_experiencia, p_tec, p_comp,
     p_aderencia_ia, p_experiencia_ia)
  ON CONFLICT (candidate_id) DO UPDATE SET
    aderencia_skills        = EXCLUDED.aderencia_skills,
    experiencia             = EXCLUDED.experiencia,
    entrevista_tec          = EXCLUDED.entrevista_tec,
    entrevista_comp         = EXCLUDED.entrevista_comp,
    aderencia_ia_sugerida   = EXCLUDED.aderencia_ia_sugerida,
    experiencia_ia_sugerida = EXCLUDED.experiencia_ia_sugerida,
    updated_at              = now()
  RETURNING * INTO r;
  RETURN r;
END $function$;

CREATE OR REPLACE FUNCTION public.fn_sync_qtd_alvo()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
BEGIN
  IF NEW.cargo_id IS NOT NULL THEN
    NEW.qtd_alvo :=
      COALESCE(NEW.alvo_manha,         0)
    + COALESCE(NEW.alvo_tarde,         0)
    + COALESCE(NEW.alvo_noite,         0)
    + COALESCE(NEW.alvo_madrugada,     0)
    + COALESCE(NEW.alvo_intermediario, 0);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_cargo_salarios()
 RETURNS TABLE(id uuid, cargo_id uuid, cargo_nome text, setor text, grupo text, tem_nivel boolean, nivel integer, unit_id uuid, salario_min numeric, salario_ref numeric, salario_max numeric, observacao text)
 LANGUAGE sql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
  select cs.id, cs.cargo_id, c.nome, c.setor, c.grupo,
         c.tem_nivel, cs.nivel, cs.unit_id,
         cs.salario_min, cs.salario_ref, cs.salario_max, cs.observacao
  from cargo_salarios cs
  join cargos c on c.id = cs.cargo_id
  where c.ativo = true
  order by c.setor, c.nome, cs.nivel nulls first;
$function$;

CREATE OR REPLACE FUNCTION public.get_organograma()
 RETURNS TABLE(id uuid, nome text, setor text, grupo text, reporta_a_cargo_id uuid, ordem_hierarquia integer)
 LANGUAGE sql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
  SELECT id, nome, setor, grupo, reporta_a_cargo_id, ordem_hierarquia
  FROM public.cargos
  WHERE ativo = true
  ORDER BY ordem_hierarquia NULLS FIRST, nome;
$function$;

CREATE OR REPLACE FUNCTION public.payroll_cc_fopag(p_departamento text, p_cargo text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
  SELECT CASE
    -- regra por cargo tem precedência (ESTOQUE não existe como departamento)
    WHEN upper(unaccent(coalesce(p_cargo,''))) LIKE '%ESTOQUISTA%' THEN 'ESTOQUE'
    ELSE
      CASE upper(btrim(unaccent(coalesce(p_departamento,''))))
        WHEN 'SALAO'          THEN 'SALAO'
        WHEN 'COZINHA'        THEN 'COZINHA'
        WHEN 'BAR'            THEN 'BAR'
        WHEN 'ESTOQUE'        THEN 'ESTOQUE'
        WHEN 'ADM'            THEN 'ADM'
        WHEN 'ADMINISTRATIVO' THEN 'ADM'
        WHEN 'DIRETORIA'      THEN 'ADM'
        WHEN 'COMPRAS'        THEN 'ADM'
        WHEN 'LIMPEZA'        THEN 'SALAO'
        ELSE ''   -- GERAL, 'Departamento', vazio: a classificar
      END
  END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_payroll_espelho_fopag(p_periodo_id uuid)
 RETURNS TABLE(employee_id uuid, cod_folha text, regime text, cc text, nome text, cargo text, admissao text, salario numeric, gorjeta_1q numeric, gorjeta_2q numeric, gorjeta_compulsoria numeric, adicional_noturno text, bonus numeric, quitacao_bh numeric, feriado numeric, emprestimo numeric, falta numeric, dsr numeric, plano_dependente numeric, coopart_plano numeric, desconto_vt text, liquido numeric, total_liquido numeric)
 LANGUAGE plpgsql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
DECLARE
  v_unit_id     uuid;
  v_competencia text;
  v_mes         int;
  v_ano         int;
BEGIN
  SELECT p.unit_id, p.competencia INTO v_unit_id, v_competencia
  FROM payroll_fechamento_periodo p WHERE p.id = p_periodo_id;

  SELECT m.mes, m.ano INTO v_mes, v_ano
  FROM payroll_competencia_mes_ano(v_competencia) m;

  RETURN QUERY
  WITH base AS (
    SELECT DISTINCT pfl.employee_id AS eid, pfl.cod_folha AS cf
    FROM payroll_fechamento_linha pfl
    WHERE pfl.periodo_id = p_periodo_id
  ),
  ident AS (
    SELECT b.eid, b.cf,
           btrim(COALESCE(e.nome,'') || ' ' || COALESCE(e.sobrenome,'')) AS v_nome,
           COALESCE(NULLIF(btrim(pm.cargo),''), NULLIF(btrim(gd.cargo),''), '') AS v_cargo,
           COALESCE(NULLIF(btrim(pm.departamento),''), NULLIF(btrim(e.departamento),''), '') AS v_dep_raw,
           COALESCE(NULLIF(btrim(pm.data_admissao),''), NULLIF(btrim(e.data_admissao::text),''), '') AS v_admissao
    FROM base b
    LEFT JOIN employees e ON e.id = b.eid
    LEFT JOIN LATERAL (
      SELECT p2.cargo, p2.departamento, p2.data_admissao
      FROM ponto_mensal p2
      WHERE p2.employee_id = b.eid AND p2.unit_id = v_unit_id
      ORDER BY (p2.periodo = v_competencia) DESC, p2.created_at DESC
      LIMIT 1
    ) pm ON true
    LEFT JOIN LATERAL (
      SELECT g2.cargo
      FROM gorjeta_distribuicao g2
      WHERE g2.employee_id = b.eid AND g2.unit_id = v_unit_id
      ORDER BY (g2.mes = v_mes AND g2.ano = v_ano) DESC, g2.created_at DESC
      LIMIT 1
    ) gd ON true
  ),
  piv AS (
    SELECT pfl.employee_id AS eid,
      MAX(CASE WHEN pr.cod_kph='PV-01'  THEN pfl.valor END) AS p_salario,
      MAX(CASE WHEN pr.cod_kph='PV-07A' THEN pfl.valor END) AS p_g1,
      MAX(CASE WHEN pr.cod_kph='PV-07B' THEN pfl.valor END) AS p_g2,
      MAX(CASE WHEN pr.cod_kph='PV-07'  THEN pfl.valor END) AS p_gmes,
      MAX(CASE WHEN pr.cod_kph='PV-04'  THEN
            lpad((extract(epoch FROM pfl.valor_horas)/3600)::int::text,2,'0') || ':' ||
            lpad(mod((extract(epoch FROM pfl.valor_horas)/60)::int,60)::text,2,'0')
          END)                                              AS p_adnot,
      MAX(CASE WHEN pr.cod_kph='PV-15'  THEN pfl.valor END) AS p_bonus,
      MAX(CASE WHEN pr.cod_kph='PV-12'  THEN pfl.valor END) AS p_quitbh,
      MAX(CASE WHEN pr.cod_kph='PV-11'  THEN pfl.valor END) AS p_feriado,
      MAX(CASE WHEN pr.cod_kph='DS-10'  THEN pfl.valor END) AS p_emprestimo,
      MAX(CASE WHEN pr.cod_kph='DS-04'  THEN pfl.valor END) AS p_falta,
      MAX(CASE WHEN pr.cod_kph='DS-13'  THEN pfl.valor END) AS p_dsr,
      MAX(CASE WHEN pr.cod_kph='DS-05'  THEN pfl.valor END) AS p_planodep,
      MAX(CASE WHEN pr.cod_kph='DS-09'  THEN pfl.valor END) AS p_coopart,
      MAX(CASE WHEN pr.cod_kph='DS-06'  THEN pfl.observacao END) AS p_vt,
      MAX(CASE WHEN pr.cod_kph='RT-01'  THEN pfl.valor END) AS p_liquido,
      MAX(CASE WHEN pr.cod_kph='RT-02'  THEN pfl.valor END) AS p_totliq
    FROM payroll_fechamento_linha pfl
    JOIN payroll_rubricas pr ON pr.id = pfl.rubrica_id
    WHERE pfl.periodo_id = p_periodo_id
    GROUP BY pfl.employee_id
  )
  SELECT
    i.eid,
    i.cf,
    'CLT'::text,
    payroll_cc_fopag(i.v_dep_raw, i.v_cargo)::text,   -- CC normalizado p/ FOPAG
    i.v_nome,
    i.v_cargo::text,
    i.v_admissao::text,
    pv.p_salario,
    pv.p_g1,
    pv.p_g2,
    COALESCE(pv.p_g1,0) + COALESCE(pv.p_g2,0)
      + CASE WHEN pv.p_g1 IS NULL AND pv.p_g2 IS NULL
             THEN COALESCE(pv.p_gmes,0) ELSE 0 END,
    pv.p_adnot,
    pv.p_bonus,
    pv.p_quitbh,
    pv.p_feriado,
    pv.p_emprestimo,
    pv.p_falta,
    pv.p_dsr,
    pv.p_planodep,
    pv.p_coopart,
    pv.p_vt,
    pv.p_liquido,
    pv.p_totliq
  FROM ident i
  LEFT JOIN piv pv ON pv.eid = i.eid
  ORDER BY i.v_nome;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_cargo_salario(p_id uuid, p_salario_min numeric, p_salario_ref numeric, p_salario_max numeric, p_observacao text DEFAULT NULL::text)
 RETURNS cargo_salarios
 LANGUAGE plpgsql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
declare r cargo_salarios;
begin
  update cargo_salarios
     set salario_min = p_salario_min,
         salario_ref = p_salario_ref,
         salario_max = p_salario_max,
         observacao  = coalesce(p_observacao, observacao),
         updated_at  = now()
   where id = p_id
  returning * into r;
  if not found then
    raise exception 'cargo_salario % não encontrado', p_id;
  end if;
  return r;
end; $function$;

CREATE OR REPLACE FUNCTION public.upsert_feedback_operacional(p_candidate_id uuid, p_agendamento_id uuid DEFAULT NULL::uuid, p_postura numeric DEFAULT NULL::numeric, p_ritmo numeric DEFAULT NULL::numeric, p_dominio numeric DEFAULT NULL::numeric, p_higiene numeric DEFAULT NULL::numeric, p_equipe numeric DEFAULT NULL::numeric, p_parecer text DEFAULT NULL::text, p_avaliador_id uuid DEFAULT NULL::uuid)
 RETURNS candidate_feedback_operacional
 LANGUAGE plpgsql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
DECLARE r public.candidate_feedback_operacional;
BEGIN
  INSERT INTO public.candidate_feedback_operacional AS f
    (candidate_id, agendamento_id, postura_apresentacao, ritmo_sob_pressao,
     dominio_tecnico, higiene_seguranca, trabalho_em_equipe, parecer, avaliador_id)
  VALUES (p_candidate_id, p_agendamento_id, p_postura, p_ritmo,
          p_dominio, p_higiene, p_equipe, p_parecer, p_avaliador_id)
  ON CONFLICT (candidate_id) DO UPDATE SET
    agendamento_id       = COALESCE(EXCLUDED.agendamento_id, f.agendamento_id),
    postura_apresentacao = COALESCE(EXCLUDED.postura_apresentacao, f.postura_apresentacao),
    ritmo_sob_pressao    = COALESCE(EXCLUDED.ritmo_sob_pressao, f.ritmo_sob_pressao),
    dominio_tecnico      = COALESCE(EXCLUDED.dominio_tecnico, f.dominio_tecnico),
    higiene_seguranca    = COALESCE(EXCLUDED.higiene_seguranca, f.higiene_seguranca),
    trabalho_em_equipe   = COALESCE(EXCLUDED.trabalho_em_equipe, f.trabalho_em_equipe),
    parecer              = COALESCE(EXCLUDED.parecer, f.parecer),
    avaliador_id         = COALESCE(EXCLUDED.avaliador_id, f.avaliador_id),
    updated_at           = now()
  RETURNING * INTO r;
  RETURN r;
END;
$function$;

CREATE OR REPLACE FUNCTION public.upsert_feedback_operacional(p_candidate_id uuid, p_agendamento_id uuid, p_postura numeric, p_ritmo numeric, p_dominio numeric, p_higiene numeric, p_equipe numeric, p_parecer text)
 RETURNS candidate_feedback_operacional
 LANGUAGE plpgsql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
DECLARE
  r public.candidate_feedback_operacional;
BEGIN
  INSERT INTO public.candidate_feedback_operacional
    (candidate_id, agendamento_id,
     postura_apresentacao, ritmo_sob_pressao, dominio_tecnico,
     higiene_seguranca, trabalho_em_equipe, parecer)
  VALUES
    (p_candidate_id, p_agendamento_id,
     p_postura, p_ritmo, p_dominio, p_higiene, p_equipe, p_parecer)
  ON CONFLICT (candidate_id) DO UPDATE SET
    agendamento_id       = EXCLUDED.agendamento_id,
    postura_apresentacao = EXCLUDED.postura_apresentacao,
    ritmo_sob_pressao    = EXCLUDED.ritmo_sob_pressao,
    dominio_tecnico      = EXCLUDED.dominio_tecnico,
    higiene_seguranca    = EXCLUDED.higiene_seguranca,
    trabalho_em_equipe   = EXCLUDED.trabalho_em_equipe,
    parecer              = EXCLUDED.parecer,
    updated_at           = now()
  RETURNING * INTO r;
  RETURN r;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_gap_headcount(p_unit_id uuid)
 RETURNS TABLE(departamento text, cargo text, grupo text, qtd_alvo integer, headcount_atual integer, gap integer)
 LANGUAGE sql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
  SELECT
    qi.departamento,
    qi.cargo,
    cg.nome                                     AS grupo,
    qi.qtd_alvo,
    COALESCE(hc.n, 0)::integer                  AS headcount_atual,
    (qi.qtd_alvo - COALESCE(hc.n, 0))::integer  AS gap
  FROM public.quadro_ideal qi
  JOIN public.cargo_grupos cg ON cg.id = qi.cargo_grupo_id
  LEFT JOIN (
    SELECT
      unaccent(lower(trim(e.funcao))) AS cargo_norm,
      COUNT(*)::integer               AS n
    FROM public.employees e
    WHERE e.unit_id = p_unit_id
      AND e.ativo   = true
      AND e.is_system_account IS NOT TRUE
    GROUP BY unaccent(lower(trim(e.funcao)))
  ) hc ON hc.cargo_norm = unaccent(lower(trim(qi.cargo)))
  WHERE qi.unit_id    = p_unit_id
    AND qi.vigente_ate IS NULL
  ORDER BY qi.departamento, qi.cargo;
$function$;

CREATE OR REPLACE FUNCTION public.get_quadro_completo(p_unit_id uuid)
 RETURNS TABLE(id uuid, cargo_id uuid, cargo_nome text, setor text, grupo text, tem_nivel boolean, alvo_manha integer, alvo_tarde integer, alvo_noite integer, alvo_madrugada integer, alvo_intermediario integer, qtd_alvo integer, headcount_atual integer, gap integer, reporta_a_cargo_id uuid, reporta_a_nome text)
 LANGUAGE sql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
  SELECT
    qi.id,
    qi.cargo_id,
    c.nome                                                   AS cargo_nome,
    c.setor,
    c.grupo,
    c.tem_nivel,
    qi.alvo_manha,
    qi.alvo_tarde,
    qi.alvo_noite,
    qi.alvo_madrugada,
    qi.alvo_intermediario,
    COALESCE(qi.qtd_alvo, 0)                                 AS qtd_alvo,
    COALESCE(hc.n, 0)::integer                               AS headcount_atual,
    (COALESCE(qi.qtd_alvo,0) - COALESCE(hc.n,0))::integer   AS gap,
    qi.reporta_a_cargo_id,
    sup.nome                                                 AS reporta_a_nome
  FROM public.quadro_ideal qi
  JOIN public.cargos c ON c.id = qi.cargo_id
  LEFT JOIN public.cargos sup ON sup.id = qi.reporta_a_cargo_id
  LEFT JOIN (
    SELECT
      unaccent(lower(trim(e.funcao))) AS cargo_norm,
      COUNT(*)::integer               AS n
    FROM public.employees e
    WHERE e.unit_id = p_unit_id
      AND e.ativo   = true
      AND e.is_system_account IS NOT TRUE
    GROUP BY unaccent(lower(trim(e.funcao)))
  ) hc ON hc.cargo_norm = unaccent(lower(trim(c.nome)))
  WHERE qi.unit_id    = p_unit_id
    AND qi.vigente_ate IS NULL
    AND qi.cargo_id   IS NOT NULL
  ORDER BY c.setor, c.nome;
$function$;

CREATE OR REPLACE FUNCTION public.get_punches_by_unit(p_unit_id uuid, p_date date)
 RETURNS TABLE(employee_id uuid, nome_completo text, funcao text, unit_id uuid, tipo text, registrado_em timestamp with time zone, gps_failed boolean)
 LANGUAGE sql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
  SELECT
    e.id,
    (e.nome || ' ' || e.sobrenome)::text,
    e.funcao::text,
    e.unit_id,
    tcp.tipo::text,
    tcp.timestamp_punch,
    (tcp.latitude IS NULL AND tcp.longitude IS NULL)::boolean
  FROM employees e
  LEFT JOIN time_clock_punches tcp
    ON  tcp.employee_id = e.id
    AND DATE(tcp.timestamp_punch AT TIME ZONE 'America/Sao_Paulo') = p_date
  WHERE
    e.ativo IS NOT FALSE
    AND e.is_system_account IS NOT TRUE
    AND (
      p_unit_id = '00000000-0000-0000-0000-000000000010'::uuid
      OR e.unit_id = p_unit_id
    )
  ORDER BY e.nome, e.sobrenome, tcp.timestamp_punch NULLS LAST;
$function$;
CREATE TRIGGER trg_training_templates_updated_at BEFORE UPDATE ON public.training_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_training_records_updated_at BEFORE UPDATE ON public.training_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_performance_templates_updated_at BEFORE UPDATE ON public.performance_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_performance_reviews_updated_at BEFORE UPDATE ON public.performance_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER runs_updated_at BEFORE UPDATE ON public.hos_runs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_gorjeta_cargo_pontos_updated_at BEFORE UPDATE ON public.gorjeta_cargo_pontos FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_gorjeta_periodos_updated_at BEFORE UPDATE ON public.gorjeta_periodos FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();
CREATE TRIGGER trg_job_openings_status_prazo BEFORE INSERT OR UPDATE ON public.job_openings FOR EACH ROW EXECUTE FUNCTION fn_recalc_status_prazo();
CREATE TRIGGER trg_sync_qtd_alvo BEFORE INSERT OR UPDATE ON public.quadro_ideal FOR EACH ROW EXECUTE FUNCTION fn_sync_qtd_alvo();
CREATE TRIGGER pdis_updated_at BEFORE UPDATE ON public.pdis FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER candidates_updated_at BEFORE UPDATE ON public.candidates FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_revert_candidate_on_employee_delete AFTER DELETE ON public.employees FOR EACH ROW EXECUTE FUNCTION revert_candidate_on_employee_delete();
CREATE TRIGGER trg_normalize_ponto_mensal_periodo BEFORE INSERT OR UPDATE ON public.ponto_mensal FOR EACH ROW EXECUTE FUNCTION normalize_ponto_mensal_periodo();
CREATE VIEW public.tips_records WITH (security_invoker=true) AS  SELECT md5(employee_id::text || to_char(data::timestamp with time zone, 'YYYY-MM'::text))::uuid AS id,
    employee_id,
    to_char(data::timestamp with time zone, 'YYYY-MM'::text) AS periodo,
    sum(pontos)::numeric(10,2) AS total_pontos,
    sum(pontos)::numeric(10,2) AS pontos_liquidos,
        CASE
            WHEN sum(pontos) > 0 THEN (sum(valor_calculado) / sum(pontos)::numeric)::numeric(10,4)
            ELSE 0::numeric
        END AS valor_ponto,
    sum(valor_calculado)::numeric(10,2) AS valor
   FROM gorjeta_dias gd
  WHERE employee_id IS NOT NULL
  GROUP BY employee_id, (to_char(data::timestamp with time zone, 'YYYY-MM'::text));
ALTER TABLE public."candidate_feedback_operacional" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."candidate_feedback_operacional" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."candidate_feedback_operacional" TO authenticated;
GRANT ALL ON public."candidate_feedback_operacional" TO service_role;
CREATE POLICY cardoso_admin_access ON public."candidate_feedback_operacional" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."interviews" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."interviews" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."interviews" TO authenticated;
GRANT ALL ON public."interviews" TO service_role;
CREATE POLICY cardoso_admin_access ON public."interviews" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."access_requests" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."access_requests" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."access_requests" TO authenticated;
GRANT ALL ON public."access_requests" TO service_role;
CREATE POLICY cardoso_admin_access ON public."access_requests" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."gorjeta_periodos" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."gorjeta_periodos" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."gorjeta_periodos" TO authenticated;
GRANT ALL ON public."gorjeta_periodos" TO service_role;
CREATE POLICY cardoso_admin_access ON public."gorjeta_periodos" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."employee_availability" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."employee_availability" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."employee_availability" TO authenticated;
GRANT ALL ON public."employee_availability" TO service_role;
CREATE POLICY cardoso_admin_access ON public."employee_availability" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."onboarding_tarefas" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."onboarding_tarefas" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."onboarding_tarefas" TO authenticated;
GRANT ALL ON public."onboarding_tarefas" TO service_role;
CREATE POLICY cardoso_admin_access ON public."onboarding_tarefas" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."pdi_metas" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."pdi_metas" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."pdi_metas" TO authenticated;
GRANT ALL ON public."pdi_metas" TO service_role;
CREATE POLICY cardoso_admin_access ON public."pdi_metas" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."candidates" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."candidates" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."candidates" TO authenticated;
GRANT ALL ON public."candidates" TO service_role;
CREATE POLICY cardoso_admin_access ON public."candidates" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."payroll_fechamento_periodo" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."payroll_fechamento_periodo" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."payroll_fechamento_periodo" TO authenticated;
GRANT ALL ON public."payroll_fechamento_periodo" TO service_role;
CREATE POLICY cardoso_admin_access ON public."payroll_fechamento_periodo" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."theo_tickets" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."theo_tickets" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."theo_tickets" TO authenticated;
GRANT ALL ON public."theo_tickets" TO service_role;
CREATE POLICY cardoso_admin_access ON public."theo_tickets" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."onboarding_runs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."onboarding_runs" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."onboarding_runs" TO authenticated;
GRANT ALL ON public."onboarding_runs" TO service_role;
CREATE POLICY cardoso_admin_access ON public."onboarding_runs" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."performance_templates" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."performance_templates" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."performance_templates" TO authenticated;
GRANT ALL ON public."performance_templates" TO service_role;
CREATE POLICY cardoso_admin_access ON public."performance_templates" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."gorjeta_dias" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."gorjeta_dias" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."gorjeta_dias" TO authenticated;
GRANT ALL ON public."gorjeta_dias" TO service_role;
CREATE POLICY cardoso_admin_access ON public."gorjeta_dias" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."job_openings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."job_openings" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."job_openings" TO authenticated;
GRANT ALL ON public."job_openings" TO service_role;
CREATE POLICY cardoso_admin_access ON public."job_openings" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."quadro_ideal" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."quadro_ideal" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."quadro_ideal" TO authenticated;
GRANT ALL ON public."quadro_ideal" TO service_role;
CREATE POLICY cardoso_admin_access ON public."quadro_ideal" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."training_templates" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."training_templates" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."training_templates" TO authenticated;
GRANT ALL ON public."training_templates" TO service_role;
CREATE POLICY cardoso_admin_access ON public."training_templates" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."score_events" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."score_events" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."score_events" TO authenticated;
GRANT ALL ON public."score_events" TO service_role;
CREATE POLICY cardoso_admin_access ON public."score_events" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."cargo_grupos" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."cargo_grupos" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."cargo_grupos" TO authenticated;
GRANT ALL ON public."cargo_grupos" TO service_role;
CREATE POLICY cardoso_admin_access ON public."cargo_grupos" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."payslips" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."payslips" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."payslips" TO authenticated;
GRANT ALL ON public."payslips" TO service_role;
CREATE POLICY cardoso_admin_access ON public."payslips" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."ponto_mensal" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."ponto_mensal" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."ponto_mensal" TO authenticated;
GRANT ALL ON public."ponto_mensal" TO service_role;
CREATE POLICY cardoso_admin_access ON public."ponto_mensal" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."hour_bank" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."hour_bank" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."hour_bank" TO authenticated;
GRANT ALL ON public."hour_bank" TO service_role;
CREATE POLICY cardoso_admin_access ON public."hour_bank" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."notifications" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."notifications" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."notifications" TO authenticated;
GRANT ALL ON public."notifications" TO service_role;
CREATE POLICY cardoso_admin_access ON public."notifications" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."payroll_dominio_empresa" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."payroll_dominio_empresa" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."payroll_dominio_empresa" TO authenticated;
GRANT ALL ON public."payroll_dominio_empresa" TO service_role;
CREATE POLICY cardoso_admin_access ON public."payroll_dominio_empresa" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."payroll_fechamento_linha" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."payroll_fechamento_linha" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."payroll_fechamento_linha" TO authenticated;
GRANT ALL ON public."payroll_fechamento_linha" TO service_role;
CREATE POLICY cardoso_admin_access ON public."payroll_fechamento_linha" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."time_bank_balance" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."time_bank_balance" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."time_bank_balance" TO authenticated;
GRANT ALL ON public."time_bank_balance" TO service_role;
CREATE POLICY cardoso_admin_access ON public."time_bank_balance" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."time_clock_punches" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."time_clock_punches" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."time_clock_punches" TO authenticated;
GRANT ALL ON public."time_clock_punches" TO service_role;
CREATE POLICY cardoso_admin_access ON public."time_clock_punches" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."training_records" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."training_records" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."training_records" TO authenticated;
GRANT ALL ON public."training_records" TO service_role;
CREATE POLICY cardoso_admin_access ON public."training_records" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."onboarding_checklist" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."onboarding_checklist" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."onboarding_checklist" TO authenticated;
GRANT ALL ON public."onboarding_checklist" TO service_role;
CREATE POLICY cardoso_admin_access ON public."onboarding_checklist" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."overtime_records" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."overtime_records" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."overtime_records" TO authenticated;
GRANT ALL ON public."overtime_records" TO service_role;
CREATE POLICY cardoso_admin_access ON public."overtime_records" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."contatos_kph" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."contatos_kph" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."contatos_kph" TO authenticated;
GRANT ALL ON public."contatos_kph" TO service_role;
CREATE POLICY cardoso_admin_access ON public."contatos_kph" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."cargos" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."cargos" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."cargos" TO authenticated;
GRANT ALL ON public."cargos" TO service_role;
CREATE POLICY cardoso_admin_access ON public."cargos" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."ponto_ahgora_arquivos" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."ponto_ahgora_arquivos" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."ponto_ahgora_arquivos" TO authenticated;
GRANT ALL ON public."ponto_ahgora_arquivos" TO service_role;
CREATE POLICY cardoso_admin_access ON public."ponto_ahgora_arquivos" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."candidate_agendamentos" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."candidate_agendamentos" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."candidate_agendamentos" TO authenticated;
GRANT ALL ON public."candidate_agendamentos" TO service_role;
CREATE POLICY cardoso_admin_access ON public."candidate_agendamentos" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."hos_runs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."hos_runs" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."hos_runs" TO authenticated;
GRANT ALL ON public."hos_runs" TO service_role;
CREATE POLICY cardoso_admin_access ON public."hos_runs" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."avaliacao_ciclos" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."avaliacao_ciclos" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."avaliacao_ciclos" TO authenticated;
GRANT ALL ON public."avaliacao_ciclos" TO service_role;
CREATE POLICY cardoso_admin_access ON public."avaliacao_ciclos" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."payroll_rubricas" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."payroll_rubricas" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."payroll_rubricas" TO authenticated;
GRANT ALL ON public."payroll_rubricas" TO service_role;
CREATE POLICY cardoso_admin_access ON public."payroll_rubricas" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."avaliacao_participantes" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."avaliacao_participantes" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."avaliacao_participantes" TO authenticated;
GRANT ALL ON public."avaliacao_participantes" TO service_role;
CREATE POLICY cardoso_admin_access ON public."avaliacao_participantes" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."reunioes_1on1" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."reunioes_1on1" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."reunioes_1on1" TO authenticated;
GRANT ALL ON public."reunioes_1on1" TO service_role;
CREATE POLICY cardoso_admin_access ON public."reunioes_1on1" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."candidatos_maya" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."candidatos_maya" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."candidatos_maya" TO authenticated;
GRANT ALL ON public."candidatos_maya" TO service_role;
CREATE POLICY cardoso_admin_access ON public."candidatos_maya" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."time_records" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."time_records" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."time_records" TO authenticated;
GRANT ALL ON public."time_records" TO service_role;
CREATE POLICY cardoso_admin_access ON public."time_records" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."candidate_pipeline" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."candidate_pipeline" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."candidate_pipeline" TO authenticated;
GRANT ALL ON public."candidate_pipeline" TO service_role;
CREATE POLICY cardoso_admin_access ON public."candidate_pipeline" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."origens_candidato" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."origens_candidato" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."origens_candidato" TO authenticated;
GRANT ALL ON public."origens_candidato" TO service_role;
CREATE POLICY cardoso_admin_access ON public."origens_candidato" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."vacations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."vacations" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."vacations" TO authenticated;
GRANT ALL ON public."vacations" TO service_role;
CREATE POLICY cardoso_admin_access ON public."vacations" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."kph_insights" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."kph_insights" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."kph_insights" TO authenticated;
GRANT ALL ON public."kph_insights" TO service_role;
CREATE POLICY cardoso_admin_access ON public."kph_insights" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."disciplinary_actions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."disciplinary_actions" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."disciplinary_actions" TO authenticated;
GRANT ALL ON public."disciplinary_actions" TO service_role;
CREATE POLICY cardoso_admin_access ON public."disciplinary_actions" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."agent_conversations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."agent_conversations" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."agent_conversations" TO authenticated;
GRANT ALL ON public."agent_conversations" TO service_role;
CREATE POLICY cardoso_admin_access ON public."agent_conversations" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."candidate_avaliacao" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."candidate_avaliacao" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."candidate_avaliacao" TO authenticated;
GRANT ALL ON public."candidate_avaliacao" TO service_role;
CREATE POLICY cardoso_admin_access ON public."candidate_avaliacao" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."job_descriptions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."job_descriptions" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."job_descriptions" TO authenticated;
GRANT ALL ON public."job_descriptions" TO service_role;
CREATE POLICY cardoso_admin_access ON public."job_descriptions" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."punch_adjustment_requests" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."punch_adjustment_requests" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."punch_adjustment_requests" TO authenticated;
GRANT ALL ON public."punch_adjustment_requests" TO service_role;
CREATE POLICY cardoso_admin_access ON public."punch_adjustment_requests" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."shifts" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."shifts" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."shifts" TO authenticated;
GRANT ALL ON public."shifts" TO service_role;
CREATE POLICY cardoso_admin_access ON public."shifts" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."sick_leaves" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."sick_leaves" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."sick_leaves" TO authenticated;
GRANT ALL ON public."sick_leaves" TO service_role;
CREATE POLICY cardoso_admin_access ON public."sick_leaves" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."agent_metrics" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."agent_metrics" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."agent_metrics" TO authenticated;
GRANT ALL ON public."agent_metrics" TO service_role;
CREATE POLICY cardoso_admin_access ON public."agent_metrics" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."transport_vouchers" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."transport_vouchers" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."transport_vouchers" TO authenticated;
GRANT ALL ON public."transport_vouchers" TO service_role;
CREATE POLICY cardoso_admin_access ON public."transport_vouchers" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."onboarding_templates" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."onboarding_templates" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."onboarding_templates" TO authenticated;
GRANT ALL ON public."onboarding_templates" TO service_role;
CREATE POLICY cardoso_admin_access ON public."onboarding_templates" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."reuniao_action_items" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."reuniao_action_items" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."reuniao_action_items" TO authenticated;
GRANT ALL ON public."reuniao_action_items" TO service_role;
CREATE POLICY cardoso_admin_access ON public."reuniao_action_items" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."performance_reviews" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."performance_reviews" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."performance_reviews" TO authenticated;
GRANT ALL ON public."performance_reviews" TO service_role;
CREATE POLICY cardoso_admin_access ON public."performance_reviews" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."feedbacks" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."feedbacks" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."feedbacks" TO authenticated;
GRANT ALL ON public."feedbacks" TO service_role;
CREATE POLICY cardoso_admin_access ON public."feedbacks" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."vacation_schedules" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."vacation_schedules" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."vacation_schedules" TO authenticated;
GRANT ALL ON public."vacation_schedules" TO service_role;
CREATE POLICY cardoso_admin_access ON public."vacation_schedules" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."hos_jobs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."hos_jobs" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."hos_jobs" TO authenticated;
GRANT ALL ON public."hos_jobs" TO service_role;
CREATE POLICY cardoso_admin_access ON public."hos_jobs" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."warnings" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."warnings" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."warnings" TO authenticated;
GRANT ALL ON public."warnings" TO service_role;
CREATE POLICY cardoso_admin_access ON public."warnings" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."kph_intelligence_scores" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."kph_intelligence_scores" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."kph_intelligence_scores" TO authenticated;
GRANT ALL ON public."kph_intelligence_scores" TO service_role;
CREATE POLICY cardoso_admin_access ON public."kph_intelligence_scores" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."kph_learning_proposals" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."kph_learning_proposals" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."kph_learning_proposals" TO authenticated;
GRANT ALL ON public."kph_learning_proposals" TO service_role;
CREATE POLICY cardoso_admin_access ON public."kph_learning_proposals" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."payroll_dominio_cadastro" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."payroll_dominio_cadastro" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."payroll_dominio_cadastro" TO authenticated;
GRANT ALL ON public."payroll_dominio_cadastro" TO service_role;
CREATE POLICY cardoso_admin_access ON public."payroll_dominio_cadastro" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."agent_prompt_versions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."agent_prompt_versions" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."agent_prompt_versions" TO authenticated;
GRANT ALL ON public."agent_prompt_versions" TO service_role;
CREATE POLICY cardoso_admin_access ON public."agent_prompt_versions" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."absences" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."absences" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."absences" TO authenticated;
GRANT ALL ON public."absences" TO service_role;
CREATE POLICY cardoso_admin_access ON public."absences" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."gorjeta_distribuicao" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."gorjeta_distribuicao" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."gorjeta_distribuicao" TO authenticated;
GRANT ALL ON public."gorjeta_distribuicao" TO service_role;
CREATE POLICY cardoso_admin_access ON public."gorjeta_distribuicao" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."pdis" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."pdis" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."pdis" TO authenticated;
GRANT ALL ON public."pdis" TO service_role;
CREATE POLICY cardoso_admin_access ON public."pdis" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."gorjeta_cargo_pontos" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."gorjeta_cargo_pontos" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."gorjeta_cargo_pontos" TO authenticated;
GRANT ALL ON public."gorjeta_cargo_pontos" TO service_role;
CREATE POLICY cardoso_admin_access ON public."gorjeta_cargo_pontos" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."cargo_salarios" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."cargo_salarios" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."cargo_salarios" TO authenticated;
GRANT ALL ON public."cargo_salarios" TO service_role;
CREATE POLICY cardoso_admin_access ON public."cargo_salarios" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."climate_questions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."climate_questions" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."climate_questions" TO authenticated;
GRANT ALL ON public."climate_questions" TO service_role;
CREATE POLICY cardoso_admin_access ON public."climate_questions" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."climate_surveys" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."climate_surveys" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."climate_surveys" TO authenticated;
GRANT ALL ON public."climate_surveys" TO service_role;
CREATE POLICY cardoso_admin_access ON public."climate_surveys" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."employee_codigos_dominio" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."employee_codigos_dominio" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."employee_codigos_dominio" TO authenticated;
GRANT ALL ON public."employee_codigos_dominio" TO service_role;
CREATE POLICY cardoso_admin_access ON public."employee_codigos_dominio" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
ALTER TABLE public."climate_responses" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."climate_responses" FROM anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public."climate_responses" TO authenticated;
GRANT ALL ON public."climate_responses" TO service_role;
CREATE POLICY cardoso_admin_access ON public."climate_responses" FOR ALL TO authenticated USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));
REVOKE ALL ON public.tips_records FROM anon, authenticated;
GRANT SELECT ON public.tips_records TO authenticated,service_role;
GRANT DELETE ON public.employees TO authenticated;
DO $acl$ DECLARE f record; BEGIN
FOR f IN SELECT p.oid::regprocedure AS signature,p.prorettype='trigger'::regtype AS is_trigger
FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname IN ('promover_candidato','update_updated_at_column','set_updated_at','fn_recalc_status_prazo','update_updated_at','fn_set_updated_at','revert_candidate_on_employee_delete','rpc_payroll_gerar_txt_dominio','get_survey_results','resolve_punch_adjustment','payroll_parse_hhmm','rpc_payroll_listar_fechamento','normalize_ponto_mensal_periodo','payroll_competencia_mes_ano','rpc_payroll_coletar_periodo','rpc_payroll_upsert_lancamento_manual','buscar_talentos','rpc_payroll_listar_periodos','upsert_avaliacao','fn_sync_qtd_alvo','get_cargo_salarios','get_organograma','payroll_cc_fopag','rpc_payroll_espelho_fopag','upsert_cargo_salario','upsert_feedback_operacional','upsert_feedback_operacional','get_gap_headcount','get_quadro_completo','get_punches_by_unit')
LOOP
 EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature);
 IF NOT f.is_trigger THEN EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated,service_role',f.signature); END IF;
END LOOP; END $acl$;
NOTIFY pgrst,'reload schema';
