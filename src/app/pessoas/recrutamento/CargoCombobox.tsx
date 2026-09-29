"use client";

import { useState, useRef, useEffect, useId } from "react";
import type { CargoCanon } from "./actions";

type Props = {
  cargos:      CargoCanon[];
  value:       string;
  cargoId:     string | null;
  onChange:    (value: string, cargoId: string | null) => void;
  style?:      React.CSSProperties;
  placeholder?: string;
  disabled?:   boolean;
};

export function CargoCombobox({ cargos, value, cargoId, onChange, style, placeholder = "Ex: Bartender", disabled }: Props) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState(value);
  const containerRef          = useRef<HTMLDivElement>(null);
  const inputRef              = useRef<HTMLInputElement>(null);
  const listboxId             = useId();

  // Sync query quando value muda externamente (ex: parse de CV)
  useEffect(() => { setQuery(value); }, [value]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const trimmed = query.trim().toLowerCase();

  const filtered = trimmed.length === 0
    ? cargos
    : cargos.filter((c) => c.nome.toLowerCase().includes(trimmed));

  const setores = Array.from(new Set(filtered.map((c) => c.setor))).sort();

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    setOpen(true);
    // Texto livre — limpa cargo_id até o usuário escolher do catálogo
    onChange(v, null);
  }

  function handleSelect(c: CargoCanon) {
    setQuery(c.nome);
    setOpen(false);
    onChange(c.nome, c.id);
    inputRef.current?.blur();
  }

  function handleBlur() {
    // Pequeno delay para deixar o click no item processar antes de fechar
    setTimeout(() => setOpen(false), 120);
  }

  const fromCatalog = cargoId !== null && cargoId !== "";

  const baseStyle: React.CSSProperties = {
    width: "100%", padding: "9px 11px", fontSize: 13, color: "var(--text)",
    background: fromCatalog ? "rgba(22,163,74,0.06)" : "var(--surface-2)",
    border: fromCatalog ? "1px solid rgba(22,163,74,0.4)" : "1px solid var(--border)",
    borderRadius: 8, outline: "none",
    ...style,
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          style={baseStyle}
          autoComplete="off"
        />
        {fromCatalog && (
          <span
            title="Cargo do catálogo canônico"
            style={{
              position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
              fontSize: 10, fontWeight: 700, color: "#16A34A",
              background: "rgba(22,163,74,0.12)", padding: "1px 6px", borderRadius: 4,
              pointerEvents: "none",
            }}
          >
            catálogo
          </span>
        )}
      </div>

      {open && (
        <div
          id={listboxId}
          role="listbox"
          style={{
            position: "absolute", zIndex: 500, top: "calc(100% + 4px)", left: 0, right: 0,
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)", maxHeight: 260, overflowY: "auto",
            padding: "6px 0",
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: "10px 14px", fontSize: 12, color: "var(--text-3)" }}>
              Nenhum cargo no catálogo — será salvo como texto livre.
            </div>
          ) : (
            setores.map((setor) => (
              <div key={setor}>
                <div style={{ padding: "5px 14px 3px", fontSize: 10, fontWeight: 700, letterSpacing: 0.8, textTransform: "uppercase", color: "var(--text-3)" }}>
                  {setor}
                </div>
                {filtered
                  .filter((c) => c.setor === setor)
                  .map((c) => (
                    <button
                      key={c.id}
                      role="option"
                      aria-selected={c.id === cargoId}
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); handleSelect(c); }}
                      style={{
                        display: "block", width: "100%", textAlign: "left",
                        padding: "7px 14px", fontSize: 13, border: "none",
                        background: c.id === cargoId ? "rgba(22,163,74,0.1)" : "none",
                        color: c.id === cargoId ? "#16A34A" : "var(--text)",
                        cursor: "pointer",
                        fontWeight: c.id === cargoId ? 600 : 400,
                      }}
                      onMouseEnter={(e) => { if (c.id !== cargoId) (e.currentTarget as HTMLButtonElement).style.background = "var(--surface-2)"; }}
                      onMouseLeave={(e) => { if (c.id !== cargoId) (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                    >
                      {c.nome}
                      {c.tem_nivel && <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: 6 }}>I / II</span>}
                    </button>
                  ))}
              </div>
            ))
          )}
          {trimmed.length > 0 && (
            <div style={{ borderTop: "1px solid var(--border)", margin: "4px 0 0", padding: "8px 14px 4px" }}>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                Ou continuar com &ldquo;<strong style={{ color: "var(--text-2)" }}>{query}</strong>&rdquo; como texto livre
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
