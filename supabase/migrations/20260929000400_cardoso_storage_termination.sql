-- Private storage and atomic termination. No third-party accounts or customer rows.
INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES
('employee-documents','employee-documents',false,10485760,ARRAY['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
('employee-docs','employee-docs',false,10485760,ARRAY['application/pdf','image/jpeg','image/png']),
('candidate-cvs','candidate-cvs',false,10485760,ARRAY['application/pdf','image/jpeg','image/png','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
('ponto-fotos','ponto-fotos',false,5242880,ARRAY['image/jpeg','image/png'])
ON CONFLICT(id) DO UPDATE SET public=false,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;
CREATE POLICY cardoso_admin_private_files ON storage.objects FOR ALL TO authenticated
USING (bucket_id IN ('employee-documents','employee-docs','candidate-cvs','ponto-fotos') AND (SELECT public.cardoso_is_admin()))
WITH CHECK(bucket_id IN ('employee-documents','employee-docs','candidate-cvs','ponto-fotos') AND (SELECT public.cardoso_is_admin()));

CREATE FUNCTION public.cardoso_terminate_employee(p_employee_id uuid,p_date date,p_reason text)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp
AS $$
DECLARE e public.employees; label text; termination_id uuid;
BEGIN
 IF NOT public.cardoso_is_admin() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
 label:=CASE p_reason
 WHEN 'pedido_demissao' THEN 'Pedido de demissão'
 WHEN 'sem_justa_causa' THEN 'Demissão sem justa causa – iniciativa da empresa'
 WHEN 'justa_causa' THEN 'Demissão por justa causa'
 WHEN 'termino_experiencia' THEN 'Término de contrato de experiência' END;
 IF label IS NULL THEN RAISE EXCEPTION 'Motivo inválido'; END IF;
 SELECT * INTO e FROM public.employees WHERE id=p_employee_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Colaborador não encontrado'; END IF;
 IF NOT e.ativo OR e.data_demissao IS NOT NULL THEN RAISE EXCEPTION 'Desligamento já registrado'; END IF;
 IF p_date IS NULL OR p_date<e.data_admissao OR p_date>(now() AT TIME ZONE 'America/Sao_Paulo')::date
 THEN RAISE EXCEPTION 'Data de desligamento inválida'; END IF;
 INSERT INTO public.terminations(unit_id,employee_id,nome,tipo_aviso,data_aviso,motivo,status)
 VALUES(e.unit_id,e.id,concat_ws(' ',e.nome,e.sobrenome),p_reason,p_date,label,'registrado')
 RETURNING id INTO termination_id;
 UPDATE public.employees SET ativo=false,status_rh='inativo',data_demissao=p_date,updated_at=now() WHERE id=e.id;
 RETURN termination_id;
END $$;
REVOKE ALL ON FUNCTION public.cardoso_terminate_employee(uuid,date,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cardoso_terminate_employee(uuid,date,text) TO authenticated,service_role;
NOTIFY pgrst,'reload schema';
