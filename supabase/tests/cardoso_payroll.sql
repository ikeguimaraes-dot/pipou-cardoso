BEGIN;
SELECT set_config('request.jwt.claims',json_build_object('sub',(SELECT ur.user_id::text FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id WHERE r.name='founder' LIMIT 1),'role','authenticated')::text,true);
SET LOCAL ROLE authenticated;
DO $$ DECLARE u uuid; e uuid; p uuid; result jsonb; txt text; adjustment uuid; BEGIN
 u:=public.cardoso_create_unit('Fixture payroll '||gen_random_uuid(),'Fixture',NULL);
 INSERT INTO public.employees(unit_id,nome,sobrenome,funcao,data_admissao,salario_base)
 VALUES(u,'Payroll','Fixture','TESTE',current_date,1000) RETURNING id INTO e;
 INSERT INTO public.payroll_dominio_empresa(cod_empresa,razao_social) VALUES('99999999','Fixture');
 INSERT INTO public.employee_codigos_dominio(employee_id,unit_id,cod_folha) VALUES(e,u,'1');
 INSERT INTO public.payroll_dominio_cadastro(cod_empresa,cod_colaborador,nome,nome_norm,employee_id)
 VALUES('99999999',1,'Payroll Fixture','PAYROLL FIXTURE',e);
 INSERT INTO public.ponto_mensal(unit_id,employee_id,nome,periodo,horas_trabalhadas,hora_extra_100)
 VALUES(u,e,'Fixture','09/2026','160:00','02:00');
 result:=public.rpc_payroll_coletar_periodo(u,'09/2026');
 p:=(result->>'periodo_id')::uuid;
 IF p IS NULL OR (result->>'colabs')::int<>1 THEN RAISE EXCEPTION 'Collection failed'; END IF;
 result:=public.rpc_payroll_upsert_lancamento_manual(p,e,'PV-15',50,NULL,'Fixture');
 IF (result->>'ok')::boolean IS NOT TRUE THEN RAISE EXCEPTION 'Manual entry failed: %',result; END IF;
 UPDATE public.payroll_rubricas SET exporta_txt=true,cod_dominio='9999' WHERE cod_kph='PV-15';
 txt:=public.rpc_payroll_gerar_txt_dominio('09/2026','99999999',u);
 IF length(txt)<>43 THEN RAISE EXCEPTION 'Invalid fixed-width export'; END IF;
 BEGIN
  PERFORM public.rpc_payroll_gerar_txt_dominio('09/2026','88888888',u);
  RAISE EXCEPTION 'Company mismatch allowed' USING ERRCODE='P0002';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
 INSERT INTO public.punch_adjustment_requests(employee_id,data_referencia,horario_saida_almoco,horario_retorno_almoco,motivo)
 VALUES(e,current_date,'12:00','13:00','Outro') RETURNING id INTO adjustment;
 PERFORM public.resolve_punch_adjustment(adjustment,auth.uid(),'aprovado',true);
 IF (SELECT count(*) FROM public.time_clock_punches WHERE employee_id=e)<>2 THEN RAISE EXCEPTION 'Punch approval failed'; END IF;
 UPDATE public.payroll_fechamento_periodo SET status='FECHADO' WHERE id=p;
 BEGIN
  PERFORM public.rpc_payroll_coletar_periodo(u,'09/2026');
  RAISE EXCEPTION 'Closed collection allowed' USING ERRCODE='P0002';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL; END;
END $$;
RESET ROLE;
ROLLBACK;
SELECT 'PASS: onboarding, payroll collection, manual entry, 43-character export, company mismatch denied, punch approval; fixtures rolled back' result;
