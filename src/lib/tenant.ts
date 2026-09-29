/** Public branding only. Never put credentials in this module. */
export const tenant = {
  name: process.env.NEXT_PUBLIC_TENANT_NAME || "Cardoso",
  appName: process.env.NEXT_PUBLIC_APP_NAME || "PIPOU · Cardoso",
  recoveryUrl: process.env.NEXT_PUBLIC_RECOVERY_URL || "",
};

export function allowedOrigins(): string[] {
  return [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_PORTAL_URL,
    ...(process.env.NODE_ENV === "development" ? ["http://localhost:3002"] : []),
  ].filter((value): value is string => Boolean(value)).map(value => new URL(value).origin);
}
