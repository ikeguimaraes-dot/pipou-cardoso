import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function PendenciasEntry() {
  return <section className="mb-8 rounded-xl border border-[var(--brand)] bg-[var(--brand-soft)] p-6" aria-labelledby="rh-central-entry">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[var(--brand)]">Seu próximo passo</p>
        <h2 id="rh-central-entry" className="mb-2 text-xl font-bold text-[var(--text)]">Pendências do RH</h2>
        <p className="mb-5 max-w-2xl text-sm leading-relaxed text-[var(--text-2)]">Veja o que falta nos cadastros, documentos e rotinas do mês. Acompanhe também as correções e evoluções da plataforma.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/pessoas/pendencias" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-3 text-sm font-bold text-[var(--primary-foreground)]">Abrir fila do RH <ArrowUpRight size={16} /></Link>
          <Link href="/pessoas/importacao-massa" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text)]">Importar planilha <ArrowUpRight size={16} /></Link>
          <Link href="/pessoas/pendencias?visao=plataforma" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--text)]">Ver evoluções e entregas <ArrowUpRight size={16} /></Link>
        </div>
      </section>;
}
