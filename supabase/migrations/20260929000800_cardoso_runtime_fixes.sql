-- Revert candidate link before the FK checks employee deletion.
DROP TRIGGER trg_revert_candidate_on_employee_delete ON public.employees;
CREATE TRIGGER trg_revert_candidate_on_employee_delete BEFORE DELETE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.revert_candidate_on_employee_delete();
CREATE OR REPLACE FUNCTION public.rpc_payroll_coletar_periodo(p_unit_id uuid, p_competencia text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER

 SET search_path TO pg_catalog,public,extensions,pg_temp
AS $function$
DECLARE
  v_periodo_id    uuid;
  v_colabs        int := 0;
  v_linhas        int := 0;
  v_mes           int;
  v_ano           int;
  v_afast_genuino int;
  v_cod_empresa   text;
  v_he100         interval;
  v_empresas      text[];

  rid_pv01 uuid; rid_pv04 uuid; rid_pv05 uuid; rid_pv06 uuid;
  rid_ds03 uuid; rid_ds04 uuid;
  rid_pv07 uuid; rid_in02 uuid; rid_in05 uuid; rid_in07 uuid; rid_in08 uuid;

  r record;
BEGIN
  SELECT mes, ano INTO v_mes, v_ano FROM payroll_competencia_mes_ano(p_competencia);

  SELECT id INTO rid_pv01 FROM payroll_rubricas WHERE cod_kph = 'PV-01';
  SELECT id INTO rid_pv04 FROM payroll_rubricas WHERE cod_kph = 'PV-04';
  SELECT id INTO rid_pv05 FROM payroll_rubricas WHERE cod_kph = 'PV-05';
  SELECT id INTO rid_pv06 FROM payroll_rubricas WHERE cod_kph = 'PV-06';
  SELECT id INTO rid_ds03 FROM payroll_rubricas WHERE cod_kph = 'DS-03B';
  SELECT id INTO rid_ds04 FROM payroll_rubricas WHERE cod_kph = 'DS-04';
  SELECT id INTO rid_pv07 FROM payroll_rubricas WHERE cod_kph = 'PV-07';
  SELECT id INTO rid_in02 FROM payroll_rubricas WHERE cod_kph = 'IN-02';
  SELECT id INTO rid_in05 FROM payroll_rubricas WHERE cod_kph = 'IN-05';
  SELECT id INTO rid_in07 FROM payroll_rubricas WHERE cod_kph = 'IN-07';
  SELECT id INTO rid_in08 FROM payroll_rubricas WHERE cod_kph = 'IN-08';

  SELECT array_agg(DISTINCT pdc.cod_empresa ORDER BY pdc.cod_empresa) INTO v_empresas
  FROM payroll_dominio_cadastro pdc
  JOIN employee_codigos_dominio ecd ON ecd.employee_id = pdc.employee_id
  WHERE ecd.unit_id     = p_unit_id
    AND pdc.cod_empresa IS NOT NULL;

  IF array_length(v_empresas, 1) > 1 THEN
    RAISE EXCEPTION
      'Unidade % possui multiplas cod_empresa: [%]. Corrija payroll_dominio_cadastro antes de coletar.',
      p_unit_id, array_to_string(v_empresas, ', ');
  END IF;

  v_cod_empresa := v_empresas[1];

  INSERT INTO payroll_fechamento_periodo (unit_id, competencia, tipo_processo, status, cod_empresa)
  VALUES (p_unit_id, p_competencia, '11', 'ABERTO', v_cod_empresa)
  ON CONFLICT (unit_id, competencia, tipo_processo) DO UPDATE
    SET status      = payroll_fechamento_periodo.status,
        cod_empresa = COALESCE(payroll_fechamento_periodo.cod_empresa, EXCLUDED.cod_empresa)
  RETURNING id INTO v_periodo_id;
  IF EXISTS(SELECT 1 FROM public.payroll_fechamento_periodo WHERE id=v_periodo_id AND status IN ('APROVADO','FECHADO')) THEN
    RAISE EXCEPTION 'Período aprovado ou fechado não permite recoleta';
  END IF;

  FOR r IN
    SELECT pm.employee_id, ecd.cod_folha,
           pm.horas_trabalhadas, pm.horas_positivas, pm.banco_horas_mes,
           pm.adicional_noturno, pm.falta_injustificada_horas,
           pm.falta_injustificada_dias, pm.afastamentos_dias, pm.ferias_dias,
           pm.hora_extra_100, pm.hora_extra_100_noturno
    FROM ponto_mensal pm
    LEFT JOIN employee_codigos_dominio ecd
           ON ecd.employee_id = pm.employee_id
          AND ecd.unit_id     = pm.unit_id
          AND ecd.ativo       = true
    WHERE pm.unit_id = p_unit_id AND pm.periodo = p_competencia
      AND pm.employee_id IS NOT NULL
  LOOP
    v_colabs := v_colabs + 1;

    IF payroll_parse_hhmm(r.adicional_noturno) IS NOT NULL THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor_horas,origem_lancamento)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_pv04,payroll_parse_hhmm(r.adicional_noturno),'AUTO')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor_horas = EXCLUDED.valor_horas,
            cod_folha   = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    END IF;

    v_he100 := COALESCE(payroll_parse_hhmm(r.hora_extra_100),         '0'::interval)
             + COALESCE(payroll_parse_hhmm(r.hora_extra_100_noturno), '0'::interval);
    IF v_he100 > '0'::interval THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor_horas,origem_lancamento)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_pv06,v_he100,'AUTO')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor_horas = EXCLUDED.valor_horas,
            cod_folha   = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    END IF;

    IF payroll_parse_hhmm(r.falta_injustificada_horas) IS NOT NULL THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor_horas,origem_lancamento)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_ds03,payroll_parse_hhmm(r.falta_injustificada_horas),'AUTO')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor_horas = EXCLUDED.valor_horas,
            cod_folha   = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    END IF;

    IF COALESCE(r.falta_injustificada_dias,0) > 0 THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor,origem_lancamento)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_ds04,r.falta_injustificada_dias,'AUTO')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor     = EXCLUDED.valor,
            cod_folha = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    END IF;

    IF payroll_parse_hhmm(r.horas_trabalhadas) IS NOT NULL THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor_horas,origem_lancamento)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_in02,payroll_parse_hhmm(r.horas_trabalhadas),'AUTO')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor_horas = EXCLUDED.valor_horas,
            cod_folha   = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    END IF;

    IF payroll_parse_hhmm(r.banco_horas_mes) IS NOT NULL THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor_horas,origem_lancamento)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_in05,payroll_parse_hhmm(r.banco_horas_mes),'AUTO')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor_horas = EXCLUDED.valor_horas,
            cod_folha   = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    END IF;

    v_afast_genuino := GREATEST(COALESCE(r.afastamentos_dias,0) - COALESCE(r.ferias_dias,0), 0);
    IF v_afast_genuino > 0 THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor,origem_lancamento,observacao)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_in07,v_afast_genuino,'AUTO',
              'afastamento genuino = afastamentos_dias - ferias_dias')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor      = EXCLUDED.valor,
            observacao = EXCLUDED.observacao,
            cod_folha  = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    ELSE
      DELETE FROM payroll_fechamento_linha
      WHERE periodo_id = v_periodo_id AND employee_id = r.employee_id AND rubrica_id = rid_in07;
    END IF;

    IF COALESCE(r.ferias_dias,0) > 0 THEN
      INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor,origem_lancamento)
      VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_in08,r.ferias_dias,'AUTO')
      ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
        SET valor     = EXCLUDED.valor,
            cod_folha = EXCLUDED.cod_folha;
      v_linhas := v_linhas + 1;
    END IF;
  END LOOP;

  DELETE FROM payroll_fechamento_linha
  WHERE periodo_id = v_periodo_id
    AND rubrica_id = rid_pv05
    AND origem_lancamento = 'AUTO';

  FOR r IN
    SELECT DISTINCT pfl.employee_id, pfl.cod_folha, e.salario_base
    FROM payroll_fechamento_linha pfl
    JOIN employees e ON e.id = pfl.employee_id
    WHERE pfl.periodo_id = v_periodo_id
      AND e.salario_base IS NOT NULL AND e.salario_base > 0
  LOOP
    INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor,origem_lancamento)
    VALUES (v_periodo_id, r.employee_id, r.cod_folha, rid_pv01, r.salario_base, 'AUTO')
    ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
      SET valor     = EXCLUDED.valor,
          cod_folha = EXCLUDED.cod_folha;
    v_linhas := v_linhas + 1;
  END LOOP;

  FOR r IN
    SELECT gd.employee_id, ecd.cod_folha, gd.valor_bruto
    FROM gorjeta_distribuicao gd
    LEFT JOIN employee_codigos_dominio ecd
           ON ecd.employee_id = gd.employee_id
          AND ecd.unit_id     = gd.unit_id
          AND ecd.ativo       = true
    WHERE gd.unit_id = p_unit_id AND gd.mes = v_mes AND gd.ano = v_ano
      AND gd.valor_bruto > 0
  LOOP
    INSERT INTO payroll_fechamento_linha (periodo_id,employee_id,cod_folha,rubrica_id,valor,origem_lancamento)
    VALUES (v_periodo_id,r.employee_id,r.cod_folha,rid_pv07,r.valor_bruto,'AUTO')
    ON CONFLICT (periodo_id,employee_id,rubrica_id) DO UPDATE
      SET valor     = EXCLUDED.valor,
          cod_folha = EXCLUDED.cod_folha;
    v_linhas := v_linhas + 1;
  END LOOP;

  DELETE FROM payroll_fechamento_linha pfl
  WHERE pfl.periodo_id = v_periodo_id AND pfl.rubrica_id = rid_pv07
    AND NOT EXISTS (
      SELECT 1 FROM gorjeta_distribuicao gd
      WHERE gd.employee_id = pfl.employee_id AND gd.unit_id = p_unit_id
        AND gd.mes = v_mes AND gd.ano = v_ano AND gd.valor_bruto > 0);

  UPDATE payroll_fechamento_periodo
  SET custo_total_folha = (
    SELECT COALESCE(SUM(pfl.valor),0)
    FROM payroll_fechamento_linha pfl
    JOIN payroll_rubricas pr ON pr.id = pfl.rubrica_id
    WHERE pfl.periodo_id = v_periodo_id
      AND pr.tipo='PROVENTO' AND pr.unidade='R$' AND pfl.valor IS NOT NULL)
  WHERE id = v_periodo_id;

  RETURN jsonb_build_object(
    'ok', true, 'periodo_id', v_periodo_id,
    'unit_id', p_unit_id, 'competencia', p_competencia,
    'mes', v_mes, 'ano', v_ano,
    'colabs', v_colabs, 'linhas', v_linhas
  );

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$function$;
CREATE OR REPLACE FUNCTION public.rpc_payroll_upsert_lancamento_manual(p_periodo_id uuid, p_employee_id uuid, p_cod_kph text, p_valor numeric DEFAULT NULL::numeric, p_valor_horas text DEFAULT NULL::text, p_observacao text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY INVOKER

 SET search_path TO pg_catalog,public,extensions,pg_temp
AS $function$
DECLARE
  v_rubrica_id uuid;
  v_cod_folha  text;
  v_status     text;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM public.employees e JOIN public.payroll_fechamento_periodo p ON p.unit_id=e.unit_id WHERE e.id=p_employee_id AND p.id=p_periodo_id) THEN
    RAISE EXCEPTION 'Colaborador não pertence à unidade do período';
  END IF;
  SELECT status INTO v_status FROM payroll_fechamento_periodo WHERE id = p_periodo_id;
  IF v_status IN ('APROVADO','FECHADO') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Periodo ' || v_status || ' nao permite edicao');
  END IF;

  SELECT id INTO v_rubrica_id FROM payroll_rubricas WHERE cod_kph = p_cod_kph;
  IF v_rubrica_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Rubrica ' || p_cod_kph || ' inexistente');
  END IF;

  SELECT ecd.cod_folha INTO v_cod_folha
  FROM employee_codigos_dominio ecd
  JOIN payroll_fechamento_periodo p ON p.id = p_periodo_id
  WHERE ecd.employee_id = p_employee_id AND ecd.unit_id = p.unit_id;

  INSERT INTO payroll_fechamento_linha
    (periodo_id, employee_id, cod_folha, rubrica_id, valor, valor_horas, origem_lancamento, observacao)
  VALUES (p_periodo_id, p_employee_id, v_cod_folha, v_rubrica_id, p_valor,
          payroll_parse_hhmm(p_valor_horas), 'MANUAL', p_observacao)
  ON CONFLICT (periodo_id, employee_id, rubrica_id) DO UPDATE
    SET valor             = EXCLUDED.valor,
        valor_horas       = EXCLUDED.valor_horas,
        origem_lancamento = 'MANUAL',
        observacao        = EXCLUDED.observacao;

  UPDATE payroll_fechamento_periodo
  SET custo_total_folha = (
    SELECT COALESCE(SUM(pfl.valor),0)
    FROM payroll_fechamento_linha pfl
    JOIN payroll_rubricas pr ON pr.id = pfl.rubrica_id
    WHERE pfl.periodo_id = p_periodo_id
      AND pr.tipo = 'PROVENTO' AND pr.unidade = 'R$' AND pfl.valor IS NOT NULL)
  WHERE id = p_periodo_id;

  RETURN jsonb_build_object('ok', true, 'periodo_id', p_periodo_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('ok', false, 'error', SQLERRM);
END;
$function$;
CREATE OR REPLACE FUNCTION public.resolve_punch_adjustment(p_request_id uuid, p_aprovado_por uuid, p_status text, p_inserir_punches boolean DEFAULT true)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY INVOKER
 SET search_path TO pg_catalog,public,extensions,pg_temp
AS $function$
DECLARE
  v_req punch_adjustment_requests%ROWTYPE;
BEGIN
  IF p_status NOT IN ('aprovado','rejeitado') OR p_status IS NULL THEN RAISE EXCEPTION 'Status inválido'; END IF;
  IF auth.uid() IS NOT NULL AND p_aprovado_por IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Aprovador inválido'; END IF;
  SELECT * INTO v_req
  FROM punch_adjustment_requests
  WHERE id = p_request_id AND status = 'pendente'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitação % não encontrada ou já resolvida', p_request_id;
  END IF;

  UPDATE punch_adjustment_requests
  SET
    status      = p_status,
    aprovado_por = p_aprovado_por,
    aprovado_em  = now()
  WHERE id = p_request_id;

  -- Insere pontos retroativos apenas se aprovado e solicitado
  IF p_status = 'aprovado' AND p_inserir_punches THEN
    INSERT INTO time_clock_punches (employee_id, tipo, timestamp_punch, aprovado)
    VALUES
      -- Saída para almoço: data_referencia + horario_saida_almoco em SP → UTC
      (
        v_req.employee_id,
        'intervalo_inicio',
        (v_req.data_referencia::text || ' ' || v_req.horario_saida_almoco::text)::timestamp
          AT TIME ZONE 'America/Sao_Paulo',
        true
      ),
      -- Retorno do almoço
      (
        v_req.employee_id,
        'intervalo_fim',
        (v_req.data_referencia::text || ' ' || v_req.horario_retorno_almoco::text)::timestamp
          AT TIME ZONE 'America/Sao_Paulo',
        true
      );
  END IF;
END;
$function$;
