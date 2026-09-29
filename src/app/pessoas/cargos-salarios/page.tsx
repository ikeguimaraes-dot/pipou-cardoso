import { requireRole } from "@kph/auth/server";
import { getGradeSalarial, getCargoHierarquia } from "./actions";
import { CargosClient } from "./CargosClient";

export const dynamic = "force-dynamic";

export default async function CargosSalariosPage() {
  await requireRole(["founder", "cfo", "gm", "pessoas"]);
  const [salarioRes, hierRes] = await Promise.allSettled([
    getGradeSalarial(),
    getCargoHierarquia(),
  ]);
  const rows = salarioRes.status === "fulfilled" ? salarioRes.value : [];
  const cargoHierarquia = hierRes.status === "fulfilled" ? hierRes.value : [];
  return <CargosClient initialRows={rows} cargoHierarquia={cargoHierarquia} />;
}
