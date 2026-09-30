-- Keep deduplication checks, insert all accepted rows with a single SQL statement per batch.
CREATE OR REPLACE FUNCTION public.cardoso_import_talents(p_unit_id uuid,p_rows jsonb,p_commit boolean DEFAULT false)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path=pg_catalog,public,pg_temp
AS $$
DECLARE item jsonb; n int:=0; added int:=0; skipped int:=0;
 candidate_name text; candidate_email text; candidate_phone text;
 seen_emails text[]:='{}'; seen_phones text[]:='{}'; outcomes jsonb:='[]'; rows_to_insert jsonb:='[]';
BEGIN
 IF NOT public.cardoso_is_admin() THEN RAISE EXCEPTION 'Acesso administrativo necessário' USING ERRCODE='42501'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.units WHERE id=p_unit_id AND active) THEN RAISE EXCEPTION 'Unidade indisponível'; END IF;
 IF p_rows IS NULL OR jsonb_typeof(p_rows)<>'array' THEN RAISE EXCEPTION 'Lote inválido'; END IF;
 IF jsonb_array_length(p_rows) NOT BETWEEN 1 AND 100 OR octet_length(p_rows::text)>500000 THEN RAISE EXCEPTION 'Limite de 100 candidatos por lote'; END IF;
 -- Serialize only writes, including other candidate insertion paths, to protect check+insert.
 IF p_commit IS TRUE THEN LOCK TABLE public.candidates IN SHARE ROW EXCLUSIVE MODE; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_rows) LOOP
  n:=n+1;
  candidate_name:=btrim(item->>'full_name');
  candidate_email:=nullif(lower(btrim(item->>'email')),'');
  candidate_phone:=nullif(public.cardoso_normalize_phone(item->>'phone'),'');
  IF jsonb_typeof(item)<>'object' OR candidate_name IS NULL OR length(candidate_name) NOT BETWEEN 2 AND 250
    OR (candidate_email IS NULL AND candidate_phone IS NULL)
    OR (candidate_email IS NOT NULL AND (length(candidate_email)>250 OR candidate_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'))
    OR (candidate_phone IS NOT NULL AND (candidate_phone !~ '^[0-9]{10,15}$' OR (item->>'phone') !~ '^\+?[0-9[:space:]().-]+$'))
    OR length(coalesce(item->>'area_interesse',''))>250 OR length(coalesce(item->>'cidade',''))>250
    OR length(coalesce(item->>'bairro',''))>250 OR length(coalesce(item->>'observacoes',''))>2000
    THEN RAISE EXCEPTION 'Candidato inválido na linha % do lote',n; END IF;
  IF (candidate_email IS NOT NULL AND candidate_email=ANY(seen_emails)) OR (candidate_phone IS NOT NULL AND candidate_phone=ANY(seen_phones))
    OR EXISTS(SELECT 1 FROM public.candidates WHERE (candidate_email IS NOT NULL AND email IS NOT NULL AND lower(btrim(email))=candidate_email) OR (candidate_phone IS NOT NULL AND phone IS NOT NULL AND public.cardoso_normalize_phone(phone)=candidate_phone)) THEN
   skipped:=skipped+1;
   outcomes:=outcomes||jsonb_build_array(jsonb_build_object('row',n,'status','existing'));
  ELSE
   rows_to_insert:=rows_to_insert||jsonb_build_array(jsonb_build_object('full_name',candidate_name,'email',candidate_email,'phone',candidate_phone,'area_interesse',nullif(btrim(item->>'area_interesse'),''),'cidade',nullif(btrim(item->>'cidade'),''),'bairro',nullif(btrim(item->>'bairro'),''),'observacoes',nullif(btrim(item->>'observacoes'),'')));
   added:=added+1;
   outcomes:=outcomes||jsonb_build_array(jsonb_build_object('row',n,'status',CASE WHEN p_commit IS TRUE THEN 'created' ELSE 'ready' END));
  END IF;
  IF candidate_email IS NOT NULL THEN seen_emails:=array_append(seen_emails,candidate_email); END IF;
  IF candidate_phone IS NOT NULL THEN seen_phones:=array_append(seen_phones,candidate_phone); END IF;
 END LOOP;
 IF p_commit IS TRUE AND added>0 THEN
  INSERT INTO public.candidates(full_name,email,phone,unit_id,status,origem,area_interesse,cidade,bairro,observacoes)
  SELECT r.full_name,r.email,r.phone,p_unit_id,'banco_talentos','manual',r.area_interesse,r.cidade,r.bairro,r.observacoes
  FROM jsonb_to_recordset(rows_to_insert) AS r(full_name text,email text,phone text,area_interesse text,cidade text,bairro text,observacoes text);
 END IF;
 RETURN jsonb_build_object('created',added,'skipped',skipped,'rows',outcomes);
END $$;
REVOKE ALL ON FUNCTION public.cardoso_import_talents(uuid,jsonb,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cardoso_import_talents(uuid,jsonb,boolean) TO authenticated;
COMMENT ON FUNCTION public.cardoso_import_talents(uuid,jsonb,boolean) IS 'Admin-only preview/import. Preserves existing candidates matched by normalized email OR phone. No vacancy, employee or outbound message is created.';
