GRANT INSERT ON public.brands,public.units TO authenticated;
CREATE POLICY cardoso_admin_insert ON public.brands FOR INSERT TO authenticated WITH CHECK((SELECT public.cardoso_is_admin()));
CREATE POLICY cardoso_admin_insert ON public.units FOR INSERT TO authenticated WITH CHECK((SELECT public.cardoso_is_admin()));
ALTER FUNCTION public.cardoso_create_unit(text,text,text) SECURITY INVOKER;
