import { NextResponse } from "next/server";
import { submitCandidatura } from "@/app/vagas/actions";
const requests = new Map<string, { count: number; since: number }>();
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
  const now = Date.now();
  for (const [key, value] of requests) if (now - value.since > 60000) requests.delete(key);
  const entry = requests.get(ip) ?? { count: 0, since: now };
  entry.count++; requests.set(ip, entry);
  if (entry.count > 5) return NextResponse.json({ success: false, error: "Aguarde um minuto antes de tentar novamente." }, { status: 429 });
  if (Number(req.headers.get("content-length") ?? 0) > 11534336) return NextResponse.json({ success: false, error: "Arquivo muito grande." }, { status: 413 });
  try {
    const result = await submitCandidatura(await req.formData());
    return NextResponse.json(result, { status: result.success ? 201 : 422 });
  } catch { return NextResponse.json({ success: false, error: "Não foi possível receber sua candidatura." }, { status: 400 }); }
}
