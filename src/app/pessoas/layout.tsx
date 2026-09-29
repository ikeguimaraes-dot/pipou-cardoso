import { AuthProvider } from "@kph/auth/context";
import { getUserTierLevel, requireUser } from "@kph/auth/server";
import { countPendingApprovals } from "@/lib/pessoas/access-requests";
import { countPendingPunchAdjustments } from "@/app/pessoas/ponto/aprovacoes/actions";
import { createSupabaseServerClient } from "@kph/db/supabase/server";
import type { Unit } from "@kph/db/types/database";
import { Sidebar } from "@kph/ui/sidebar";
import AgentesKPH from "@/components/pessoas/AgentesKPH";

export const dynamic = "force-dynamic";

export default async function PessoasLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  const tierLevel = getUserTierLevel(user);
  const [unitsR, approvalsR, punchAdjR] = await Promise.allSettled([
    loadAccessibleUnits(),
    tierLevel >= 2 ? countPendingApprovals() : Promise.resolve(0),
    tierLevel >= 3 ? countPendingPunchAdjustments() : Promise.resolve(0),
  ]);
  const units = unitsR.status === "fulfilled" ? unitsR.value : [];
  const approvalsCount = approvalsR.status === "fulfilled" ? approvalsR.value : 0;
  const punchAdjCount = punchAdjR.status === "fulfilled" ? punchAdjR.value : 0;

  return (
    <AuthProvider user={user} units={units}>
      <div style={{ display: "flex", height: "100vh" }}>
        <Sidebar tierLevel={tierLevel} approvalsCount={approvalsCount} punchAdjCount={punchAdjCount} />
        <main className="shell-main kph-page-main" style={{ flex: 1, overflowY: "auto", padding: "32px 28px" }}>
          {children}
        </main>
      </div>
      <AgentesKPH />
    </AuthProvider>
  );
}

async function loadAccessibleUnits(): Promise<Unit[]> {
  try {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from("units")
      .select("*")
      .eq("active", true)
      .order("name");
    if (error) return [];
    return data ?? [];
  } catch (e) {
    console.error("[loadAccessibleUnits]", e);
    return [];
  }
}
