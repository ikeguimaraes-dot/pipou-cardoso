"use client";

import { useState, useTransition, useRef } from "react";
import { Upload, CheckCircle, XCircle, AlertCircle, Loader2, Eye } from "lucide-react";
import { processarLoteCV, confirmarRascunho } from "../actions";
import type { ResultadoCV, FonteCandidato, CargoCanon } from "../actions";
import { CargoCombobox } from "../CargoCombobox";

const FONTES: { value: FonteCandidato; label: string }[] = [
  { value: "cv_email",               label: "CV por e-mail" },
  { value: "cv_loja",                label: "CV entregue na loja" },
  { value: "indicacao_colaborador",  label: "Indicação de colaborador" },
  { value: "indicacao",              label: "Indicação" },
  { value: "banco_talentos_reativado", label: "Banco de Talentos" },
  { value: "busca_ativa",            label: "Busca ativa" },
  { value: "linkedin",               label: "LinkedIn" },
  { value: "indeed",                 label: "Indeed" },
  { value: "catho",                  label: "Catho" },
  { value: "vagas_com_br",           label: "Vagas.com.br" },
  { value: "instagram",              label: "Instagram" },
  { value: "facebook",               label: "Facebook" },
  { value: "whatsapp",               label: "WhatsApp" },
  { value: "consultoria",            label: "Consultoria" },
  { value: "ex_colaborador",         label: "Ex-colaborador" },
  { value: "mutirao",                label: "Mutirão" },
  { value: "abordagem",              label: "Abordagem" },
  { value: "manual",                 label: "Cadastro manual" },
  { value: "outro",                  label: "Outro" },
];

type Step = "upload" | "processando" | "revisao";

type CardState = ResultadoCV & {
  key: string;
  status: "pendente" | "confirmado" | "descartado" | "confirmando" | "erro_confirm";
  erroConfirm?: string;
  editNome: string;
  editPhone: string;
  editCargo: string;
  editCargoId: string | null;
};

type Props = {
  units: { id: string; name: string }[];
  cargosCanon: CargoCanon[];
};

export function ImportarCVsClient({ units, cargosCanon }: Props) {
  const [step, setStep]         = useState<Step>("upload");
  const [files, setFiles]       = useState<File[]>([]);
  const [origem, setOrigem]     = useState<FonteCandidato>("cv_email");
  const [unitId, setUnitId]     = useState<string>("");
  const [cards, setCards]       = useState<CardState[]>([]);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const pendentes    = cards.filter((c) => c.status === "pendente");
  const confirmados  = cards.filter((c) => c.status === "confirmado");
  const descartados  = cards.filter((c) => c.status === "descartado");
  const falhas       = cards.filter((c) => !c.ok);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).slice(0, 20);
    setFiles(picked);
  }

  function handleProcessar() {
    if (files.length === 0) return;
    setStep("processando");

    startTransition(async () => {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));

      const resultado = await processarLoteCV(fd);
      const initial: CardState[] = resultado.resultados.map((r, i) => ({
        ...r,
        key:          `${i}-${r.nomeArquivo}`,
        status:       r.ok ? "pendente" : "descartado",
        editNome:     r.rascunho?.full_name ?? "",
        editPhone:    r.rascunho?.phone ?? "",
        editCargo:    r.rascunho?.area_interesse ?? "",
        editCargoId:  null,
      }));
      setCards(initial);
      setStep("revisao");
    });
  }

  function patchCard(key: string, patch: Partial<CardState>) {
    setCards((prev) => prev.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }

  async function handleConfirmar(card: CardState) {
    if (!card.editNome.trim()) {
      patchCard(card.key, { status: "erro_confirm", erroConfirm: "Nome é obrigatório" });
      return;
    }
    if (!card.editPhone.replace(/\D/g, "")) {
      patchCard(card.key, { status: "erro_confirm", erroConfirm: "Telefone é obrigatório" });
      return;
    }
    patchCard(card.key, { status: "confirmando" });

    const result = await confirmarRascunho({
      nome:         card.editNome.trim(),
      phone:        card.editPhone.replace(/\D/g, ""),
      areaInteresse: card.editCargo.trim() || "Não informado",
      cargoId:      card.editCargoId,
      origem,
      unitId:       unitId || null,
      curriculo: {
        escolaridade_nivel:   card.rascunho?.escolaridade_nivel,
        pretensao_salarial:   card.rascunho?.pretensao_salarial,
        disponibilidade_inicio: card.rascunho?.disponibilidade_inicio,
        turnos_disponiveis:   card.rascunho?.turnos_disponiveis,
        cidade:               card.rascunho?.cidade,
        bairro:               card.rascunho?.bairro,
        experiencias:         card.rascunho?.experiencias,
        formacoes:            card.rascunho?.formacoes,
        idiomas:              card.rascunho?.idiomas,
        habilidades:          card.rascunho?.habilidades,
      },
    });

    if (result.ok) {
      patchCard(card.key, { status: "confirmado" });
    } else {
      patchCard(card.key, {
        status: "erro_confirm",
        erroConfirm: result.error ?? "Erro ao confirmar",
      });
    }
  }

  // ── STEP: upload ────────────────────────────────────────────────────────────
  if (step === "upload") {
    return (
      <div>
        {/* Zona de upload */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: "2px dashed var(--border)",
            borderRadius: 12,
            padding: "48px 32px",
            textAlign: "center",
            cursor: "pointer",
            background: "var(--surface-2)",
            marginBottom: 24,
          }}
        >
          <Upload size={32} style={{ color: "var(--text-3)", marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
            Clique para selecionar CVs
          </div>
          <div style={{ fontSize: 12, color: "var(--text-3)" }}>
            PDF ou imagem (JPG, PNG) · Máx. 20 arquivos · 10 MB cada
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,image/jpeg,image/png,image/gif,image/webp"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
        </div>

        {files.length > 0 && (
          <div
            style={{
              background: "var(--surface-2)",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 24,
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-3)",
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 8,
              }}
            >
              {files.length} arquivo{files.length > 1 ? "s" : ""} selecionado
              {files.length > 1 ? "s" : ""}
            </div>
            {files.map((f, i) => (
              <div
                key={i}
                style={{
                  fontSize: 12,
                  color: "var(--text-2)",
                  padding: "3px 0",
                  borderBottom: i < files.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                {f.name}{" "}
                <span style={{ color: "var(--text-3)" }}>
                  ({(f.size / 1024).toFixed(0)} KB)
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Config do lote */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: "var(--text-3)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Fonte (aplicada a todos)
            </label>
            <select
              value={origem}
              onChange={(e) => setOrigem(e.target.value as FonteCandidato)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
              }}
            >
              {FONTES.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: "var(--text-3)",
                display: "block",
                marginBottom: 6,
              }}
            >
              Unidade (opcional)
            </label>
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                fontSize: 13,
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
              }}
            >
              <option value="">Sem unidade definida</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleProcessar}
          disabled={files.length === 0}
          style={{
            padding: "10px 24px",
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 8,
            border: "none",
            background: files.length > 0 ? "var(--brasa)" : "var(--border)",
            color: files.length > 0 ? "var(--primary-foreground)" : "var(--text-3)",
            cursor: files.length > 0 ? "pointer" : "not-allowed",
          }}
        >
          Processar {files.length > 0 ? `${files.length} CV${files.length > 1 ? "s" : ""}` : "CVs"}
        </button>
      </div>
    );
  }

  // ── STEP: processando ───────────────────────────────────────────────────────
  if (step === "processando") {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <Loader2
          size={40}
          style={{ color: "var(--brasa)", marginBottom: 16, animation: "spin 1s linear infinite" }}
        />
        <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
          Processando {files.length} arquivo{files.length > 1 ? "s" : ""}…
        </div>
        <div style={{ fontSize: 13, color: "var(--text-3)" }}>
          A IA está extraindo os dados de cada CV. Aguarde.
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── STEP: revisao ───────────────────────────────────────────────────────────
  return (
    <div>
      {/* Barra de progresso do lote */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 28,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {[
          { label: "Pendentes",    count: pendentes.length,   cor: "var(--text-2)" },
          { label: "Confirmados",  count: confirmados.length, cor: "#16A34A" },
          { label: "Descartados",  count: descartados.length, cor: "var(--text-3)" },
          { label: "Falhas parse", count: falhas.length,      cor: "#DC2626" },
        ].map(({ label, count, cor }) => (
          <div
            key={label}
            style={{
              padding: "8px 14px",
              background: "var(--surface-2)",
              borderRadius: 8,
              border: "1px solid var(--border)",
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 700, color: cor }}>{count}</span>
            <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: 6 }}>{label}</span>
          </div>
        ))}

        <button
          onClick={() => { setStep("upload"); setFiles([]); setCards([]); }}
          style={{
            marginLeft: "auto",
            padding: "8px 14px",
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-3)",
            cursor: "pointer",
          }}
        >
          + Novo lote
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {cards
          .filter((c) => c.status !== "descartado")
          .map((card) => (
            <CardItem
              key={card.key}
              card={card}
              units={units}
              cargosCanon={cargosCanon}
              onConfirmar={() => handleConfirmar(card)}
              onDescartar={() => patchCard(card.key, { status: "descartado" })}
              onPatch={(patch) => patchCard(card.key, patch)}
            />
          ))}
      </div>

      {descartados.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 8,
            }}
          >
            Descartados ({descartados.length})
          </div>
          {descartados.map((c) => (
            <div
              key={c.key}
              style={{
                fontSize: 12,
                color: "var(--text-3)",
                padding: "6px 0",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <XCircle size={14} />
              {c.nomeArquivo}
              {c.error && (
                <span style={{ color: "#DC2626", marginLeft: 4 }}>— {c.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Card individual ──────────────────────────────────────────────────────────

type CardItemProps = {
  card: CardState;
  units: { id: string; name: string }[];
  cargosCanon: CargoCanon[];
  onConfirmar: () => void;
  onDescartar: () => void;
  onPatch: (patch: Partial<CardState>) => void;
};

function CardItem({ card, onConfirmar, onDescartar, onPatch, cargosCanon }: CardItemProps) {
  const isConfirmado  = card.status === "confirmado";
  const isConfirmando = card.status === "confirmando";
  const isErro        = card.status === "erro_confirm";

  return (
    <div
      style={{
        background: "var(--surface-2)",
        border: `1px solid ${isConfirmado ? "#16A34A44" : isErro ? "#DC262644" : "var(--border)"}`,
        borderRadius: 12,
        padding: "16px 20px",
        opacity: isConfirmado ? 0.7 : 1,
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        {isConfirmado ? (
          <CheckCircle size={16} style={{ color: "#16A34A" }} />
        ) : card.ok ? (
          <Eye size={16} style={{ color: "var(--text-3)" }} />
        ) : (
          <XCircle size={16} style={{ color: "#DC2626" }} />
        )}
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: isConfirmado ? "#16A34A" : "var(--text-3)",
          }}
        >
          {card.nomeArquivo}
        </span>
        {isConfirmado && (
          <span
            style={{
              fontSize: 11,
              color: "#16A34A",
              marginLeft: "auto",
              fontWeight: 700,
            }}
          >
            Candidato criado
          </span>
        )}
      </div>

      {/* Duplicata warning */}
      {card.duplicata && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            padding: "8px 12px",
            background: "#F59E0B22",
            border: "1px solid #F59E0B44",
            borderRadius: 8,
            marginBottom: 12,
            fontSize: 12,
            color: "#B45309",
          }}
        >
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Possível duplicata por <strong>{card.duplicata.tipo}</strong>:{" "}
            <a
              href={`/pessoas/recrutamento/${card.duplicata.candidatoId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#B45309", fontWeight: 600 }}
            >
              {card.duplicata.candidatoNome}
            </a>{" "}
            já existe no banco. Confirme com cuidado.
          </span>
        </div>
      )}

      {card.ok && !isConfirmado && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginBottom: 16,
          }}
        >
          {[
            {
              label: "Nome *",
              value: card.editNome,
              key: "editNome" as const,
              placeholder: "Nome completo",
            },
            {
              label: "Telefone *",
              value: card.editPhone,
              key: "editPhone" as const,
              placeholder: "11 dígitos",
            },
          ].map(({ label, value, key, placeholder }) => (
            <div key={key}>
              <label
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: "var(--text-3)",
                  display: "block",
                  marginBottom: 4,
                }}
              >
                {label}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => onPatch({ [key]: e.target.value } as Partial<CardState>)}
                placeholder={placeholder}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  fontSize: 13,
                  borderRadius: 6,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  boxSizing: "border-box",
                }}
              />
            </div>
          ))}
          <div>
            <label
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                color: "var(--text-3)",
                display: "block",
                marginBottom: 4,
              }}
            >
              Cargo pretendido *
            </label>
            <CargoCombobox
              cargos={cargosCanon}
              value={card.editCargo}
              cargoId={card.editCargoId}
              onChange={(value, cargoId) => onPatch({ editCargo: value, editCargoId: cargoId })}
              placeholder="Ex: Garçom"
            />
          </div>
        </div>
      )}

      {/* Dados extraídos — resumo colapsado */}
      {card.ok && !isConfirmado && card.rascunho && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-3)",
            marginBottom: 14,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {card.rascunho.cidade && <span>📍 {card.rascunho.cidade}</span>}
          {card.rascunho.escolaridade_nivel && (
            <span>🎓 {card.rascunho.escolaridade_nivel.replace(/_/g, " ")}</span>
          )}
          {card.rascunho.pretensao_salarial && (
            <span>
              💰 R${card.rascunho.pretensao_salarial.toLocaleString("pt-BR")}
            </span>
          )}
          {(card.rascunho.habilidades?.length ?? 0) > 0 && (
            <span>🔧 {card.rascunho.habilidades!.slice(0, 3).join(", ")}</span>
          )}
          {(card.rascunho.experiencias?.length ?? 0) > 0 && (
            <span>
              💼 {card.rascunho.experiencias!.length} experiência
              {card.rascunho.experiencias!.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {isErro && (
        <div
          style={{
            fontSize: 12,
            color: "#DC2626",
            marginBottom: 12,
            padding: "6px 10px",
            background: "#DC262611",
            borderRadius: 6,
          }}
        >
          {card.erroConfirm}
        </div>
      )}

      {/* Botões */}
      {!isConfirmado && (
        <div style={{ display: "flex", gap: 10 }}>
          {card.ok && (
            <button
              onClick={onConfirmar}
              disabled={isConfirmando}
              style={{
                padding: "7px 18px",
                fontSize: 13,
                fontWeight: 700,
                borderRadius: 7,
                border: "none",
                background: isConfirmando ? "var(--border)" : "var(--brasa)",
                color: isConfirmando ? "var(--text-3)" : "var(--primary-foreground)",
                cursor: isConfirmando ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isConfirmando && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
              {isConfirmando ? "Confirmando…" : "Confirmar candidato"}
            </button>
          )}
          <button
            onClick={onDescartar}
            disabled={isConfirmando}
            style={{
              padding: "7px 14px",
              fontSize: 13,
              borderRadius: 7,
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-3)",
              cursor: isConfirmando ? "not-allowed" : "pointer",
            }}
          >
            Descartar
          </button>
        </div>
      )}

      {card.error && !card.ok && (
        <div style={{ fontSize: 12, color: "#DC2626", marginTop: 4 }}>
          {card.error}
        </div>
      )}
    </div>
  );
}
