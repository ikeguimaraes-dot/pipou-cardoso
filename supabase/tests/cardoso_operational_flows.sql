BEGIN;
SELECT set_config('test.admin',(SELECT ur.user_id::text FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id WHERE r.name='founder' LIMIT 1),true);
WITH b AS(INSERT INTO public.brands(group_id,name,slug) SELECT id,'Fixture','fixture-'||gen_random_uuid() FROM public.groups WHERE slug='cardoso' RETURNING id)
SELECT set_config('test.brand',id::text,true) FROM b;
WITH u AS(INSERT INTO public.units(brand_id,name) VALUES(current_setting('test.brand')::uuid,'Fixture') RETURNING id)
SELECT set_config('test.unit',id::text,true) FROM u;
SELECT set_config('request.jwt.claims',json_build_object('sub',current_setting('test.admin'),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $test$ DECLARE t record; v uuid; c uuid; e uuid; sid uuid; qid uuid; n integer; tid uuid; BEGIN
 FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP
  EXECUTE format('SELECT count(*) FROM public.%I',t.tablename) INTO n;
 END LOOP;
 INSERT INTO public.job_openings(title,unit_id,motivo_estruturado,status)
 VALUES('Fixture',current_setting('test.unit')::uuid,'substituicao_promocao','aberta') RETURNING id INTO v;
 INSERT INTO public.candidates(full_name,unit_id,job_opening_id,status)
 VALUES('Fixture Teste',current_setting('test.unit')::uuid,v,'aprovado') RETURNING id INTO c;
 SELECT public.promover_candidato(c,current_setting('test.unit')::uuid,'00000000001','TESTE',1000,current_date) INTO e;
 IF NOT EXISTS(SELECT 1 FROM public.candidates WHERE id=c AND employee_id=e AND status='contratado') THEN RAISE EXCEPTION 'Promotion failed'; END IF;
 PERFORM public.upsert_avaliacao(c,8,8,8,8,false,false);
 IF (SELECT nota_final FROM public.candidate_avaliacao WHERE candidate_id=c)<>8 THEN RAISE EXCEPTION 'Generated score failed'; END IF;
 INSERT INTO public.ponto_mensal(unit_id,employee_id,nome,periodo) VALUES(current_setting('test.unit')::uuid,e,'Fixture','set/26');
 IF NOT EXISTS(SELECT 1 FROM public.ponto_mensal WHERE employee_id=e AND periodo='09/2026') THEN RAISE EXCEPTION 'Normalization failed'; END IF;
 INSERT INTO public.climate_surveys(titulo) VALUES('Fixture') RETURNING id INTO sid;
 INSERT INTO public.climate_questions(survey_id,texto,tipo) VALUES(sid,'Fixture','escala') RETURNING id INTO qid;
 INSERT INTO public.climate_responses(survey_id,question_id,employee_id,valor_escala) VALUES(sid,qid,e,5);
 IF (SELECT media_escala FROM public.get_survey_results(sid) LIMIT 1)<>5 THEN RAISE EXCEPTION 'Survey result failed'; END IF;
 INSERT INTO public.training_templates(brand_id,nome) VALUES(current_setting('test.brand')::uuid,'Fixture') RETURNING id INTO tid;
 INSERT INTO public.training_records(employee_id,template_id,status,data_conclusao,validade_dias_snapshot)
 VALUES(e,tid,'concluido',current_date,30);
 IF NOT EXISTS(SELECT 1 FROM public.training_records WHERE employee_id=e AND validade_ate=current_date+30) THEN RAISE EXCEPTION 'Training validity failed'; END IF;
 PERFORM public.cardoso_terminate_employee(e,current_date,'pedido_demissao');
 IF NOT EXISTS(SELECT 1 FROM public.employees WHERE id=e AND NOT ativo AND data_demissao=current_date) THEN RAISE EXCEPTION 'Termination failed'; END IF;
 BEGIN
  PERFORM public.cardoso_terminate_employee(e,current_date,'pedido_demissao');
  RAISE EXCEPTION 'Duplicate termination accepted' USING ERRCODE='P0002';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
 PERFORM * FROM public.get_cargo_salarios();
 PERFORM * FROM public.get_organograma();
 PERFORM * FROM public.get_gap_headcount(current_setting('test.unit')::uuid);
 PERFORM * FROM public.get_quadro_completo(current_setting('test.unit')::uuid);
 PERFORM * FROM public.get_punches_by_unit(current_setting('test.unit')::uuid,current_date);
 PERFORM * FROM public.buscar_talentos(ARRAY['contratado']);
 PERFORM * FROM public.rpc_payroll_listar_periodos(current_setting('test.unit')::uuid);
 PERFORM * FROM public.rpc_payroll_listar_fechamento(gen_random_uuid());
 PERFORM * FROM public.rpc_payroll_espelho_fopag(gen_random_uuid());
 INSERT INTO public.candidates(full_name,unit_id,job_opening_id,status)
 VALUES('Fixture Reversal',current_setting('test.unit')::uuid,v,'aprovado') RETURNING id INTO c;
 SELECT public.promover_candidato(c,current_setting('test.unit')::uuid,'00000000002','TESTE',1000,current_date) INTO e;
 DELETE FROM public.employees WHERE id=e;
 IF EXISTS(SELECT 1 FROM public.candidates WHERE id=c AND employee_id IS NOT NULL) THEN RAISE EXCEPTION 'Candidate reversal failed'; END IF;
END $test$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: all tables readable; vacancy; candidate admission; generated score; monthly point; climate; training; atomic termination; read RPCs' AS result;
