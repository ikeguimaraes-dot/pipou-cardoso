import { notFound } from "next/navigation";
import { createServiceClient, createSupabaseServerClient } from "@kph/db/supabase/server";
import { requireRole } from "@kph/auth/server";
import { normalizarTelefone } from "@/lib/pessoas/utils";
import { AgentPainelClient } from "./AgentPainelClient";
import type {
  ConversaStats,
  KphInsight,
  CustoData,
  MayaData,
  TheoData,
  IntencoesItem,
  PromptVersion,
} from "./AgentPainelClient";

export const dynamic = "force-dynamic";

const AGENT_META = {
  maya: {
    name: "Maya",
    role: "Recrutamento & Seleção",
    color: "#C9A96E",
    colorBorder: "rgba(201,169,110,0.25)",
    colorDim: "rgba(201,169,110,0.08)",
  },
  theo: {
    name: "Theo",
    role: "SAC Interno · RH",
    color: "#7EB8C9",
    colorBorder: "rgba(126,184,201,0.25)",
    colorDim: "rgba(126,184,201,0.08)",
  },
} as const;

export type AgentKey = keyof typeof AGENT_META;

export type NameMap = Record<string, { nome: string; avatar: string; tipo?: string }>;

export type AgentConversation = {
  id: string;
  agent: string;
  phone: string;
  messages: Array<{ role: "user" | "assistant" | "operator"; content: string | unknown[] }>;
  last_activity: string;
  created_at: string;
  status: "ativa" | "assumida" | "encerrada" | null;
  operator_id: string | null;
  operator_name: string | null;
};

export default async function AgentPainelPage({
  params,
}: {
  params: Promise<{ agent: string }>;
}) {
  const { agent } = await params;

  await requireRole(["founder", "cfo", "gm", "pessoas"]);

  if (!Object.keys(AGENT_META).includes(agent)) notFound();
  const agentKey = agent as AgentKey;
  const meta = AGENT_META[agentKey];

  const serviceClient = createServiceClient();
  // Prévia local autenticada: as leituras continuam sujeitas às políticas RLS.
  // Não substitui a configuração administrativa necessária para operar os agentes.
  const supabase = serviceClient ?? (
    process.env.NODE_ENV === "development" ? await createSupabaseServerClient() : null
  );
  if (!supabase) return <div>Supabase indisponível</div>;
  const readOnly = !serviceClient;

  // Busca em paralelo — allSettled para não derrubar a página se uma query falhar
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [convRes, metricsRes, insightsRes, mayaRes, theoRes, promptRes] = (
    await Promise.allSettled([
      // Conversas (para tab Conversas + stats)
      supabase
        .from("agent_conversations")
        .select("id, agent, phone, messages, last_activity, created_at, status, operator_id, operator_name")
        .eq("agent", agentKey)
        .order("last_activity", { ascending: false })
        .limit(150),

      // Métricas de custo + intenções
      readOnly ? Promise.resolve({ data: null }) : supabase
        .from("agent_metrics")
        .select("input_tokens, output_tokens, cost_usd, latency_ms, intencao")
        .eq("agent", agentKey),

      // Insights semanais
      supabase
        .from("kph_insights")
        .select("id, semana, insight_text, dados_referencia, gerado_por, aprovado, created_at")
        .eq("modulo", agentKey)
        .order("created_at", { ascending: false })
        .limit(20),

      // Maya: candidatos
      agentKey === "maya"
        ? supabase.from("candidatos_maya").select("status")
        : Promise.resolve({ data: null }),

      // Theo: tickets
      agentKey === "theo"
        ? supabase.from("theo_tickets").select("status, categoria")
        : Promise.resolve({ data: null }),

      // Versões de prompt
      supabase
        .from("agent_prompt_versions")
        .select("id, agent, version, system_prompt, ativado_em, nota, ativo")
        .eq("agent", agentKey)
        .order("ativado_em", { ascending: false })
        .limit(20),
    ])
  ).map((r) => (r.status === "fulfilled" ? r.value : { data: null, error: true })) as [any, any, any, any, any, any];

  // ─── Conversas stats ───────────────────────────────────────────
  const conversations = (convRes.data ?? []) as AgentConversation[];

  const nameMap: NameMap = {};
  // Fonte única: contatos_kph (telefone já normalizado, com nome e tipo).
  {
    const { data: contatos } = await supabase
      .from("contatos_kph")
      .select("telefone, nome, tipo")
      .not("nome", "is", null);
    for (const c of (contatos ?? []) as { telefone: string; nome: string | null; tipo: string | null }[]) {
      if (c.telefone && c.nome) {
        nameMap[c.telefone] = { nome: c.nome, avatar: c.nome.charAt(0).toUpperCase(), tipo: c.tipo ?? "externo" };
      }
    }
  }

  // Resolve nomes de sessões web:hos_<employee_id> → employees
  {
    const webHosPhones = [...new Set(
      conversations.filter(c => c.phone.startsWith("web:hos_")).map(c => c.phone),
    )];
    if (webHosPhones.length > 0) {
      const uuids = webHosPhones.map(p => p.replace("web:hos_", ""));
      const { data: empRows } = await supabase
        .from("employees")
        .select("id, nome, sobrenome")
        .in("id", uuids);
      for (const e of (empRows ?? []) as { id: string; nome: string; sobrenome: string | null }[]) {
        const fullName = [e.nome, e.sobrenome].filter(Boolean).join(" ");
        nameMap[`web:hos_${e.id}`] = {
          nome: fullName,
          avatar: e.nome.charAt(0).toUpperCase(),
          tipo: "colaborador",
        };
      }
    }
  }

  const total = conversations.length;
  const ativas = conversations.filter((c) => (c.status ?? "ativa") === "ativa").length;
  const assumidas = conversations.filter((c) => c.status === "assumida").length;
  const encerradas = conversations.filter((c) => c.status === "encerrada").length;
  const taxaAutonoma =
    encerradas > 0
      ? Math.round(
          (conversations.filter(
            (c) => c.status === "encerrada" && !c.operator_id,
          ).length /
            encerradas) *
            100,
        )
      : 0;

  const stats: ConversaStats = { total, ativas, assumidas, encerradas, taxaAutonoma };

  // ─── Custo ────────────────────────────────────────────────────
  const metrics = (metricsRes.data ?? []) as {
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
    latency_ms: number;
    intencao: string | null;
  }[];

  const custo: CustoData = {
    totalCalls: metrics.length,
    inputTokens: metrics.reduce((s, m) => s + (m.input_tokens ?? 0), 0),
    outputTokens: metrics.reduce((s, m) => s + (m.output_tokens ?? 0), 0),
    costUsd: metrics.reduce((s, m) => s + Number(m.cost_usd ?? 0), 0),
    avgLatencyMs:
      metrics.length > 0
        ? Math.round(metrics.reduce((s, m) => s + (m.latency_ms ?? 0), 0) / metrics.length)
        : 0,
  };

  // ─── Insights ─────────────────────────────────────────────────
  const insights: KphInsight[] = (insightsRes.data ?? []).map(
    (ins: Record<string, unknown>) => ({
      id: String(ins.id),
      semana: String(ins.semana),
      insight_text: String(ins.insight_text),
      dados_referencia: (ins.dados_referencia as Record<string, unknown>) ?? null,
      gerado_por: ins.gerado_por ? String(ins.gerado_por) : null,
      aprovado: ins.aprovado as boolean | null,
      created_at: String(ins.created_at),
    }),
  );

  // ─── Maya data ────────────────────────────────────────────────
  let mayaData: MayaData | undefined;
  if (agentKey === "maya" && mayaRes.data) {
    const candidatos = mayaRes.data as { status: string }[];
    mayaData = {
      candidatosTotal: candidatos.length,
      qualificados: candidatos.filter((c) => c.status?.toLowerCase().includes("qualificad")).length,
      emAndamento: candidatos.filter((c) => ["triagem", "entrevista", "teste"].some((s) => c.status?.toLowerCase().includes(s))).length,
      naoAvancaram: candidatos.filter((c) => ["reprovad", "desistiu", "não avançou"].some((s) => c.status?.toLowerCase().includes(s))).length,
    };
  }

  // ─── Theo data ────────────────────────────────────────────────
  let theoData: TheoData | undefined;
  if (agentKey === "theo" && theoRes.data) {
    const tickets = theoRes.data as { status: string; categoria: string }[];

    // Intenções de agent_metrics (agrupadas por count)
    const intentMap: Record<string, number> = {};
    for (const m of metrics) {
      if (m.intencao) {
        intentMap[m.intencao] = (intentMap[m.intencao] ?? 0) + 1;
      }
    }
    const intencoes: IntencoesItem[] = Object.entries(intentMap)
      .sort(([, a], [, b]) => b - a)
      .map(([intencao, count]) => ({ intencao, count }));

    theoData = {
      ticketsTotal: tickets.length,
      abertos: tickets.filter((t) => t.status?.toLowerCase() === "aberto").length,
      resolvidos: tickets.filter((t) => t.status?.toLowerCase() === "resolvido").length,
      intencoes,
      friccoes: metrics.filter((m) => !m.intencao).length,
    };
  }

  // ─── Prompt versions ─────────────────────────────────────────
  const promptVersions: PromptVersion[] = (promptRes.data ?? []).map(
    (v: Record<string, unknown>) => ({
      id: String(v.id),
      agent: String(v.agent),
      version: String(v.version),
      system_prompt: String(v.system_prompt),
      ativado_em: String(v.ativado_em),
      nota: v.nota ? String(v.nota) : null,
      ativo: Boolean(v.ativo),
    }),
  );

  // ─── Payload para "Gerar insight" ────────────────────────────
  const dadosInsight: Record<string, unknown> = {
    stats,
    custo: { totalCalls: custo.totalCalls, costUsd: custo.costUsd },
    ...(mayaData ? { maya: mayaData } : {}),
    ...(theoData
      ? {
          theo: {
            tickets: { total: theoData.ticketsTotal, abertos: theoData.abertos, resolvidos: theoData.resolvidos },
            topIntencoes: theoData.intencoes.slice(0, 5),
            friccoes: theoData.friccoes,
          },
        }
      : {}),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <AgentPainelClient
        agent={agentKey}
        meta={meta}
        conversations={conversations}
        nameMap={nameMap}
        stats={stats}
        insights={insights}
        custo={custo}
        mayaData={mayaData}
        theoData={theoData}
        dadosInsight={dadosInsight}
        promptVersions={promptVersions}
        readOnly={readOnly}
        metricsAvailable={!readOnly && !metricsRes.error}
        loadErrors={{
          "visao-geral": Boolean(convRes.error || mayaRes.error || theoRes.error),
          conversas: Boolean(convRes.error),
          insights: Boolean(insightsRes.error),
          prompts: Boolean(promptRes.error),
        }}
      />
    </div>
  );
}
