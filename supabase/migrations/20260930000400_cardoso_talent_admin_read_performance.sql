-- Global admins already use cardoso_admin_access. Avoid a scoped membership query per candidate row.
-- Non-admin read authorization remains unchanged.
ALTER POLICY cardoso_scoped_read ON public.candidates USING ((SELECT NOT public.cardoso_is_admin()) AND public.cardoso_can_read_unit(unit_id));
