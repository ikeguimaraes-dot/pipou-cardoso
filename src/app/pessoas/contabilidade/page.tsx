import { requireUser, getUserTierLevel, isFounder } from "@kph/auth/server";
import { redirect } from "next/navigation";
import { ContabilidadeClient } from "./ContabilidadeClient";

export const dynamic = "force-dynamic";

export default async function ContabilidadePage() {
  const user = await requireUser();
  const tier = getUserTierLevel(user);
  if (tier < 4) redirect("/pessoas");
  return <ContabilidadeClient isFounder={isFounder(user)} />;
}
