-- CPF lookup and deterministic pagination for batch-created candidates.
CREATE OR REPLACE FUNCTION public.buscar_talentos(p_statuses text[], p_termo text DEFAULT NULL::text, p_cargo text DEFAULT NULL::text, p_cidade text DEFAULT NULL::text, p_escolaridade text DEFAULT NULL::text, p_habilidade text DEFAULT NULL::text, p_turno text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, full_name text, area_interesse text, cidade text, escolaridade_nivel text, habilidades text[], cv_storage_path text, status text, origem text, created_at timestamp with time zone, total_count bigint)
 LANGUAGE sql
 SECURITY INVOKER

 SET search_path TO pg_catalog, public, extensions, pg_temp
AS $function$
  SELECT
    c.id,
    c.full_name,
    c.area_interesse,
    c.cidade,
    c.escolaridade_nivel,
    c.habilidades,
    c.cv_storage_path,
    c.status::text,
    c.origem,
    c.created_at,
    COUNT(*) OVER ()::bigint AS total_count
  FROM candidates c
  WHERE c.status = ANY(p_statuses)
    AND (p_termo IS NULL OR c.full_name ILIKE '%' || p_termo || '%' OR (regexp_replace(p_termo, '[^0-9]', '', 'g') <> '' AND c.cpf = regexp_replace(p_termo, '[^0-9]', '', 'g')))
    AND (p_cargo        IS NULL OR c.area_interesse  ILIKE '%' || p_cargo        || '%')
    AND (p_cidade       IS NULL OR c.cidade          ILIKE '%' || p_cidade       || '%')
    AND (p_escolaridade IS NULL OR c.escolaridade_nivel = p_escolaridade)
    AND (p_habilidade   IS NULL OR EXISTS (
           SELECT 1 FROM unnest(c.habilidades) h
           WHERE h ILIKE '%' || p_habilidade || '%'
         ))
    AND (p_turno        IS NULL OR EXISTS (
           SELECT 1 FROM unnest(c.turnos_disponiveis) t
           WHERE t ILIKE '%' || p_turno || '%'
         ))
  ORDER BY c.created_at DESC, c.id
  LIMIT  p_limit
  OFFSET p_offset;
$function$;
