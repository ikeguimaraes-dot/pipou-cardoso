-- Cardoso: first operational schema block, structure only; no source customer records.
-- Non-administrator roles remain denied until scoped policies are implemented.
-- Employee DELETE is deliberately withheld until recruitment and its delete trigger exist.
SET LOCAL search_path = public, pg_catalog;

CREATE TABLE public.employees (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "unit_id" uuid NOT NULL,
  "user_id" uuid,
  "nome" text NOT NULL,
  "sobrenome" text NOT NULL,
  "cpf" text,
  "ctps" text,
  "funcao" text NOT NULL,
  "salario_base" numeric(10,2) DEFAULT 0 NOT NULL,
  "data_admissao" date NOT NULL,
  "data_demissao" date,
  "ativo" boolean DEFAULT true,
  "banco" text,
  "agencia" text,
  "conta" text,
  "tipo_conta" text,
  "pix" text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  "rg" text,
  "rg_orgao" text,
  "rg_uf" character(2),
  "pis" text,
  "ctps_serie" text,
  "ctps_uf" character(2),
  "titulo_eleitor" text,
  "reservista" text,
  "rua" text,
  "numero" text,
  "complemento" text,
  "bairro" text,
  "cidade" text,
  "estado" character(2),
  "cep" text,
  "escolaridade" text,
  "raca" text,
  "genero" text,
  "nome_mae" text,
  "nome_pai" text,
  "departamento" text,
  "employee_code" text,
  "esocial_code" text,
  "nome_social" text,
  "data_nascimento" date,
  "cidade_nascimento" text,
  "uf_nascimento" character(2),
  "pais_nascimento" text DEFAULT 'Brasil'::text,
  "estado_civil" text,
  "tipo_contrato" text,
  "jornada" text,
  "telefone" text,
  "email" text,
  "contato_emergencia_nome" text,
  "contato_emergencia_tel" text,
  "photo_url" text,
  "ctps_expedicao" date,
  "zona_eleitoral" text,
  "secao_eleitoral" text,
  "rne" text,
  "rne_orgao" text,
  "rne_expedicao" date,
  "status_rh" text DEFAULT 'ativo'::text,
  "score" integer DEFAULT 100 NOT NULL,
  "manager_id" uuid,
  "mise_ativo" boolean DEFAULT false,
  "role_id" uuid,
  "tier" text,
  "observacao" text,
  "push_token" text,
  "push_token_updated_at" timestamp with time zone,
  "is_system_account" boolean DEFAULT false NOT NULL
);
CREATE TABLE public.dependents (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "employee_id" uuid NOT NULL,
  "nome" text NOT NULL,
  "cpf" text,
  "data_nascimento" date,
  "parentesco" text NOT NULL,
  "ordem" integer DEFAULT 1,
  "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public.employee_documents (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "employee_id" uuid NOT NULL,
  "tipo" text NOT NULL,
  "nome" text NOT NULL,
  "descricao" text,
  "file_path" text DEFAULT ''::text NOT NULL,
  "file_size" bigint,
  "mime_type" text,
  "data_emissao" date,
  "data_validade" date,
  "observacoes" text,
  "uploaded_by" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public.terminations (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "unit_id" uuid,
  "employee_id" uuid,
  "nome" text,
  "tipo_aviso" text,
  "data_aviso" date,
  "motivo" text,
  "status" text DEFAULT 'registrado'::text,
  "created_at" timestamp with time zone DEFAULT now()
);
CREATE TABLE public.import_logs (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "unit_id" uuid,
  "periodo" text NOT NULL,
  "tipo" text DEFAULT 'ponto'::text,
  "total_linhas" integer DEFAULT 0,
  "importados" integer DEFAULT 0,
  "nao_encontrados" integer DEFAULT 0,
  "erros" integer DEFAULT 0,
  "detalhes" jsonb,
  "imported_by" uuid,
  "imported_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public.dependents ADD CONSTRAINT "dependents_pkey" PRIMARY KEY (id);
ALTER TABLE public.employee_documents ADD CONSTRAINT "employee_documents_pkey" PRIMARY KEY (id);
ALTER TABLE public.employee_documents ADD CONSTRAINT "employee_documents_tipo_check" CHECK ((tipo = ANY (ARRAY['rg'::text, 'cpf'::text, 'ctps'::text, 'pis_pasep'::text, 'titulo_eleitor'::text, 'comprovante_residencia'::text, 'foto_3x4'::text, 'aso_admissional'::text, 'reservista'::text, 'certidao_nascimento'::text, 'certidao_casamento'::text, 'cnh'::text, 'outros'::text])));
ALTER TABLE public.employees ADD CONSTRAINT "employees_cpf_key" UNIQUE (cpf);
ALTER TABLE public.employees ADD CONSTRAINT "employees_pkey" PRIMARY KEY (id);
ALTER TABLE public.employees ADD CONSTRAINT "employees_status_rh_check" CHECK ((status_rh = ANY (ARRAY['ativo'::text, 'inativo'::text, 'ferias'::text, 'afastado'::text])));
ALTER TABLE public.employees ADD CONSTRAINT "employees_tier_check" CHECK ((tier = ANY (ARRAY['T1'::text, 'T2A'::text, 'T2B'::text, 'T3'::text, 'T4'::text, 'T5'::text, 'T6'::text])));
ALTER TABLE public.employees ADD CONSTRAINT "employees_tipo_contrato_check" CHECK ((tipo_contrato = ANY (ARRAY['CLT'::text, 'PJ'::text, 'temporario'::text, 'estagiario'::text])));
ALTER TABLE public.import_logs ADD CONSTRAINT "import_logs_pkey" PRIMARY KEY (id);
ALTER TABLE public.import_logs ADD CONSTRAINT "import_logs_tipo_check" CHECK ((tipo = ANY (ARRAY['ponto'::text, 'holerites'::text, 'gorjetas'::text, 'vt'::text, 'purchase_invoices'::text])));
ALTER TABLE public.terminations ADD CONSTRAINT "terminations_employee_id_tipo_aviso_data_aviso_key" UNIQUE (employee_id, tipo_aviso, data_aviso);
ALTER TABLE public.terminations ADD CONSTRAINT "terminations_pkey" PRIMARY KEY (id);
ALTER TABLE public.dependents ADD CONSTRAINT "dependents_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public.employee_documents ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;
ALTER TABLE public.employee_documents ADD CONSTRAINT "employee_documents_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.employees ADD CONSTRAINT "employees_manager_id_fkey" FOREIGN KEY (manager_id) REFERENCES employees(id);
ALTER TABLE public.employees ADD CONSTRAINT "employees_role_id_fkey" FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL;
ALTER TABLE public.employees ADD CONSTRAINT "employees_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;
ALTER TABLE public.employees ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);
ALTER TABLE public.import_logs ADD CONSTRAINT "import_logs_imported_by_fkey" FOREIGN KEY (imported_by) REFERENCES auth.users(id);
ALTER TABLE public.import_logs ADD CONSTRAINT "import_logs_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
ALTER TABLE public.terminations ADD CONSTRAINT "terminations_employee_id_fkey" FOREIGN KEY (employee_id) REFERENCES employees(id);
ALTER TABLE public.terminations ADD CONSTRAINT "terminations_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id);
CREATE INDEX idx_employees_score ON public.employees USING btree (score DESC);
CREATE INDEX idx_employees_status_rh ON public.employees USING btree (status_rh);
CREATE INDEX idx_employees_unit ON public.employees USING btree (unit_id);
CREATE INDEX idx_emp_docs_employee ON public.employee_documents USING btree (employee_id);
CREATE INDEX idx_employees_employee_code ON public.employees USING btree (employee_code);
CREATE INDEX idx_dependents_employee ON public.dependents USING btree (employee_id);
CREATE INDEX idx_emp_docs_tipo ON public.employee_documents USING btree (tipo);
CREATE INDEX idx_emp_docs_validade ON public.employee_documents USING btree (data_validade) WHERE (data_validade IS NOT NULL);
CREATE INDEX employees_manager ON public.employees USING btree (manager_id);

CREATE INDEX employees_role_id_idx ON public.employees(role_id);
CREATE INDEX employees_user_id_idx ON public.employees(user_id);
CREATE INDEX terminations_unit_id_idx ON public.terminations(unit_id);
CREATE INDEX import_logs_unit_id_idx ON public.import_logs(unit_id);
CREATE INDEX import_logs_imported_by_idx ON public.import_logs(imported_by);
CREATE INDEX employee_documents_uploaded_by_idx ON public.employee_documents(uploaded_by);

CREATE FUNCTION public.cardoso_is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
 SELECT EXISTS (
  SELECT 1 FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id
  WHERE ur.user_id=(SELECT auth.uid()) AND r.name='founder'
    AND ur.group_id IS NOT NULL AND ur.unit_id IS NULL AND ur.brand_id IS NULL
 );
$$;
REVOKE ALL ON FUNCTION public.cardoso_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cardoso_is_admin() TO authenticated, service_role;

CREATE FUNCTION public._sync_employee_tier() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
 IF NEW.role_id IS NULL THEN NEW.tier := NULL;
 ELSE SELECT r.tier INTO NEW.tier FROM public.roles r WHERE r.id=NEW.role_id;
 END IF;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public._sync_employee_tier() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER trg_sync_employee_tier BEFORE INSERT OR UPDATE OF role_id
 ON public.employees FOR EACH ROW EXECUTE FUNCTION public._sync_employee_tier();

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.employees FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
CREATE POLICY cardoso_admin_access ON public.employees FOR ALL TO authenticated
 USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));

ALTER TABLE public.dependents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.dependents FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dependents TO authenticated;
GRANT ALL ON public.dependents TO service_role;
CREATE POLICY cardoso_admin_access ON public.dependents FOR ALL TO authenticated
 USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));

ALTER TABLE public.employee_documents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.employee_documents FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_documents TO authenticated;
GRANT ALL ON public.employee_documents TO service_role;
CREATE POLICY cardoso_admin_access ON public.employee_documents FOR ALL TO authenticated
 USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));

ALTER TABLE public.terminations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.terminations FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.terminations TO authenticated;
GRANT ALL ON public.terminations TO service_role;
CREATE POLICY cardoso_admin_access ON public.terminations FOR ALL TO authenticated
 USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.import_logs FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_logs TO authenticated;
GRANT ALL ON public.import_logs TO service_role;
CREATE POLICY cardoso_admin_access ON public.import_logs FOR ALL TO authenticated
 USING ((SELECT public.cardoso_is_admin())) WITH CHECK ((SELECT public.cardoso_is_admin()));

NOTIFY pgrst, 'reload schema';

