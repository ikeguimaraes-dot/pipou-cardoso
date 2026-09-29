"use client";

import { useRef, useState } from "react";
import { createSurveyAction } from "../actions";

type PerguntaDraft = {
  texto: string;
  tipo: "escala" | "texto_livre";
};

export default function NovaPesquisaPage() {
  const [perguntas, setPerguntas] = useState<PerguntaDraft[]>([
    { texto: "", tipo: "escala" },
  ]);
  const [salvarComo, setSalvarComo] = useState<"rascunho" | "ativa">("rascunho");
  const formRef = useRef<HTMLFormElement>(null);

  function addPergunta() {
    setPerguntas(prev => [...prev, { texto: "", tipo: "escala" }]);
  }

  function removePergunta(idx: number) {
    setPerguntas(prev => prev.filter((_, i) => i !== idx));
  }

  function updatePergunta(idx: number, field: keyof PerguntaDraft, value: string) {
    setPerguntas(prev =>
      prev.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p,
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    fd.set("salvar_como", salvarComo);
    fd.set("perguntas", JSON.stringify(perguntas));
    await createSurveyAction(fd);
    window.location.href = "/pessoas/clima";
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <header style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            color: "var(--text-3)",
          }}
        >
          Pessoas · DHO · Clima
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            margin: "6px 0 0",
            color: "var(--text)",
            letterSpacing: -0.4,
          }}
        >
          Nova Pesquisa
        </h1>
      </header>

      <form ref={formRef} onSubmit={handleSubmit}>
        <input type="hidden" name="salvar_como" value={salvarComo} />
        <input type="hidden" name="perguntas" value={JSON.stringify(perguntas)} />

        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Título */}
          <Field label="Título" required>
            <input
              name="titulo"
              required
              placeholder="Ex: Pesquisa de Clima — Julho 2026"
              style={inputStyle}
            />
          </Field>

          {/* Descrição */}
          <Field label="Descrição">
            <textarea
              name="descricao"
              rows={3}
              placeholder="Contexto opcional sobre esta pesquisa..."
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
            />
          </Field>

          {/* Tipo */}
          <Field label="Tipo de Pesquisa" required>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {(
                [
                  { value: "pulso", label: "Pulso semanal" },
                  { value: "nps", label: "NPS interno" },
                  { value: "tematica", label: "Temática" },
                ] as const
              ).map(opt => (
                <label
                  key={opt.value}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    fontSize: 13,
                    fontWeight: 500,
                    color: "var(--text)",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="tipo"
                    value={opt.value}
                    defaultChecked={opt.value === "pulso"}
                    required
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </Field>

          {/* Unidade */}
          <Field label="Unidade">
            <input
              name="unit_id"
              placeholder="ID da unidade (deixe vazio para todas as unidades)"
              style={inputStyle}
            />
            <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
              Deixe em branco para aplicar a todas as unidades.
            </p>
          </Field>
        </div>

        {/* Perguntas */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "24px",
            marginTop: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 }}>
              Perguntas
            </h2>
            <button
              type="button"
              onClick={addPergunta}
              style={{
                padding: "7px 14px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: "var(--text-2)",
                cursor: "pointer",
              }}
            >
              + Adicionar pergunta
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {perguntas.map((p, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "14px",
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-3)",
                    paddingTop: 10,
                    minWidth: 20,
                    textAlign: "right",
                  }}
                >
                  {idx + 1}.
                </span>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    value={p.texto}
                    onChange={e => updatePergunta(idx, "texto", e.target.value)}
                    placeholder="Texto da pergunta"
                    style={inputStyle}
                  />
                  <select
                    value={p.tipo}
                    onChange={e => updatePergunta(idx, "tipo", e.target.value)}
                    style={{ ...inputStyle, width: "auto", maxWidth: 180 }}
                  >
                    <option value="escala">Escala 1-5</option>
                    <option value="texto_livre">Texto livre</option>
                  </select>
                </div>
                {perguntas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePergunta(idx)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-3)",
                      fontSize: 18,
                      lineHeight: 1,
                      padding: "6px 4px",
                      borderRadius: 4,
                    }}
                    aria-label="Remover pergunta"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ações */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 20,
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          <a
            href="/pessoas/clima"
            style={{
              padding: "10px 20px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text-2)",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            Cancelar
          </a>
          <button
            type="submit"
            onClick={() => setSalvarComo("rascunho")}
            style={{
              padding: "10px 20px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--text)",
              cursor: "pointer",
            }}
          >
            Salvar rascunho
          </button>
          <button
            type="submit"
            onClick={() => setSalvarComo("ativa")}
            style={{
              padding: "10px 20px",
              background: "var(--brand)",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: "var(--primary-foreground)",
              cursor: "pointer",
            }}
          >
            Publicar agora
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--text-2)",
          letterSpacing: 0.2,
        }}
      >
        {label}
        {required && <span style={{ color: "var(--brand)", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  background: "var(--background)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 13,
  color: "var(--text)",
  outline: "none",
  boxSizing: "border-box",
};
