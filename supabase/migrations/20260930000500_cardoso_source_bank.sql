-- Source-aware talent bank. No historical selection outcome changes current eligibility.
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS import_identity_key text;
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS import_review text[] NOT NULL DEFAULT '{}';
CREATE UNIQUE INDEX IF NOT EXISTS candidates_import_identity_key ON public.candidates(import_identity_key) WHERE import_identity_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS candidates_cpf_lookup ON public.candidates(cpf) WHERE cpf IS NOT NULL;
CREATE TABLE public.talent_import_runs (
 id uuid PRIMARY KEY, source_sha256 text UNIQUE NOT NULL, filename text NOT NULL,
 unit_id uuid NOT NULL REFERENCES public.units(id), status text NOT NULL CHECK(status IN ('loading','complete')),
 source_rows integer NOT NULL, candidate_count integer NOT NULL, summary jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz
);
CREATE TABLE public.talent_source_records (
 id uuid PRIMARY KEY, run_id uuid NOT NULL REFERENCES public.talent_import_runs(id),
 candidate_id uuid NOT NULL REFERENCES public.candidates(id),
 sheet text NOT NULL, source_row integer NOT NULL, source_company_code text,
 fields jsonb NOT NULL, review_flags text[] NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(run_id,sheet,source_row)
);
CREATE INDEX talent_source_candidate ON public.talent_source_records(candidate_id);
CREATE INDEX talent_source_run ON public.talent_source_records(run_id);
ALTER TABLE public.talent_import_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_source_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY talent_import_admin_read ON public.talent_import_runs FOR SELECT TO authenticated USING ((SELECT public.cardoso_is_admin()));
CREATE POLICY talent_source_admin_read ON public.talent_source_records FOR SELECT TO authenticated USING ((SELECT public.cardoso_is_admin()));
REVOKE ALL ON public.talent_import_runs, public.talent_source_records FROM anon, authenticated;
GRANT SELECT ON public.talent_import_runs, public.talent_source_records TO authenticated;
GRANT ALL ON public.talent_import_runs, public.talent_source_records TO service_role;
COMMENT ON TABLE public.talent_source_records IS 'Original row history. Company codes are source employer references, not platform unit assignments. Only admin can read; backend service imports.';
