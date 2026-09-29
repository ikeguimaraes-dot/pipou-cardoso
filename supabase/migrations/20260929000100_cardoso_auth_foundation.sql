CREATE TABLE public.groups (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, slug text NOT NULL UNIQUE,
 created_at timestamptz DEFAULT now(), icone text, parent_id uuid REFERENCES public.groups(id)
);
CREATE TABLE public.brands (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
 name text NOT NULL, slug text NOT NULL UNIQUE, color text DEFAULT '#D4A574', active boolean DEFAULT true,
 created_at timestamptz DEFAULT now()
);
CREATE TABLE public.units (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
 name text NOT NULL, address text, whatsapp_number text, active boolean DEFAULT true, created_at timestamptz DEFAULT now(),
 cnpj text, latitude numeric(10,7), longitude numeric(10,7), geofence_radius_m integer DEFAULT 200, lorean_code text
);
CREATE TABLE public.roles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, description text,
 dept text, tier text CHECK(tier IN ('T1','T2A','T2B','T3','T4','T5','T6')), level text, sector text,
 permissions jsonb NOT NULL DEFAULT '[]'::jsonb
);
CREATE TABLE public.user_roles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role_id uuid NOT NULL REFERENCES public.roles(id),
 unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
 brand_id uuid REFERENCES public.brands(id) ON DELETE CASCADE,
 group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE, created_at timestamptz DEFAULT now(),
 CHECK(unit_id IS NOT NULL OR brand_id IS NOT NULL OR group_id IS NOT NULL),
 UNIQUE(user_id,role_id,unit_id)
);
CREATE INDEX user_roles_user_id_idx ON public.user_roles(user_id);
CREATE UNIQUE INDEX user_roles_global_group_unique ON public.user_roles(user_id,role_id,group_id)
 WHERE unit_id IS NULL AND brand_id IS NULL AND group_id IS NOT NULL;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.groups,public.brands,public.units,public.roles,public.user_roles FROM anon,authenticated;
GRANT SELECT ON public.groups,public.brands,public.units,public.roles,public.user_roles TO authenticated;
GRANT ALL ON public.groups,public.brands,public.units,public.roles,public.user_roles TO service_role;
CREATE POLICY role_catalog_read ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY own_role_grants_read ON public.user_roles FOR SELECT TO authenticated USING (user_id=(SELECT auth.uid()));
CREATE POLICY groups_scope_read ON public.groups FOR SELECT TO authenticated USING (
 EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id
 WHERE ur.user_id=(SELECT auth.uid()) AND (r.name='founder' OR ur.group_id=groups.id))
);
CREATE POLICY brands_scope_read ON public.brands FOR SELECT TO authenticated USING (
 EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id
 WHERE ur.user_id=(SELECT auth.uid()) AND (r.name='founder' OR ur.brand_id=brands.id OR ur.group_id=brands.group_id))
);
CREATE POLICY units_scope_read ON public.units FOR SELECT TO authenticated USING (
 EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.roles r ON r.id=ur.role_id
 WHERE ur.user_id=(SELECT auth.uid()) AND (r.name='founder' OR ur.unit_id=units.id OR ur.brand_id=units.brand_id
 OR EXISTS (SELECT 1 FROM public.brands b WHERE b.id=units.brand_id AND b.group_id=ur.group_id)))
);
INSERT INTO public.groups(name,slug) VALUES ('Cardoso','cardoso');
INSERT INTO public.roles(name,description,tier) VALUES ('founder','Administrador global do ambiente Cardoso','T6');
COMMENT ON TABLE public.user_roles IS 'Base inicial de acesso Cardoso. Permissões dos demais módulos devem ser implantadas nas migrations de cada domínio.';
