-- Product catalogs only. External payroll mapping intentionally unset.
INSERT INTO public.cargo_grupos(nome,sla_dias_uteis) VALUES ('Operacional',15),('Tático',25),('Estratégico',35),('Executivo/Liderança',50) ON CONFLICT(nome) DO NOTHING;
INSERT INTO public.payroll_rubricas(cod_kph,grupo,descricao,tipo,unidade,origem_dado,exporta_txt,cod_dominio) VALUES
('ID-01','IDENTIFICACAO','Nome completo','INFORMATIVA','TEXTO','AUTO_CADASTRO',false,NULL),
('ID-02','IDENTIFICACAO','CPF','INFORMATIVA','TEXTO','AUTO_CADASTRO',false,NULL),
('ID-03','IDENTIFICACAO','Matricula Dominio','INFORMATIVA','TEXTO','AUTO_CADASTRO',false,NULL),
('ID-04','IDENTIFICACAO','Data de admissao','INFORMATIVA','TEXTO','AUTO_CADASTRO',false,NULL),
('ID-05','IDENTIFICACAO','Data de demissao','INFORMATIVA','TEXTO','AUTO_CADASTRO',false,NULL),
('ID-06','IDENTIFICACAO','Cargo / funcao','INFORMATIVA','TEXTO','AUTO_CADASTRO',false,NULL),
('ID-07','IDENTIFICACAO','Unidade / empresa','INFORMATIVA','TEXTO','AUTO_CADASTRO',false,NULL),
('ID-08','IDENTIFICACAO','Tipo de processo','INFORMATIVA','TEXTO','AUTO_CADASTRO',false,NULL),
('ID-09','IDENTIFICACAO','Jornada contratual','INFORMATIVA','HORAS','AUTO_CADASTRO',false,NULL),
('PV-02','PROVENTO_FIXO','Salario proporcional','PROVENTO','R$','CALCULADO',false,NULL),
('PV-10','PROVENTO_VARIAVEL','Folga domingo trabalhado','PROVENTO','DIAS','AUTO_PONTO',false,NULL),
('PV-13','PROVENTO_VARIAVEL','Licenca paternidade','PROVENTO','DIAS','AUTO_PONTO',false,NULL),
('PV-14','PROVENTO_VARIAVEL','Comissao / premiacao','PROVENTO','R$','MANUAL_RH',false,NULL),
('IN-01','INFORMATIVA','Dias trabalhados','INFORMATIVA','DIAS','AUTO_PONTO',false,NULL),
('IN-02','INFORMATIVA','Horas trabalhadas','INFORMATIVA','HORAS','AUTO_PONTO',false,NULL),
('IN-03','INFORMATIVA','Horas previstas (jornada)','INFORMATIVA','HORAS','AUTO_PONTO',false,NULL),
('IN-04','INFORMATIVA','Saldo banco de horas acumulado','INFORMATIVA','HORAS','AUTO',false,NULL),
('IN-05','INFORMATIVA','Banco de horas do mes','INFORMATIVA','HORAS','AUTO',false,NULL),
('IN-06','INFORMATIVA','Horas negativas','INFORMATIVA','HORAS','AUTO_PONTO',false,NULL),
('IN-09','INFORMATIVA','Dias de licenca (pat./mat.)','INFORMATIVA','DIAS','AUTO_PONTO',false,NULL),
('IN-10','INFORMATIVA','Atestado medico (dias)','INFORMATIVA','DIAS','AUTO',false,NULL),
('IN-11','INFORMATIVA','Feriados trabalhados','INFORMATIVA','DIAS','AUTO_PONTO',false,NULL),
('IN-12','INFORMATIVA','Abonado (horas)','INFORMATIVA','HORAS','MANUAL_RH',false,NULL),
('BN-01','BENEFICIO','Vale transporte (valor bruto)','INFORMATIVA','R$','MANUAL_RH',false,NULL),
('BN-02','BENEFICIO','Plano de saude (custo empresa)','INFORMATIVA','R$','MANUAL_RH',false,NULL),
('PV-03','PROVENTO_FIXO','Adicional de insalubridade','PROVENTO','R$','MANUAL_RH',false,NULL),
('BN-03','BENEFICIO','Vale alimentacao / refeicao','INFORMATIVA','R$','MANUAL_RH',false,NULL),
('BN-04','BENEFICIO','Seguro de vida (custo empresa)','INFORMATIVA','R$','MANUAL_RH',false,NULL),
('BS-01','BASE','Base de calculo INSS','BASE','R$','CALCULADO',false,NULL),
('BS-02','BASE','Base de calculo IRRF','BASE','R$','CALCULADO',false,NULL),
('BS-03','BASE','Base de calculo FGTS','BASE','R$','CALCULADO',false,NULL),
('BS-04','BASE','Liquido a receber','BASE','R$','CALCULADO',false,NULL),
('RT-01','RETORNO','Liquido do holerite','INFORMATIVA','R$','EXTERNO',false,NULL),
('RT-02','RETORNO','Total liquido a pagar','INFORMATIVA','R$','EXTERNO',false,NULL),
('PV-07A','PROVENTO_VARIAVEL','Gorjeta 1a Quinzena','PROVENTO','R$','MANUAL_RH',false,NULL),
('PV-01','PROVENTO_FIXO','Salario base mensal','PROVENTO','R$','AUTO_CADASTRO',false,NULL),
('PV-08','PROVENTO_VARIAVEL','DSR sobre HE','PROVENTO','R$','CALCULADO',false,NULL),
('PV-07B','PROVENTO_VARIAVEL','Gorjeta 2a Quinzena','PROVENTO','R$','MANUAL_RH',false,NULL),
('PV-06','PROVENTO_VARIAVEL','Hora Extra 100%','PROVENTO','HORAS','AUTO_PONTO',false,NULL),
('PV-07','PROVENTO_VARIAVEL','Gorjeta mensal','PROVENTO','R$','AUTO',false,NULL),
('PV-04','PROVENTO_VARIAVEL','Adicional Noturno','PROVENTO','HORAS','AUTO_PONTO',false,NULL),
('PV-05','PROVENTO_VARIAVEL','Hora Extra 50%','PROVENTO','HORAS','AUTO_PONTO',false,NULL),
('PV-09','PROVENTO_VARIAVEL','DSR sobre Adic. Noturno','PROVENTO','R$','CALCULADO',false,NULL),
('PV-11','PROVENTO_VARIAVEL','Folga feriado trabalhado','PROVENTO','DIAS','AUTO_PONTO',false,NULL),
('PV-15','PROVENTO_VARIAVEL','Bonus','PROVENTO','R$','MANUAL_RH',false,NULL),
('DS-01','DESCONTO','INSS colaborador','DESCONTO','R$','CALCULADO',false,NULL),
('DS-02','DESCONTO','IRRF','DESCONTO','R$','CALCULADO',false,NULL),
('DS-05','DESCONTO','Desconto plano de saude','DESCONTO','R$','MANUAL_RH',false,NULL),
('DS-06','DESCONTO','Desconto vale transporte (6%)','DESCONTO','R$','CALCULADO',false,NULL),
('DS-07','DESCONTO','Adiantamento salarial','DESCONTO','R$','MANUAL_RH',false,NULL),
('DS-08','DESCONTO','Pensao alimenticia','DESCONTO','R$','JUDICIAL',false,NULL),
('DS-09','DESCONTO','Coparticipacao plano de saude','DESCONTO','R$','MANUAL_RH',false,NULL),
('DS-11','DESCONTO','Contribuicao assistencial sindical','DESCONTO','R$','MANUAL_RH',false,NULL),
('DS-12','DESCONTO','Manutencao de uniforme','DESCONTO','R$','MANUAL_RH',false,NULL),
('IN-08','INFORMATIVA','Dias de ferias','INFORMATIVA','DIAS','AUTO',false,NULL),
('IN-07','INFORMATIVA','Dias de afastamento INSS','INFORMATIVA','DIAS','AUTO',false,NULL),
('DS-03','DESCONTO','Atrasos e saidas antecipadas','DESCONTO','HORAS','AUTO_PONTO',false,NULL),
('DS-04','DESCONTO','Faltas injustificadas (dias)','DESCONTO','DIAS','AUTO_PONTO',false,NULL),
('DS-10','DESCONTO','Emprestimo e-consignado','DESCONTO','R$','EXTERNO',false,NULL),
('DS-13','DESCONTO','DSR (desconto)','DESCONTO','DIAS','MANUAL_RH',false,NULL),
('DS-03B','DESCONTO','Atrasos e saidas antecipadas','DESCONTO','HORAS','AUTO_PONTO',false,NULL),
('PV-12','PROVENTO_VARIAVEL','Quitacao banco de horas','PROVENTO','HORAS','AUTO',false,NULL) ON CONFLICT(cod_kph) DO NOTHING;

CREATE FUNCTION public.cardoso_create_unit(p_brand text,p_name text,p_cnpj text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,extensions,pg_temp
AS $$
DECLARE gid uuid; bid uuid; uid uuid; brand_slug text;
BEGIN
 IF NOT public.cardoso_is_admin() THEN RAISE EXCEPTION 'Sem permissão' USING ERRCODE='42501'; END IF;
 IF nullif(btrim(p_brand),'') IS NULL OR nullif(btrim(p_name),'') IS NULL OR length(p_brand)>120 OR length(p_name)>120 THEN RAISE EXCEPTION 'Informe empresa e unidade válidas'; END IF;
 IF p_cnpj IS NOT NULL AND p_cnpj !~ '^[0-9]{14}$' THEN RAISE EXCEPTION 'CNPJ deve conter 14 dígitos'; END IF;
 SELECT id INTO gid FROM public.groups WHERE slug='cardoso';
 IF gid IS NULL THEN RAISE EXCEPTION 'Grupo não configurado'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('cardoso-create-unit'));
 SELECT id INTO bid FROM public.brands WHERE group_id=gid AND lower(name)=lower(btrim(p_brand)) LIMIT 1;
 IF bid IS NULL THEN
  brand_slug:=trim(both '-' from regexp_replace(lower(unaccent(p_brand)),'[^a-z0-9]+','-','g'))||'-'||substr(gen_random_uuid()::text,1,8);
  INSERT INTO public.brands(group_id,name,slug) VALUES(gid,btrim(p_brand),brand_slug) RETURNING id INTO bid;
 END IF;
 IF EXISTS(SELECT 1 FROM public.units WHERE brand_id=bid AND lower(name)=lower(btrim(p_name))) THEN RAISE EXCEPTION 'Unidade já cadastrada'; END IF;
 INSERT INTO public.units(brand_id,name,cnpj) VALUES(bid,btrim(p_name),p_cnpj) RETURNING id INTO uid;
 RETURN uid;
END $$;
REVOKE ALL ON FUNCTION public.cardoso_create_unit(text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cardoso_create_unit(text,text,text) TO authenticated;
NOTIFY pgrst,'reload schema';
