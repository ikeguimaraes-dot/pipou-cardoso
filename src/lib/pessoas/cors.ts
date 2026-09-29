// Origens permitidas com credenciais — NUNCA wildcard com credentials:true
import { allowedOrigins } from "@/lib/tenant";
export const CORS_ORIGINS = allowedOrigins();

export function corsHeaders(
  origin: string | null,
  methods: string,
): Record<string, string> {
  if (!origin || !CORS_ORIGINS.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}
