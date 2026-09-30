BEGIN;
SELECT set_config('request.jwt.claims',json_build_object('sub',(SELECT ur.user_id::text FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id WHERE r.name='founder' LIMIT 1),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE u uuid; result jsonb; payload jsonb; token text:=gen_random_uuid()::text;
 before_employees bigint; before_candidates bigint; total_new int:=0;
BEGIN
 SELECT count(*) INTO before_employees FROM public.employees;
 SELECT count(*) INTO before_candidates FROM public.candidates;
 u:=public.cardoso_create_unit('Fixture talent '||token,'Fixture',NULL);
 payload:=jsonb_build_array(jsonb_build_object('full_name','Fixture','email',token||'@example.invalid','phone','+55 (11) 90000-0123'));
 result:=public.cardoso_import_talents(u,payload,false);
 IF (result->>'created')::int<>1 OR (SELECT count(*) FROM public.candidates)<>before_candidates THEN RAISE EXCEPTION 'Preview mutated'; END IF;
 result:=public.cardoso_import_talents(u,payload,true);
 IF (result->>'created')::int<>1 THEN RAISE EXCEPTION 'Import failed'; END IF;
 result:=public.cardoso_import_talents(u,payload,true);
 IF (result->>'created')::int<>0 OR (result->>'skipped')::int<>1 THEN RAISE EXCEPTION 'Retry duplicated'; END IF;
 result:=public.cardoso_import_talents(u,jsonb_build_array(jsonb_build_object('full_name','Another name','phone','11900000123')),true);
 IF (result->>'skipped')::int<>1 THEN RAISE EXCEPTION 'Phone normalization failed'; END IF;
 BEGIN
  PERFORM public.cardoso_import_talents(u,jsonb_build_array(jsonb_build_object('full_name','Valid','email','valid-'||token||'@example.invalid'),jsonb_build_object('full_name','Invalid')),true);
  RAISE EXCEPTION 'Invalid batch accepted' USING ERRCODE='P0002';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
 IF EXISTS(SELECT 1 FROM public.candidates WHERE email='valid-'||token||'@example.invalid') THEN RAISE EXCEPTION 'Partial batch persisted'; END IF;
 FOR i IN 0..100 LOOP
  SELECT jsonb_agg(jsonb_build_object('full_name','Fixture '||g,'email',token||'-'||g||'@example.invalid')) INTO payload FROM generate_series(i*100+1,least((i+1)*100,10001)) g;
  result:=public.cardoso_import_talents(u,payload,true);
  total_new:=total_new+(result->>'created')::int;
 END LOOP;
 IF total_new<>10001 THEN RAISE EXCEPTION 'Large load truncated'; END IF;
 IF EXISTS(SELECT 1 FROM public.candidates WHERE unit_id=u AND (status<>'banco_talentos' OR job_opening_id IS NOT NULL OR employee_id IS NOT NULL OR welcome_message_sid IS NOT NULL)) THEN RAISE EXCEPTION 'Unexpected side effects'; END IF;
 IF (SELECT count(*) FROM public.employees)<>before_employees THEN RAISE EXCEPTION 'Employees changed'; END IF;
 PERFORM set_config('request.jwt.claims',json_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
 BEGIN
  PERFORM public.cardoso_import_talents(u,payload,true);
  RAISE EXCEPTION 'Unauthorized import accepted' USING ERRCODE='P0002';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: preview without writes, idempotency, phone deduplication, atomic failure, 10001 candidates in 101 batches, no employee/message side effects, unauthorized denied; all fixtures rolled back' result;
