// GET /api/gorjetas/recibo?id=<distribuicao_id>
// Renderiza e serve o PDF de recibo de gorjeta individual.

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { getDistribuicaoById, marcarReciboGerado } from "@/app/pessoas/gorjetas/distribuicao-actions";
import { GorjetaReciboPdf } from "@/components/pessoas/GorjetaReciboPdf";
import { requireRoleApi } from "@kph/auth/server";

export const dynamic = "force-dynamic";

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/** Remove acentos e caracteres especiais para nomes de arquivo seguros */
function safeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(req: NextRequest) {
  const guard = await requireRoleApi(["founder", "cfo", "gm", "pessoas"]);
  if (!guard.ok) return new NextResponse("Sem permissão", { status: guard.status });

  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return new NextResponse("Parâmetro id obrigatório", { status: 400 });
  }

  const dist = await getDistribuicaoById(id);

  if (!dist) {
    return new NextResponse("Distribuição não encontrada", { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await renderToBuffer(
      React.createElement(GorjetaReciboPdf, {
        data: {
          nome: dist.nome ?? "Colaborador",
          cargo: dist.cargo,
          mes: dist.mes,
          ano: dist.ano,
          dias_trabalhados: dist.dias_trabalhados,
          pontuacao: Number(dist.pontuacao),
          percentual: Number(dist.percentual),
          valor_bruto: Number(dist.valor_bruto),
          valor_liquido: Number(dist.valor_liquido),
          gerado_em: new Date().toISOString(),
        },
      }) as any,
    );
  } catch (err) {
    console.error("[gorjetas/recibo] renderToBuffer falhou:", err);
    return new NextResponse("Erro ao gerar PDF", { status: 500 });
  }

  // Marca timestamp de geração (fire-and-forget)
  marcarReciboGerado(id).catch((err) => {
    console.error("[gorjetas/recibo] marcarReciboGerado falhou:", err);
  });

  const mesStr = MESES[(dist.mes ?? 1) - 1] ?? "mes";
  const nomeSeguro = dist.nome ? safeName(dist.nome) : "colaborador";
  const filename = `recibo-gorjeta-${nomeSeguro}-${mesStr}${dist.ano}.pdf`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
