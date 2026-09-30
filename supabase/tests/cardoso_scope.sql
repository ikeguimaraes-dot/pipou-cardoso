BEGIN;
SELECT set_config('test.uid',gen_random_uuid()::text,true);
INSERT INTO auth.users(id,email) VALUES(current_setting('test.uid')::uuid,'fixture-'||gen_random_uuid()||'@example.invalid');
WITH b AS(INSERT INTO public.brands(group_id,name,slug) SELECT id,'Scope fixture','fixture-'||gen_random_uuid() FROM public.groups WHERE slug='cardoso' RETURNING id)
SELECT set_config('test.brand',id::text,true) FROM b;
WITH u AS(INSERT INTO public.units(brand_id,name) VALUES(current_setting('test.brand')::uuid,'A') RETURNING id) SELECT set_config('test.a',id::text,true) FROM u;
WITH u AS(INSERT INTO public.units(brand_id,name) VALUES(current_setting('test.brand')::uuid,'B') RETURNING id) SELECT set_config('test.b',id::text,true) FROM u;
INSERT INTO public.user_roles(user_id,role_id,unit_id) SELECT current_setting('test.uid')::uuid,id,current_setting('test.a')::uuid FROM public.roles WHERE name='pessoas';
INSERT INTO public.employees(unit_id,nome,sobrenome,funcao,data_admissao)
VALUES(current_setting('test.a')::uuid,'A','Fixture','TESTE',current_date),(current_setting('test.b')::uuid,'B','Fixture','TESTE',current_date);
INSERT INTO public.employee_documents(employee_id,tipo,nome) SELECT id,'outros','Fixture' FROM public.employees WHERE unit_id IN(current_setting('test.a')::uuid,current_setting('test.b')::uuid);
INSERT INTO public.candidates(full_name,unit_id) VALUES('Scoped A',current_setting('test.a')::uuid),('Scoped B',current_setting('test.b')::uuid);
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.uid'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE n int; BEGIN
 IF public.cardoso_is_admin() THEN RAISE EXCEPTION 'Scoped manager elevated'; END IF;
 IF NOT public.cardoso_can_read_unit(current_setting('test.a')::uuid) OR public.cardoso_can_read_unit(current_setting('test.b')::uuid) THEN RAISE EXCEPTION 'Scope mismatch'; END IF;
 SELECT count(*) INTO n FROM public.employees;
 IF n<>1 THEN RAISE EXCEPTION 'Expected one authorized employee, got %',n; END IF;
 SELECT count(*) INTO n FROM public.employee_documents;
 IF n<>1 THEN RAISE EXCEPTION 'Document isolation failed'; END IF;
 SELECT count(*) INTO n FROM public.candidates;
 IF n<>1 THEN RAISE EXCEPTION 'Candidate isolation failed'; END IF;
 BEGIN
  PERFORM public.cardoso_import_talents(current_setting('test.a')::uuid,'[{"full_name":"Fixture","email":"fixture@example.invalid"}]'::jsonb,true);
  RAISE EXCEPTION 'Scoped manager imported' USING ERRCODE='P0002';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.employees SET nome='FORBIDDEN';
 IF FOUND THEN RAISE EXCEPTION 'Read-only manager wrote employee'; END IF;
 BEGIN
  PERFORM public.cardoso_create_unit('Escalation','Forbidden',null);
  RAISE EXCEPTION 'Manager created unit' USING ERRCODE='P0002';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 IF EXISTS(SELECT 1 FROM storage.objects WHERE bucket_id IN('candidate-cvs','employee-documents','ponto-fotos','employee-docs')) THEN RAISE EXCEPTION 'Manager read private files'; END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims',json_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE t record; n int; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN('roles') LOOP
  EXECUTE format('SELECT count(*) FROM public.%I',t.tablename) INTO n;
  IF n<>0 THEN RAISE EXCEPTION 'Unauthorized rows in %',t.tablename; END IF;
 END LOOP;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: scoped RH reads only unit A, cannot write or elevate, no-role reads no operational data; fixtures rolled back' result;
