import type { ReactNode } from "react";
import { LockKeyhole, ArrowUpRight } from "lucide-react";
import "./pipou-login.css";
import { tenant } from "@/lib/tenant";

/** Uses the original logo and hospitality photograph supplied in the Pipou brand guide. */
export function PipouLoginScene({ children, recoveryHref = tenant.recoveryUrl, title = "Bom ter você aqui.", description = "Entre na sua conta para continuar." }: { children: ReactNode; recoveryHref?: string; title?: string; description?: string }) {
  return <main className="pipou-login">
    {/* Decorative photograph; the form and all copy remain real, accessible HTML. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="pipou-login-photo" src="/pessoas/brand/pipou/login/hospitalidade.jpg" alt="" fetchPriority="high" />
    <div className="pipou-login-shade" aria-hidden="true" />
    <header className="pipou-login-header">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="pipou-login-logo" src="/pessoas/brand/pipou/login/logo-yellow.png" alt="Pipou Academy" width={2244} height={890} />
      <span>Desenvolver. Cuidar. Encantar.</span>
    </header>
    <div className="pipou-login-content">
      <section className="pipou-login-story" aria-labelledby="pipou-login-title">
        <p className="pipou-login-eyebrow"><span /> Gestão de pessoas</p>
        <h1 id="pipou-login-title">O padrão ouro<br />da hospitalidade.<br /><em>Começa com pessoas.</em></h1>
        <p className="pipou-login-description">Desenvolver talentos. Fortalecer o time.<br />Transformar cuidado em experiências extraordinárias.</p>
        <div className="pipou-login-signature"><span>01 — Pessoas</span><span>02 — Processos</span><span>03 — Encantamento</span></div>
      </section>
      <section className="pipou-login-card" aria-labelledby="pipou-login-welcome">
        <p className="pipou-login-card-eyebrow"><LockKeyhole size={14} aria-hidden="true" /> Seu espaço PIPOU</p>
        <h2 id="pipou-login-welcome">{title}</h2>
        <p className="pipou-login-card-description">{description}</p>
        {children}
        {recoveryHref && <a className="pipou-login-recovery" href={recoveryHref}>Esqueceu sua senha? <ArrowUpRight size={13} aria-hidden="true" /></a>}
        <p className="pipou-login-help">Precisa de acesso? Fale com o responsável<br className="pipou-login-help-break" /> pelo RH da sua unidade.</p>
        <div className="pipou-login-card-footer"><strong>PIPOU ACADEMY</strong><span>O cuidado começa aqui.</span></div>
      </section>
    </div>
    <footer className="pipou-login-footer"><span>Onde pessoas, processos e protocolo se alinham ao resultado.</span><span>{tenant.name} <i /> Hospitalidade em cada detalhe.</span></footer>
  </main>;
}
