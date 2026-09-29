-- Run on the Cardoso project only. All fixtures are rolled back.
BEGIN;
SELECT set_config('test.admin1', (SELECT ur.user_id::text FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id WHERE r.name='founder' ORDER BY ur.user_id LIMIT 1), true);
SELECT set_config('test.admin2', (SELECT ur.user_id::text FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id WHERE r.name='founder' ORDER BY ur.user_id OFFSET 1 LIMIT 1), true);
DO $$ BEGIN
 IF current_setting('test.admin1',true) IS NULL OR current_setting('test.admin2',true) IS NULL
 THEN RAISE EXCEPTION 'Two admin grants required'; END IF;
END $$;
WITH b AS (
 INSERT INTO public.brands(group_id,name,slug)
 SELECT id,'Fixture rollback','fixture-'||gen_random_uuid() FROM public.groups WHERE slug='cardoso' RETURNING id
), u AS (
 INSERT INTO public.units(brand_id,name) SELECT id,'Fixture rollback' FROM b RETURNING id
) SELECT set_config('test.unit',id::text,true) FROM u;
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.admin1'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE eid uuid; BEGIN
 IF NOT public.cardoso_is_admin() THEN RAISE EXCEPTION 'Admin rejected'; END IF;
 INSERT INTO public.employees(unit_id,nome,sobrenome,funcao,data_admissao,role_id)
 VALUES(current_setting('test.unit')::uuid,'Fixture','Rollback','TESTE',current_date,(SELECT id FROM public.roles WHERE name='founder')) RETURNING id INTO eid;
 PERFORM set_config('test.employee',eid::text,true);
 IF (SELECT tier FROM public.employees WHERE id=eid) <> 'T6' THEN RAISE EXCEPTION 'Tier trigger failed'; END IF;
 INSERT INTO public.dependents(employee_id,nome,parentesco) VALUES(eid,'Fixture','filho');
 INSERT INTO public.employee_documents(employee_id,tipo,nome) VALUES(eid,'outros','Fixture');
 INSERT INTO public.terminations(employee_id,unit_id,nome,data_aviso,tipo_aviso) VALUES(eid,current_setting('test.unit')::uuid,'Fixture',current_date,'pedido_demissao');
 INSERT INTO public.import_logs(unit_id,periodo,tipo) VALUES(current_setting('test.unit')::uuid,'2026-09','ponto');
 UPDATE public.employees SET pis='TESTE',ativo=false,status_rh='inativo',data_demissao=current_date WHERE id=eid;
 IF NOT EXISTS(SELECT 1 FROM public.employees WHERE id=eid AND pis='TESTE' AND NOT ativo) THEN RAISE EXCEPTION 'Update failed'; END IF;
 BEGIN
  INSERT INTO public.employee_documents(employee_id,tipo,nome) VALUES(eid,'invalid_type','Fixture');
  RAISE EXCEPTION 'Invalid document type accepted';
 EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.admin2'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 IF NOT public.cardoso_is_admin() OR NOT EXISTS(SELECT 1 FROM public.employees WHERE id=current_setting('test.employee')::uuid)
 THEN RAISE EXCEPTION 'Second admin cannot read'; END IF;
 UPDATE public.employee_documents SET nome='Fixture updated' WHERE employee_id=current_setting('test.employee')::uuid;
 IF NOT FOUND THEN RAISE EXCEPTION 'Second admin cannot update'; END IF;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims',json_build_object('sub',gen_random_uuid(),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE n int; t text; BEGIN
 IF public.cardoso_is_admin() THEN RAISE EXCEPTION 'Unassigned user is admin'; END IF;
 FOREACH t IN ARRAY ARRAY['employees','dependents','employee_documents','terminations','import_logs'] LOOP
  EXECUTE format('SELECT count(*) FROM public.%I',t) INTO n;
  IF n<>0 THEN RAISE EXCEPTION 'Unauthorized read on %',t; END IF;
 END LOOP;
 UPDATE public.employees SET pis='FORBIDDEN' WHERE id=current_setting('test.employee')::uuid;
 IF FOUND THEN RAISE EXCEPTION 'Unauthorized update'; END IF;
 BEGIN
  INSERT INTO public.employees(unit_id,nome,sobrenome,funcao,data_admissao)
  VALUES(current_setting('test.unit')::uuid,'Denied','Fixture','TESTE',current_date);
  RAISE EXCEPTION 'Unauthorized insert';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  UPDATE public.user_roles SET user_id=auth.uid();
  RAISE EXCEPTION 'Role escalation allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
RESET ROLE;
SELECT set_config('request.jwt.claims','{"role":"anon"}',true);
SET LOCAL ROLE anon;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['employees','dependents','employee_documents','terminations','import_logs'] LOOP
  BEGIN
   EXECUTE format('SELECT 1 FROM public.%I LIMIT 1',t);
   RAISE EXCEPTION 'Anonymous read allowed on %',t;
  EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 END LOOP;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: both admins; insert/update/read; tier trigger; document constraint; unassigned/anon denial; role escalation denied; fixtures rolled back' AS result;
