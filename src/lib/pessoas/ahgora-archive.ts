import "server-only";
import { pendenciasContext } from "./pendencias-server";

export type AhgoraArchive = {
  id: string; arquivo: string; tipo: "totais" | "batidas";
  consulta_inicio: string; consulta_fim: string; criado_em: string;
  resultado: { status?: string; linhas_esperadas?: number };
};

export async function listAhgoraArchives(unitId: string): Promise<{ files: AhgoraArchive[]; error?: string }> {
  try {
    const { client, units } = await pendenciasContext({ includeInactiveUnits: true });
    if (!units.some(unit => unit.id === unitId)) return { files: [] };
    // The new archive is intentionally not part of the generated legacy DB types yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = client as any;
    const { data, error } = await db.from("ponto_ahgora_arquivos")
      .select("id,arquivo,tipo,consulta_inicio,consulta_fim,criado_em,resultado")
      .eq("unit_id", unitId).eq("resultado->>status", "arquivado").order("consulta_inicio", { ascending: false });
    if (error) throw error;
    return { files: (data ?? []) as AhgoraArchive[] };
  } catch {
    return { files: [], error: "Não foi possível consultar os arquivos do Ahgora." };
  }
}
