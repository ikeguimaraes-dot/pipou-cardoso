// Tipos do schema Supabase do KPH OS.
//
// ── Seção 1: GERADA via `supabase gen types typescript --linked` (08/07/2026).
//    Para atualizar: supabase gen types typescript --linked, substituir a seção gerada.
// ── Seção 2 (após o marcador CUSTOM): tipos mantidos manualmente — unions de
//    CHECK constraints e aliases de Row. NÃO sobrescrever ao regenerar.
//
// Removidos em 11/06/2026 (tabelas/views não existem mais no banco):
//   financial_periods, cash_flow_projections, cash_flow_entries,
//   approval_requests, brand_financial_config, v_gap_projecao_realizado,
//   v_cmv_dashboard — e os aliases derivados.


export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      absences: {
        Row: {
          atestado_path: string | null
          created_at: string | null
          data: string
          employee_id: string
          id: string
          motivo: string | null
          score_impact: number | null
          tipo: string
        }
        Insert: {
          atestado_path?: string | null
          created_at?: string | null
          data: string
          employee_id: string
          id?: string
          motivo?: string | null
          score_impact?: number | null
          tipo: string
        }
        Update: {
          atestado_path?: string | null
          created_at?: string | null
          data?: string
          employee_id?: string
          id?: string
          motivo?: string | null
          score_impact?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "absences_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      access_requests: {
        Row: {
          approved_at: string | null
          approver_id: string | null
          approver_tier: string
          cpf: string
          created_at: string | null
          email: string
          employee_id: string | null
          id: string
          rejected_reason: string | null
          status: string
        }
        Insert: {
          approved_at?: string | null
          approver_id?: string | null
          approver_tier: string
          cpf: string
          created_at?: string | null
          email: string
          employee_id?: string | null
          id?: string
          rejected_reason?: string | null
          status?: string
        }
        Update: {
          approved_at?: string | null
          approver_id?: string | null
          approver_tier?: string
          cpf?: string
          created_at?: string | null
          email?: string
          employee_id?: string | null
          id?: string
          rejected_reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plan_tasks: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          plan_id: string | null
          prazo: string | null
          responsavel_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          plan_id?: string | null
          prazo?: string | null
          responsavel_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          plan_id?: string | null
          prazo?: string | null
          responsavel_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_plan_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "action_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      action_plans: {
        Row: {
          created_at: string | null
          created_by: string | null
          descricao: string | null
          employee_id: string | null
          id: string
          origem: string | null
          origem_id: string | null
          prazo: string | null
          responsavel_id: string | null
          status: string | null
          titulo: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          employee_id?: string | null
          id?: string
          origem?: string | null
          origem_id?: string | null
          prazo?: string | null
          responsavel_id?: string | null
          status?: string | null
          titulo: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          employee_id?: string | null
          id?: string
          origem?: string | null
          origem_id?: string | null
          prazo?: string | null
          responsavel_id?: string | null
          status?: string | null
          titulo?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_conversations: {
        Row: {
          agent: string
          created_at: string | null
          id: string
          last_activity: string | null
          messages: Json
          operator_id: string | null
          operator_name: string | null
          phone: string
          session_type: string
          status: string | null
        }
        Insert: {
          agent: string
          created_at?: string | null
          id?: string
          last_activity?: string | null
          messages?: Json
          operator_id?: string | null
          operator_name?: string | null
          phone: string
          session_type?: string
          status?: string | null
        }
        Update: {
          agent?: string
          created_at?: string | null
          id?: string
          last_activity?: string | null
          messages?: Json
          operator_id?: string | null
          operator_name?: string | null
          phone?: string
          session_type?: string
          status?: string | null
        }
        Relationships: []
      }
      agent_metrics: {
        Row: {
          agent: string
          cost_usd: number | null
          created_at: string | null
          id: string
          input_tokens: number | null
          intencao: string | null
          latency_ms: number | null
          output_tokens: number | null
          phone_last4: string | null
        }
        Insert: {
          agent: string
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          input_tokens?: number | null
          intencao?: string | null
          latency_ms?: number | null
          output_tokens?: number | null
          phone_last4?: string | null
        }
        Update: {
          agent?: string
          cost_usd?: number | null
          created_at?: string | null
          id?: string
          input_tokens?: number | null
          intencao?: string | null
          latency_ms?: number | null
          output_tokens?: number | null
          phone_last4?: string | null
        }
        Relationships: []
      }
      agent_prompt_versions: {
        Row: {
          agent: string
          ativado_em: string
          ativado_por: string | null
          ativo: boolean
          created_at: string
          id: string
          nota: string | null
          system_prompt: string
          version: string
        }
        Insert: {
          agent: string
          ativado_em?: string
          ativado_por?: string | null
          ativo?: boolean
          created_at?: string
          id?: string
          nota?: string | null
          system_prompt: string
          version: string
        }
        Update: {
          agent?: string
          ativado_em?: string
          ativado_por?: string | null
          ativo?: boolean
          created_at?: string
          id?: string
          nota?: string | null
          system_prompt?: string
          version?: string
        }
        Relationships: []
      }
      agent_runs: {
        Row: {
          agent_name: string
          category: string
          created_at: string | null
          duration_seconds: number | null
          id: string
          output_summary: string | null
          status: string
          triggered_by: string | null
          week_number: number
          year: number
        }
        Insert: {
          agent_name: string
          category: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          output_summary?: string | null
          status?: string
          triggered_by?: string | null
          week_number: number
          year: number
        }
        Update: {
          agent_name?: string
          category?: string
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          output_summary?: string | null
          status?: string
          triggered_by?: string | null
          week_number?: number
          year?: number
        }
        Relationships: []
      }
      attendance_summaries: {
        Row: {
          adicional_noturno_min: number
          cargo: string | null
          created_at: string
          departamento: string | null
          documento_ref: string | null
          employee_id: string | null
          horas_trabalhadas_min: number
          id: string
          nome: string | null
          periodo_fim: string
          periodo_inicio: string
          unit_id: string | null
        }
        Insert: {
          adicional_noturno_min?: number
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          documento_ref?: string | null
          employee_id?: string | null
          horas_trabalhadas_min?: number
          id?: string
          nome?: string | null
          periodo_fim: string
          periodo_inicio: string
          unit_id?: string | null
        }
        Update: {
          adicional_noturno_min?: number
          cargo?: string | null
          created_at?: string
          departamento?: string | null
          documento_ref?: string | null
          employee_id?: string | null
          horas_trabalhadas_min?: number
          id?: string
          nome?: string | null
          periodo_fim?: string
          periodo_inicio?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_summaries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_summaries_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          resource: string
          resource_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          resource: string
          resource_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          resource?: string
          resource_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auditoria_nutricional: {
        Row: {
          criado_em: string | null
          data_inspecao: string
          id: number
          local: string | null
          nota: number | null
          status: string | null
          tipo_inspecao: string | null
        }
        Insert: {
          criado_em?: string | null
          data_inspecao: string
          id?: number
          local?: string | null
          nota?: number | null
          status?: string | null
          tipo_inspecao?: string | null
        }
        Update: {
          criado_em?: string | null
          data_inspecao?: string
          id?: number
          local?: string | null
          nota?: number | null
          status?: string | null
          tipo_inspecao?: string | null
        }
        Relationships: []
      }
      avaliacao_ciclos: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_fim: string
          data_inicio: string
          id: string
          nome: string
          status: string
          template_id: string | null
          unit_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_fim: string
          data_inicio: string
          id?: string
          nome: string
          status?: string
          template_id?: string | null
          unit_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_fim?: string
          data_inicio?: string
          id?: string
          nome?: string
          status?: string
          template_id?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacao_ciclos_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "performance_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacao_ciclos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacao_participantes: {
        Row: {
          avaliado_id: string
          avaliador_id: string
          ciclo_id: string
          id: string
          review_id: string | null
          status: string | null
          tipo_avaliador: string
        }
        Insert: {
          avaliado_id: string
          avaliador_id: string
          ciclo_id: string
          id?: string
          review_id?: string | null
          status?: string | null
          tipo_avaliador: string
        }
        Update: {
          avaliado_id?: string
          avaliador_id?: string
          ciclo_id?: string
          id?: string
          review_id?: string | null
          status?: string | null
          tipo_avaliador?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacao_participantes_avaliado_id_fkey"
            columns: ["avaliado_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacao_participantes_avaliador_id_fkey"
            columns: ["avaliador_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacao_participantes_ciclo_id_fkey"
            columns: ["ciclo_id"]
            isOneToOne: false
            referencedRelation: "avaliacao_ciclos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacao_participantes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_links: {
        Row: {
          brand_id: string
          created_at: string | null
          id: string
          kind: string
          label: string | null
          ordem: number | null
          url: string
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          id?: string
          kind: string
          label?: string | null
          ordem?: number | null
          url: string
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          id?: string
          kind?: string
          label?: string | null
          ordem?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_links_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_links_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
        ]
      }
      brand_targets: {
        Row: {
          brand_id: string
          cmv_meta_pct: number | null
          created_at: string | null
          created_by: string | null
          eventos_meta: number | null
          headcount_meta: number | null
          id: string
          nps_meta: number | null
          periodo: string
          prime_cost_meta_pct: number | null
          receita_meta: number | null
          ticket_medio_meta: number | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          brand_id: string
          cmv_meta_pct?: number | null
          created_at?: string | null
          created_by?: string | null
          eventos_meta?: number | null
          headcount_meta?: number | null
          id?: string
          nps_meta?: number | null
          periodo: string
          prime_cost_meta_pct?: number | null
          receita_meta?: number | null
          ticket_medio_meta?: number | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string
          cmv_meta_pct?: number | null
          created_at?: string | null
          created_by?: string | null
          eventos_meta?: number | null
          headcount_meta?: number | null
          id?: string
          nps_meta?: number | null
          periodo?: string
          prime_cost_meta_pct?: number | null
          receita_meta?: number | null
          ticket_medio_meta?: number | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_targets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brand_targets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "brand_targets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string | null
          group_id: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "brands_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      buckets: {
        Row: {
          created_at: string
          id: string
          name: string
          project_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          project_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buckets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          active: boolean | null
          brand_id: string | null
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          image_url: string | null
          starts_at: string | null
          target: string
          target_value: string | null
          title: string
          unit_id: string | null
        }
        Insert: {
          active?: boolean | null
          brand_id?: string | null
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          starts_at?: string | null
          target?: string
          target_value?: string | null
          title: string
          unit_id?: string | null
        }
        Update: {
          active?: boolean | null
          brand_id?: string | null
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          starts_at?: string | null
          target?: string
          target_value?: string | null
          title?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "campaigns_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_pipeline: {
        Row: {
          candidate_id: string
          created_at: string
          data_agendamento: string | null
          etapa: string
          feedback: string | null
          id: string
          responsavel_id: string | null
          status: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          data_agendamento?: string | null
          etapa: string
          feedback?: string | null
          id?: string
          responsavel_id?: string | null
          status?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          data_agendamento?: string | null
          etapa?: string
          feedback?: string | null
          id?: string
          responsavel_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_pipeline_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_pipeline_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          access_code: string
          area_interesse: string | null
          conversa_id: string | null
          created_at: string | null
          disc_profile: string | null
          email: string | null
          entrevistador_id: string | null
          full_name: string
          id: string
          interview_status: string
          job_opening_id: string | null
          nota_maya: number | null
          observacoes: string | null
          origem: string
          origem_id: string | null
          phone: string | null
          responsavel_id: string | null
          status: string
          unit_id: string | null
          updated_at: string
          welcome_delivery_status: string | null
          welcome_error_code: string | null
          welcome_message_sid: string | null
          welcome_sent_at: string | null
        }
        Insert: {
          access_code?: string
          area_interesse?: string | null
          conversa_id?: string | null
          created_at?: string | null
          disc_profile?: string | null
          email?: string | null
          entrevistador_id?: string | null
          full_name: string
          id?: string
          interview_status?: string
          job_opening_id?: string | null
          nota_maya?: number | null
          observacoes?: string | null
          origem?: string
          origem_id?: string | null
          phone?: string | null
          responsavel_id?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
          welcome_delivery_status?: string | null
          welcome_error_code?: string | null
          welcome_message_sid?: string | null
          welcome_sent_at?: string | null
        }
        Update: {
          access_code?: string
          area_interesse?: string | null
          conversa_id?: string | null
          created_at?: string | null
          disc_profile?: string | null
          email?: string | null
          entrevistador_id?: string | null
          full_name?: string
          id?: string
          interview_status?: string
          job_opening_id?: string | null
          nota_maya?: number | null
          observacoes?: string | null
          origem?: string
          origem_id?: string | null
          phone?: string | null
          responsavel_id?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
          welcome_delivery_status?: string | null
          welcome_error_code?: string | null
          welcome_message_sid?: string | null
          welcome_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_entrevistador_id_fkey"
            columns: ["entrevistador_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_job_opening_id_fkey"
            columns: ["job_opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_job_opening_id_fkey"
            columns: ["job_opening_id"]
            isOneToOne: false
            referencedRelation: "v_vagas_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_origem_id_fkey"
            columns: ["origem_id"]
            isOneToOne: false
            referencedRelation: "origens_candidato"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      candidatos_maya: {
        Row: {
          area_interesse: string | null
          cargo_interesse: string | null
          created_at: string | null
          id: string
          nome: string
          source: string
          status: string
          telefone: string
          updated_at: string | null
        }
        Insert: {
          area_interesse?: string | null
          cargo_interesse?: string | null
          created_at?: string | null
          id?: string
          nome: string
          source?: string
          status?: string
          telefone: string
          updated_at?: string | null
        }
        Update: {
          area_interesse?: string | null
          cargo_interesse?: string | null
          created_at?: string | null
          id?: string
          nome?: string
          source?: string
          status?: string
          telefone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cargo_grupos: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          nome: string
          sla_dias_uteis: number
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          sla_dias_uteis: number
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          sla_dias_uteis?: number
        }
        Relationships: []
      }
      cct_versions: {
        Row: {
          adicional_noturno_pct: number | null
          ativo: boolean | null
          created_at: string | null
          dados_completos: Json | null
          dsr_sobre_gorjeta: boolean | null
          gorjeta_percentual: number | null
          hora_extra_100_pct: number | null
          hora_extra_50_pct: number | null
          id: string
          piso_salarial: number | null
          sindicato: string
          vigencia_fim: string
          vigencia_inicio: string
        }
        Insert: {
          adicional_noturno_pct?: number | null
          ativo?: boolean | null
          created_at?: string | null
          dados_completos?: Json | null
          dsr_sobre_gorjeta?: boolean | null
          gorjeta_percentual?: number | null
          hora_extra_100_pct?: number | null
          hora_extra_50_pct?: number | null
          id?: string
          piso_salarial?: number | null
          sindicato: string
          vigencia_fim: string
          vigencia_inicio: string
        }
        Update: {
          adicional_noturno_pct?: number | null
          ativo?: boolean | null
          created_at?: string | null
          dados_completos?: Json | null
          dsr_sobre_gorjeta?: boolean | null
          gorjeta_percentual?: number | null
          hora_extra_100_pct?: number | null
          hora_extra_50_pct?: number | null
          id?: string
          piso_salarial?: number | null
          sindicato?: string
          vigencia_fim?: string
          vigencia_inicio?: string
        }
        Relationships: []
      }
      checklist_records: {
        Row: {
          checklist_id: string
          created_at: string
          data: string
          id: string
          observacoes: string | null
          responsavel_id: string | null
          respostas: Json
          score_pct: number | null
          turno: Database["public"]["Enums"]["checklist_turno"]
          unit_id: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          data?: string
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          respostas?: Json
          score_pct?: number | null
          turno: Database["public"]["Enums"]["checklist_turno"]
          unit_id: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          data?: string
          id?: string
          observacoes?: string | null
          responsavel_id?: string | null
          respostas?: Json
          score_pct?: number | null
          turno?: Database["public"]["Enums"]["checklist_turno"]
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_records_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "quality_checklists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_records_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      client_interactions: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string | null
          data: string
          descricao: string | null
          id: string
          tipo: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by?: string | null
          data?: string
          descricao?: string | null
          id?: string
          tipo: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          data?: string
          descricao?: string | null
          id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          ativo: boolean | null
          brand_id: string
          created_at: string | null
          created_by: string | null
          email: string | null
          empresa: string | null
          id: string
          nome: string
          observacoes: string | null
          origem: string | null
          telefone: string | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          brand_id: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          origem?: string | null
          telefone?: string | null
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          brand_id?: string
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          origem?: string | null
          telefone?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "clients_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_questions: {
        Row: {
          created_at: string | null
          id: string
          ordem: number
          survey_id: string
          texto: string
          tipo: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          ordem?: number
          survey_id: string
          texto: string
          tipo?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          ordem?: number
          survey_id?: string
          texto?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "climate_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "climate_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_responses: {
        Row: {
          employee_id: string
          id: string
          question_id: string
          respondido_em: string | null
          survey_id: string
          texto_livre: string | null
          valor_escala: number | null
        }
        Insert: {
          employee_id: string
          id?: string
          question_id: string
          respondido_em?: string | null
          survey_id: string
          texto_livre?: string | null
          valor_escala?: number | null
        }
        Update: {
          employee_id?: string
          id?: string
          question_id?: string
          respondido_em?: string | null
          survey_id?: string
          texto_livre?: string | null
          valor_escala?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "climate_responses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "climate_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "climate_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "climate_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "climate_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_survey_questions: {
        Row: {
          created_at: string | null
          id: string
          opcoes: Json | null
          ordem: number | null
          pergunta: string
          survey_id: string | null
          tipo: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          opcoes?: Json | null
          ordem?: number | null
          pergunta: string
          survey_id?: string | null
          tipo?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          opcoes?: Json | null
          ordem?: number | null
          pergunta?: string
          survey_id?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "climate_survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "climate_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_survey_responses: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          nota: number | null
          question_id: string | null
          resposta: string | null
          survey_id: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          nota?: number | null
          question_id?: string | null
          resposta?: string | null
          survey_id?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          nota?: number | null
          question_id?: string | null
          resposta?: string | null
          survey_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "climate_survey_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "climate_survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "climate_survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "climate_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_surveys: {
        Row: {
          anonimo: boolean | null
          created_at: string | null
          created_by: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          status: string | null
          titulo: string
          unit_id: string | null
        }
        Insert: {
          anonimo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          status?: string | null
          titulo: string
          unit_id?: string | null
        }
        Update: {
          anonimo?: boolean | null
          created_at?: string | null
          created_by?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          status?: string | null
          titulo?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "climate_surveys_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          member_id: string
          task_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          member_id: string
          task_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          member_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      Comments: {
        Row: {
          content: string
          created_at: string
          id: string
          member_id: string
          task_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          member_id: string
          task_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          member_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Comments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "Team_Members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "Tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos_kph: {
        Row: {
          agentes_usados: string[] | null
          area_interesse: string | null
          candidate_id: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          nome: string | null
          primeiro_contato: string | null
          telefone: string
          tipo: string | null
          total_conversas: number | null
          ultimo_contato: string | null
          updated_at: string | null
        }
        Insert: {
          agentes_usados?: string[] | null
          area_interesse?: string | null
          candidate_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          nome?: string | null
          primeiro_contato?: string | null
          telefone: string
          tipo?: string | null
          total_conversas?: number | null
          ultimo_contato?: string | null
          updated_at?: string | null
        }
        Update: {
          agentes_usados?: string[] | null
          area_interesse?: string | null
          candidate_id?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          nome?: string | null
          primeiro_contato?: string | null
          telefone?: string
          tipo?: string | null
          total_conversas?: number | null
          ultimo_contato?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contatos_kph_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contatos_kph_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_payments: {
        Row: {
          competencia: string
          contractor_id: string | null
          created_at: string | null
          desconto: number | null
          gorjeta_1q: number | null
          gorjeta_2q: number | null
          id: string
          observacao: string | null
          pgto_15: number | null
          pgto_30: number | null
          unit_id: string | null
          valor_bruto: number | null
          valor_cash: number | null
          valor_nota: number | null
        }
        Insert: {
          competencia: string
          contractor_id?: string | null
          created_at?: string | null
          desconto?: number | null
          gorjeta_1q?: number | null
          gorjeta_2q?: number | null
          id?: string
          observacao?: string | null
          pgto_15?: number | null
          pgto_30?: number | null
          unit_id?: string | null
          valor_bruto?: number | null
          valor_cash?: number | null
          valor_nota?: number | null
        }
        Update: {
          competencia?: string
          contractor_id?: string | null
          created_at?: string | null
          desconto?: number | null
          gorjeta_1q?: number | null
          gorjeta_2q?: number | null
          id?: string
          observacao?: string | null
          pgto_15?: number | null
          pgto_30?: number | null
          unit_id?: string | null
          valor_bruto?: number | null
          valor_cash?: number | null
          valor_nota?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_payments_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_payments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_vacations: {
        Row: {
          contractor_id: string | null
          created_at: string | null
          data_inicio: string | null
          data_termino: string | null
          id: string
          observacao: string | null
          total_dias: number | null
          unit_id: string | null
        }
        Insert: {
          contractor_id?: string | null
          created_at?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          id?: string
          observacao?: string | null
          total_dias?: number | null
          unit_id?: string | null
        }
        Update: {
          contractor_id?: string | null
          created_at?: string | null
          data_inicio?: string | null
          data_termino?: string | null
          id?: string
          observacao?: string | null
          total_dias?: number | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_vacations_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_vacations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          agencia: string | null
          ativo: boolean | null
          banco: string | null
          banco_codigo: string | null
          cnpj: string | null
          conta: string | null
          cpf_responsavel: string | null
          created_at: string | null
          data_fim_contrato: string | null
          data_inicio_contrato: string | null
          data_nascimento_responsavel: string | null
          email: string | null
          endereco: string | null
          id: string
          observacao: string | null
          responsavel: string
          setor: string | null
          telefone: string | null
          unit_id: string | null
          valor_mensal: number | null
          valor_nota: number | null
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean | null
          banco?: string | null
          banco_codigo?: string | null
          cnpj?: string | null
          conta?: string | null
          cpf_responsavel?: string | null
          created_at?: string | null
          data_fim_contrato?: string | null
          data_inicio_contrato?: string | null
          data_nascimento_responsavel?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          observacao?: string | null
          responsavel: string
          setor?: string | null
          telefone?: string | null
          unit_id?: string | null
          valor_mensal?: number | null
          valor_nota?: number | null
        }
        Update: {
          agencia?: string | null
          ativo?: boolean | null
          banco?: string | null
          banco_codigo?: string | null
          cnpj?: string | null
          conta?: string | null
          cpf_responsavel?: string | null
          created_at?: string | null
          data_fim_contrato?: string | null
          data_inicio_contrato?: string | null
          data_nascimento_responsavel?: string | null
          email?: string | null
          endereco?: string | null
          id?: string
          observacao?: string | null
          responsavel?: string
          setor?: string | null
          telefone?: string | null
          unit_id?: string | null
          valor_mensal?: number | null
          valor_nota?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contractors_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      contratos: {
        Row: {
          aviso_previo_dias: number | null
          categoria: string
          contraparte: string
          contraparte_doc: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          data_proximo_reajuste: string | null
          id: string
          indice_reajuste: string | null
          multa_rescisoria: string | null
          observacoes: string | null
          recorrencia: string | null
          renovacao_automatica: boolean | null
          responsavel: string | null
          status_manual: string | null
          tags: string[] | null
          titulo: string
          unit_id: string | null
          updated_at: string | null
          valor: number | null
          vigencia_indeterminada: boolean | null
        }
        Insert: {
          aviso_previo_dias?: number | null
          categoria: string
          contraparte: string
          contraparte_doc?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          data_proximo_reajuste?: string | null
          id?: string
          indice_reajuste?: string | null
          multa_rescisoria?: string | null
          observacoes?: string | null
          recorrencia?: string | null
          renovacao_automatica?: boolean | null
          responsavel?: string | null
          status_manual?: string | null
          tags?: string[] | null
          titulo: string
          unit_id?: string | null
          updated_at?: string | null
          valor?: number | null
          vigencia_indeterminada?: boolean | null
        }
        Update: {
          aviso_previo_dias?: number | null
          categoria?: string
          contraparte?: string
          contraparte_doc?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          data_proximo_reajuste?: string | null
          id?: string
          indice_reajuste?: string | null
          multa_rescisoria?: string | null
          observacoes?: string | null
          recorrencia?: string | null
          renovacao_automatica?: boolean | null
          responsavel?: string | null
          status_manual?: string | null
          tags?: string[] | null
          titulo?: string
          unit_id?: string | null
          updated_at?: string | null
          valor?: number | null
          vigencia_indeterminada?: boolean | null
        }
        Relationships: []
      }
      contratos_arquivos: {
        Row: {
          content_type: string | null
          contrato_id: string
          id: string
          nome: string
          storage_path: string
          tamanho_bytes: number | null
          tipo: string
          uploaded_at: string | null
        }
        Insert: {
          content_type?: string | null
          contrato_id: string
          id?: string
          nome: string
          storage_path: string
          tamanho_bytes?: number | null
          tipo?: string
          uploaded_at?: string | null
        }
        Update: {
          content_type?: string | null
          contrato_id?: string
          id?: string
          nome?: string
          storage_path?: string
          tamanho_bytes?: number | null
          tipo?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contratos_arquivos_contrato_id_fkey"
            columns: ["contrato_id"]
            isOneToOne: false
            referencedRelation: "contratos"
            referencedColumns: ["id"]
          },
        ]
      }
      dependents: {
        Row: {
          cpf: string | null
          created_at: string | null
          data_nascimento: string | null
          employee_id: string
          id: string
          nome: string
          ordem: number | null
          parentesco: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          employee_id: string
          id?: string
          nome: string
          ordem?: number | null
          parentesco: string
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          data_nascimento?: string | null
          employee_id?: string
          id?: string
          nome?: string
          ordem?: number | null
          parentesco?: string
        }
        Relationships: [
          {
            foreignKeyName: "dependents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      dho_tracking: {
        Row: {
          competencia: string | null
          created_at: string | null
          descricao: string | null
          employee_id: string | null
          id: string
          nome: string | null
          score: number | null
          tipo: string | null
          unit_id: string | null
        }
        Insert: {
          competencia?: string | null
          created_at?: string | null
          descricao?: string | null
          employee_id?: string | null
          id?: string
          nome?: string | null
          score?: number | null
          tipo?: string | null
          unit_id?: string | null
        }
        Update: {
          competencia?: string | null
          created_at?: string | null
          descricao?: string | null
          employee_id?: string | null
          id?: string
          nome?: string | null
          score?: number | null
          tipo?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dho_tracking_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dho_tracking_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      disc_profiles: {
        Row: {
          created_at: string | null
          data_avaliacao: string | null
          descricao: string | null
          documento_ref: string | null
          employee_id: string | null
          id: string
          nome: string | null
          perfil: string | null
        }
        Insert: {
          created_at?: string | null
          data_avaliacao?: string | null
          descricao?: string | null
          documento_ref?: string | null
          employee_id?: string | null
          id?: string
          nome?: string | null
          perfil?: string | null
        }
        Update: {
          created_at?: string | null
          data_avaliacao?: string | null
          descricao?: string | null
          documento_ref?: string | null
          employee_id?: string | null
          id?: string
          nome?: string | null
          perfil?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disc_profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_actions: {
        Row: {
          created_at: string | null
          data: string | null
          documento_ref: string | null
          employee_id: string | null
          id: string
          motivo: string | null
          nome: string | null
          tipo: string | null
          unit_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: string | null
          documento_ref?: string | null
          employee_id?: string | null
          id?: string
          motivo?: string | null
          nome?: string | null
          tipo?: string | null
          unit_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string | null
          documento_ref?: string | null
          employee_id?: string | null
          id?: string
          motivo?: string | null
          nome?: string | null
          tipo?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_actions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_actions_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          id: string
          nome: string
          tipo: string | null
          unidade: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome: string
          tipo?: string | null
          unidade?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          id?: string
          nome?: string
          tipo?: string | null
          unidade?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          employee_id: string | null
          id: string
          name: string
          notes: string | null
          storage_path: string
          type: string
          unit_id: string | null
          uploaded_at: string | null
        }
        Insert: {
          employee_id?: string | null
          id?: string
          name: string
          notes?: string | null
          storage_path: string
          type?: string
          unit_id?: string | null
          uploaded_at?: string | null
        }
        Update: {
          employee_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          storage_path?: string
          type?: string
          unit_id?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      dre_contratos_fixos: {
        Row: {
          codigo_contabil: string | null
          descricao: string | null
          id: number
          razao_social: string
          tipo: string | null
          unit_id: string | null
          valor_mensal: number
        }
        Insert: {
          codigo_contabil?: string | null
          descricao?: string | null
          id?: number
          razao_social: string
          tipo?: string | null
          unit_id?: string | null
          valor_mensal: number
        }
        Update: {
          codigo_contabil?: string | null
          descricao?: string | null
          id?: number
          razao_social?: string
          tipo?: string | null
          unit_id?: string | null
          valor_mensal?: number
        }
        Relationships: []
      }
      dre_despesa_detalhada: {
        Row: {
          categoria: string | null
          classificacao_dre: string | null
          criado_em: string | null
          data_competencia: string | null
          descricao: string | null
          id: number
          mes_ano: string
          tipo_despesa: string | null
          unit_id: string | null
          valor: number
        }
        Insert: {
          categoria?: string | null
          classificacao_dre?: string | null
          criado_em?: string | null
          data_competencia?: string | null
          descricao?: string | null
          id?: number
          mes_ano: string
          tipo_despesa?: string | null
          unit_id?: string | null
          valor: number
        }
        Update: {
          categoria?: string | null
          classificacao_dre?: string | null
          criado_em?: string | null
          data_competencia?: string | null
          descricao?: string | null
          id?: number
          mes_ano?: string
          tipo_despesa?: string | null
          unit_id?: string | null
          valor?: number
        }
        Relationships: []
      }
      dre_faturamento_historico: {
        Row: {
          categoria: string
          clientes_bd: number | null
          criado_em: string | null
          id: number
          mes_num: number
          rec_2022: number | null
          rec_2023: number | null
          rec_2024: number | null
          rec_2025: number | null
          rec_2026_bd: number | null
          ticket_bd: number | null
          unit_id: string | null
        }
        Insert: {
          categoria: string
          clientes_bd?: number | null
          criado_em?: string | null
          id?: number
          mes_num: number
          rec_2022?: number | null
          rec_2023?: number | null
          rec_2024?: number | null
          rec_2025?: number | null
          rec_2026_bd?: number | null
          ticket_bd?: number | null
          unit_id?: string | null
        }
        Update: {
          categoria?: string
          clientes_bd?: number | null
          criado_em?: string | null
          id?: number
          mes_num?: number
          rec_2022?: number | null
          rec_2023?: number | null
          rec_2024?: number | null
          rec_2025?: number | null
          rec_2026_bd?: number | null
          ticket_bd?: number | null
          unit_id?: string | null
        }
        Relationships: []
      }
      dre_folha: {
        Row: {
          admissao: string | null
          competencia: string | null
          criado_em: string | null
          custo_total: number
          divisao: string
          funcao: string
          id: number
          is_vaga: boolean
          nome: string | null
          salario: number
          tipo: string
          unit_id: string | null
        }
        Insert: {
          admissao?: string | null
          competencia?: string | null
          criado_em?: string | null
          custo_total: number
          divisao: string
          funcao: string
          id?: number
          is_vaga?: boolean
          nome?: string | null
          salario: number
          tipo: string
          unit_id?: string | null
        }
        Update: {
          admissao?: string | null
          competencia?: string | null
          criado_em?: string | null
          custo_total?: number
          divisao?: string
          funcao?: string
          id?: number
          is_vaga?: boolean
          nome?: string | null
          salario?: number
          tipo?: string
          unit_id?: string | null
        }
        Relationships: []
      }
      dre_gorjeta_mensal: {
        Row: {
          criado_em: string | null
          decimo_terceiro: number | null
          encargos_total: number | null
          ferias: number | null
          fgts: number | null
          gorjeta_paga: number | null
          gorjeta_recebida: number | null
          id: number
          inss: number | null
          mes_ano: string
          retencao: number | null
          unit_id: string | null
        }
        Insert: {
          criado_em?: string | null
          decimo_terceiro?: number | null
          encargos_total?: number | null
          ferias?: number | null
          fgts?: number | null
          gorjeta_paga?: number | null
          gorjeta_recebida?: number | null
          id?: number
          inss?: number | null
          mes_ano: string
          retencao?: number | null
          unit_id?: string | null
        }
        Update: {
          criado_em?: string | null
          decimo_terceiro?: number | null
          encargos_total?: number | null
          ferias?: number | null
          fgts?: number | null
          gorjeta_paga?: number | null
          gorjeta_recebida?: number | null
          id?: number
          inss?: number | null
          mes_ano?: string
          retencao?: number | null
          unit_id?: string | null
        }
        Relationships: []
      }
      dre_indicadores: {
        Row: {
          criado_em: string | null
          id: number
          indicador: string
          mes_ano: string
          tipo: string
          unit_id: string | null
          valor: number | null
        }
        Insert: {
          criado_em?: string | null
          id?: number
          indicador: string
          mes_ano: string
          tipo: string
          unit_id?: string | null
          valor?: number | null
        }
        Update: {
          criado_em?: string | null
          id?: number
          indicador?: string
          mes_ano?: string
          tipo?: string
          unit_id?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      dre_kpis_mensais: {
        Row: {
          clientes: number | null
          cofins: number | null
          gorjetas_recebidas: number | null
          icms: number | null
          iss: number | null
          mes_ano: string
          pis: number | null
          ticket_medio: number | null
          unit_id: string
        }
        Insert: {
          clientes?: number | null
          cofins?: number | null
          gorjetas_recebidas?: number | null
          icms?: number | null
          iss?: number | null
          mes_ano: string
          pis?: number | null
          ticket_medio?: number | null
          unit_id: string
        }
        Update: {
          clientes?: number | null
          cofins?: number | null
          gorjetas_recebidas?: number | null
          icms?: number | null
          iss?: number | null
          mes_ano?: string
          pis?: number | null
          ticket_medio?: number | null
          unit_id?: string
        }
        Relationships: []
      }
      dre_linhas_detalhadas: {
        Row: {
          av_percentual: number | null
          conta: string | null
          criado_em: string | null
          custo_tipo: string | null
          descricao: string
          grupo: string
          id: number
          mes_ano: string
          tipo: string
          unit_id: string | null
          valor: number | null
        }
        Insert: {
          av_percentual?: number | null
          conta?: string | null
          criado_em?: string | null
          custo_tipo?: string | null
          descricao: string
          grupo: string
          id?: number
          mes_ano: string
          tipo: string
          unit_id?: string | null
          valor?: number | null
        }
        Update: {
          av_percentual?: number | null
          conta?: string | null
          criado_em?: string | null
          custo_tipo?: string | null
          descricao?: string
          grupo?: string
          id?: number
          mes_ano?: string
          tipo?: string
          unit_id?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      dre_manutencao_detalhada: {
        Row: {
          categoria: string
          fornecedor: string
          id: number
          mes_ano: string | null
          unit_id: string | null
          valor: number
        }
        Insert: {
          categoria: string
          fornecedor: string
          id?: number
          mes_ano?: string | null
          unit_id?: string | null
          valor: number
        }
        Update: {
          categoria?: string
          fornecedor?: string
          id?: number
          mes_ano?: string | null
          unit_id?: string | null
          valor?: number
        }
        Relationships: []
      }
      dre_mensal: {
        Row: {
          administrativa: number | null
          clientes: number | null
          cmv: number | null
          criado_em: string | null
          ebitda: number | null
          id: number
          impostos: number | null
          manutencao: number | null
          marketing: number | null
          mes_ano: string
          ocupacao: number | null
          operacao: number | null
          pessoal: number | null
          receita_bruta: number | null
          resultado_liquido: number | null
          taxa_cartao: number | null
          ticket_medio: number | null
          tipo: string
          unit_id: string | null
          utilidades: number | null
        }
        Insert: {
          administrativa?: number | null
          clientes?: number | null
          cmv?: number | null
          criado_em?: string | null
          ebitda?: number | null
          id?: number
          impostos?: number | null
          manutencao?: number | null
          marketing?: number | null
          mes_ano: string
          ocupacao?: number | null
          operacao?: number | null
          pessoal?: number | null
          receita_bruta?: number | null
          resultado_liquido?: number | null
          taxa_cartao?: number | null
          ticket_medio?: number | null
          tipo: string
          unit_id?: string | null
          utilidades?: number | null
        }
        Update: {
          administrativa?: number | null
          clientes?: number | null
          cmv?: number | null
          criado_em?: string | null
          ebitda?: number | null
          id?: number
          impostos?: number | null
          manutencao?: number | null
          marketing?: number | null
          mes_ano?: string
          ocupacao?: number | null
          operacao?: number | null
          pessoal?: number | null
          receita_bruta?: number | null
          resultado_liquido?: number | null
          taxa_cartao?: number | null
          ticket_medio?: number | null
          tipo?: string
          unit_id?: string | null
          utilidades?: number | null
        }
        Relationships: []
      }
      dre_pessoal_detalhado: {
        Row: {
          categoria: string
          id: number
          mes_ano: string
          unit_id: string | null
          valor: number | null
        }
        Insert: {
          categoria: string
          id?: number
          mes_ano: string
          unit_id?: string | null
          valor?: number | null
        }
        Update: {
          categoria?: string
          id?: number
          mes_ano?: string
          unit_id?: string | null
          valor?: number | null
        }
        Relationships: []
      }
      dre_prestadores: {
        Row: {
          grupo: string
          id: number
          mes_ano: string
          nome: string
          unit_id: string | null
          valor: number
        }
        Insert: {
          grupo: string
          id?: number
          mes_ano: string
          nome: string
          unit_id?: string | null
          valor: number
        }
        Update: {
          grupo?: string
          id?: number
          mes_ano?: string
          nome?: string
          unit_id?: string | null
          valor?: number
        }
        Relationships: []
      }
      dre_receita_detalhada: {
        Row: {
          bandeira: string
          classificacao: string
          criado_em: string | null
          grupo: string
          id: number
          mes_ano: string
          unit_id: string | null
          valor: number
        }
        Insert: {
          bandeira: string
          classificacao: string
          criado_em?: string | null
          grupo: string
          id?: number
          mes_ano: string
          unit_id?: string | null
          valor: number
        }
        Update: {
          bandeira?: string
          classificacao?: string
          criado_em?: string | null
          grupo?: string
          id?: number
          mes_ano?: string
          unit_id?: string | null
          valor?: number
        }
        Relationships: []
      }
      employee_auth: {
        Row: {
          cpf: string
          created_at: string | null
          employee_id: string
          id: string
          is_active: boolean
          last_login: string | null
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          cpf: string
          created_at?: string | null
          employee_id: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          cpf?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_auth_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_availability: {
        Row: {
          created_at: string
          data: string
          disponivel: boolean
          employee_id: string
          id: string
          motivo: string | null
          unit_id: string
        }
        Insert: {
          created_at?: string
          data: string
          disponivel?: boolean
          employee_id: string
          id?: string
          motivo?: string | null
          unit_id: string
        }
        Update: {
          created_at?: string
          data?: string
          disponivel?: boolean
          employee_id?: string
          id?: string
          motivo?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_availability_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_availability_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_benefits: {
        Row: {
          competencia: string | null
          created_at: string | null
          detalhes: Json | null
          employee_id: string | null
          id: string
          tipo: string | null
          unit_id: string | null
          valor: number | null
        }
        Insert: {
          competencia?: string | null
          created_at?: string | null
          detalhes?: Json | null
          employee_id?: string | null
          id?: string
          tipo?: string | null
          unit_id?: string | null
          valor?: number | null
        }
        Update: {
          competencia?: string | null
          created_at?: string | null
          detalhes?: Json | null
          employee_id?: string | null
          id?: string
          tipo?: string | null
          unit_id?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_benefits_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string | null
          data_emissao: string | null
          data_validade: string | null
          descricao: string | null
          employee_id: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          nome: string
          observacoes: string | null
          tipo: string
          updated_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          data_emissao?: string | null
          data_validade?: string | null
          descricao?: string | null
          employee_id: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          nome: string
          observacoes?: string | null
          tipo: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          data_emissao?: string | null
          data_validade?: string | null
          descricao?: string | null
          employee_id?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          nome?: string
          observacoes?: string | null
          tipo?: string
          updated_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          agencia: string | null
          ativo: boolean | null
          bairro: string | null
          banco: string | null
          cep: string | null
          cidade: string | null
          cidade_nascimento: string | null
          complemento: string | null
          conta: string | null
          contato_emergencia_nome: string | null
          contato_emergencia_tel: string | null
          cpf: string | null
          created_at: string | null
          ctps: string | null
          ctps_expedicao: string | null
          ctps_serie: string | null
          ctps_uf: string | null
          data_admissao: string
          data_demissao: string | null
          data_nascimento: string | null
          departamento: string | null
          email: string | null
          employee_code: string | null
          escolaridade: string | null
          esocial_code: string | null
          estado: string | null
          estado_civil: string | null
          funcao: string
          genero: string | null
          id: string
          jornada: string | null
          manager_id: string | null
          mise_ativo: boolean | null
          nome: string
          nome_mae: string | null
          nome_pai: string | null
          nome_social: string | null
          numero: string | null
          observacao: string | null
          pais_nascimento: string | null
          photo_url: string | null
          pis: string | null
          pix: string | null
          push_token: string | null
          push_token_updated_at: string | null
          raca: string | null
          reservista: string | null
          rg: string | null
          rg_orgao: string | null
          rg_uf: string | null
          rne: string | null
          rne_expedicao: string | null
          rne_orgao: string | null
          role_id: string | null
          rua: string | null
          salario_base: number
          score: number
          secao_eleitoral: string | null
          sobrenome: string
          status_rh: string | null
          telefone: string | null
          tier: string | null
          tipo_conta: string | null
          tipo_contrato: string | null
          titulo_eleitor: string | null
          uf_nascimento: string | null
          unit_id: string
          updated_at: string | null
          user_id: string | null
          zona_eleitoral: string | null
        }
        Insert: {
          agencia?: string | null
          ativo?: boolean | null
          bairro?: string | null
          banco?: string | null
          cep?: string | null
          cidade?: string | null
          cidade_nascimento?: string | null
          complemento?: string | null
          conta?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_tel?: string | null
          cpf?: string | null
          created_at?: string | null
          ctps?: string | null
          ctps_expedicao?: string | null
          ctps_serie?: string | null
          ctps_uf?: string | null
          data_admissao: string
          data_demissao?: string | null
          data_nascimento?: string | null
          departamento?: string | null
          email?: string | null
          employee_code?: string | null
          escolaridade?: string | null
          esocial_code?: string | null
          estado?: string | null
          estado_civil?: string | null
          funcao: string
          genero?: string | null
          id?: string
          jornada?: string | null
          manager_id?: string | null
          mise_ativo?: boolean | null
          nome: string
          nome_mae?: string | null
          nome_pai?: string | null
          nome_social?: string | null
          numero?: string | null
          observacao?: string | null
          pais_nascimento?: string | null
          photo_url?: string | null
          pis?: string | null
          pix?: string | null
          push_token?: string | null
          push_token_updated_at?: string | null
          raca?: string | null
          reservista?: string | null
          rg?: string | null
          rg_orgao?: string | null
          rg_uf?: string | null
          rne?: string | null
          rne_expedicao?: string | null
          rne_orgao?: string | null
          role_id?: string | null
          rua?: string | null
          salario_base?: number
          score?: number
          secao_eleitoral?: string | null
          sobrenome: string
          status_rh?: string | null
          telefone?: string | null
          tier?: string | null
          tipo_conta?: string | null
          tipo_contrato?: string | null
          titulo_eleitor?: string | null
          uf_nascimento?: string | null
          unit_id: string
          updated_at?: string | null
          user_id?: string | null
          zona_eleitoral?: string | null
        }
        Update: {
          agencia?: string | null
          ativo?: boolean | null
          bairro?: string | null
          banco?: string | null
          cep?: string | null
          cidade?: string | null
          cidade_nascimento?: string | null
          complemento?: string | null
          conta?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_tel?: string | null
          cpf?: string | null
          created_at?: string | null
          ctps?: string | null
          ctps_expedicao?: string | null
          ctps_serie?: string | null
          ctps_uf?: string | null
          data_admissao?: string
          data_demissao?: string | null
          data_nascimento?: string | null
          departamento?: string | null
          email?: string | null
          employee_code?: string | null
          escolaridade?: string | null
          esocial_code?: string | null
          estado?: string | null
          estado_civil?: string | null
          funcao?: string
          genero?: string | null
          id?: string
          jornada?: string | null
          manager_id?: string | null
          mise_ativo?: boolean | null
          nome?: string
          nome_mae?: string | null
          nome_pai?: string | null
          nome_social?: string | null
          numero?: string | null
          observacao?: string | null
          pais_nascimento?: string | null
          photo_url?: string | null
          pis?: string | null
          pix?: string | null
          push_token?: string | null
          push_token_updated_at?: string | null
          raca?: string | null
          reservista?: string | null
          rg?: string | null
          rg_orgao?: string | null
          rg_uf?: string | null
          rne?: string | null
          rne_expedicao?: string | null
          rne_orgao?: string | null
          role_id?: string | null
          rua?: string | null
          salario_base?: number
          score?: number
          secao_eleitoral?: string | null
          sobrenome?: string
          status_rh?: string | null
          telefone?: string | null
          tier?: string | null
          tipo_conta?: string | null
          tipo_contrato?: string | null
          titulo_eleitor?: string | null
          uf_nascimento?: string | null
          unit_id?: string
          updated_at?: string | null
          user_id?: string | null
          zona_eleitoral?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attachments: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          nome: string
          storage_path: string
          tamanho_bytes: number | null
          tipo: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          nome: string
          storage_path: string
          tamanho_bytes?: number | null
          tipo?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          nome?: string
          storage_path?: string
          tamanho_bytes?: number | null
          tipo?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_attachments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attachments_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_proximos_eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      event_infra_items: {
        Row: {
          categoria: string
          created_at: string | null
          event_id: string
          id: string
          item: string
          observacoes: string | null
          quantidade: number | null
          responsavel: string | null
          sort_order: number | null
          status: string | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          event_id: string
          id?: string
          item: string
          observacoes?: string | null
          quantidade?: number | null
          responsavel?: string | null
          sort_order?: number | null
          status?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          event_id?: string
          id?: string
          item?: string
          observacoes?: string | null
          quantidade?: number | null
          responsavel?: string | null
          sort_order?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_infra_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_infra_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_proximos_eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      event_menu_items: {
        Row: {
          categoria: Database["public"]["Enums"]["menu_item_category"]
          created_at: string | null
          descricao: string | null
          event_id: string
          id: string
          nome: string
          observacoes: string | null
          preco_unitario: number | null
          quantidade: number | null
          sort_order: number | null
          unidade: string | null
        }
        Insert: {
          categoria: Database["public"]["Enums"]["menu_item_category"]
          created_at?: string | null
          descricao?: string | null
          event_id: string
          id?: string
          nome: string
          observacoes?: string | null
          preco_unitario?: number | null
          quantidade?: number | null
          sort_order?: number | null
          unidade?: string | null
        }
        Update: {
          categoria?: Database["public"]["Enums"]["menu_item_category"]
          created_at?: string | null
          descricao?: string | null
          event_id?: string
          id?: string
          nome?: string
          observacoes?: string | null
          preco_unitario?: number | null
          quantidade?: number | null
          sort_order?: number | null
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_menu_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_menu_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_proximos_eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      event_staff: {
        Row: {
          confirmado: boolean | null
          created_at: string | null
          employee_id: string | null
          event_id: string
          funcao: string
          horario_entrada: string | null
          horario_saida: string | null
          id: string
          nome_externo: string | null
          observacoes: string | null
        }
        Insert: {
          confirmado?: boolean | null
          created_at?: string | null
          employee_id?: string | null
          event_id: string
          funcao: string
          horario_entrada?: string | null
          horario_saida?: string | null
          id?: string
          nome_externo?: string | null
          observacoes?: string | null
        }
        Update: {
          confirmado?: boolean | null
          created_at?: string | null
          employee_id?: string | null
          event_id?: string
          funcao?: string
          horario_entrada?: string | null
          horario_saida?: string | null
          id?: string
          nome_externo?: string | null
          observacoes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_staff_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_staff_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_proximos_eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      event_status_log: {
        Row: {
          changed_by: string | null
          created_at: string | null
          event_id: string
          id: string
          motivo: string | null
          status_anterior: Database["public"]["Enums"]["event_status"] | null
          status_novo: Database["public"]["Enums"]["event_status"]
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          motivo?: string | null
          status_anterior?: Database["public"]["Enums"]["event_status"] | null
          status_novo: Database["public"]["Enums"]["event_status"]
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          motivo?: string | null
          status_anterior?: Database["public"]["Enums"]["event_status"] | null
          status_novo?: Database["public"]["Enums"]["event_status"]
        }
        Relationships: [
          {
            foreignKeyName: "event_status_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_status_log_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "v_proximos_eventos"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          acesso_entrada: string | null
          acesso_obs: string | null
          ambulancia: string | null
          approved_at: string | null
          approved_by: string | null
          artistico: string | null
          brand_id: string
          briefing_cliente: string | null
          brigada: Json | null
          campo_livre: string | null
          contato_cliente: string | null
          created_at: string | null
          created_by: string | null
          criado_por: string | null
          data_fim: string | null
          data_inicio: string
          email_cliente: string | null
          empresa_cliente: string | null
          espacos: string | null
          fotografia: string | null
          gerador: string | null
          group_id: string
          hora_inicio: string | null
          hora_termino: string | null
          id: string
          layout_anexos: string | null
          menores: string | null
          menu_bar: Json | null
          menu_cozinha: Json | null
          mobiliario: string | null
          mobiliario_obs: string | null
          montagem: string | null
          montagem_descricao: string | null
          nome: string
          num_convidados: number | null
          observacoes: string | null
          responsavel_comercial: string | null
          responsavel_interno: string | null
          responsavel_operacional: string | null
          situacao_pagamento: string | null
          status: Database["public"]["Enums"]["event_status"]
          telefone_cliente: string | null
          tema: string | null
          tempos_movimentos: string | null
          tipo: string | null
          unit_id: string | null
          updated_at: string | null
          valet: string | null
          valor_sinal: number | null
          valor_sinal_pago: boolean | null
          valor_total: number | null
        }
        Insert: {
          acesso_entrada?: string | null
          acesso_obs?: string | null
          ambulancia?: string | null
          approved_at?: string | null
          approved_by?: string | null
          artistico?: string | null
          brand_id: string
          briefing_cliente?: string | null
          brigada?: Json | null
          campo_livre?: string | null
          contato_cliente?: string | null
          created_at?: string | null
          created_by?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_inicio: string
          email_cliente?: string | null
          empresa_cliente?: string | null
          espacos?: string | null
          fotografia?: string | null
          gerador?: string | null
          group_id: string
          hora_inicio?: string | null
          hora_termino?: string | null
          id?: string
          layout_anexos?: string | null
          menores?: string | null
          menu_bar?: Json | null
          menu_cozinha?: Json | null
          mobiliario?: string | null
          mobiliario_obs?: string | null
          montagem?: string | null
          montagem_descricao?: string | null
          nome: string
          num_convidados?: number | null
          observacoes?: string | null
          responsavel_comercial?: string | null
          responsavel_interno?: string | null
          responsavel_operacional?: string | null
          situacao_pagamento?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          telefone_cliente?: string | null
          tema?: string | null
          tempos_movimentos?: string | null
          tipo?: string | null
          unit_id?: string | null
          updated_at?: string | null
          valet?: string | null
          valor_sinal?: number | null
          valor_sinal_pago?: boolean | null
          valor_total?: number | null
        }
        Update: {
          acesso_entrada?: string | null
          acesso_obs?: string | null
          ambulancia?: string | null
          approved_at?: string | null
          approved_by?: string | null
          artistico?: string | null
          brand_id?: string
          briefing_cliente?: string | null
          brigada?: Json | null
          campo_livre?: string | null
          contato_cliente?: string | null
          created_at?: string | null
          created_by?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string
          email_cliente?: string | null
          empresa_cliente?: string | null
          espacos?: string | null
          fotografia?: string | null
          gerador?: string | null
          group_id?: string
          hora_inicio?: string | null
          hora_termino?: string | null
          id?: string
          layout_anexos?: string | null
          menores?: string | null
          menu_bar?: Json | null
          menu_cozinha?: Json | null
          mobiliario?: string | null
          mobiliario_obs?: string | null
          montagem?: string | null
          montagem_descricao?: string | null
          nome?: string
          num_convidados?: number | null
          observacoes?: string | null
          responsavel_comercial?: string | null
          responsavel_interno?: string | null
          responsavel_operacional?: string | null
          situacao_pagamento?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          telefone_cliente?: string | null
          tema?: string | null
          tempos_movimentos?: string | null
          tipo?: string | null
          unit_id?: string | null
          updated_at?: string | null
          valet?: string | null
          valor_sinal?: number | null
          valor_sinal_pago?: boolean | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string
          description: string
          id: string
          module: string
          priority: string
          status: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          module: string
          priority?: string
          status?: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          module?: string
          priority?: string
          status?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          anonimo: boolean | null
          categoria: string
          created_at: string | null
          de_employee_id: string
          id: string
          mensagem: string
          para_employee_id: string
          tipo: string
          unit_id: string
        }
        Insert: {
          anonimo?: boolean | null
          categoria: string
          created_at?: string | null
          de_employee_id: string
          id?: string
          mensagem: string
          para_employee_id: string
          tipo: string
          unit_id: string
        }
        Update: {
          anonimo?: boolean | null
          categoria?: string
          created_at?: string | null
          de_employee_id?: string
          id?: string
          mensagem?: string
          para_employee_id?: string
          tipo?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_de_employee_id_fkey"
            columns: ["de_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_para_employee_id_fkey"
            columns: ["para_employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      gorjeta_cargo_pontos: {
        Row: {
          ativo: boolean
          cargo: string
          created_at: string
          id: string
          pontos: number
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cargo: string
          created_at?: string
          id?: string
          pontos: number
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cargo?: string
          created_at?: string
          id?: string
          pontos?: number
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gorjeta_cargo_pontos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      gorjeta_dias: {
        Row: {
          cargo: string
          created_at: string
          data: string
          employee_id: string | null
          id: string
          periodo_id: string | null
          pontos: number
          presente: boolean
          unit_id: string | null
          valor_calculado: number
        }
        Insert: {
          cargo: string
          created_at?: string
          data: string
          employee_id?: string | null
          id?: string
          periodo_id?: string | null
          pontos?: number
          presente?: boolean
          unit_id?: string | null
          valor_calculado?: number
        }
        Update: {
          cargo?: string
          created_at?: string
          data?: string
          employee_id?: string | null
          id?: string
          periodo_id?: string | null
          pontos?: number
          presente?: boolean
          unit_id?: string | null
          valor_calculado?: number
        }
        Relationships: [
          {
            foreignKeyName: "gorjeta_dias_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gorjeta_dias_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "gorjeta_periodos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gorjeta_dias_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      gorjeta_distribuicao: {
        Row: {
          ano: number
          cargo: string
          colaborador_id: string | null
          created_at: string
          dias_trabalhados: number
          employee_id: string
          id: string
          mes: number
          nome: string
          percentual: number
          periodo: string | null
          pontuacao: number
          recibo_gerado_at: string | null
          recibo_url: string | null
          unit_id: string
          updated_at: string
          valor_bruto: number
          valor_liquido: number
        }
        Insert: {
          ano: number
          cargo: string
          colaborador_id?: string | null
          created_at?: string
          dias_trabalhados: number
          employee_id: string
          id?: string
          mes: number
          nome: string
          percentual?: number
          periodo?: string | null
          pontuacao: number
          recibo_gerado_at?: string | null
          recibo_url?: string | null
          unit_id: string
          updated_at?: string
          valor_bruto?: number
          valor_liquido?: number
        }
        Update: {
          ano?: number
          cargo?: string
          colaborador_id?: string | null
          created_at?: string
          dias_trabalhados?: number
          employee_id?: string
          id?: string
          mes?: number
          nome?: string
          percentual?: number
          periodo?: string | null
          pontuacao?: number
          recibo_gerado_at?: string | null
          recibo_url?: string | null
          unit_id?: string
          updated_at?: string
          valor_bruto?: number
          valor_liquido?: number
        }
        Relationships: [
          {
            foreignKeyName: "gorjeta_distribuicao_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gorjeta_distribuicao_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gorjeta_distribuicao_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      gorjeta_periodos: {
        Row: {
          created_at: string
          data: string
          fonte: string
          id: string
          imposto_pct: number
          receita_bruta: number
          receita_liquida: number | null
          total_pontos: number
          unit_id: string | null
          updated_at: string
          valor_ponto: number | null
        }
        Insert: {
          created_at?: string
          data: string
          fonte?: string
          id?: string
          imposto_pct?: number
          receita_bruta: number
          receita_liquida?: number | null
          total_pontos: number
          unit_id?: string | null
          updated_at?: string
          valor_ponto?: number | null
        }
        Update: {
          created_at?: string
          data?: string
          fonte?: string
          id?: string
          imposto_pct?: number
          receita_bruta?: number
          receita_liquida?: number | null
          total_pontos?: number
          unit_id?: string | null
          updated_at?: string
          valor_ponto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gorjeta_periodos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          icone: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          icone?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string | null
          icone?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      hos_approvals: {
        Row: {
          created_at: string | null
          decision: string
          feedback: string | null
          id: string
          run_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          decision: string
          feedback?: string | null
          id?: string
          run_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          decision?: string
          feedback?: string | null
          id?: string
          run_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hos_approvals_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "hos_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      hos_insights: {
        Row: {
          created_at: string
          id: string
          metrics: Json
          period_end: string
          period_start: string
          report_md: string
        }
        Insert: {
          created_at?: string
          id?: string
          metrics?: Json
          period_end: string
          period_start: string
          report_md: string
        }
        Update: {
          created_at?: string
          id?: string
          metrics?: Json
          period_end?: string
          period_start?: string
          report_md?: string
        }
        Relationships: []
      }
      hos_jobs: {
        Row: {
          auto_approve: boolean
          created_at: string | null
          descricao: string | null
          description: string | null
          funcao: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          unit_id: string | null
        }
        Insert: {
          auto_approve?: boolean
          created_at?: string | null
          descricao?: string | null
          description?: string | null
          funcao?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          unit_id?: string | null
        }
        Update: {
          auto_approve?: boolean
          created_at?: string | null
          descricao?: string | null
          description?: string | null
          funcao?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hos_jobs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      hos_runs: {
        Row: {
          archived_at: string | null
          created_at: string | null
          deployment_id: string | null
          employee_id: string | null
          id: string
          job_id: string | null
          logs: Json | null
          payload: Json | null
          result_data: Json | null
          status: string
          title: string | null
          triggered_by: string
          updated_at: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string | null
          deployment_id?: string | null
          employee_id?: string | null
          id?: string
          job_id?: string | null
          logs?: Json | null
          payload?: Json | null
          result_data?: Json | null
          status?: string
          title?: string | null
          triggered_by?: string
          updated_at?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string | null
          deployment_id?: string | null
          employee_id?: string | null
          id?: string
          job_id?: string | null
          logs?: Json | null
          payload?: Json | null
          result_data?: Json | null
          status?: string
          title?: string | null
          triggered_by?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hos_runs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hos_runs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "hos_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      hour_bank: {
        Row: {
          competencia: string | null
          created_at: string | null
          employee_id: string | null
          horas_debito: number | null
          horas_extras: number | null
          id: string
          nome: string | null
          saldo: number | null
          unit_id: string | null
        }
        Insert: {
          competencia?: string | null
          created_at?: string | null
          employee_id?: string | null
          horas_debito?: number | null
          horas_extras?: number | null
          id?: string
          nome?: string | null
          saldo?: number | null
          unit_id?: string | null
        }
        Update: {
          competencia?: string | null
          created_at?: string | null
          employee_id?: string | null
          horas_debito?: number | null
          horas_extras?: number | null
          id?: string
          nome?: string | null
          saldo?: number | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hour_bank_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hour_bank_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_policies: {
        Row: {
          ativo: boolean | null
          condicoes: string | null
          created_at: string | null
          descricao: string | null
          dia_pagamento: number | null
          id: string
          nome: string
          tipo: string | null
          unit_id: string | null
          valor: number | null
        }
        Insert: {
          ativo?: boolean | null
          condicoes?: string | null
          created_at?: string | null
          descricao?: string | null
          dia_pagamento?: number | null
          id?: string
          nome: string
          tipo?: string | null
          unit_id?: string | null
          valor?: number | null
        }
        Update: {
          ativo?: boolean | null
          condicoes?: string | null
          created_at?: string | null
          descricao?: string | null
          dia_pagamento?: number | null
          id?: string
          nome?: string
          tipo?: string | null
          unit_id?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hr_policies_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          detalhes: Json | null
          erros: number | null
          id: string
          importados: number | null
          imported_at: string | null
          imported_by: string | null
          nao_encontrados: number | null
          periodo: string
          tipo: string | null
          total_linhas: number | null
          unit_id: string | null
        }
        Insert: {
          detalhes?: Json | null
          erros?: number | null
          id?: string
          importados?: number | null
          imported_at?: string | null
          imported_by?: string | null
          nao_encontrados?: number | null
          periodo: string
          tipo?: string | null
          total_linhas?: number | null
          unit_id?: string | null
        }
        Update: {
          detalhes?: Json | null
          erros?: number | null
          id?: string
          importados?: number | null
          imported_at?: string | null
          imported_by?: string | null
          nao_encontrados?: number | null
          periodo?: string
          tipo?: string | null
          total_linhas?: number | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_logs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_price_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          custo_anterior: number | null
          custo_novo: number
          id: string
          ingredient_id: string
          motivo: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          custo_anterior?: number | null
          custo_novo: number
          id?: string
          ingredient_id: string
          motivo?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          custo_anterior?: number | null
          custo_novo?: number
          id?: string
          ingredient_id?: string
          motivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_price_history_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_stock: {
        Row: {
          estoque_minimo: number
          estoque_real: number
          id: string
          ingredient_id: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          estoque_minimo?: number
          estoque_real?: number
          id?: string
          ingredient_id: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          estoque_minimo?: number
          estoque_real?: number
          id?: string
          ingredient_id?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_stock_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          ativo: boolean | null
          categoria: string
          categoria_anvisa: string | null
          codigo: string | null
          created_at: string | null
          custo_padrao: number
          fornecedor_id: string | null
          group_id: string
          id: string
          menu_item_id: string | null
          nome: string
          observacoes: string | null
          perdas_padrao: number | null
          unidade_padrao: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          categoria_anvisa?: string | null
          codigo?: string | null
          created_at?: string | null
          custo_padrao?: number
          fornecedor_id?: string | null
          group_id: string
          id?: string
          menu_item_id?: string | null
          nome: string
          observacoes?: string | null
          perdas_padrao?: number | null
          unidade_padrao: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          categoria_anvisa?: string | null
          codigo?: string | null
          created_at?: string | null
          custo_padrao?: number
          fornecedor_id?: string | null
          group_id?: string
          id?: string
          menu_item_id?: string | null
          nome?: string
          observacoes?: string | null
          perdas_padrao?: number | null
          unidade_padrao?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredients_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredients_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "v_cmv_produto"
            referencedColumns: ["produto_id"]
          },
        ]
      }
      interview_questions: {
        Row: {
          created_at: string | null
          id: string
          job_opening_id: string
          order_num: number
          question_text: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_opening_id: string
          order_num: number
          question_text?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          job_opening_id?: string
          order_num?: number
          question_text?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_questions_job_opening_id_fkey"
            columns: ["job_opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_questions_job_opening_id_fkey"
            columns: ["job_opening_id"]
            isOneToOne: false
            referencedRelation: "v_vagas_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_responses: {
        Row: {
          candidate_id: string
          created_at: string | null
          id: string
          question_id: string
          video_url: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          id?: string
          question_id: string
          video_url?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          id?: string
          question_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_responses_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interview_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "interview_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          candidate_id: string
          created_at: string
          data_entrevista: string
          entrevistador_id: string | null
          feedback: string | null
          formato: string
          id: string
          job_opening_id: string | null
          nota: number | null
          status: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          data_entrevista: string
          entrevistador_id?: string | null
          feedback?: string | null
          formato?: string
          id?: string
          job_opening_id?: string | null
          nota?: number | null
          status?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          data_entrevista?: string
          entrevistador_id?: string | null
          feedback?: string | null
          formato?: string
          id?: string
          job_opening_id?: string | null
          nota?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_entrevistador_id_fkey"
            columns: ["entrevistador_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_opening_id_fkey"
            columns: ["job_opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interviews_job_opening_id_fkey"
            columns: ["job_opening_id"]
            isOneToOne: false
            referencedRelation: "v_vagas_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      job_descriptions: {
        Row: {
          area: string
          beneficios: string | null
          brand_id: string | null
          cargo: string
          created_at: string
          created_by: string | null
          id: string
          modalidade: string
          requisitos: string | null
          responsabilidades: string | null
          status: string
          tipo_contrato: string
          updated_at: string
        }
        Insert: {
          area: string
          beneficios?: string | null
          brand_id?: string | null
          cargo: string
          created_at?: string
          created_by?: string | null
          id?: string
          modalidade?: string
          requisitos?: string | null
          responsabilidades?: string | null
          status?: string
          tipo_contrato?: string
          updated_at?: string
        }
        Update: {
          area?: string
          beneficios?: string | null
          brand_id?: string | null
          cargo?: string
          created_at?: string
          created_by?: string | null
          id?: string
          modalidade?: string
          requisitos?: string | null
          responsabilidades?: string | null
          status?: string
          tipo_contrato?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_descriptions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_descriptions_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
        ]
      }
      job_opening_logs: {
        Row: {
          autor: string | null
          created_at: string
          id: string
          opening_id: string | null
          texto: string
        }
        Insert: {
          autor?: string | null
          created_at?: string
          id?: string
          opening_id?: string | null
          texto: string
        }
        Update: {
          autor?: string | null
          created_at?: string
          id?: string
          opening_id?: string | null
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_opening_logs_opening_id_fkey"
            columns: ["opening_id"]
            isOneToOne: false
            referencedRelation: "job_openings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_opening_logs_opening_id_fkey"
            columns: ["opening_id"]
            isOneToOne: false
            referencedRelation: "v_vagas_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      job_openings: {
        Row: {
          area: string | null
          brand_id: string | null
          cancelada: boolean
          cancelada_em: string | null
          candidato_aprovado: string | null
          cargo: string | null
          cargo_grupo_id: string | null
          congelada: boolean
          congelada_em: string | null
          created_at: string | null
          created_by: string | null
          data_admissao: string | null
          data_solicitacao: string | null
          description: string | null
          entrevistador_id: string | null
          fechamento_previsto: string | null
          fonte_recrutamento: string | null
          forma_contratacao: string | null
          horario: string | null
          horario_escala: string | null
          id: string
          is_active: boolean | null
          motivo: string | null
          motivo_congelamento: string | null
          motivo_estruturado: string | null
          must_have: string | null
          nice_to_have: string | null
          observacao: string | null
          observacoes: string | null
          periodo_exp_dias: number | null
          prioridade: string | null
          recrutador: string | null
          responsavel_id: string | null
          salario: number | null
          salario_max: number | null
          salario_min: number | null
          sla_dias: number | null
          status: string
          status_prazo: string | null
          substituido_id: string | null
          title: string
          unit_id: string | null
        }
        Insert: {
          area?: string | null
          brand_id?: string | null
          cancelada?: boolean
          cancelada_em?: string | null
          candidato_aprovado?: string | null
          cargo?: string | null
          cargo_grupo_id?: string | null
          congelada?: boolean
          congelada_em?: string | null
          created_at?: string | null
          created_by?: string | null
          data_admissao?: string | null
          data_solicitacao?: string | null
          description?: string | null
          entrevistador_id?: string | null
          fechamento_previsto?: string | null
          fonte_recrutamento?: string | null
          forma_contratacao?: string | null
          horario?: string | null
          horario_escala?: string | null
          id?: string
          is_active?: boolean | null
          motivo?: string | null
          motivo_congelamento?: string | null
          motivo_estruturado?: string | null
          must_have?: string | null
          nice_to_have?: string | null
          observacao?: string | null
          observacoes?: string | null
          periodo_exp_dias?: number | null
          prioridade?: string | null
          recrutador?: string | null
          responsavel_id?: string | null
          salario?: number | null
          salario_max?: number | null
          salario_min?: number | null
          sla_dias?: number | null
          status?: string
          status_prazo?: string | null
          substituido_id?: string | null
          title: string
          unit_id?: string | null
        }
        Update: {
          area?: string | null
          brand_id?: string | null
          cancelada?: boolean
          cancelada_em?: string | null
          candidato_aprovado?: string | null
          cargo?: string | null
          cargo_grupo_id?: string | null
          congelada?: boolean
          congelada_em?: string | null
          created_at?: string | null
          created_by?: string | null
          data_admissao?: string | null
          data_solicitacao?: string | null
          description?: string | null
          entrevistador_id?: string | null
          fechamento_previsto?: string | null
          fonte_recrutamento?: string | null
          forma_contratacao?: string | null
          horario?: string | null
          horario_escala?: string | null
          id?: string
          is_active?: boolean | null
          motivo?: string | null
          motivo_congelamento?: string | null
          motivo_estruturado?: string | null
          must_have?: string | null
          nice_to_have?: string | null
          observacao?: string | null
          observacoes?: string | null
          periodo_exp_dias?: number | null
          prioridade?: string | null
          recrutador?: string | null
          responsavel_id?: string | null
          salario?: number | null
          salario_max?: number | null
          salario_min?: number | null
          sla_dias?: number | null
          status?: string
          status_prazo?: string | null
          substituido_id?: string | null
          title?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_openings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "job_openings_cargo_grupo_id_fkey"
            columns: ["cargo_grupo_id"]
            isOneToOne: false
            referencedRelation: "cargo_grupos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_entrevistador_id_fkey"
            columns: ["entrevistador_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_substituido_id_fkey"
            columns: ["substituido_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      job_requisitions: {
        Row: {
          area: string | null
          cargo: string | null
          cenario_pratico: string | null
          created_at: string
          data_limite: string | null
          desafios_reais: string | null
          empresa: string | null
          fatores_eliminatorios: string | null
          gabarito_rh: string | null
          hard_skills_desejaveis: string | null
          hard_skills_obrigatorios: string | null
          id: string
          justificativa_vaga: string | null
          motivo: string | null
          nome_solicitante: string | null
          proposta_valor: string | null
          resumo_responsabilidades: string | null
          soft_skills: string | null
          status: string
          vale_transporte: string | null
        }
        Insert: {
          area?: string | null
          cargo?: string | null
          cenario_pratico?: string | null
          created_at?: string
          data_limite?: string | null
          desafios_reais?: string | null
          empresa?: string | null
          fatores_eliminatorios?: string | null
          gabarito_rh?: string | null
          hard_skills_desejaveis?: string | null
          hard_skills_obrigatorios?: string | null
          id?: string
          justificativa_vaga?: string | null
          motivo?: string | null
          nome_solicitante?: string | null
          proposta_valor?: string | null
          resumo_responsabilidades?: string | null
          soft_skills?: string | null
          status?: string
          vale_transporte?: string | null
        }
        Update: {
          area?: string | null
          cargo?: string | null
          cenario_pratico?: string | null
          created_at?: string
          data_limite?: string | null
          desafios_reais?: string | null
          empresa?: string | null
          fatores_eliminatorios?: string | null
          gabarito_rh?: string | null
          hard_skills_desejaveis?: string | null
          hard_skills_obrigatorios?: string | null
          id?: string
          justificativa_vaga?: string | null
          motivo?: string | null
          nome_solicitante?: string | null
          proposta_valor?: string | null
          resumo_responsabilidades?: string | null
          soft_skills?: string | null
          status?: string
          vale_transporte?: string | null
        }
        Relationships: []
      }
      kph_alerts: {
        Row: {
          canal: string | null
          created_at: string
          entidade: string | null
          entidade_id: string | null
          enviado_em: string | null
          enviado_para: string[] | null
          id: string
          lido: boolean | null
          mensagem: string
          prioridade: string
          resolvido: boolean | null
          tipo: string
        }
        Insert: {
          canal?: string | null
          created_at?: string
          entidade?: string | null
          entidade_id?: string | null
          enviado_em?: string | null
          enviado_para?: string[] | null
          id?: string
          lido?: boolean | null
          mensagem: string
          prioridade: string
          resolvido?: boolean | null
          tipo: string
        }
        Update: {
          canal?: string | null
          created_at?: string
          entidade?: string | null
          entidade_id?: string | null
          enviado_em?: string | null
          enviado_para?: string[] | null
          id?: string
          lido?: boolean | null
          mensagem?: string
          prioridade?: string
          resolvido?: boolean | null
          tipo?: string
        }
        Relationships: []
      }
      kph_insights: {
        Row: {
          aprovado: boolean | null
          created_at: string
          dados_referencia: Json | null
          gerado_por: string | null
          id: string
          insight_text: string
          modulo: string
          semana: string
        }
        Insert: {
          aprovado?: boolean | null
          created_at?: string
          dados_referencia?: Json | null
          gerado_por?: string | null
          id?: string
          insight_text: string
          modulo: string
          semana: string
        }
        Update: {
          aprovado?: boolean | null
          created_at?: string
          dados_referencia?: Json | null
          gerado_por?: string | null
          id?: string
          insight_text?: string
          modulo?: string
          semana?: string
        }
        Relationships: []
      }
      kph_intelligence_scores: {
        Row: {
          adocao_score: number | null
          breakdown: Json | null
          bugs_score: number | null
          cap_razao: string | null
          cmv_score: number | null
          created_at: string
          ebitda_score: number | null
          id: string
          metas_score: number | null
          modulo: string | null
          score: number
          score_oficial: number | null
          semana: string
        }
        Insert: {
          adocao_score?: number | null
          breakdown?: Json | null
          bugs_score?: number | null
          cap_razao?: string | null
          cmv_score?: number | null
          created_at?: string
          ebitda_score?: number | null
          id?: string
          metas_score?: number | null
          modulo?: string | null
          score: number
          score_oficial?: number | null
          semana: string
        }
        Update: {
          adocao_score?: number | null
          breakdown?: Json | null
          bugs_score?: number | null
          cap_razao?: string | null
          cmv_score?: number | null
          created_at?: string
          ebitda_score?: number | null
          id?: string
          metas_score?: number | null
          modulo?: string | null
          score?: number
          score_oficial?: number | null
          semana?: string
        }
        Relationships: []
      }
      kph_learning_proposals: {
        Row: {
          created_at: string
          descricao: string
          evidencia: string | null
          executed_at: string | null
          id: string
          impacto_estimado: string | null
          modulo: string
          prioridade: string
          severidade: string | null
          status: string
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          descricao: string
          evidencia?: string | null
          executed_at?: string | null
          id?: string
          impacto_estimado?: string | null
          modulo: string
          prioridade: string
          severidade?: string | null
          status?: string
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string
          descricao?: string
          evidencia?: string | null
          executed_at?: string | null
          id?: string
          impacto_estimado?: string | null
          modulo?: string
          prioridade?: string
          severidade?: string | null
          status?: string
          tipo?: string
          titulo?: string
        }
        Relationships: []
      }
      learning_machine_reports: {
        Row: {
          active_agents: number
          dormant_agents: Json | null
          generated_at: string | null
          id: string
          inactive_agents: number
          insights: Json | null
          missing_agents: Json | null
          raw_analysis: string | null
          top_agents: Json | null
          total_runs: number
          week_number: number
          year: number
        }
        Insert: {
          active_agents?: number
          dormant_agents?: Json | null
          generated_at?: string | null
          id?: string
          inactive_agents?: number
          insights?: Json | null
          missing_agents?: Json | null
          raw_analysis?: string | null
          top_agents?: Json | null
          total_runs?: number
          week_number: number
          year: number
        }
        Update: {
          active_agents?: number
          dormant_agents?: Json | null
          generated_at?: string | null
          id?: string
          inactive_agents?: number
          insights?: Json | null
          missing_agents?: Json | null
          raw_analysis?: string | null
          top_agents?: Json | null
          total_runs?: number
          week_number?: number
          year?: number
        }
        Relationships: []
      }
      lorean_ambientes: {
        Row: {
          ambiente: string
          clientes: number | null
          consumo: number | null
          criado_em: string | null
          gorjeta: number | null
          id: string
          produto: number | null
          workday_id_fk: string | null
        }
        Insert: {
          ambiente: string
          clientes?: number | null
          consumo?: number | null
          criado_em?: string | null
          gorjeta?: number | null
          id?: string
          produto?: number | null
          workday_id_fk?: string | null
        }
        Update: {
          ambiente?: string
          clientes?: number | null
          consumo?: number | null
          criado_em?: string | null
          gorjeta?: number | null
          id?: string
          produto?: number | null
          workday_id_fk?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lorean_ambientes_workday_id_fk_fkey"
            columns: ["workday_id_fk"]
            isOneToOne: false
            referencedRelation: "lorean_workdays"
            referencedColumns: ["id"]
          },
        ]
      }
      lorean_caixas: {
        Row: {
          abertura_at: string | null
          caixa_id: number | null
          criado_em: string | null
          diferenca: number | null
          fechamento_at: string | null
          id: string
          operador: string | null
          total_fechado: number | null
          total_recebido: number | null
          workday_id_fk: string | null
        }
        Insert: {
          abertura_at?: string | null
          caixa_id?: number | null
          criado_em?: string | null
          diferenca?: number | null
          fechamento_at?: string | null
          id?: string
          operador?: string | null
          total_fechado?: number | null
          total_recebido?: number | null
          workday_id_fk?: string | null
        }
        Update: {
          abertura_at?: string | null
          caixa_id?: number | null
          criado_em?: string | null
          diferenca?: number | null
          fechamento_at?: string | null
          id?: string
          operador?: string | null
          total_fechado?: number | null
          total_recebido?: number | null
          workday_id_fk?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lorean_caixas_workday_id_fk_fkey"
            columns: ["workday_id_fk"]
            isOneToOne: false
            referencedRelation: "lorean_workdays"
            referencedColumns: ["id"]
          },
        ]
      }
      lorean_cancelamentos: {
        Row: {
          consumo: number | null
          criado_em: string | null
          id: string
          motivo: string
          qtd: number | null
          workday_id_fk: string | null
        }
        Insert: {
          consumo?: number | null
          criado_em?: string | null
          id?: string
          motivo: string
          qtd?: number | null
          workday_id_fk?: string | null
        }
        Update: {
          consumo?: number | null
          criado_em?: string | null
          id?: string
          motivo?: string
          qtd?: number | null
          workday_id_fk?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lorean_cancelamentos_workday_id_fk_fkey"
            columns: ["workday_id_fk"]
            isOneToOne: false
            referencedRelation: "lorean_workdays"
            referencedColumns: ["id"]
          },
        ]
      }
      lorean_cancelamentos_detalhe: {
        Row: {
          created_at: string | null
          id: number
          item: string | null
          motivo: string | null
          qtd: number | null
          usuario: string | null
          valor: number | null
          workday_id_fk: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          item?: string | null
          motivo?: string | null
          qtd?: number | null
          usuario?: string | null
          valor?: number | null
          workday_id_fk: string
        }
        Update: {
          created_at?: string | null
          id?: never
          item?: string | null
          motivo?: string | null
          qtd?: number | null
          usuario?: string | null
          valor?: number | null
          workday_id_fk?: string
        }
        Relationships: [
          {
            foreignKeyName: "lorean_cancelamentos_detalhe_workday_id_fk_fkey"
            columns: ["workday_id_fk"]
            isOneToOne: false
            referencedRelation: "lorean_workdays"
            referencedColumns: ["id"]
          },
        ]
      }
      lorean_descontos: {
        Row: {
          consumo: number | null
          criado_em: string | null
          id: string
          motivo: string
          qtd: number | null
          workday_id_fk: string | null
        }
        Insert: {
          consumo?: number | null
          criado_em?: string | null
          id?: string
          motivo: string
          qtd?: number | null
          workday_id_fk?: string | null
        }
        Update: {
          consumo?: number | null
          criado_em?: string | null
          id?: string
          motivo?: string
          qtd?: number | null
          workday_id_fk?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lorean_descontos_workday_id_fk_fkey"
            columns: ["workday_id_fk"]
            isOneToOne: false
            referencedRelation: "lorean_workdays"
            referencedColumns: ["id"]
          },
        ]
      }
      lorean_descontos_detalhe: {
        Row: {
          created_at: string | null
          id: number
          item: string | null
          motivo: string | null
          qtd: number | null
          usuario: string | null
          valor: number | null
          workday_id_fk: string
        }
        Insert: {
          created_at?: string | null
          id?: never
          item?: string | null
          motivo?: string | null
          qtd?: number | null
          usuario?: string | null
          valor?: number | null
          workday_id_fk: string
        }
        Update: {
          created_at?: string | null
          id?: never
          item?: string | null
          motivo?: string | null
          qtd?: number | null
          usuario?: string | null
          valor?: number | null
          workday_id_fk?: string
        }
        Relationships: [
          {
            foreignKeyName: "lorean_descontos_detalhe_workday_id_fk_fkey"
            columns: ["workday_id_fk"]
            isOneToOne: false
            referencedRelation: "lorean_workdays"
            referencedColumns: ["id"]
          },
        ]
      }
      lorean_grupos: {
        Row: {
          bruto: number | null
          consumo: number | null
          criado_em: string | null
          desconto: number | null
          gorjeta: number | null
          grupo: string
          id: string
          pct_bruto: number | null
          workday_id_fk: string | null
        }
        Insert: {
          bruto?: number | null
          consumo?: number | null
          criado_em?: string | null
          desconto?: number | null
          gorjeta?: number | null
          grupo: string
          id?: string
          pct_bruto?: number | null
          workday_id_fk?: string | null
        }
        Update: {
          bruto?: number | null
          consumo?: number | null
          criado_em?: string | null
          desconto?: number | null
          gorjeta?: number | null
          grupo?: string
          id?: string
          pct_bruto?: number | null
          workday_id_fk?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lorean_grupos_workday_id_fk_fkey"
            columns: ["workday_id_fk"]
            isOneToOne: false
            referencedRelation: "lorean_workdays"
            referencedColumns: ["id"]
          },
        ]
      }
      lorean_horarios: {
        Row: {
          clientes: number | null
          consumo: number | null
          criado_em: string | null
          gorjeta: number | null
          hora: number
          id: string
          produto: number | null
          workday_id_fk: string | null
        }
        Insert: {
          clientes?: number | null
          consumo?: number | null
          criado_em?: string | null
          gorjeta?: number | null
          hora: number
          id?: string
          produto?: number | null
          workday_id_fk?: string | null
        }
        Update: {
          clientes?: number | null
          consumo?: number | null
          criado_em?: string | null
          gorjeta?: number | null
          hora?: number
          id?: string
          produto?: number | null
          workday_id_fk?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lorean_horarios_workday_id_fk_fkey"
            columns: ["workday_id_fk"]
            isOneToOne: false
            referencedRelation: "lorean_workdays"
            referencedColumns: ["id"]
          },
        ]
      }
      lorean_import_log: {
        Row: {
          data_referente: string | null
          email_id: string | null
          erro: string | null
          filename: string | null
          id: string
          processado_em: string | null
          status: string | null
          tipo: string | null
        }
        Insert: {
          data_referente?: string | null
          email_id?: string | null
          erro?: string | null
          filename?: string | null
          id?: string
          processado_em?: string | null
          status?: string | null
          tipo?: string | null
        }
        Update: {
          data_referente?: string | null
          email_id?: string | null
          erro?: string | null
          filename?: string | null
          id?: string
          processado_em?: string | null
          status?: string | null
          tipo?: string | null
        }
        Relationships: []
      }
      lorean_pagamentos: {
        Row: {
          criado_em: string | null
          diferenca: number | null
          forma: string
          id: string
          valor_fechado: number | null
          valor_recebido: number | null
          workday_id_fk: string | null
        }
        Insert: {
          criado_em?: string | null
          diferenca?: number | null
          forma: string
          id?: string
          valor_fechado?: number | null
          valor_recebido?: number | null
          workday_id_fk?: string | null
        }
        Update: {
          criado_em?: string | null
          diferenca?: number | null
          forma?: string
          id?: string
          valor_fechado?: number | null
          valor_recebido?: number | null
          workday_id_fk?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lorean_pagamentos_workday_id_fk_fkey"
            columns: ["workday_id_fk"]
            isOneToOne: false
            referencedRelation: "lorean_workdays"
            referencedColumns: ["id"]
          },
        ]
      }
      lorean_produtos_dia: {
        Row: {
          bruto: number | null
          cmv_pct: number | null
          created_at: string | null
          desconto: number | null
          gorjeta: number | null
          grupo: string | null
          id: number
          produto: string
          qtd: number | null
          total: number | null
          workday_id_fk: string
        }
        Insert: {
          bruto?: number | null
          cmv_pct?: number | null
          created_at?: string | null
          desconto?: number | null
          gorjeta?: number | null
          grupo?: string | null
          id?: never
          produto: string
          qtd?: number | null
          total?: number | null
          workday_id_fk: string
        }
        Update: {
          bruto?: number | null
          cmv_pct?: number | null
          created_at?: string | null
          desconto?: number | null
          gorjeta?: number | null
          grupo?: string | null
          id?: never
          produto?: string
          qtd?: number | null
          total?: number | null
          workday_id_fk?: string
        }
        Relationships: [
          {
            foreignKeyName: "lorean_produtos_dia_workday_id_fk_fkey"
            columns: ["workday_id_fk"]
            isOneToOne: false
            referencedRelation: "lorean_workdays"
            referencedColumns: ["id"]
          },
        ]
      }
      lorean_turnos: {
        Row: {
          clientes: number | null
          consumo: number | null
          criado_em: string | null
          gorjeta: number | null
          id: string
          produto: number | null
          turno: string
          workday_id_fk: string | null
        }
        Insert: {
          clientes?: number | null
          consumo?: number | null
          criado_em?: string | null
          gorjeta?: number | null
          id?: string
          produto?: number | null
          turno: string
          workday_id_fk?: string | null
        }
        Update: {
          clientes?: number | null
          consumo?: number | null
          criado_em?: string | null
          gorjeta?: number | null
          id?: string
          produto?: number | null
          turno?: string
          workday_id_fk?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lorean_turnos_workday_id_fk_fkey"
            columns: ["workday_id_fk"]
            isOneToOne: false
            referencedRelation: "lorean_workdays"
            referencedColumns: ["id"]
          },
        ]
      }
      lorean_usuarios: {
        Row: {
          consumo: number | null
          criado_em: string | null
          gorjeta: number | null
          id: string
          produto: number | null
          qtd: number | null
          usuario: string
          workday_id_fk: string | null
        }
        Insert: {
          consumo?: number | null
          criado_em?: string | null
          gorjeta?: number | null
          id?: string
          produto?: number | null
          qtd?: number | null
          usuario: string
          workday_id_fk?: string | null
        }
        Update: {
          consumo?: number | null
          criado_em?: string | null
          gorjeta?: number | null
          id?: string
          produto?: number | null
          qtd?: number | null
          usuario?: string
          workday_id_fk?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lorean_usuarios_workday_id_fk_fkey"
            columns: ["workday_id_fk"]
            isOneToOne: false
            referencedRelation: "lorean_workdays"
            referencedColumns: ["id"]
          },
        ]
      }
      lorean_workdays: {
        Row: {
          abertura_at: string | null
          clientes: number | null
          cmv_pct: number | null
          criado_em: string | null
          custo: number | null
          data: string
          desconto: number | null
          devedor: number | null
          fechamento_at: string | null
          gorjeta: number | null
          id: string
          lucro: number | null
          permanencia_media: string | null
          previsto: number | null
          receita_bruta: number | null
          receita_liquida: number | null
          ticket_medio: number | null
          ticket_real: number | null
          turno: string
          unit_id: string | null
          workday_id: number | null
        }
        Insert: {
          abertura_at?: string | null
          clientes?: number | null
          cmv_pct?: number | null
          criado_em?: string | null
          custo?: number | null
          data: string
          desconto?: number | null
          devedor?: number | null
          fechamento_at?: string | null
          gorjeta?: number | null
          id?: string
          lucro?: number | null
          permanencia_media?: string | null
          previsto?: number | null
          receita_bruta?: number | null
          receita_liquida?: number | null
          ticket_medio?: number | null
          ticket_real?: number | null
          turno?: string
          unit_id?: string | null
          workday_id?: number | null
        }
        Update: {
          abertura_at?: string | null
          clientes?: number | null
          cmv_pct?: number | null
          criado_em?: string | null
          custo?: number | null
          data?: string
          desconto?: number | null
          devedor?: number | null
          fechamento_at?: string | null
          gorjeta?: number | null
          id?: string
          lucro?: number | null
          permanencia_media?: string | null
          previsto?: number | null
          receita_bruta?: number | null
          receita_liquida?: number | null
          ticket_medio?: number | null
          ticket_real?: number | null
          turno?: string
          unit_id?: string | null
          workday_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lorean_workdays_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      mapa_conta_dre: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          descricao_c_gerencial: string
          esperada_mensal: boolean | null
          id: string
          linha_dre: string | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          descricao_c_gerencial: string
          esperada_mensal?: boolean | null
          id?: string
          linha_dre?: string | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          descricao_c_gerencial?: string
          esperada_mensal?: boolean | null
          id?: string
          linha_dre?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          ativo: boolean | null
          brand_id: string
          categoria: string
          codigo: string | null
          created_at: string | null
          custo_total: number
          descricao: string | null
          id: string
          is_subproduto: boolean
          nome: string
          observacoes: string | null
          ordem: number | null
          preco_venda: number
          rendimento: number
          tem_ficha_tecnica: boolean | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          brand_id: string
          categoria: string
          codigo?: string | null
          created_at?: string | null
          custo_total?: number
          descricao?: string | null
          id?: string
          is_subproduto?: boolean
          nome: string
          observacoes?: string | null
          ordem?: number | null
          preco_venda?: number
          rendimento?: number
          tem_ficha_tecnica?: boolean | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          brand_id?: string
          categoria?: string
          codigo?: string | null
          created_at?: string | null
          custo_total?: number
          descricao?: string | null
          id?: string
          is_subproduto?: boolean
          nome?: string
          observacoes?: string | null
          ordem?: number | null
          preco_venda?: number
          rendimento?: number
          tem_ficha_tecnica?: boolean | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "menu_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_dia_override: {
        Row: {
          created_at: string | null
          data: string
          id: number
          meta: number
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          data: string
          id?: never
          meta: number
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          data?: string
          id?: never
          meta?: number
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      metas_dia_semana: {
        Row: {
          created_at: string | null
          dia_semana: number
          id: number
          meta: number
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dia_semana: number
          id?: never
          meta: number
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dia_semana?: number
          id?: never
          meta?: number
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      metas_projecoes: {
        Row: {
          criado_em: string | null
          id: number
          mes_ano: string
          meta_faturamento: number | null
          metas_diarias: Json | null
        }
        Insert: {
          criado_em?: string | null
          id?: number
          mes_ano: string
          meta_faturamento?: number | null
          metas_diarias?: Json | null
        }
        Update: {
          criado_em?: string | null
          id?: number
          mes_ano?: string
          meta_faturamento?: number | null
          metas_diarias?: Json | null
        }
        Relationships: []
      }
      movimentacoes_rh: {
        Row: {
          created_at: string
          data_movimentacao: string
          employee_id: string
          funcao_antes: string | null
          funcao_depois: string | null
          id: string
          motivo: string | null
          registrado_por: string | null
          tier_antes: string | null
          tier_depois: string | null
          tipo: string
          unidade_destino_id: string | null
          unidade_id: string | null
        }
        Insert: {
          created_at?: string
          data_movimentacao: string
          employee_id: string
          funcao_antes?: string | null
          funcao_depois?: string | null
          id?: string
          motivo?: string | null
          registrado_por?: string | null
          tier_antes?: string | null
          tier_depois?: string | null
          tipo: string
          unidade_destino_id?: string | null
          unidade_id?: string | null
        }
        Update: {
          created_at?: string
          data_movimentacao?: string
          employee_id?: string
          funcao_antes?: string | null
          funcao_depois?: string | null
          id?: string
          motivo?: string | null
          registrado_por?: string | null
          tier_antes?: string | null
          tier_depois?: string | null
          tipo?: string
          unidade_destino_id?: string | null
          unidade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_rh_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_rh_unidade_destino_id_fkey"
            columns: ["unidade_destino_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_rh_unidade_id_fkey"
            columns: ["unidade_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_detalhadas: {
        Row: {
          data_inspecao: string
          id: number
          local: string | null
          meta: number | null
          nota: number | null
          setor: string | null
          topico: string | null
        }
        Insert: {
          data_inspecao: string
          id?: number
          local?: string | null
          meta?: number | null
          nota?: number | null
          setor?: string | null
          topico?: string | null
        }
        Update: {
          data_inspecao?: string
          id?: number
          local?: string | null
          meta?: number | null
          nota?: number | null
          setor?: string | null
          topico?: string | null
        }
        Relationships: []
      }
      notas_nutri: {
        Row: {
          data_inspecao: string
          id: number
          local: string | null
          nota: number | null
          status: string | null
          tipo_inspecao: string | null
        }
        Insert: {
          data_inspecao: string
          id?: number
          local?: string | null
          nota?: number | null
          status?: string | null
          tipo_inspecao?: string | null
        }
        Update: {
          data_inspecao?: string
          id?: number
          local?: string | null
          nota?: number | null
          status?: string | null
          tipo_inspecao?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          lida: boolean
          link: string | null
          mensagem: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string | null
          tipo: string
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lida?: boolean
          link?: string | null
          mensagem?: string | null
          tipo?: string
          titulo?: string
          user_id?: string
        }
        Relationships: []
      }
      occupational_health: {
        Row: {
          cargo: string | null
          cpf: string | null
          created_at: string | null
          crm: string | null
          data_exame: string | null
          documento_ref: string | null
          employee_id: string | null
          id: string
          medico: string | null
          nome: string | null
          restricoes: string | null
          resultado: string | null
          tipo_exame: string | null
          unit_id: string | null
          validade: string | null
        }
        Insert: {
          cargo?: string | null
          cpf?: string | null
          created_at?: string | null
          crm?: string | null
          data_exame?: string | null
          documento_ref?: string | null
          employee_id?: string | null
          id?: string
          medico?: string | null
          nome?: string | null
          restricoes?: string | null
          resultado?: string | null
          tipo_exame?: string | null
          unit_id?: string | null
          validade?: string | null
        }
        Update: {
          cargo?: string | null
          cpf?: string | null
          created_at?: string | null
          crm?: string | null
          data_exame?: string | null
          documento_ref?: string | null
          employee_id?: string | null
          id?: string
          medico?: string | null
          nome?: string | null
          restricoes?: string | null
          resultado?: string | null
          tipo_exame?: string | null
          unit_id?: string | null
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "occupational_health_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupational_health_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checklist: {
        Row: {
          concluido_em: string | null
          concluido_por: string | null
          id: string
          run_id: string
          status: string
          tarefa_id: string
        }
        Insert: {
          concluido_em?: string | null
          concluido_por?: string | null
          id?: string
          run_id: string
          status?: string
          tarefa_id: string
        }
        Update: {
          concluido_em?: string | null
          concluido_por?: string | null
          id?: string
          run_id?: string
          status?: string
          tarefa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checklist_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "onboarding_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checklist_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "onboarding_tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_runs: {
        Row: {
          created_at: string | null
          data_inicio: string
          employee_id: string
          id: string
          status: string
          template_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string | null
          data_inicio?: string
          employee_id: string
          id?: string
          status?: string
          template_id: string
          unit_id: string
        }
        Update: {
          created_at?: string | null
          data_inicio?: string
          employee_id?: string
          id?: string
          status?: string
          template_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_runs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_runs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_runs_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_tarefas: {
        Row: {
          descricao: string | null
          id: string
          ordem: number
          prazo_dias: number
          responsavel: string
          template_id: string
          titulo: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          ordem?: number
          prazo_dias?: number
          responsavel: string
          template_id: string
          titulo: string
        }
        Update: {
          descricao?: string | null
          id?: string
          ordem?: number
          prazo_dias?: number
          responsavel?: string
          template_id?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_tarefas_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "onboarding_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_templates: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string | null
          id: string
          nome: string
          unit_id: string
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome: string
          unit_id: string
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_templates_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      origens_candidato: {
        Row: {
          ativo: boolean
          automatica: boolean
          codigo: string
          id: string
          label: string
          ordem: number
        }
        Insert: {
          ativo?: boolean
          automatica?: boolean
          codigo: string
          id?: string
          label: string
          ordem?: number
        }
        Update: {
          ativo?: boolean
          automatica?: boolean
          codigo?: string
          id?: string
          label?: string
          ordem?: number
        }
        Relationships: []
      }
      orkestri_achados: {
        Row: {
          atualizado_em: string
          auditor: string
          causa_provavel: string | null
          created_at: string
          desvio_pp: number | null
          faixa_mercado: string | null
          fonte_ok: boolean
          id: string
          indicador: string
          marca: string
          meta_interna: number | null
          periodo: string
          r_em_risco: number | null
          realizado: number | null
          resolucao: string | null
          run_id: string | null
          severidade: string | null
          status: string
          tipo: string
          tipo_periodo: string
          titulo: string
          unit_id: string
          zona: string
        }
        Insert: {
          atualizado_em?: string
          auditor: string
          causa_provavel?: string | null
          created_at?: string
          desvio_pp?: number | null
          faixa_mercado?: string | null
          fonte_ok?: boolean
          id?: string
          indicador: string
          marca: string
          meta_interna?: number | null
          periodo: string
          r_em_risco?: number | null
          realizado?: number | null
          resolucao?: string | null
          run_id?: string | null
          severidade?: string | null
          status?: string
          tipo: string
          tipo_periodo?: string
          titulo: string
          unit_id: string
          zona: string
        }
        Update: {
          atualizado_em?: string
          auditor?: string
          causa_provavel?: string | null
          created_at?: string
          desvio_pp?: number | null
          faixa_mercado?: string | null
          fonte_ok?: boolean
          id?: string
          indicador?: string
          marca?: string
          meta_interna?: number | null
          periodo?: string
          r_em_risco?: number | null
          realizado?: number | null
          resolucao?: string | null
          run_id?: string | null
          severidade?: string | null
          status?: string
          tipo?: string
          tipo_periodo?: string
          titulo?: string
          unit_id?: string
          zona?: string
        }
        Relationships: []
      }
      orkestri_leads: {
        Row: {
          cargo: string
          celular: string
          created_at: string | null
          dor: string | null
          email: string
          empresa: string
          id: string
          nome: string
          problema_1: string | null
          problema_2: string | null
          problema_3: string | null
        }
        Insert: {
          cargo: string
          celular: string
          created_at?: string | null
          dor?: string | null
          email: string
          empresa: string
          id?: string
          nome: string
          problema_1?: string | null
          problema_2?: string | null
          problema_3?: string | null
        }
        Update: {
          cargo?: string
          celular?: string
          created_at?: string | null
          dor?: string | null
          email?: string
          empresa?: string
          id?: string
          nome?: string
          problema_1?: string | null
          problema_2?: string | null
          problema_3?: string | null
        }
        Relationships: []
      }
      orquestrador_jobs: {
        Row: {
          created_at: string | null
          error_msg: string | null
          executed_at: string | null
          execution_result: Json | null
          id: string
          payload: Json | null
          result: Json | null
          status: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          error_msg?: string | null
          executed_at?: string | null
          execution_result?: Json | null
          id?: string
          payload?: Json | null
          result?: Json | null
          status?: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          error_msg?: string | null
          executed_at?: string | null
          execution_result?: Json | null
          id?: string
          payload?: Json | null
          result?: Json | null
          status?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      overtime_records: {
        Row: {
          approved: boolean | null
          approved_by: string | null
          created_at: string | null
          date: string
          employee_id: string
          hours: number
          id: string
          periodo: string | null
          reason: string | null
          source: string | null
          type: string
          unit_id: string
        }
        Insert: {
          approved?: boolean | null
          approved_by?: string | null
          created_at?: string | null
          date: string
          employee_id: string
          hours: number
          id?: string
          periodo?: string | null
          reason?: string | null
          source?: string | null
          type: string
          unit_id: string
        }
        Update: {
          approved?: boolean | null
          approved_by?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          hours?: number
          id?: string
          periodo?: string | null
          reason?: string | null
          source?: string | null
          type?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "overtime_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "overtime_records_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      page_views: {
        Row: {
          id: string
          path: string
          user_id: string | null
          visited_at: string
        }
        Insert: {
          id?: string
          path: string
          user_id?: string | null
          visited_at?: string
        }
        Update: {
          id?: string
          path?: string
          user_id?: string | null
          visited_at?: string
        }
        Relationships: []
      }
      payslips: {
        Row: {
          adiantamento: number | null
          adicional_noturno: number | null
          bonus: number | null
          cargo: string | null
          competencia: string
          created_at: string | null
          desconto_inss: number | null
          desconto_irrf: number | null
          desconto_vale_refeicao: number | null
          desconto_vale_transporte: number | null
          dsr_gorjeta: number | null
          employee_code: string | null
          employee_id: string
          faixa_irrf: string | null
          fgts: number | null
          fgts_base: number | null
          fgts_mes: number | null
          gorjeta: number | null
          horas_extras: number | null
          horas_trabalhadas: number | null
          id: string
          inss: number | null
          liquido: number
          nome: string | null
          observacoes: string | null
          outros_acrescimos: number | null
          outros_descontos: number | null
          pdf_url: string | null
          salario_base: number
          status: string | null
          tipo: string | null
          unit_id: string | null
          valor_liquido: number | null
          vr: number | null
          vt: number | null
        }
        Insert: {
          adiantamento?: number | null
          adicional_noturno?: number | null
          bonus?: number | null
          cargo?: string | null
          competencia: string
          created_at?: string | null
          desconto_inss?: number | null
          desconto_irrf?: number | null
          desconto_vale_refeicao?: number | null
          desconto_vale_transporte?: number | null
          dsr_gorjeta?: number | null
          employee_code?: string | null
          employee_id: string
          faixa_irrf?: string | null
          fgts?: number | null
          fgts_base?: number | null
          fgts_mes?: number | null
          gorjeta?: number | null
          horas_extras?: number | null
          horas_trabalhadas?: number | null
          id?: string
          inss?: number | null
          liquido: number
          nome?: string | null
          observacoes?: string | null
          outros_acrescimos?: number | null
          outros_descontos?: number | null
          pdf_url?: string | null
          salario_base: number
          status?: string | null
          tipo?: string | null
          unit_id?: string | null
          valor_liquido?: number | null
          vr?: number | null
          vt?: number | null
        }
        Update: {
          adiantamento?: number | null
          adicional_noturno?: number | null
          bonus?: number | null
          cargo?: string | null
          competencia?: string
          created_at?: string | null
          desconto_inss?: number | null
          desconto_irrf?: number | null
          desconto_vale_refeicao?: number | null
          desconto_vale_transporte?: number | null
          dsr_gorjeta?: number | null
          employee_code?: string | null
          employee_id?: string
          faixa_irrf?: string | null
          fgts?: number | null
          fgts_base?: number | null
          fgts_mes?: number | null
          gorjeta?: number | null
          horas_extras?: number | null
          horas_trabalhadas?: number | null
          id?: string
          inss?: number | null
          liquido?: number
          nome?: string | null
          observacoes?: string | null
          outros_acrescimos?: number | null
          outros_descontos?: number | null
          pdf_url?: string | null
          salario_base?: number
          status?: string | null
          tipo?: string | null
          unit_id?: string | null
          valor_liquido?: number | null
          vr?: number | null
          vt?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      pdi_metas: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          pdi_id: string
          prazo: string | null
          progresso: number | null
          status: string
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          pdi_id: string
          prazo?: string | null
          progresso?: number | null
          status?: string
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          pdi_id?: string
          prazo?: string | null
          progresso?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdi_metas_pdi_id_fkey"
            columns: ["pdi_id"]
            isOneToOne: false
            referencedRelation: "pdis"
            referencedColumns: ["id"]
          },
        ]
      }
      pdis: {
        Row: {
          avaliacao_id: string | null
          created_at: string | null
          created_by: string | null
          criado_por: string | null
          data_fim: string
          data_inicio: string
          descricao: string | null
          employee_id: string
          id: string
          status: string
          titulo: string
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          avaliacao_id?: string | null
          created_at?: string | null
          created_by?: string | null
          criado_por?: string | null
          data_fim: string
          data_inicio: string
          descricao?: string | null
          employee_id: string
          id?: string
          status?: string
          titulo: string
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          avaliacao_id?: string | null
          created_at?: string | null
          created_by?: string | null
          criado_por?: string | null
          data_fim?: string
          data_inicio?: string
          descricao?: string | null
          employee_id?: string
          id?: string
          status?: string
          titulo?: string
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pdis_avaliacao_id_fkey"
            columns: ["avaliacao_id"]
            isOneToOne: false
            referencedRelation: "performance_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdis_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdis_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          anonimo: boolean | null
          avaliador_id: string | null
          created_at: string | null
          data_avaliacao: string | null
          employee_id: string
          id: string
          nota_geral: number | null
          periodo: string
          plano_acao: string | null
          pontos_fortes: string | null
          pontos_melhoria: string | null
          respostas: Json
          status: string
          template_id: string
          tipo_avaliador: string | null
          updated_at: string | null
        }
        Insert: {
          anonimo?: boolean | null
          avaliador_id?: string | null
          created_at?: string | null
          data_avaliacao?: string | null
          employee_id: string
          id?: string
          nota_geral?: number | null
          periodo: string
          plano_acao?: string | null
          pontos_fortes?: string | null
          pontos_melhoria?: string | null
          respostas?: Json
          status?: string
          template_id: string
          tipo_avaliador?: string | null
          updated_at?: string | null
        }
        Update: {
          anonimo?: boolean | null
          avaliador_id?: string | null
          created_at?: string | null
          data_avaliacao?: string | null
          employee_id?: string
          id?: string
          nota_geral?: number | null
          periodo?: string
          plano_acao?: string | null
          pontos_fortes?: string | null
          pontos_melhoria?: string | null
          respostas?: Json
          status?: string
          template_id?: string
          tipo_avaliador?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "performance_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_templates: {
        Row: {
          ativo: boolean | null
          brand_id: string
          created_at: string | null
          created_by: string | null
          criterios: Json
          descricao: string | null
          funcao: string | null
          id: string
          nome: string
          periodicidade: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          brand_id: string
          created_at?: string | null
          created_by?: string | null
          criterios?: Json
          descricao?: string | null
          funcao?: string | null
          id?: string
          nome: string
          periodicidade: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          brand_id?: string
          created_at?: string | null
          created_by?: string | null
          criterios?: Json
          descricao?: string | null
          funcao?: string | null
          id?: string
          nome?: string
          periodicidade?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_templates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_templates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "performance_templates_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_members: {
        Row: {
          member_id: string
          plan_id: string
        }
        Insert: {
          member_id: string
          plan_id: string
        }
        Update: {
          member_id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_members_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_members_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ponto_mensal: {
        Row: {
          abonado_dias: number | null
          abonado_horas: string | null
          adicional_noturno: string | null
          afastamentos_dias: number | null
          afastamentos_horas: string | null
          atestado_medico: string | null
          banco_horas_acumulado: string | null
          banco_horas_mes: string | null
          cargo: string | null
          compensacao_bh: string | null
          confraternizacao: string | null
          cpf: string | null
          created_at: string | null
          data_admissao: string | null
          data_demissao: string | null
          departamento: string | null
          employee_id: string | null
          falta_injustificada_dias: number | null
          falta_injustificada_horas: string | null
          feriados_dias: number | null
          ferias_dias: number | null
          ferias_horas: string | null
          folga_domingo: string | null
          folga_feriado: string | null
          horas_negativas: string | null
          horas_positivas: string | null
          horas_previstas: string | null
          horas_trabalhadas: string | null
          id: string
          importado_em: string | null
          inss_dias: number | null
          inss_horas: string | null
          licenca_paternidade_dias: number | null
          licenca_paternidade_horas: string | null
          matricula: string | null
          nome: string
          periodo: string
          saldo: string | null
          unit_id: string
        }
        Insert: {
          abonado_dias?: number | null
          abonado_horas?: string | null
          adicional_noturno?: string | null
          afastamentos_dias?: number | null
          afastamentos_horas?: string | null
          atestado_medico?: string | null
          banco_horas_acumulado?: string | null
          banco_horas_mes?: string | null
          cargo?: string | null
          compensacao_bh?: string | null
          confraternizacao?: string | null
          cpf?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          departamento?: string | null
          employee_id?: string | null
          falta_injustificada_dias?: number | null
          falta_injustificada_horas?: string | null
          feriados_dias?: number | null
          ferias_dias?: number | null
          ferias_horas?: string | null
          folga_domingo?: string | null
          folga_feriado?: string | null
          horas_negativas?: string | null
          horas_positivas?: string | null
          horas_previstas?: string | null
          horas_trabalhadas?: string | null
          id?: string
          importado_em?: string | null
          inss_dias?: number | null
          inss_horas?: string | null
          licenca_paternidade_dias?: number | null
          licenca_paternidade_horas?: string | null
          matricula?: string | null
          nome: string
          periodo: string
          saldo?: string | null
          unit_id: string
        }
        Update: {
          abonado_dias?: number | null
          abonado_horas?: string | null
          adicional_noturno?: string | null
          afastamentos_dias?: number | null
          afastamentos_horas?: string | null
          atestado_medico?: string | null
          banco_horas_acumulado?: string | null
          banco_horas_mes?: string | null
          cargo?: string | null
          compensacao_bh?: string | null
          confraternizacao?: string | null
          cpf?: string | null
          created_at?: string | null
          data_admissao?: string | null
          data_demissao?: string | null
          departamento?: string | null
          employee_id?: string | null
          falta_injustificada_dias?: number | null
          falta_injustificada_horas?: string | null
          feriados_dias?: number | null
          ferias_dias?: number | null
          ferias_horas?: string | null
          folga_domingo?: string | null
          folga_feriado?: string | null
          horas_negativas?: string | null
          horas_positivas?: string | null
          horas_previstas?: string | null
          horas_trabalhadas?: string | null
          id?: string
          importado_em?: string | null
          inss_dias?: number | null
          inss_horas?: string | null
          licenca_paternidade_dias?: number | null
          licenca_paternidade_horas?: string | null
          matricula?: string | null
          nome?: string
          periodo?: string
          saldo?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ponto_mensal_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ponto_mensal_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      price_quote_items: {
        Row: {
          created_at: string
          descricao: string
          id: string
          observacoes: string | null
          preco_unitario: number | null
          quantidade: number
          quote_id: string
          total: number | null
          unidade: string
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          observacoes?: string | null
          preco_unitario?: number | null
          quantidade: number
          quote_id: string
          total?: number | null
          unidade?: string
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          observacoes?: string | null
          preco_unitario?: number | null
          quantidade?: number
          quote_id?: string
          total?: number | null
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "price_quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      price_quotes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          observacoes: string | null
          periodo: string
          status: Database["public"]["Enums"]["quote_status"]
          supplier_id: string | null
          titulo: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          observacoes?: string | null
          periodo: string
          status?: Database["public"]["Enums"]["quote_status"]
          supplier_id?: string | null
          titulo?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          observacoes?: string | null
          periodo?: string
          status?: Database["public"]["Enums"]["quote_status"]
          supplier_id?: string | null
          titulo?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_quotes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_quotes_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos_relatorio: {
        Row: {
          ano_lancamento: number
          calcula_cmv: boolean | null
          codigo_gerencial: string | null
          criado_em: string | null
          desc_gerencial: string | null
          dt_emissao: string | null
          fornecedor_codigo: string | null
          fornecedor_nome: string | null
          id: number
          item_codigo: string | null
          item_descricao: string | null
          mes_lancamento: number
          nr_danfe: string | null
          perc_variacao: number | null
          q_embalagem: number | null
          q_estoque: number | null
          tipo_item: string | null
          unidade_medida: string | null
          unit_id: string
          v_custo_compra: number | null
          v_custo_medio: number | null
          v_custo_total: number | null
          v_embalagem: number | null
          v_total_danfe: number | null
          v_total_embalagem: number | null
        }
        Insert: {
          ano_lancamento: number
          calcula_cmv?: boolean | null
          codigo_gerencial?: string | null
          criado_em?: string | null
          desc_gerencial?: string | null
          dt_emissao?: string | null
          fornecedor_codigo?: string | null
          fornecedor_nome?: string | null
          id?: number
          item_codigo?: string | null
          item_descricao?: string | null
          mes_lancamento: number
          nr_danfe?: string | null
          perc_variacao?: number | null
          q_embalagem?: number | null
          q_estoque?: number | null
          tipo_item?: string | null
          unidade_medida?: string | null
          unit_id: string
          v_custo_compra?: number | null
          v_custo_medio?: number | null
          v_custo_total?: number | null
          v_embalagem?: number | null
          v_total_danfe?: number | null
          v_total_embalagem?: number | null
        }
        Update: {
          ano_lancamento?: number
          calcula_cmv?: boolean | null
          codigo_gerencial?: string | null
          criado_em?: string | null
          desc_gerencial?: string | null
          dt_emissao?: string | null
          fornecedor_codigo?: string | null
          fornecedor_nome?: string | null
          id?: number
          item_codigo?: string | null
          item_descricao?: string | null
          mes_lancamento?: number
          nr_danfe?: string | null
          perc_variacao?: number | null
          q_embalagem?: number | null
          q_estoque?: number | null
          tipo_item?: string | null
          unidade_medida?: string | null
          unit_id?: string
          v_custo_compra?: number | null
          v_custo_medio?: number | null
          v_custo_total?: number | null
          v_embalagem?: number | null
          v_total_danfe?: number | null
          v_total_embalagem?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      project_invites: {
        Row: {
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          project_id: string | null
          token: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          project_id?: string | null
          token?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          project_id?: string | null
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_invites_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_members: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          project_id: string | null
          role: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          project_id?: string | null
          role?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          project_id?: string | null
          role?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          name: string
          owner_id: string | null
          start_date: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          owner_id?: string | null
          start_date?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          start_date?: string | null
          status?: string | null
        }
        Relationships: []
      }
      Projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      punch_adjustment_requests: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          created_at: string
          data_referencia: string
          employee_id: string
          horario_retorno_almoco: string
          horario_saida_almoco: string
          id: string
          motivo: string
          status: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          data_referencia: string
          employee_id: string
          horario_retorno_almoco: string
          horario_saida_almoco: string
          id?: string
          motivo: string
          status?: string
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          created_at?: string
          data_referencia?: string
          employee_id?: string
          horario_retorno_almoco?: string
          horario_saida_almoco?: string
          id?: string
          motivo?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "punch_adjustment_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoice_items: {
        Row: {
          categoria_gerencial_codigo: string | null
          categoria_gerencial_nome: string | null
          created_at: string | null
          custo_medio: number | null
          custo_ultima_compra: number | null
          data_lancamento: string | null
          id: string
          ingredient_codigo: string
          ingredient_id: string | null
          ingredient_nome: string
          purchase_invoice_id: string
          quantidade_embalagem: number | null
          quantidade_estoque: number | null
          unidade: string | null
          valor_embalagem: number | null
          valor_total: number | null
        }
        Insert: {
          categoria_gerencial_codigo?: string | null
          categoria_gerencial_nome?: string | null
          created_at?: string | null
          custo_medio?: number | null
          custo_ultima_compra?: number | null
          data_lancamento?: string | null
          id?: string
          ingredient_codigo: string
          ingredient_id?: string | null
          ingredient_nome: string
          purchase_invoice_id: string
          quantidade_embalagem?: number | null
          quantidade_estoque?: number | null
          unidade?: string | null
          valor_embalagem?: number | null
          valor_total?: number | null
        }
        Update: {
          categoria_gerencial_codigo?: string | null
          categoria_gerencial_nome?: string | null
          created_at?: string | null
          custo_medio?: number | null
          custo_ultima_compra?: number | null
          data_lancamento?: string | null
          id?: string
          ingredient_codigo?: string
          ingredient_id?: string | null
          ingredient_nome?: string
          purchase_invoice_id?: string
          quantidade_embalagem?: number | null
          quantidade_estoque?: number | null
          unidade?: string | null
          valor_embalagem?: number | null
          valor_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoice_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_invoice_items_purchase_invoice_id_fkey"
            columns: ["purchase_invoice_id"]
            isOneToOne: false
            referencedRelation: "purchase_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_invoices: {
        Row: {
          cfop: string | null
          created_at: string | null
          data_emissao: string
          fornecedor_codigo: string | null
          fornecedor_nome: string | null
          id: string
          mes_referencia: string | null
          numero_danfe: string
          origem: string | null
          situacao: string | null
          unit_id: string
          valor_total: number
        }
        Insert: {
          cfop?: string | null
          created_at?: string | null
          data_emissao: string
          fornecedor_codigo?: string | null
          fornecedor_nome?: string | null
          id?: string
          mes_referencia?: string | null
          numero_danfe: string
          origem?: string | null
          situacao?: string | null
          unit_id: string
          valor_total: number
        }
        Update: {
          cfop?: string | null
          created_at?: string | null
          data_emissao?: string
          fornecedor_codigo?: string | null
          fornecedor_nome?: string | null
          id?: string
          mes_referencia?: string | null
          numero_danfe?: string
          origem?: string | null
          situacao?: string | null
          unit_id?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_invoices_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string | null
          id: string
          nome: string
          order_id: string
          preco_unitario: number
          quantidade: number
          quantidade_recebida: number
          total: number | null
          unidade: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          nome: string
          order_id: string
          preco_unitario?: number
          quantidade?: number
          quantidade_recebida?: number
          total?: number | null
          unidade?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome?: string
          order_id?: string
          preco_unitario?: number
          quantidade?: number
          quantidade_recebida?: number
          total?: number | null
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          brand_id: string
          created_at: string | null
          created_by: string | null
          data_pedido: string
          data_prevista: string | null
          fornecedor: string | null
          id: string
          numero: string
          observacoes: string | null
          solicitante_nome: string | null
          status: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id: string | null
          unit_id: string
          updated_at: string | null
          valor_total: number
        }
        Insert: {
          brand_id: string
          created_at?: string | null
          created_by?: string | null
          data_pedido?: string
          data_prevista?: string | null
          fornecedor?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          solicitante_nome?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id?: string | null
          unit_id: string
          updated_at?: string | null
          valor_total?: number
        }
        Update: {
          brand_id?: string
          created_at?: string | null
          created_by?: string | null
          data_pedido?: string
          data_prevista?: string | null
          fornecedor?: string | null
          id?: string
          numero?: string
          observacoes?: string | null
          solicitante_nome?: string | null
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id?: string | null
          unit_id?: string
          updated_at?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_checklists: {
        Row: {
          area: Database["public"]["Enums"]["checklist_area"]
          ativo: boolean
          created_at: string
          id: string
          items: Json
          nome: string
          turno: Database["public"]["Enums"]["checklist_turno"]
          unit_id: string
        }
        Insert: {
          area?: Database["public"]["Enums"]["checklist_area"]
          ativo?: boolean
          created_at?: string
          id?: string
          items?: Json
          nome: string
          turno?: Database["public"]["Enums"]["checklist_turno"]
          unit_id: string
        }
        Update: {
          area?: Database["public"]["Enums"]["checklist_area"]
          ativo?: boolean
          created_at?: string
          id?: string
          items?: Json
          nome?: string
          turno?: Database["public"]["Enums"]["checklist_turno"]
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_checklists_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimento_itens: {
        Row: {
          created_at: string
          id: string
          nome: string
          observacao: string | null
          pedido_item_id: string
          quantidade_pedida: number
          quantidade_recebida: number
          recebimento_id: string
          status: string
          unidade: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          observacao?: string | null
          pedido_item_id: string
          quantidade_pedida: number
          quantidade_recebida?: number
          recebimento_id: string
          status?: string
          unidade: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          observacao?: string | null
          pedido_item_id?: string
          quantidade_pedida?: number
          quantidade_recebida?: number
          recebimento_id?: string
          status?: string
          unidade?: string
        }
        Relationships: [
          {
            foreignKeyName: "recebimento_itens_pedido_item_id_fkey"
            columns: ["pedido_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recebimento_itens_recebimento_id_fkey"
            columns: ["recebimento_id"]
            isOneToOne: false
            referencedRelation: "recebimentos"
            referencedColumns: ["id"]
          },
        ]
      }
      recebimentos: {
        Row: {
          assinatura_nome: string | null
          created_at: string
          id: string
          observacao: string | null
          pedido_id: string
          recebido_por: string
          status: string
          unit_id: string
        }
        Insert: {
          assinatura_nome?: string | null
          created_at?: string
          id?: string
          observacao?: string | null
          pedido_id: string
          recebido_por: string
          status?: string
          unit_id: string
        }
        Update: {
          assinatura_nome?: string | null
          created_at?: string
          id?: string
          observacao?: string | null
          pedido_id?: string
          recebido_por?: string
          status?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recebimentos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_items: {
        Row: {
          created_at: string | null
          custo_total: number | null
          custo_unitario: number
          id: string
          ingredient_id: string | null
          insumo: string
          menu_item_id: string
          observacoes: string | null
          ordem: number | null
          perda_pct: number | null
          quantidade: number
          unidade: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custo_total?: number | null
          custo_unitario?: number
          id?: string
          ingredient_id?: string | null
          insumo?: string
          menu_item_id: string
          observacoes?: string | null
          ordem?: number | null
          perda_pct?: number | null
          quantidade?: number
          unidade?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custo_total?: number | null
          custo_unitario?: number
          id?: string
          ingredient_id?: string | null
          insumo?: string
          menu_item_id?: string
          observacoes?: string | null
          ordem?: number | null
          perda_pct?: number | null
          quantidade?: number
          unidade?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "v_cmv_produto"
            referencedColumns: ["produto_id"]
          },
        ]
      }
      recipe_notes: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          menu_item_id: string
          nota: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          menu_item_id: string
          nota: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          menu_item_id?: string
          nota?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_notes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_notes_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "v_cmv_produto"
            referencedColumns: ["produto_id"]
          },
        ]
      }
      relatorio_produtos: {
        Row: {
          ano_lancamento: number | null
          calcula_cmv: boolean | null
          codigo_gerencial: number | null
          created_at: string | null
          desc_gerencial: string | null
          dt_emissao: string | null
          fornecedor_codigo: number | null
          fornecedor_nome: string | null
          id: number
          item_codigo: string | null
          item_descricao: string | null
          mes_lancamento: number | null
          nr_danfe: string | null
          perc_variacao: number | null
          q_embalagem: number | null
          q_estoque: number | null
          tipo_item: string | null
          unidade_medida: string | null
          unit_id: string | null
          v_custo_compra: number | null
          v_custo_medio: number | null
          v_custo_total: number | null
          v_embalagem: number | null
          v_total_danfe: number | null
          v_total_embalagem: number | null
        }
        Insert: {
          ano_lancamento?: number | null
          calcula_cmv?: boolean | null
          codigo_gerencial?: number | null
          created_at?: string | null
          desc_gerencial?: string | null
          dt_emissao?: string | null
          fornecedor_codigo?: number | null
          fornecedor_nome?: string | null
          id?: number
          item_codigo?: string | null
          item_descricao?: string | null
          mes_lancamento?: number | null
          nr_danfe?: string | null
          perc_variacao?: number | null
          q_embalagem?: number | null
          q_estoque?: number | null
          tipo_item?: string | null
          unidade_medida?: string | null
          unit_id?: string | null
          v_custo_compra?: number | null
          v_custo_medio?: number | null
          v_custo_total?: number | null
          v_embalagem?: number | null
          v_total_danfe?: number | null
          v_total_embalagem?: number | null
        }
        Update: {
          ano_lancamento?: number | null
          calcula_cmv?: boolean | null
          codigo_gerencial?: number | null
          created_at?: string | null
          desc_gerencial?: string | null
          dt_emissao?: string | null
          fornecedor_codigo?: number | null
          fornecedor_nome?: string | null
          id?: number
          item_codigo?: string | null
          item_descricao?: string | null
          mes_lancamento?: number | null
          nr_danfe?: string | null
          perc_variacao?: number | null
          q_embalagem?: number | null
          q_estoque?: number | null
          tipo_item?: string | null
          unidade_medida?: string | null
          unit_id?: string | null
          v_custo_compra?: number | null
          v_custo_medio?: number | null
          v_custo_total?: number | null
          v_embalagem?: number | null
          v_total_danfe?: number | null
          v_total_embalagem?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "relatorio_produtos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          cliente_email: string | null
          cliente_nome: string
          cliente_telefone: string | null
          confirmado_em: string | null
          confirmado_por: string | null
          created_at: string
          created_by: string | null
          data: string
          hora: string
          id: string
          mesa: string | null
          observacoes: string | null
          origem: Database["public"]["Enums"]["reservation_origem"]
          pax: number
          status: Database["public"]["Enums"]["reservation_status"]
          unit_id: string
          updated_at: string
        }
        Insert: {
          cliente_email?: string | null
          cliente_nome: string
          cliente_telefone?: string | null
          confirmado_em?: string | null
          confirmado_por?: string | null
          created_at?: string
          created_by?: string | null
          data: string
          hora: string
          id?: string
          mesa?: string | null
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["reservation_origem"]
          pax: number
          status?: Database["public"]["Enums"]["reservation_status"]
          unit_id: string
          updated_at?: string
        }
        Update: {
          cliente_email?: string | null
          cliente_nome?: string
          cliente_telefone?: string | null
          confirmado_em?: string | null
          confirmado_por?: string | null
          created_at?: string
          created_by?: string | null
          data?: string
          hora?: string
          id?: string
          mesa?: string | null
          observacoes?: string | null
          origem?: Database["public"]["Enums"]["reservation_origem"]
          pax?: number
          status?: Database["public"]["Enums"]["reservation_status"]
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      reuniao_action_items: {
        Row: {
          created_at: string | null
          descricao: string
          id: string
          prazo: string | null
          responsavel_id: string | null
          reuniao_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          descricao: string
          id?: string
          prazo?: string | null
          responsavel_id?: string | null
          reuniao_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          descricao?: string
          id?: string
          prazo?: string | null
          responsavel_id?: string | null
          reuniao_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reuniao_action_items_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reuniao_action_items_reuniao_id_fkey"
            columns: ["reuniao_id"]
            isOneToOne: false
            referencedRelation: "reunioes_1on1"
            referencedColumns: ["id"]
          },
        ]
      }
      reunioes_1on1: {
        Row: {
          colaborador_id: string
          created_at: string | null
          created_by: string | null
          data_reuniao: string
          duracao_min: number | null
          gestor_id: string
          id: string
          notas: string | null
          status: string
          unit_id: string
        }
        Insert: {
          colaborador_id: string
          created_at?: string | null
          created_by?: string | null
          data_reuniao: string
          duracao_min?: number | null
          gestor_id: string
          id?: string
          notas?: string | null
          status?: string
          unit_id: string
        }
        Update: {
          colaborador_id?: string
          created_at?: string | null
          created_by?: string | null
          data_reuniao?: string
          duracao_min?: number | null
          gestor_id?: string
          id?: string
          notas?: string | null
          status?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reunioes_1on1_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_1on1_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_1on1_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          module: string | null
          sprint: number
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          module?: string | null
          sprint: number
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          module?: string | null
          sprint?: number
          status?: string
          title?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          dept: string | null
          description: string | null
          id: string
          level: string | null
          name: string
          permissions: Json
          sector: string | null
          tier: string | null
        }
        Insert: {
          dept?: string | null
          description?: string | null
          id?: string
          level?: string | null
          name: string
          permissions?: Json
          sector?: string | null
          tier?: string | null
        }
        Update: {
          dept?: string | null
          description?: string | null
          id?: string
          level?: string | null
          name?: string
          permissions?: Json
          sector?: string | null
          tier?: string | null
        }
        Relationships: []
      }
      score_events: {
        Row: {
          created_at: string | null
          delta: number
          descricao: string | null
          employee_id: string
          id: string
          referencia_id: string | null
          tipo: string
        }
        Insert: {
          created_at?: string | null
          delta: number
          descricao?: string | null
          employee_id: string
          id?: string
          referencia_id?: string | null
          tipo: string
        }
        Update: {
          created_at?: string | null
          delta?: number
          descricao?: string | null
          employee_id?: string
          id?: string
          referencia_id?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "score_events_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          area: string | null
          created_at: string | null
          data: string
          employee_id: string
          hora_fim: string
          hora_inicio: string
          id: string
          labor_cost: number | null
          observacao: string | null
          tipo: string | null
          unit_id: string
        }
        Insert: {
          area?: string | null
          created_at?: string | null
          data: string
          employee_id: string
          hora_fim: string
          hora_inicio: string
          id?: string
          labor_cost?: number | null
          observacao?: string | null
          tipo?: string | null
          unit_id: string
        }
        Update: {
          area?: string | null
          created_at?: string | null
          data?: string
          employee_id?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          labor_cost?: number | null
          observacao?: string | null
          tipo?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      sick_leaves: {
        Row: {
          cid: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          documento_ref: string | null
          employee_id: string | null
          id: string
          medico: string | null
          nome: string | null
          tipo: string | null
          total_dias: number | null
          unit_id: string | null
        }
        Insert: {
          cid?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          documento_ref?: string | null
          employee_id?: string | null
          id?: string
          medico?: string | null
          nome?: string | null
          tipo?: string | null
          total_dias?: number | null
          unit_id?: string | null
        }
        Update: {
          cid?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          documento_ref?: string | null
          employee_id?: string | null
          id?: string
          medico?: string | null
          nome?: string | null
          tipo?: string | null
          total_dias?: number | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sick_leaves_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sick_leaves_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          ativo: boolean | null
          brand_id: string
          categoria: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          nome: string
          telefone: string | null
          unit_id: string
        }
        Insert: {
          ativo?: boolean | null
          brand_id: string
          categoria?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome: string
          telefone?: string | null
          unit_id: string
        }
        Update: {
          ativo?: boolean | null
          brand_id?: string
          categoria?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suppliers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "suppliers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      target_notes: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          nota: string
          target_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          nota: string
          target_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          nota?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_notes_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "brand_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          member_id: string
          task_id: string
        }
        Insert: {
          member_id: string
          task_id: string
        }
        Update: {
          member_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      Task_Assignees: {
        Row: {
          member_id: string
          task_id: string
        }
        Insert: {
          member_id: string
          task_id: string
        }
        Update: {
          member_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "Task_Assignees_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "Team_Members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Task_Assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "Tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          bucket_id: string | null
          description: string | null
          due_date: string | null
          id: string
          label_color: string | null
          label_text: string | null
          priority: string | null
          project_id: string
          start_date: string | null
          status: string
          title: string
        }
        Insert: {
          bucket_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          label_color?: string | null
          label_text?: string | null
          priority?: string | null
          project_id: string
          start_date?: string | null
          status?: string
          title: string
        }
        Update: {
          bucket_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          label_color?: string | null
          label_text?: string | null
          priority?: string | null
          project_id?: string
          start_date?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      Tasks: {
        Row: {
          description: string | null
          due_date: string | null
          id: string
          project_id: string
          status: string
          title: string
        }
        Insert: {
          description?: string | null
          due_date?: string | null
          id?: string
          project_id: string
          status?: string
          title: string
        }
        Update: {
          description?: string | null
          due_date?: string | null
          id?: string
          project_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "Tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "Projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          name: string
          role: string
        }
        Insert: {
          id?: string
          name: string
          role: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
        }
        Relationships: []
      }
      Team_Members: {
        Row: {
          id: string
          name: string
          role: string
        }
        Insert: {
          id?: string
          name: string
          role: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
        }
        Relationships: []
      }
      terminations: {
        Row: {
          created_at: string | null
          data_aviso: string | null
          employee_id: string | null
          id: string
          motivo: string | null
          nome: string | null
          status: string | null
          tipo_aviso: string | null
          unit_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_aviso?: string | null
          employee_id?: string | null
          id?: string
          motivo?: string | null
          nome?: string | null
          status?: string | null
          tipo_aviso?: string | null
          unit_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_aviso?: string | null
          employee_id?: string | null
          id?: string
          motivo?: string | null
          nome?: string | null
          status?: string | null
          tipo_aviso?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "terminations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "terminations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      theo_tickets: {
        Row: {
          categoria: string
          created_at: string | null
          descricao: string | null
          employee_id: string | null
          id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          categoria: string
          created_at?: string | null
          descricao?: string | null
          employee_id?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          categoria?: string
          created_at?: string | null
          descricao?: string | null
          employee_id?: string | null
          id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "theo_tickets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      time_bank_balance: {
        Row: {
          employee_id: string
          id: string
          observacao: string | null
          saldo_minutos: number | null
          source: string | null
          ultimo_calculo: string | null
          updated_at: string | null
        }
        Insert: {
          employee_id: string
          id?: string
          observacao?: string | null
          saldo_minutos?: number | null
          source?: string | null
          ultimo_calculo?: string | null
          updated_at?: string | null
        }
        Update: {
          employee_id?: string
          id?: string
          observacao?: string | null
          saldo_minutos?: number | null
          source?: string | null
          ultimo_calculo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_bank_balance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      time_clock_punches: {
        Row: {
          aprovado: boolean | null
          aprovado_por: string | null
          created_at: string | null
          device_info: string | null
          distance_meters: number | null
          employee_id: string
          gps_failed: boolean | null
          id: string
          latitude: number | null
          longitude: number | null
          timestamp_punch: string
          tipo: string
        }
        Insert: {
          aprovado?: boolean | null
          aprovado_por?: string | null
          created_at?: string | null
          device_info?: string | null
          distance_meters?: number | null
          employee_id: string
          gps_failed?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          timestamp_punch?: string
          tipo: string
        }
        Update: {
          aprovado?: boolean | null
          aprovado_por?: string | null
          created_at?: string | null
          device_info?: string | null
          distance_meters?: number | null
          employee_id?: string
          gps_failed?: boolean | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          timestamp_punch?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_clock_punches_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_clock_punches_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      time_records: {
        Row: {
          adicional_noturno: string | null
          afastamentos_dias: number | null
          atestado_horas: string | null
          banco_horas_acumulado: string | null
          banco_horas_negativo: string | null
          banco_horas_positivo: string | null
          created_at: string | null
          employee_id: string
          faltas_injustificadas_dias: number | null
          ferias_dias: number | null
          fonte: string | null
          horas_previstas: string | null
          horas_trabalhadas: string | null
          id: string
          notes: string | null
          periodo: string
          saldo_banco: string | null
          unit_id: string
        }
        Insert: {
          adicional_noturno?: string | null
          afastamentos_dias?: number | null
          atestado_horas?: string | null
          banco_horas_acumulado?: string | null
          banco_horas_negativo?: string | null
          banco_horas_positivo?: string | null
          created_at?: string | null
          employee_id: string
          faltas_injustificadas_dias?: number | null
          ferias_dias?: number | null
          fonte?: string | null
          horas_previstas?: string | null
          horas_trabalhadas?: string | null
          id?: string
          notes?: string | null
          periodo: string
          saldo_banco?: string | null
          unit_id: string
        }
        Update: {
          adicional_noturno?: string | null
          afastamentos_dias?: number | null
          atestado_horas?: string | null
          banco_horas_acumulado?: string | null
          banco_horas_negativo?: string | null
          banco_horas_positivo?: string | null
          created_at?: string | null
          employee_id?: string
          faltas_injustificadas_dias?: number | null
          ferias_dias?: number | null
          fonte?: string | null
          horas_previstas?: string | null
          horas_trabalhadas?: string | null
          id?: string
          notes?: string | null
          periodo?: string
          saldo_banco?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_records_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      titulo_override: {
        Row: {
          criado_em: string | null
          id: string
          linha_dre_corrigida: string | null
          observacao: string | null
          titulo_id: string
        }
        Insert: {
          criado_em?: string | null
          id?: string
          linha_dre_corrigida?: string | null
          observacao?: string | null
          titulo_id: string
        }
        Update: {
          criado_em?: string | null
          id?: string
          linha_dre_corrigida?: string | null
          observacao?: string | null
          titulo_id?: string
        }
        Relationships: []
      }
      titulos_a_pagar: {
        Row: {
          ano: number | null
          bairro: string | null
          c_gerencial: string | null
          cep: string | null
          cidade: string | null
          cnpj_cpf_fornecedor: string | null
          condicao_compra: string | null
          d_autorizacao_pgto: string | null
          d_competencia: string | null
          d_lancamento: string | null
          d_liquidacao_atual: string | null
          d_liquidacao_periodo: string | null
          d_vencimento: string | null
          descricao_c_gerencial: string | null
          dia_semana: string | null
          dias_atraso_atual: number | null
          dias_atraso_periodo: number | null
          documento: string | null
          empresa: string | null
          fantasia_empresa: string | null
          fantasia_fornecedor: string | null
          fluxo_de_caixa: boolean | null
          fornecedor: string | null
          grupo_economico: string | null
          id: string
          importado_em: string | null
          mes: string | null
          n_conta: string | null
          n_nota_fiscal: string | null
          n_titulo: string | null
          origem: string | null
          pais: string | null
          parcela: string | null
          portador: string | null
          portador_num: string | null
          prazo_medio: number | null
          quadrimestre: number | null
          razao_fornecedor: string | null
          ref_mes: string | null
          semana: number | null
          serie: string | null
          situacao_atual: string | null
          situacao_periodo: string | null
          t_fornecedor: string | null
          tipo: string | null
          tipo_sep: string | null
          trimestre: number | null
          uf: string | null
          v_atraso_atual: number | null
          v_atraso_periodo: number | null
          v_atualizado_atual: number | null
          v_atualizado_periodo: number | null
          v_credito_periodo: number | null
          v_debito_periodo: number | null
          v_desconto: number | null
          v_juros_dia: number | null
          v_multa_atraso: number | null
          v_original: number | null
          v_saldo_anterior: number | null
          v_saldo_atual: number | null
          v_saldo_periodo: number | null
          v_titulo: number | null
        }
        Insert: {
          ano?: number | null
          bairro?: string | null
          c_gerencial?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf_fornecedor?: string | null
          condicao_compra?: string | null
          d_autorizacao_pgto?: string | null
          d_competencia?: string | null
          d_lancamento?: string | null
          d_liquidacao_atual?: string | null
          d_liquidacao_periodo?: string | null
          d_vencimento?: string | null
          descricao_c_gerencial?: string | null
          dia_semana?: string | null
          dias_atraso_atual?: number | null
          dias_atraso_periodo?: number | null
          documento?: string | null
          empresa?: string | null
          fantasia_empresa?: string | null
          fantasia_fornecedor?: string | null
          fluxo_de_caixa?: boolean | null
          fornecedor?: string | null
          grupo_economico?: string | null
          id: string
          importado_em?: string | null
          mes?: string | null
          n_conta?: string | null
          n_nota_fiscal?: string | null
          n_titulo?: string | null
          origem?: string | null
          pais?: string | null
          parcela?: string | null
          portador?: string | null
          portador_num?: string | null
          prazo_medio?: number | null
          quadrimestre?: number | null
          razao_fornecedor?: string | null
          ref_mes?: string | null
          semana?: number | null
          serie?: string | null
          situacao_atual?: string | null
          situacao_periodo?: string | null
          t_fornecedor?: string | null
          tipo?: string | null
          tipo_sep?: string | null
          trimestre?: number | null
          uf?: string | null
          v_atraso_atual?: number | null
          v_atraso_periodo?: number | null
          v_atualizado_atual?: number | null
          v_atualizado_periodo?: number | null
          v_credito_periodo?: number | null
          v_debito_periodo?: number | null
          v_desconto?: number | null
          v_juros_dia?: number | null
          v_multa_atraso?: number | null
          v_original?: number | null
          v_saldo_anterior?: number | null
          v_saldo_atual?: number | null
          v_saldo_periodo?: number | null
          v_titulo?: number | null
        }
        Update: {
          ano?: number | null
          bairro?: string | null
          c_gerencial?: string | null
          cep?: string | null
          cidade?: string | null
          cnpj_cpf_fornecedor?: string | null
          condicao_compra?: string | null
          d_autorizacao_pgto?: string | null
          d_competencia?: string | null
          d_lancamento?: string | null
          d_liquidacao_atual?: string | null
          d_liquidacao_periodo?: string | null
          d_vencimento?: string | null
          descricao_c_gerencial?: string | null
          dia_semana?: string | null
          dias_atraso_atual?: number | null
          dias_atraso_periodo?: number | null
          documento?: string | null
          empresa?: string | null
          fantasia_empresa?: string | null
          fantasia_fornecedor?: string | null
          fluxo_de_caixa?: boolean | null
          fornecedor?: string | null
          grupo_economico?: string | null
          id?: string
          importado_em?: string | null
          mes?: string | null
          n_conta?: string | null
          n_nota_fiscal?: string | null
          n_titulo?: string | null
          origem?: string | null
          pais?: string | null
          parcela?: string | null
          portador?: string | null
          portador_num?: string | null
          prazo_medio?: number | null
          quadrimestre?: number | null
          razao_fornecedor?: string | null
          ref_mes?: string | null
          semana?: number | null
          serie?: string | null
          situacao_atual?: string | null
          situacao_periodo?: string | null
          t_fornecedor?: string | null
          tipo?: string | null
          tipo_sep?: string | null
          trimestre?: number | null
          uf?: string | null
          v_atraso_atual?: number | null
          v_atraso_periodo?: number | null
          v_atualizado_atual?: number | null
          v_atualizado_periodo?: number | null
          v_credito_periodo?: number | null
          v_debito_periodo?: number | null
          v_desconto?: number | null
          v_juros_dia?: number | null
          v_multa_atraso?: number | null
          v_original?: number | null
          v_saldo_anterior?: number | null
          v_saldo_atual?: number | null
          v_saldo_periodo?: number | null
          v_titulo?: number | null
        }
        Relationships: []
      }
      training_participants: {
        Row: {
          certificado_url: string | null
          created_at: string | null
          employee_id: string | null
          id: string
          nota: number | null
          status: string | null
          training_id: string | null
        }
        Insert: {
          certificado_url?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          nota?: number | null
          status?: string | null
          training_id?: string | null
        }
        Update: {
          certificado_url?: string | null
          created_at?: string | null
          employee_id?: string | null
          id?: string
          nota?: number | null
          status?: string | null
          training_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_participants_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_participants_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_records: {
        Row: {
          created_at: string | null
          created_by: string | null
          data_conclusao: string | null
          data_inicio: string | null
          employee_id: string
          id: string
          observacoes: string | null
          status: string
          template_id: string
          updated_at: string | null
          validade_ate: string | null
          validade_dias_snapshot: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          employee_id: string
          id?: string
          observacoes?: string | null
          status?: string
          template_id: string
          updated_at?: string | null
          validade_ate?: string | null
          validade_dias_snapshot?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data_conclusao?: string | null
          data_inicio?: string | null
          employee_id?: string
          id?: string
          observacoes?: string | null
          status?: string
          template_id?: string
          updated_at?: string | null
          validade_ate?: string | null
          validade_dias_snapshot?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_records_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "training_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      training_templates: {
        Row: {
          ativo: boolean | null
          brand_id: string
          created_at: string | null
          created_by: string | null
          descricao: string | null
          funcao: string | null
          id: string
          nome: string
          obrigatorio: boolean | null
          unit_id: string | null
          updated_at: string | null
          validade_dias: number | null
        }
        Insert: {
          ativo?: boolean | null
          brand_id: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          funcao?: string | null
          id?: string
          nome: string
          obrigatorio?: boolean | null
          unit_id?: string | null
          updated_at?: string | null
          validade_dias?: number | null
        }
        Update: {
          ativo?: boolean | null
          brand_id?: string
          created_at?: string | null
          created_by?: string | null
          descricao?: string | null
          funcao?: string | null
          id?: string
          nome?: string
          obrigatorio?: boolean | null
          unit_id?: string | null
          updated_at?: string | null
          validade_dias?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_templates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_templates_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "training_templates_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          carga_horaria: number | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          descricao: string | null
          id: string
          instrutor: string | null
          status: string | null
          tipo: string | null
          titulo: string
          unit_id: string | null
        }
        Insert: {
          carga_horaria?: number | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          instrutor?: string | null
          status?: string | null
          tipo?: string | null
          titulo: string
          unit_id?: string | null
        }
        Update: {
          carga_horaria?: number | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          instrutor?: string | null
          status?: string | null
          tipo?: string | null
          titulo?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trainings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_vouchers: {
        Row: {
          created_at: string | null
          desconto_funcionario: number | null
          dias_uteis: number | null
          employee_id: string
          id: string
          observacoes: string | null
          operadora: string | null
          periodo: string
          total_bruto: number | null
          unit_id: string
          valor_diario: number | null
          valor_empresa: number | null
        }
        Insert: {
          created_at?: string | null
          desconto_funcionario?: number | null
          dias_uteis?: number | null
          employee_id: string
          id?: string
          observacoes?: string | null
          operadora?: string | null
          periodo: string
          total_bruto?: number | null
          unit_id: string
          valor_diario?: number | null
          valor_empresa?: number | null
        }
        Update: {
          created_at?: string | null
          desconto_funcionario?: number | null
          dias_uteis?: number | null
          employee_id?: string
          id?: string
          observacoes?: string | null
          operadora?: string | null
          periodo?: string
          total_bruto?: number | null
          unit_id?: string
          valor_diario?: number | null
          valor_empresa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_vouchers_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_vouchers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      uniforms: {
        Row: {
          created_at: string | null
          data_entrega: string | null
          employee_id: string | null
          id: string
          item: string | null
          nome: string | null
          quantidade: number | null
          tamanho: string | null
          unit_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_entrega?: string | null
          employee_id?: string | null
          id?: string
          item?: string | null
          nome?: string | null
          quantidade?: number | null
          tamanho?: string | null
          unit_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_entrega?: string | null
          employee_id?: string | null
          id?: string
          item?: string | null
          nome?: string | null
          quantidade?: number | null
          tamanho?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uniforms_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uniforms_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          active: boolean | null
          address: string | null
          brand_id: string | null
          cnpj: string | null
          created_at: string | null
          geofence_radius_m: number | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          whatsapp_number: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          brand_id?: string | null
          cnpj?: string | null
          created_at?: string | null
          geofence_radius_m?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          whatsapp_number?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          brand_id?: string | null
          cnpj?: string | null
          created_at?: string | null
          geofence_radius_m?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          brand_id: string | null
          created_at: string | null
          group_id: string | null
          id: string
          role_id: string
          unit_id: string | null
          user_id: string
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          role_id: string
          unit_id?: string | null
          user_id: string
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          group_id?: string | null
          id?: string
          role_id?: string
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "user_roles_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_schedules: {
        Row: {
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          data_retorno: string | null
          employee_id: string | null
          id: string
          nome: string | null
          status: string | null
          total_dias: number | null
          unit_id: string | null
        }
        Insert: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          data_retorno?: string | null
          employee_id?: string | null
          id?: string
          nome?: string | null
          status?: string | null
          total_dias?: number | null
          unit_id?: string | null
        }
        Update: {
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          data_retorno?: string | null
          employee_id?: string | null
          id?: string
          nome?: string | null
          status?: string | null
          total_dias?: number | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacation_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacation_schedules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      vacations: {
        Row: {
          abono_days: number | null
          acquisitive_period_end: string | null
          acquisitive_period_start: string | null
          created_at: string | null
          created_by: string | null
          days_entitled: number | null
          days_taken: number | null
          employee_id: string
          end_date: string
          id: string
          is_double_pay: boolean | null
          notes: string | null
          start_date: string
          status: string
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          abono_days?: number | null
          acquisitive_period_end?: string | null
          acquisitive_period_start?: string | null
          created_at?: string | null
          created_by?: string | null
          days_entitled?: number | null
          days_taken?: number | null
          employee_id: string
          end_date: string
          id?: string
          is_double_pay?: boolean | null
          notes?: string | null
          start_date: string
          status?: string
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          abono_days?: number | null
          acquisitive_period_end?: string | null
          acquisitive_period_start?: string | null
          created_at?: string | null
          created_by?: string | null
          days_entitled?: number | null
          days_taken?: number | null
          employee_id?: string
          end_date?: string
          id?: string
          is_double_pay?: boolean | null
          notes?: string | null
          start_date?: string
          status?: string
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_consolidado_ambiente: {
        Row: {
          ambiente: string
          bruto: number | null
          clientes: number | null
          id: string
          participacao_pct: number | null
          periodo_id: string
        }
        Insert: {
          ambiente: string
          bruto?: number | null
          clientes?: number | null
          id?: string
          participacao_pct?: number | null
          periodo_id: string
        }
        Update: {
          ambiente?: string
          bruto?: number | null
          clientes?: number | null
          id?: string
          participacao_pct?: number | null
          periodo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_consolidado_ambiente_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "vendas_consolidado_periodo"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_consolidado_dia_semana: {
        Row: {
          bruto: number | null
          clientes: number | null
          dia_semana: string
          id: string
          ordem: number | null
          periodo_id: string
          ticket_medio: number | null
        }
        Insert: {
          bruto?: number | null
          clientes?: number | null
          dia_semana: string
          id?: string
          ordem?: number | null
          periodo_id: string
          ticket_medio?: number | null
        }
        Update: {
          bruto?: number | null
          clientes?: number | null
          dia_semana?: string
          id?: string
          ordem?: number | null
          periodo_id?: string
          ticket_medio?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_consolidado_dia_semana_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "vendas_consolidado_periodo"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_consolidado_funcionarios: {
        Row: {
          bruto: number | null
          funcionario: string
          id: string
          periodo_id: string
          qtd_vendas: number | null
        }
        Insert: {
          bruto?: number | null
          funcionario: string
          id?: string
          periodo_id: string
          qtd_vendas?: number | null
        }
        Update: {
          bruto?: number | null
          funcionario?: string
          id?: string
          periodo_id?: string
          qtd_vendas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_consolidado_funcionarios_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "vendas_consolidado_periodo"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_consolidado_mensal: {
        Row: {
          bruto: number | null
          clientes: number | null
          id: string
          liquido: number | null
          mes: string
          ordem: number | null
          periodo_id: string
          ticket_medio: number | null
        }
        Insert: {
          bruto?: number | null
          clientes?: number | null
          id?: string
          liquido?: number | null
          mes: string
          ordem?: number | null
          periodo_id: string
          ticket_medio?: number | null
        }
        Update: {
          bruto?: number | null
          clientes?: number | null
          id?: string
          liquido?: number | null
          mes?: string
          ordem?: number | null
          periodo_id?: string
          ticket_medio?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_consolidado_mensal_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "vendas_consolidado_periodo"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_consolidado_periodo: {
        Row: {
          data_fim: string
          data_inicio: string
          id: string
          importado_em: string
          label: string
          unit_id: string
        }
        Insert: {
          data_fim: string
          data_inicio: string
          id?: string
          importado_em?: string
          label: string
          unit_id: string
        }
        Update: {
          data_fim?: string
          data_inicio?: string
          id?: string
          importado_em?: string
          label?: string
          unit_id?: string
        }
        Relationships: []
      }
      vendas_consolidado_produtos: {
        Row: {
          grupo: string | null
          id: string
          participacao_pct: number | null
          periodo_id: string
          produto: string
          quantidade: number | null
          valor_bruto: number | null
          valor_desconto: number | null
          valor_liquido: number | null
        }
        Insert: {
          grupo?: string | null
          id?: string
          participacao_pct?: number | null
          periodo_id: string
          produto: string
          quantidade?: number | null
          valor_bruto?: number | null
          valor_desconto?: number | null
          valor_liquido?: number | null
        }
        Update: {
          grupo?: string | null
          id?: string
          participacao_pct?: number | null
          periodo_id?: string
          produto?: string
          quantidade?: number | null
          valor_bruto?: number | null
          valor_desconto?: number | null
          valor_liquido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_consolidado_produtos_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "vendas_consolidado_periodo"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_consolidado_resumo: {
        Row: {
          acessos: number | null
          bruto: number | null
          card: number | null
          cash: number | null
          consumo: number | null
          convite: number | null
          custo: number | null
          desconto: number | null
          devedor: number | null
          entrada: number | null
          gorjeta: number | null
          id: string
          lucro: number | null
          periodo_id: string
          permanencia_media: string | null
          pgto_diferenca: number | null
          pgto_fechado: number | null
          pgto_recebido: number | null
          pix: number | null
          produto: number | null
          ticket_medio: number | null
          ticket_real: number | null
        }
        Insert: {
          acessos?: number | null
          bruto?: number | null
          card?: number | null
          cash?: number | null
          consumo?: number | null
          convite?: number | null
          custo?: number | null
          desconto?: number | null
          devedor?: number | null
          entrada?: number | null
          gorjeta?: number | null
          id?: string
          lucro?: number | null
          periodo_id: string
          permanencia_media?: string | null
          pgto_diferenca?: number | null
          pgto_fechado?: number | null
          pgto_recebido?: number | null
          pix?: number | null
          produto?: number | null
          ticket_medio?: number | null
          ticket_real?: number | null
        }
        Update: {
          acessos?: number | null
          bruto?: number | null
          card?: number | null
          cash?: number | null
          consumo?: number | null
          convite?: number | null
          custo?: number | null
          desconto?: number | null
          devedor?: number | null
          entrada?: number | null
          gorjeta?: number | null
          id?: string
          lucro?: number | null
          periodo_id?: string
          permanencia_media?: string | null
          pgto_diferenca?: number | null
          pgto_fechado?: number | null
          pgto_recebido?: number | null
          pix?: number | null
          produto?: number | null
          ticket_medio?: number | null
          ticket_real?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_consolidado_resumo_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "vendas_consolidado_periodo"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_consolidado_turno: {
        Row: {
          bruto: number | null
          clientes: number | null
          id: string
          participacao_pct: number | null
          periodo_id: string
          ticket_medio: number | null
          turno: string
        }
        Insert: {
          bruto?: number | null
          clientes?: number | null
          id?: string
          participacao_pct?: number | null
          periodo_id: string
          ticket_medio?: number | null
          turno: string
        }
        Update: {
          bruto?: number | null
          clientes?: number | null
          id?: string
          participacao_pct?: number | null
          periodo_id?: string
          ticket_medio?: number | null
          turno?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_consolidado_turno_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "vendas_consolidado_periodo"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_diarias: {
        Row: {
          criado_em: string | null
          data_venda: string
          descontos_clientes: number | null
          descontos_internos: number | null
          descontos_socios: number | null
          faturamento_bruto: number | null
          gorjetas: number | null
          id: number
          meta_faturamento: number | null
          penduras: number | null
          perdas: number | null
          qtd_clientes: number | null
          turno: string | null
        }
        Insert: {
          criado_em?: string | null
          data_venda: string
          descontos_clientes?: number | null
          descontos_internos?: number | null
          descontos_socios?: number | null
          faturamento_bruto?: number | null
          gorjetas?: number | null
          id?: number
          meta_faturamento?: number | null
          penduras?: number | null
          perdas?: number | null
          qtd_clientes?: number | null
          turno?: string | null
        }
        Update: {
          criado_em?: string | null
          data_venda?: string
          descontos_clientes?: number | null
          descontos_internos?: number | null
          descontos_socios?: number | null
          faturamento_bruto?: number | null
          gorjetas?: number | null
          id?: number
          meta_faturamento?: number | null
          penduras?: number | null
          perdas?: number | null
          qtd_clientes?: number | null
          turno?: string | null
        }
        Relationships: []
      }
      warnings: {
        Row: {
          created_at: string | null
          data: string
          descricao: string
          documento_path: string | null
          employee_id: string
          id: string
          nivel: string
          score_impact: number | null
        }
        Insert: {
          created_at?: string | null
          data?: string
          descricao: string
          documento_path?: string | null
          employee_id: string
          id?: string
          nivel: string
          score_impact?: number | null
        }
        Update: {
          created_at?: string | null
          data?: string
          descricao?: string
          documento_path?: string | null
          employee_id?: string
          id?: string
          nivel?: string
          score_impact?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "warnings_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      work_schedules: {
        Row: {
          cargo: string | null
          created_at: string | null
          departamento: string | null
          employee_id: string | null
          escala_numero: number | null
          id: string
          mes_referencia: string | null
          nome: string | null
          unit_id: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string | null
          departamento?: string | null
          employee_id?: string | null
          escala_numero?: number | null
          id?: string
          mes_referencia?: string | null
          nome?: string | null
          unit_id?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string | null
          departamento?: string | null
          employee_id?: string | null
          escala_numero?: number | null
          id?: string
          mes_referencia?: string | null
          nome?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_schedules_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_schedules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      workday_caixas: {
        Row: {
          abertura: string | null
          caixa_id: number
          cedulas: Json | null
          despesa: number | null
          diferenca_total: number | null
          dinheiro_total: number | null
          fechamento: string | null
          moedas: Json | null
          operador_cpf: string | null
          operador_nome: string | null
          pagamentos: Json | null
          total_fechado: number | null
          total_recebido: number | null
          transacao: number | null
          workday_id: number
        }
        Insert: {
          abertura?: string | null
          caixa_id: number
          cedulas?: Json | null
          despesa?: number | null
          diferenca_total?: number | null
          dinheiro_total?: number | null
          fechamento?: string | null
          moedas?: Json | null
          operador_cpf?: string | null
          operador_nome?: string | null
          pagamentos?: Json | null
          total_fechado?: number | null
          total_recebido?: number | null
          transacao?: number | null
          workday_id: number
        }
        Update: {
          abertura?: string | null
          caixa_id?: number
          cedulas?: Json | null
          despesa?: number | null
          diferenca_total?: number | null
          dinheiro_total?: number | null
          fechamento?: string | null
          moedas?: Json | null
          operador_cpf?: string | null
          operador_nome?: string | null
          pagamentos?: Json | null
          total_fechado?: number | null
          total_recebido?: number | null
          transacao?: number | null
          workday_id?: number
        }
        Relationships: []
      }
      workday_grupos: {
        Row: {
          bruto: number | null
          consumo: number | null
          desconto: number | null
          gorjeta: number | null
          id: number
          nome: string | null
          percentual: number | null
          posicao: number | null
          workday_id: number
        }
        Insert: {
          bruto?: number | null
          consumo?: number | null
          desconto?: number | null
          gorjeta?: number | null
          id: number
          nome?: string | null
          percentual?: number | null
          posicao?: number | null
          workday_id: number
        }
        Update: {
          bruto?: number | null
          consumo?: number | null
          desconto?: number | null
          gorjeta?: number | null
          id?: number
          nome?: string | null
          percentual?: number | null
          posicao?: number | null
          workday_id?: number
        }
        Relationships: []
      }
      workday_produtos: {
        Row: {
          cmv_pct: number | null
          consumo: number | null
          custo: number | null
          id: number
          lucro: number | null
          nome: string | null
          posicao: number | null
          qtde: number | null
          unitario: number | null
          workday_id: number
        }
        Insert: {
          cmv_pct?: number | null
          consumo?: number | null
          custo?: number | null
          id: number
          lucro?: number | null
          nome?: string | null
          posicao?: number | null
          qtde?: number | null
          unitario?: number | null
          workday_id: number
        }
        Update: {
          cmv_pct?: number | null
          consumo?: number | null
          custo?: number | null
          id?: number
          lucro?: number | null
          nome?: string | null
          posicao?: number | null
          qtde?: number | null
          unitario?: number | null
          workday_id?: number
        }
        Relationships: []
      }
      workday_resumo: {
        Row: {
          acessos: number | null
          ambientes: Json | null
          bruto: number | null
          caixas: Json | null
          cancelamentos_motivo: Json | null
          cancelamentos_total: number | null
          cancelamentos_usuario: Json | null
          cidades: Json | null
          clientes_idade: Json | null
          clientes_sexo: Json | null
          clientes_tipo: Json | null
          cmv_pct: number | null
          consumo_total: number | null
          convite: number | null
          created_at: string | null
          custo: number | null
          data: string
          desconto: number | null
          descontos_motivo: Json | null
          descontos_total: number | null
          despesa: number | null
          devedor_total: number | null
          devedores: Json | null
          diferenca_caixa: number | null
          diferenca_real: number | null
          gorjeta: number | null
          gorjetas_edit: Json | null
          lucro: number | null
          pagamentos: Json | null
          pendencia_antiga: number | null
          pendencias_antigas: Json | null
          permanencia: string | null
          produto: number | null
          ticket_medio: number | null
          ticket_real: number | null
          ticket_zero: number | null
          total_fechado: number | null
          total_recebido: number | null
          turnos: Json | null
          unidade_id: number
          updated_at: string | null
          workday_id: number
        }
        Insert: {
          acessos?: number | null
          ambientes?: Json | null
          bruto?: number | null
          caixas?: Json | null
          cancelamentos_motivo?: Json | null
          cancelamentos_total?: number | null
          cancelamentos_usuario?: Json | null
          cidades?: Json | null
          clientes_idade?: Json | null
          clientes_sexo?: Json | null
          clientes_tipo?: Json | null
          cmv_pct?: number | null
          consumo_total?: number | null
          convite?: number | null
          created_at?: string | null
          custo?: number | null
          data: string
          desconto?: number | null
          descontos_motivo?: Json | null
          descontos_total?: number | null
          despesa?: number | null
          devedor_total?: number | null
          devedores?: Json | null
          diferenca_caixa?: number | null
          diferenca_real?: number | null
          gorjeta?: number | null
          gorjetas_edit?: Json | null
          lucro?: number | null
          pagamentos?: Json | null
          pendencia_antiga?: number | null
          pendencias_antigas?: Json | null
          permanencia?: string | null
          produto?: number | null
          ticket_medio?: number | null
          ticket_real?: number | null
          ticket_zero?: number | null
          total_fechado?: number | null
          total_recebido?: number | null
          turnos?: Json | null
          unidade_id: number
          updated_at?: string | null
          workday_id: number
        }
        Update: {
          acessos?: number | null
          ambientes?: Json | null
          bruto?: number | null
          caixas?: Json | null
          cancelamentos_motivo?: Json | null
          cancelamentos_total?: number | null
          cancelamentos_usuario?: Json | null
          cidades?: Json | null
          clientes_idade?: Json | null
          clientes_sexo?: Json | null
          clientes_tipo?: Json | null
          cmv_pct?: number | null
          consumo_total?: number | null
          convite?: number | null
          created_at?: string | null
          custo?: number | null
          data?: string
          desconto?: number | null
          descontos_motivo?: Json | null
          descontos_total?: number | null
          despesa?: number | null
          devedor_total?: number | null
          devedores?: Json | null
          diferenca_caixa?: number | null
          diferenca_real?: number | null
          gorjeta?: number | null
          gorjetas_edit?: Json | null
          lucro?: number | null
          pagamentos?: Json | null
          pendencia_antiga?: number | null
          pendencias_antigas?: Json | null
          permanencia?: string | null
          produto?: number | null
          ticket_medio?: number | null
          ticket_real?: number | null
          ticket_zero?: number | null
          total_fechado?: number | null
          total_recebido?: number | null
          turnos?: Json | null
          unidade_id?: number
          updated_at?: string | null
          workday_id?: number
        }
        Relationships: []
      }
      workday_usuarios: {
        Row: {
          consumo: number | null
          convite: number | null
          gorjeta: number | null
          id: number
          nome: string | null
          posicao: number | null
          produto: number | null
          qtde: number | null
          workday_id: number
        }
        Insert: {
          consumo?: number | null
          convite?: number | null
          gorjeta?: number | null
          id: number
          nome?: string | null
          posicao?: number | null
          produto?: number | null
          qtde?: number | null
          workday_id: number
        }
        Update: {
          consumo?: number | null
          convite?: number | null
          gorjeta?: number | null
          id?: number
          nome?: string | null
          posicao?: number | null
          produto?: number | null
          qtde?: number | null
          workday_id?: number
        }
        Relationships: []
      }
      workday_venda: {
        Row: {
          bruto_total: number | null
          categorias: Json | null
          data: string
          desconto_total: number | null
          gorjeta_total: number | null
          total: number | null
          workday_id: number
        }
        Insert: {
          bruto_total?: number | null
          categorias?: Json | null
          data: string
          desconto_total?: number | null
          gorjeta_total?: number | null
          total?: number | null
          workday_id: number
        }
        Update: {
          bruto_total?: number | null
          categorias?: Json | null
          data?: string
          desconto_total?: number | null
          gorjeta_total?: number | null
          total?: number | null
          workday_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      tips_records: {
        Row: {
          employee_id: string | null
          id: string | null
          periodo: string | null
          pontos_liquidos: number | null
          total_pontos: number | null
          valor: number | null
          valor_ponto: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gorjeta_dias_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      v_alertas: {
        Row: {
          brand_id: string | null
          brand_name: string | null
          created_at: string | null
          mensagem: string | null
          resource_id: string | null
          severidade: string | null
          tipo_alerta: string | null
        }
        Relationships: []
      }
      v_aprovacoes_pendentes: {
        Row: {
          criado_em: string | null
          id: number | null
          unit_id: string | null
        }
        Insert: {
          criado_em?: string | null
          id?: number | null
          unit_id?: string | null
        }
        Update: {
          criado_em?: string | null
          id?: number | null
          unit_id?: string | null
        }
        Relationships: []
      }
      v_cadastro_saude: {
        Row: {
          camada_prontidao: number | null
          categoria: string | null
          eh_everest: boolean | null
          fonte_ok: boolean | null
          item_id: string | null
          nome: string | null
          nome_normalizado: string | null
          peso_relevancia: number | null
          subtipo: string | null
          tem_categoria: boolean | null
          tem_custo: boolean | null
          tem_ficha: boolean | null
          tem_preco: boolean | null
          tipo_item: string | null
        }
        Relationships: []
      }
      v_cmv_produto: {
        Row: {
          balde: string | null
          categoria: string | null
          cmv_teorico_pct: number | null
          custo_total: number | null
          eh_bebida: boolean | null
          fonte_ok: boolean | null
          nome: string | null
          preco_venda: number | null
          produto_id: string | null
        }
        Relationships: []
      }
      v_despesa_canonica: {
        Row: {
          conta: string | null
          fonte_ok: boolean | null
          mes_ano: string | null
          participacao_pct: number | null
          unit_id: string | null
          valor_caixa: number | null
          valor_mes_anterior: number | null
          variacao_pct: number | null
        }
        Relationships: []
      }
      v_dre_canonico: {
        Row: {
          fonte_ok: boolean | null
          indicador: string | null
          mes_ano: string | null
          meta_pct: number | null
          realizado_pct: number | null
          realizado_rs: number | null
          receita_bruta: number | null
          unit_id: string | null
        }
        Relationships: []
      }
      v_dre_consolidado: {
        Row: {
          brand_id: string | null
          clientes: number | null
          cmv: number | null
          cmv_pct: number | null
          competencia: string | null
          ebitda: number | null
          ebitda_pct: number | null
          pessoal: number | null
          pessoal_pct: number | null
          prime_cost: number | null
          prime_cost_pct: number | null
          receita_bruta: number | null
          ticket_medio: number | null
        }
        Relationships: []
      }
      v_eventos_kpi: {
        Row: {
          brand_color: string | null
          brand_id: string | null
          brand_name: string | null
          brand_slug: string | null
          eventos_aprovados: number | null
          eventos_cancelados: number | null
          eventos_concluidos: number | null
          eventos_em_andamento: number | null
          eventos_pendentes: number | null
          mes: string | null
          receita_prevista: number | null
          receita_realizada: number | null
          total_convidados: number | null
          total_eventos: number | null
        }
        Relationships: [
          {
            foreignKeyName: "events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
        ]
      }
      v_gorjeta_periodo_dia: {
        Row: {
          data: string | null
          fonte: string | null
          imposto_pct: number | null
          receita_bruta: number | null
          receita_liquida: number | null
          unit_id: string | null
          valor_ponto: number | null
        }
        Insert: {
          data?: string | null
          fonte?: string | null
          imposto_pct?: number | null
          receita_bruta?: number | null
          receita_liquida?: number | null
          unit_id?: string | null
          valor_ponto?: number | null
        }
        Update: {
          data?: string | null
          fonte?: string | null
          imposto_pct?: number | null
          receita_bruta?: number | null
          receita_liquida?: number | null
          unit_id?: string | null
          valor_ponto?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gorjeta_periodos_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      v_gorjeta_saude: {
        Row: {
          ano: number | null
          cargo: string | null
          colaborador_id: string | null
          dias_trabalhados: number | null
          employee_id: string | null
          fonte_ok: boolean | null
          mes: number | null
          nome: string | null
          percentual: number | null
          pontuacao: number | null
          recibo_gerado_at: string | null
          recibo_url: string | null
          tem_recibo: boolean | null
          unit_id: string | null
          valor_bruto: number | null
          valor_liquido: number | null
          valor_zero_com_pontos: boolean | null
        }
        Insert: {
          ano?: number | null
          cargo?: string | null
          colaborador_id?: string | null
          dias_trabalhados?: number | null
          employee_id?: string | null
          fonte_ok?: never
          mes?: number | null
          nome?: string | null
          percentual?: number | null
          pontuacao?: number | null
          recibo_gerado_at?: string | null
          recibo_url?: string | null
          tem_recibo?: never
          unit_id?: string | null
          valor_bruto?: number | null
          valor_liquido?: number | null
          valor_zero_com_pontos?: never
        }
        Update: {
          ano?: number | null
          cargo?: string | null
          colaborador_id?: string | null
          dias_trabalhados?: number | null
          employee_id?: string | null
          fonte_ok?: never
          mes?: number | null
          nome?: string | null
          percentual?: number | null
          pontuacao?: number | null
          recibo_gerado_at?: string | null
          recibo_url?: string | null
          tem_recibo?: never
          unit_id?: string | null
          valor_bruto?: number | null
          valor_liquido?: number | null
          valor_zero_com_pontos?: never
        }
        Relationships: [
          {
            foreignKeyName: "gorjeta_distribuicao_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gorjeta_distribuicao_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gorjeta_distribuicao_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      v_headcount_por_marca: {
        Row: {
          admissoes_mes: number | null
          brand_id: string | null
          brand_name: string | null
          brand_slug: string | null
          demissoes_mes: number | null
          folha_bruta: number | null
          headcount_ativo: number | null
        }
        Relationships: [
          {
            foreignKeyName: "units_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
        ]
      }
      v_proximos_eventos: {
        Row: {
          brand_color: string | null
          brand_name: string | null
          brand_slug: string | null
          contato_cliente: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string | null
          nome: string | null
          num_convidados: number | null
          status: Database["public"]["Enums"]["event_status"] | null
          tipo: string | null
          total_equipe: number | null
          total_itens_cardapio: number | null
          unit_name: string | null
          valor_total: number | null
        }
        Relationships: []
      }
      v_vagas_pipeline: {
        Row: {
          brand_id: string | null
          brand_name: string | null
          candidato_aprovado: string | null
          created_at: string | null
          created_by: string | null
          data_admissao: string | null
          description: string | null
          dias_corridos: number | null
          fechamento_previsto: string | null
          fonte_recrutamento: string | null
          horario: string | null
          id: string | null
          is_active: boolean | null
          motivo: string | null
          observacoes: string | null
          recrutador: string | null
          salario: number | null
          sla_dias: number | null
          status: string | null
          status_prazo: string | null
          title: string | null
          total_logs: number | null
          ultimo_log_em: string | null
          unit_id: string | null
          unit_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_openings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_openings_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "v_dre_consolidado"
            referencedColumns: ["brand_id"]
          },
          {
            foreignKeyName: "job_openings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_recipe_cost: {
        Args: { p_menu_item_id: string }
        Returns: number
      }
      check_primo_acesso: { Args: { p_cpf: string }; Returns: Json }
      check_survey_response: {
        Args: { p_employee_id: string; p_survey_id: string }
        Returns: boolean
      }
      create_employee_auth: {
        Args: { p_cpf: string; p_employee_id: string; p_password_hash: string }
        Returns: undefined
      }
      create_punch_adjustment: {
        Args: {
          p_data_referencia: string
          p_employee_id: string
          p_horario_retorno_almoco: string
          p_horario_saida_almoco: string
          p_motivo: string
        }
        Returns: string
      }
      get_active_campaigns: { Args: never; Returns: Json }
      get_active_survey: {
        Args: { p_unit_id: string }
        Returns: {
          descricao: string
          questions: Json
          survey_id: string
          tipo: string
          titulo: string
        }[]
      }
      get_auth_by_cpf: { Args: { p_cpf: string }; Returns: Json }
      get_employee_profile: { Args: { p_employee_id: string }; Returns: Json }
      get_my_adjustment_requests: {
        Args: { p_employee_id: string }
        Returns: {
          created_at: string
          data_referencia: string
          horario_retorno_almoco: string
          horario_saida_almoco: string
          id: string
          motivo: string
          status: string
        }[]
      }
      get_my_dept: { Args: never; Returns: string }
      get_my_development: { Args: { p_employee_id: string }; Returns: Json }
      get_my_documents: { Args: { p_employee_id: string }; Returns: Json }
      get_my_gorjetas: { Args: { p_employee_id: string }; Returns: Json }
      get_my_home: { Args: { p_employee_id: string }; Returns: Json }
      get_my_hour_bank: { Args: { p_employee_id: string }; Returns: Json }
      get_my_last_punch: { Args: { p_employee_id: string }; Returns: Json }
      get_my_level: { Args: never; Returns: string }
      get_my_payments: { Args: { p_employee_id: string }; Returns: Json }
      get_my_payslips: { Args: { p_employee_id: string }; Returns: Json }
      get_my_punch_history: {
        Args: { p_days?: number; p_employee_id: string }
        Returns: {
          dia: string
          punches: Json
        }[]
      }
      get_my_punches_today: {
        Args: { p_employee_id: string }
        Returns: {
          id: string
          timestamp_punch: string
          tipo: string
        }[]
      }
      get_my_registro: { Args: { p_employee_id: string }; Returns: Json }
      get_my_role: { Args: never; Returns: string }
      get_my_sector: { Args: never; Returns: string }
      get_my_tier: { Args: never; Returns: string }
      get_my_tier_real: { Args: never; Returns: string }
      get_my_unit: { Args: never; Returns: string }
      get_my_vacations: { Args: { p_employee_id: string }; Returns: Json }
      get_produto_meses: {
        Args: { p_unit_id: string }
        Returns: {
          ano: number
          mes: number
          total: number
        }[]
      }
      get_punches_by_unit: {
        Args: { p_date: string; p_unit_id: string }
        Returns: {
          employee_id: string
          funcao: string
          gps_failed: boolean
          nome_completo: string
          registrado_em: string
          tipo: string
          unit_id: string
        }[]
      }
      get_survey_results: {
        Args: { p_survey_id: string }
        Returns: {
          distribuicao: Json
          media_escala: number
          question_id: string
          texto_pergunta: string
          total_respostas: number
        }[]
      }
      get_unit_geofence: {
        Args: { p_unit_id: string }
        Returns: {
          latitude: number
          longitude: number
          radius_meters: number
        }[]
      }
      get_unit_surveys: {
        Args: { p_employee_id: string; p_unit_id: string }
        Returns: Json
      }
      insert_document: {
        Args: {
          p_employee_id: string
          p_name: string
          p_storage_path: string
          p_type: string
          p_unit_id: string
        }
        Returns: Json
      }
      insert_punch:
        | {
            Args: {
              p_device_info: string
              p_employee_id: string
              p_latitude: number
              p_longitude: number
              p_timestamp: string
              p_tipo: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_aprovado?: boolean
              p_device_info: string
              p_distance_meters?: number
              p_employee_id: string
              p_gps_failed?: boolean
              p_latitude: number
              p_longitude: number
              p_timestamp: string
              p_tipo: string
            }
            Returns: Json
          }
      kph_accessible_unit_ids: { Args: never; Returns: string[] }
      kph_can_delete_event_brand: {
        Args: { p_brand_id: string }
        Returns: boolean
      }
      kph_can_write_event_brand: {
        Args: { p_brand_id: string }
        Returns: boolean
      }
      kph_has_role_for_brand: { Args: { p_brand_id: string }; Returns: boolean }
      kph_has_role_for_group: { Args: { p_group_id: string }; Returns: boolean }
      kph_has_role_for_unit: { Args: { p_unit_id: string }; Returns: boolean }
      kph_is_founder: { Args: never; Returns: boolean }
      kph_is_founder_or_cfo: { Args: never; Returns: boolean }
      norm_fone_br: { Args: { p: string }; Returns: string }
      resolve_punch_adjustment: {
        Args: {
          p_aprovado_por: string
          p_inserir_punches?: boolean
          p_request_id: string
          p_status: string
        }
        Returns: undefined
      }
      submit_survey_responses:
        | {
            Args: {
              p_employee_id: string
              p_responses: Json
              p_survey_id: string
            }
            Returns: undefined
          }
        | { Args: { p_responses: Json }; Returns: undefined }
      update_employee_photo: {
        Args: { p_employee_id: string; p_photo_url: string }
        Returns: undefined
      }
      upsert_push_token: {
        Args: { p_employee_id: string; p_token: string }
        Returns: undefined
      }
    }
    Enums: {
      checklist_area: "cozinha" | "bar" | "salao" | "higiene" | "geral"
      checklist_turno: "abertura" | "almoco" | "jantar" | "fechamento"
      conversation_status: "ativa" | "assumida" | "encerrada"
      event_status:
        | "rascunho"
        | "pendente_aprovacao"
        | "confirmado"
        | "aprovado"
        | "em_andamento"
        | "concluido"
        | "realizado"
        | "cancelado"
      menu_item_category:
        | "bar"
        | "cozinha"
        | "bebida_alcoolica"
        | "bebida_nao_alcoolica"
        | "entrada"
        | "prato_principal"
        | "sobremesa"
        | "outros"
      purchase_order_status:
        | "rascunho"
        | "enviado"
        | "parcial"
        | "recebido"
        | "cancelado"
      quote_status:
        | "rascunho"
        | "enviada"
        | "recebida"
        | "aprovada"
        | "cancelada"
      reservation_origem:
        | "whatsapp"
        | "telefone"
        | "email"
        | "tagme"
        | "presencial"
        | "instagram"
      reservation_status:
        | "pendente"
        | "confirmada"
        | "cancelada"
        | "no_show"
        | "finalizada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      checklist_area: ["cozinha", "bar", "salao", "higiene", "geral"],
      checklist_turno: ["abertura", "almoco", "jantar", "fechamento"],
      conversation_status: ["ativa", "assumida", "encerrada"],
      event_status: [
        "rascunho",
        "pendente_aprovacao",
        "confirmado",
        "aprovado",
        "em_andamento",
        "concluido",
        "realizado",
        "cancelado",
      ],
      menu_item_category: [
        "bar",
        "cozinha",
        "bebida_alcoolica",
        "bebida_nao_alcoolica",
        "entrada",
        "prato_principal",
        "sobremesa",
        "outros",
      ],
      purchase_order_status: [
        "rascunho",
        "enviado",
        "parcial",
        "recebido",
        "cancelado",
      ],
      quote_status: [
        "rascunho",
        "enviada",
        "recebida",
        "aprovada",
        "cancelada",
      ],
      reservation_origem: [
        "whatsapp",
        "telefone",
        "email",
        "tagme",
        "presencial",
        "instagram",
      ],
      reservation_status: [
        "pendente",
        "confirmada",
        "cancelada",
        "no_show",
        "finalizada",
      ],
    },
  },
} as const

// CUSTOM — tipos manuais (unions de CHECK constraints + aliases)
// ═══════════════════════════════════════════════════════════════

export type RoleName =
  | "founder"
  | "cfo"
  // T6 — diretoria/holding (migration 096)
  | "ceo"
  | "diretor"
  // T5 — gerentes de área (migration 096)
  | "pipou_admin"
  | "head_rh"
  | "head_financeiro"
  | "head_operacao"
  // T3 — gestão de unidade
  | "gm"
  | "pessoas"
  | "chef"
  | "comprador"
  | "comercial"
  | "operacional"
  // T1
  | "colaborador"
  | "socio_readonly";

export type BrandLinkKind =
  | "drive"
  | "dashboard"
  | "instagram"
  | "site"
  | "report"
  | "other";

// ── Fase E2 / Eventos (O.S.) ───────────────────────────────────
// Migration 011_events_expand expandiu o enum event_status com
// 'confirmado' e 'realizado' (paridade HOS legado).
export type EventStatus =
  | "rascunho"
  | "pendente_aprovacao"
  | "aprovado"
  | "confirmado"
  | "em_andamento"
  | "realizado"
  | "concluido"
  | "cancelado";

export type MenuItemCategory =
  | "bar"
  | "cozinha"
  | "bebida_alcoolica"
  | "bebida_nao_alcoolica"
  | "entrada"
  | "prato_principal"
  | "sobremesa"
  | "outros";

// ── Fase E4 / Financeiro ───────────────────────────────────────
export type LancamentoNatureza = "receita" | "despesa";

export type LancamentoRegime = "caixa" | "competencia";

export type LancamentoStatus =
  | "rascunho"
  | "pendente_aprovacao"
  | "aprovado"
  | "rejeitado"
  | "pago"
  | "cancelado";

export type CategoriaReceita =
  | "vendas_salao"
  | "vendas_delivery"
  | "vendas_bar"
  | "eventos_private_dining"
  | "gorjeta"
  | "outras_receitas";

export type CategoriaDespesa =
  // CMV
  | "cmv_cozinha"
  | "cmv_bar"
  | "cmv_delivery"
  // Folha
  | "folha_salarios"
  | "folha_encargos"
  | "folha_beneficios"
  | "folha_gorjeta_repasse"
  // Ocupação
  | "aluguel"
  | "condominio"
  | "iptu"
  // Utilidades
  | "energia_eletrica"
  | "gas"
  | "agua"
  | "telefone_internet"
  // Operacional
  | "manutencao"
  | "limpeza_higiene"
  | "uniformes_epi"
  | "descartaveis_embalagens"
  // Comercial
  | "marketing_publicidade"
  | "delivery_taxas_plataforma"
  | "comissoes"
  // Administrativo
  | "contabilidade"
  | "juridico"
  | "seguros"
  | "software_sistemas"
  | "cartao_taxas"
  // Tributos
  | "pis_cofins"
  | "irpj_csll"
  | "iss"
  | "outros_tributos"
  // Capex
  | "depreciacao"
  | "investimento_capex"
  // Outros
  | "outras_despesas";

export type ApprovalStatus = "pendente" | "aprovado" | "rejeitado";
export type FinancialPeriodStatus = "aberto" | "fechado" | "revisao";

export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

export type EventosKpiRow = Views<"v_eventos_kpi">;
export type HeadcountMarcaRow = Views<"v_headcount_por_marca">;
export type ProximoEventoRow = Views<"v_proximos_eventos">;
export type AlertaRow = Views<"v_alertas">;

// ── Fase E4 / Financeiro ───────────────────────────────────────
export type MenuItemRow = Tables<"menu_items">;

export type DreConsolidadoRow = Views<"v_dre_consolidado">;
export type AprovacaoPendenteRow = Views<"v_aprovacoes_pendentes">;



export type Group = Tables<"groups">;
export type Brand = Tables<"brands">;
export type Unit = Tables<"units">;
export type BrandLink = Tables<"brand_links">;
export type RoleRow = Tables<"roles">;
export type UserRole = Tables<"user_roles">;
export type AuditLogEntry = Tables<"audit_log">;
export type EventRow = Tables<"events">;
export type EventMenuItem = Tables<"event_menu_items">;
export type EventInfraItem = Tables<"event_infra_items">;
export type EventStaff = Tables<"event_staff">;
export type EventAttachment = Tables<"event_attachments">;
export type EventStatusLog = Tables<"event_status_log">;

// Evento + relacionamentos resolvidos (usado em listagens e detalhe).
export type EventWithRelations = EventRow & {
  brand_name: string | null;
  unit_name: string | null;
  menu_items: EventMenuItem[];
  infra_items: EventInfraItem[];
  staff: EventStaff[];
};

// ── HOS RH expansion (migrations 011–018) ─────────────────────
export type EmployeeAuthRow = Tables<"employee_auth">;
export type DocumentRow = Tables<"documents">;
export type TipsRecordRow = Tables<"tips_records">;
export type TransportVoucherRow = Tables<"transport_vouchers">;
export type TimeRecordRow = Tables<"time_records">;
export type VacationRow = Tables<"vacations">;
export type OvertimeRecordRow = Tables<"overtime_records">;
export type ImportLogRow = Tables<"import_logs">;
export type CampaignRow = Tables<"campaigns">;
export type JobOpeningRow = Tables<"job_openings">;
export type CandidateRow = Tables<"candidates">;
export type InterviewQuestionRow = Tables<"interview_questions">;
export type InterviewResponseRow = Tables<"interview_responses">;

// Enums refletindo CHECK constraints das migrations
export type DocumentType = "RG" | "CPF" | "CTPS" | "contrato" | "exame" | "outro";
export type TipoContrato = "CLT" | "PJ" | "temporario" | "estagiario";
export type StatusRH = "ativo" | "inativo" | "ferias" | "afastado";
export type VacationStatus = "agendada" | "em_andamento" | "concluida" | "cancelada";
export type OvertimeType = "50" | "100" | "banco";
export type OvertimeSource = "manual" | "totvs";
export type ImportTipo = "ponto" | "holerites" | "gorjetas" | "vt";
export type CampaignCategory = "saude" | "evento" | "comunicado";
export type CampaignTarget = "all" | "department";
export type CandidateStatus = "pendente" | "aprovado" | "reprovado";
export type CandidateInterviewStatus = "pendente" | "em_andamento" | "concluido";

// ── Compras (migration 019) ───────────────────────────────────
export type PurchaseOrderStatus =
  | "rascunho"
  | "enviado"
  | "parcial"
  | "recebido"
  | "cancelado";

export type SupplierRow = Tables<"suppliers">;
export type PurchaseOrderRow = Tables<"purchase_orders">;
export type PurchaseOrderItemRow = Tables<"purchase_order_items">;

// ── Cliente / CRM (migration 020) ─────────────────────────────
export type ClientOrigem =
  | "indicacao"
  | "site"
  | "instagram"
  | "whatsapp"
  | "evento"
  | "outro";

export type ClientInteractionTipo =
  | "ligacao"
  | "email"
  | "whatsapp"
  | "reuniao"
  | "visita"
  | "outro";

export type ClientRow = Tables<"clients">;
export type ClientInteractionRow = Tables<"client_interactions">;

// ── Treinamentos / Onboarding (migration 021) ─────────────────
export type TrainingStatus =
  | "pendente"
  | "em_andamento"
  | "concluido"
  | "vencido";

export type TrainingTemplateRow = Tables<"training_templates">;
// Override: status é text com CHECK constraint no banco.
export type TrainingRecordRow = Omit<Tables<"training_records">, "status"> & {
  status: TrainingStatus;
};

// ── Avaliação de desempenho (migration 022) ───────────────────
export type PerformancePeriodicidade =
  | "mensal"
  | "trimestral"
  | "semestral"
  | "anual";

export type PerformanceReviewStatus = "rascunho" | "concluida" | "aprovada";

export type PerformanceCriterioTipo = "nota_1_5" | "sim_nao" | "texto";

export type PerformanceCriterio = {
  id: string;
  nome: string;
  descricao?: string | null;
  peso: number;
  tipo: PerformanceCriterioTipo;
};

// Overrides sobre o gerado: o banco guarda periodicidade/status como text
// (CHECK constraint) e criterios como jsonb — os unions abaixo são a verdade
// de domínio que o gerado não captura.
export type PerformanceTemplateRow = Omit<
  Tables<"performance_templates">,
  "periodicidade" | "criterios" | "ativo"
> & {
  periodicidade: PerformancePeriodicidade;
  criterios: PerformanceCriterio[];
  ativo: boolean;
};
export type PerformanceReviewRow = Omit<
  Tables<"performance_reviews">,
  "status"
> & {
  status: PerformanceReviewStatus;
};

// ── Metas por marca (migration 023) ───────────────────────────
export type BrandTargetRow = Tables<"brand_targets">;
export type TargetNoteRow = Tables<"target_notes">;

// ── Notificações in-app (migration 024) ───────────────────────
export type NotificationRow = Tables<"notifications">;

// ── Quality Checklists (migration 029) ────────────────────────
export type ChecklistTurno = "abertura" | "almoco" | "jantar" | "fechamento";
export type ChecklistArea  = "cozinha" | "bar" | "salao" | "higiene" | "geral";

export type ChecklistItem = {
  id: string;
  texto: string;
  obrigatorio: boolean;
};

export type QualityChecklistRow = {
  id: string;
  unit_id: string;
  nome: string;
  area: ChecklistArea;
  turno: ChecklistTurno;
  items: ChecklistItem[];
  ativo: boolean;
  created_at: string;
};

export type ChecklistRecordRow = {
  id: string;
  checklist_id: string;
  unit_id: string;
  data: string;
  turno: ChecklistTurno;
  responsavel_id: string | null;
  respostas: Record<string, boolean>;
  score_pct: number | null;
  observacoes: string | null;
  created_at: string;
};

// ── Reservations (migration 031) ──────────────────────────────
export type ReservationStatus = "pendente" | "confirmada" | "cancelada" | "no_show" | "finalizada";
export type ReservationOrigem = "whatsapp" | "telefone" | "email" | "tagme" | "presencial" | "instagram";

export type ReservationRow = {
  id: string;
  unit_id: string;
  data: string;
  hora: string;
  pax: number;
  status: ReservationStatus;
  origem: ReservationOrigem;
  cliente_nome: string;
  cliente_telefone: string | null;
  cliente_email: string | null;
  mesa: string | null;
  observacoes: string | null;
  confirmado_por: string | null;
  confirmado_em: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

// ── Price Quotes (migration 032) ──────────────────────────────
export type QuoteStatus = "rascunho" | "enviada" | "recebida" | "aprovada" | "cancelada";

export type PriceQuoteRow = {
  id: string;
  unit_id: string;
  supplier_id: string | null;
  periodo: string;
  status: QuoteStatus;
  titulo: string | null;
  observacoes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type PriceQuoteItemRow = {
  id: string;
  quote_id: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  preco_unitario: number | null;
  total: number | null;
  observacoes: string | null;
  created_at: string;
};
