-- Scoped read access for future RH managers. The initial web release remains admin-only.
CREATE FUNCTION public.cardoso_can_read_unit(p_unit_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT public.cardoso_is_admin() OR EXISTS(
 SELECT 1 FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id
 JOIN public.units u ON u.id=p_unit_id LEFT JOIN public.brands b ON b.id=u.brand_id
 WHERE ur.user_id=(SELECT auth.uid()) AND r.name IN('pessoas','head_rh','pipou_admin','gm')
 AND (ur.unit_id=u.id OR ur.brand_id=u.brand_id OR ur.group_id=b.group_id));
$$;
REVOKE ALL ON FUNCTION public.cardoso_can_read_unit(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cardoso_can_read_unit(uuid) TO authenticated,service_role;
INSERT INTO public.roles(name,description) VALUES('pessoas','Gestão de RH por abrangência'),('colaborador','Acesso do colaborador') ON CONFLICT(name) DO NOTHING;
CREATE POLICY cardoso_scoped_read ON public."gorjeta_periodos" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("gorjeta_periodos".unit_id));
CREATE POLICY cardoso_scoped_read ON public."employee_availability" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("employee_availability".unit_id));
CREATE POLICY cardoso_scoped_read ON public."candidates" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("candidates".unit_id));
CREATE POLICY cardoso_scoped_read ON public."payroll_fechamento_periodo" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("payroll_fechamento_periodo".unit_id));
CREATE POLICY cardoso_scoped_read ON public."theo_tickets" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="theo_tickets".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."onboarding_runs" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("onboarding_runs".unit_id));
CREATE POLICY cardoso_scoped_read ON public."performance_templates" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("performance_templates".unit_id));
CREATE POLICY cardoso_scoped_read ON public."gorjeta_dias" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("gorjeta_dias".unit_id));
CREATE POLICY cardoso_scoped_read ON public."job_openings" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("job_openings".unit_id));
CREATE POLICY cardoso_scoped_read ON public."quadro_ideal" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("quadro_ideal".unit_id));
CREATE POLICY cardoso_scoped_read ON public."training_templates" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("training_templates".unit_id));
CREATE POLICY cardoso_scoped_read ON public."score_events" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="score_events".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."payslips" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("payslips".unit_id));
CREATE POLICY cardoso_scoped_read ON public."employee_documents" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="employee_documents".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."ponto_mensal" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("ponto_mensal".unit_id));
CREATE POLICY cardoso_scoped_read ON public."hour_bank" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("hour_bank".unit_id));
CREATE POLICY cardoso_scoped_read ON public."payroll_fechamento_linha" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="payroll_fechamento_linha".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."time_bank_balance" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="time_bank_balance".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."time_clock_punches" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="time_clock_punches".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."training_records" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="training_records".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."overtime_records" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("overtime_records".unit_id));
CREATE POLICY cardoso_scoped_read ON public."contatos_kph" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="contatos_kph".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."ponto_ahgora_arquivos" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("ponto_ahgora_arquivos".unit_id));
CREATE POLICY cardoso_scoped_read ON public."candidate_agendamentos" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("candidate_agendamentos".unit_id));
CREATE POLICY cardoso_scoped_read ON public."hos_runs" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="hos_runs".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."avaliacao_ciclos" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("avaliacao_ciclos".unit_id));
CREATE POLICY cardoso_scoped_read ON public."terminations" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("terminations".unit_id));
CREATE POLICY cardoso_scoped_read ON public."reunioes_1on1" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("reunioes_1on1".unit_id));
CREATE POLICY cardoso_scoped_read ON public."import_logs" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("import_logs".unit_id));
CREATE POLICY cardoso_scoped_read ON public."time_records" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("time_records".unit_id));
CREATE POLICY cardoso_scoped_read ON public."vacations" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("vacations".unit_id));
CREATE POLICY cardoso_scoped_read ON public."disciplinary_actions" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("disciplinary_actions".unit_id));
CREATE POLICY cardoso_scoped_read ON public."employees" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("employees".unit_id));
CREATE POLICY cardoso_scoped_read ON public."punch_adjustment_requests" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="punch_adjustment_requests".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."shifts" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("shifts".unit_id));
CREATE POLICY cardoso_scoped_read ON public."sick_leaves" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("sick_leaves".unit_id));
CREATE POLICY cardoso_scoped_read ON public."transport_vouchers" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("transport_vouchers".unit_id));
CREATE POLICY cardoso_scoped_read ON public."onboarding_templates" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("onboarding_templates".unit_id));
CREATE POLICY cardoso_scoped_read ON public."performance_reviews" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="performance_reviews".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."feedbacks" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("feedbacks".unit_id));
CREATE POLICY cardoso_scoped_read ON public."vacation_schedules" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("vacation_schedules".unit_id));
CREATE POLICY cardoso_scoped_read ON public."hos_jobs" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("hos_jobs".unit_id));
CREATE POLICY cardoso_scoped_read ON public."warnings" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="warnings".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."payroll_dominio_cadastro" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="payroll_dominio_cadastro".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."dependents" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="dependents".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."absences" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="absences".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
CREATE POLICY cardoso_scoped_read ON public."gorjeta_distribuicao" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("gorjeta_distribuicao".unit_id));
CREATE POLICY cardoso_scoped_read ON public."pdis" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("pdis".unit_id));
CREATE POLICY cardoso_scoped_read ON public."gorjeta_cargo_pontos" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("gorjeta_cargo_pontos".unit_id));
CREATE POLICY cardoso_scoped_read ON public."cargo_salarios" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("cargo_salarios".unit_id));
CREATE POLICY cardoso_scoped_read ON public."climate_surveys" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("climate_surveys".unit_id));
CREATE POLICY cardoso_scoped_read ON public."employee_codigos_dominio" FOR SELECT TO authenticated USING (public.cardoso_can_read_unit("employee_codigos_dominio".unit_id));
CREATE POLICY cardoso_scoped_read ON public."climate_responses" FOR SELECT TO authenticated USING (EXISTS(SELECT 1 FROM public.employees e WHERE e.id="climate_responses".employee_id AND public.cardoso_can_read_unit(e.unit_id)));
NOTIFY pgrst,'reload schema';
