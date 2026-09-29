"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown, Cake, ChevronLeft, ChevronRight, MoreHorizontal,
  Pencil, UserMinus, Search, Link as LinkIcon, CheckCircle2,
} from "lucide-react";

import { Input } from "@kph/ui/input";
import { Button, buttonVariants } from "@kph/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@kph/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@kph/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@kph/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@kph/ui/table";

import { deactivateEmployee, vincularColaborador } from "@/lib/pessoas/actions";
import { saoPauloDate } from "@/lib/pessoas/pendencias-model";
import { ScoreDot } from "@/components/pessoas/ScoreBar";
import { avatarColor, formatBRL, formatDateBR, initials } from "@/lib/format";
import { TERMINATION_REASONS, type TerminationReason } from "@/lib/pessoas/termination-model";
import type { Employee, EmployeeScore } from "@kph/db/types/pessoas";

const PAGE_SIZE = 10;

const MES_ABREV = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

/**
 * Calcula info de aniversário a partir de data_nascimento (ISO YYYY-MM-DD).
 * - displayDDMMM: "12/abr"
 * - isToday: aniversário é exatamente hoje
 * - isUpcoming: aniversário cai nos próximos 7 dias (incluindo hoje)
 */
function birthdayInfo(iso: string | null | undefined): {
  display: string;
  isToday: boolean;
  isUpcoming: boolean;
} {
  if (!iso) return { display: "—", isToday: false, isUpcoming: false };
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return { display: "—", isToday: false, isUpcoming: false };
  const dia = Number(m[3]);
  const mes = Number(m[2]);
  const display = `${String(dia).padStart(2, "0")}/${MES_ABREV[mes - 1] ?? "??"}`;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Próxima ocorrência do aniversário (mesmo ano se ainda não passou)
  let next = new Date(now.getFullYear(), mes - 1, dia);
  if (next < today) next = new Date(now.getFullYear() + 1, mes - 1, dia);
  const diffDays = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return {
    display,
    isToday: diffDays === 0,
    isUpcoming: diffDays >= 0 && diffDays <= 7,
  };
}

export function EmployeeTable({
  data,
  scores,
  canTerminate = false,
  terminationAccessError = null,
}: {
  data: Employee[];
  canTerminate?: boolean;
  terminationAccessError?: string | null;
  scores?: Record<string, EmployeeScore>;
}) {
  const router = useRouter();
  const [terminating, startTransition] = useTransition();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [funcaoFilter, setFuncaoFilter] = useState<string>("__all__");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">("ativos");
  const [search, setSearch] = useState("");

  const [terminationEmp, setTerminationEmp] = useState<Employee | null>(null);
  const [terminationDate, setTerminationDate] = useState("");
  const [terminationReason, setTerminationReason] = useState<TerminationReason | "">("");
  const [terminationError, setTerminationError] = useState("");
  const [terminationSuccess, setTerminationSuccess] = useState<{ id: string; name: string; date: string } | null>(null);
  const [terminated, setTerminated] = useState<Record<string, string>>({});
  const openTermination = useCallback((employee: Employee) => {
    setTerminationEmp(employee);
    setTerminationDate(saoPauloDate());
    setTerminationReason("");
    setTerminationError("");
    setTerminationSuccess(null);
  }, []);

  // Modal de vínculo
  const [onboardEmp, setOnboardEmp] = useState<Employee | null>(null);
  const [onboardEmail, setOnboardEmail] = useState("");
  const [onboardStatus, setOnboardStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [onboardMsg, setOnboardMsg] = useState("");

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.map(e => terminated[e.id] ? { ...e, ativo: false, data_demissao: terminated[e.id]! } : e).filter((e) => {
      if (statusFilter === "ativos" && !e.ativo) return false;
      if (statusFilter === "inativos" && e.ativo) return false;
      if (funcaoFilter !== "__all__" && e.funcao?.trim().toLocaleUpperCase("pt-BR") !== funcaoFilter) return false;
      if (!q) return true;
      const hay = `${e.nome} ${e.sobrenome} ${e.funcao} ${e.cpf ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [data, search, funcaoFilter, statusFilter, terminated]);

  const funcoes = useMemo(() => {
    const set = new Set<string>();
    for (const e of data) if (e.funcao) set.add(e.funcao.trim().toLocaleUpperCase("pt-BR"));
    return Array.from(set).sort();
  }, [data]);

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: "nome",
        header: ({ column }) => (
          <SortableHeader
            label="Colaborador"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => {
          const e = row.original;
          const fullName = `${e.nome} ${e.sobrenome}`.trim();
          const s = scores?.[e.id];
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={fullName} />
              <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text)",
                  }}
                >
                  {s && (
                    <ScoreDot
                      score={s.score}
                      warnings={s.warnings_count}
                      absences={s.absences_count}
                    />
                  )}
                  {fullName}
                </span>
                {e.cpf && (
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                    CPF {e.cpf}
                  </span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "funcao",
        header: ({ column }) => (
          <SortableHeader
            label="Função"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span style={{ fontSize: 12, color: "var(--text-2)" }}>{row.original.funcao?.toLocaleUpperCase("pt-BR")}</span>
        ),
      },
      {
        accessorKey: "salario_base",
        header: ({ column }) => (
          <SortableHeader
            label="Salário-base"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            align="right"
          />
        ),
        cell: ({ row }) => (
          <span
            style={{
              fontSize: 12,
              color: "var(--text)",
              fontVariantNumeric: "tabular-nums",
              display: "block",
              textAlign: "right",
            }}
          >
            {formatBRL(row.original.salario_base)}
          </span>
        ),
      },
      {
        accessorKey: "data_admissao",
        header: ({ column }) => (
          <SortableHeader
            label="Admissão"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          />
        ),
        cell: ({ row }) => (
          <span style={{ fontSize: 12, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>
            {formatDateBR(row.original.data_admissao)}
          </span>
        ),
      },
      {
        accessorKey: "data_demissao",
        header: ({ column }) => (
          <SortableHeader label="Demissão" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
        ),
        cell: ({ row }) => (
          <span style={{ fontSize: 12, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>
            {formatDateBR(row.original.data_demissao)}
          </span>
        ),
      },
      {
        accessorKey: "data_nascimento",
        header: "Aniversário",
        cell: ({ row }) => {
          const b = birthdayInfo(row.original.data_nascimento);
          if (b.display === "—") {
            return <span style={{ fontSize: 12, color: "var(--text-3)" }}>—</span>;
          }
          return (
            <span
              title={
                b.isToday
                  ? "É hoje! 🎉"
                  : b.isUpcoming
                    ? "Aniversário nos próximos 7 dias"
                    : ""
              }
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: b.isUpcoming ? 700 : 500,
                color: b.isUpcoming ? "var(--brand)" : "var(--text-2)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {b.isUpcoming && <Cake size={11} />}
              {b.display}
            </span>
          );
        },
      },
      {
        accessorKey: "ativo",
        header: "Status",
        cell: ({ row }) => {
          const ativo = row.original.ativo;
          return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 99,
                background: ativo ? "rgba(34,197,94,0.12)" : "var(--muted)",
                color: ativo ? "#22C55E" : "var(--muted-foreground)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 99,
                  background: ativo ? "#22C55E" : "var(--muted-foreground)",
                }}
              />
              {ativo ? "Ativo" : "Inativo"}
            </span>
            {ativo && canTerminate && (
              <Button variant="ghost" size="sm" aria-label={`Desligar ${row.original.nome} ${row.original.sobrenome}`}
                style={{ fontSize: 11, height: 28, padding: "0 6px", color: "var(--text-2)" }}
                onClick={(event) => { event.stopPropagation(); openTermination(row.original); }}>
                <UserMinus size={12} /> Desligar
              </Button>
            )}
            </div>
          );
        },
      },
      {
        accessorKey: "conta",
        header: "Conta",
        cell: ({ row }) => {
          const e = row.original;
          if (e.user_id) {
            return (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#22C55E",
                }}
              >
                <CheckCircle2 size={12} />
                Conta ativa
              </span>
            );
          }
          return (
            <Button
              variant="outline"
              size="sm"
              style={{
                height: 24,
                fontSize: 10,
                color: "var(--brand)",
                borderColor: "var(--brand-soft)",
              }}
              onClick={(ev) => {
                ev.stopPropagation();
                setOnboardEmp(e);
                setOnboardEmail(e.email || "");
                setOnboardStatus("idle");
                setOnboardMsg("");
              }}
            >
              <LinkIcon size={10} className="mr-1" />
              Vincular conta
            </Button>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={buttonVariants({ variant: "ghost", size: "icon" })}
                  aria-label="Ações"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => router.push(`/pessoas/colaboradores/${e.id}/editar`)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  {e.ativo && canTerminate && (
                    <DropdownMenuItem
                      onClick={() => openTermination(e)}
                      style={{ color: "var(--destructive)" }}
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Desligar colaborador
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [router, scores, canTerminate, openTermination],
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {terminationAccessError && (
        <div role="alert" style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 8, fontSize: 13 }}>
          <p style={{ margin: "0 0 8px" }}>{terminationAccessError}</p>
          <Button variant="outline" size="sm" onClick={() => router.refresh()}>Atualizar consulta</Button>
        </div>
      )}
      <div
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "minmax(180px, 1fr) auto auto",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-3)",
            }}
          />
          <Input
            placeholder="Buscar nome, CPF, função…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 30 }}
          />
        </div>
        <Select
          value={funcaoFilter}
          onValueChange={(v) => setFuncaoFilter(v ?? "__all__")}
        >
          <SelectTrigger aria-label="Filtrar por função" style={{ minWidth: 160 }}>
            <SelectValue>{funcaoFilter === "__all__" ? "Todas funções" : funcaoFilter}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas funções</SelectItem>
            {funcoes.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => v && setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger aria-label="Filtrar por status" style={{ minWidth: 140 }}>
            <SelectValue>{statusFilter === "ativos" ? "Ativos" : statusFilter === "inativos" ? "Inativos" : "Todos"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: 12,
          background: "var(--surface)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => (
                    <TableHead key={h.id} style={h.column.id === "ativo" ? {
                      position: "sticky", right: 0, zIndex: 2, background: "var(--surface)",
                      boxShadow: "-1px 0 0 var(--border)",
                    } : undefined}>
                      {h.isPlaceholder
                        ? null
                        : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    style={{
                      textAlign: "center",
                      padding: "48px 16px",
                      color: "var(--text-3)",
                      fontSize: 12,
                    }}
                  >
                    Nenhum colaborador encontrado com esses filtros.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => {
                  const b = birthdayInfo(row.original.data_nascimento);
                  return (
                  <TableRow
                    key={row.id}
                    onClick={() => router.push(`/pessoas/colaboradores/${row.original.id}`)}
                    style={{
                      cursor: "pointer",
                      borderLeft: b.isUpcoming
                        ? `3px solid var(--brand)`
                        : "3px solid transparent",
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={cell.column.id === "ativo" ? {
                          position: "sticky", right: 0, zIndex: 1, background: "var(--surface)",
                          boxShadow: "-1px 0 0 var(--border)",
                        } : undefined}
                        // Coluna de ações tem dropdown — stopPropagation impede o
                        // clique no menu de virar navegação pra perfil.
                        onClick={
                          cell.column.id === "actions"
                            ? (e) => e.stopPropagation()
                            : undefined
                        }
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderTop: "1px solid var(--border)",
            fontSize: 11,
            color: "var(--text-3)",
          }}
        >
          <span>
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {Math.max(table.getPageCount(), 1)} · {filteredData.length} colaborador
            {filteredData.length === 1 ? "" : "es"}
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {terminationSuccess && (
        <p role="status" style={{ margin: 0, fontSize: 13, color: "var(--text-2)" }}>
          Desligamento de {terminationSuccess.name} registrado em {formatDateBR(terminationSuccess.date)}. O histórico foi preservado.{" "}
          <button type="button" onClick={() => router.push(`/pessoas/colaboradores/${terminationSuccess.id}`)} style={{ textDecoration: "underline" }}>Ver cadastro</button>
        </p>
      )}

      {terminationEmp && (
        <Dialog open onOpenChange={(open) => { if (!open && !terminating) setTerminationEmp(null); }}>
          <DialogContent showCloseButton={!terminating}>
            <DialogHeader>
              <DialogTitle>Desligar colaborador</DialogTitle>
              <DialogDescription>
                {terminationEmp.nome} {terminationEmp.sobrenome} ficará inativo. O cadastro e o histórico serão preservados.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(event) => {
              event.preventDefault();
              if (terminating || !terminationDate || !terminationReason) return;
              setTerminationError("");
              startTransition(async () => {
                try {
                  const result = await deactivateEmployee(terminationEmp.id, terminationDate, terminationReason);
                  if (!result.ok) { setTerminationError(result.error); return; }
                  setTerminated(previous => ({ ...previous, [terminationEmp.id]: terminationDate }));
                  setTerminationSuccess({ id: terminationEmp.id, name: `${terminationEmp.nome} ${terminationEmp.sobrenome}`, date: terminationDate });
                  setStatusFilter("inativos");
                  setTerminationEmp(null);
                  router.refresh();
                } catch {
                  setTerminationError("Não foi possível salvar. Confira sua conexão e tente novamente.");
                }
              });
            }} style={{ display: "grid", gap: 16 }}>
              <div>
                <label htmlFor="termination-date" style={{ display: "block", marginBottom: 6 }}>Data de demissão</label>
                <Input id="termination-date" type="date" required value={terminationDate}
                  min={terminationEmp.data_admissao || undefined} max={saoPauloDate()} disabled={terminating}
                  aria-invalid={!!terminationError} aria-describedby={terminationError ? "termination-error" : undefined}
                  onChange={(event) => { setTerminationDate(event.target.value); setTerminationError(""); }} />
                <p style={{ fontSize: 12, color: "var(--text-3)", margin: "6px 0 0" }}>Admissão: {formatDateBR(terminationEmp.data_admissao)}</p>
              </div>
              <div>
                <label htmlFor="termination-reason" style={{ display: "block", marginBottom: 6 }}>Motivo do desligamento</label>
                <select id="termination-reason" required value={terminationReason} disabled={terminating}
                  onChange={(event) => { setTerminationReason(event.target.value as TerminationReason); setTerminationError(""); }}
                  style={{ width: "100%", minHeight: 40, borderRadius: 8, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", padding: "0 12px" }}>
                  <option value="">Selecione o motivo</option>
                  {TERMINATION_REASONS.map(reason => <option key={reason.value} value={reason.value}>{reason.label}</option>)}
                </select>
              </div>
              {terminationError && <p id="termination-error" role="alert" style={{ color: "var(--destructive)", margin: 0 }}>{terminationError}</p>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Button type="button" variant="outline" disabled={terminating} onClick={() => setTerminationEmp(null)}>Cancelar</Button>
                <Button type="submit" disabled={terminating || !terminationDate || !terminationReason || terminationDate > saoPauloDate() || (!!terminationEmp.data_admissao && terminationDate < terminationEmp.data_admissao)}>
                  {terminating ? "Salvando…" : "Confirmar desligamento"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {onboardEmp && (
        <Dialog open={!!onboardEmp} onOpenChange={(o) => !o && setOnboardEmp(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vincular Conta</DialogTitle>
              <DialogDescription>
                Vamos enviar um magic link para o colaborador acessar o KPH OS.
              </DialogDescription>
            </DialogHeader>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", marginBottom: 4, display: "block" }}>
                  E-mail do colaborador
                </label>
                <Input
                  value={onboardEmail}
                  onChange={(e) => setOnboardEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>

              {onboardMsg && (
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: onboardStatus === "error" ? "var(--destructive)" : "#22C55E",
                    padding: "8px 12px",
                    borderRadius: 6,
                    background: onboardStatus === "error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                  }}
                >
                  {onboardMsg}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Button variant="ghost" onClick={() => setOnboardEmp(null)}>Cancelar</Button>
                <Button
                  disabled={!onboardEmail || onboardStatus === "loading"}
                  onClick={async () => {
                    setOnboardStatus("loading");
                    setOnboardMsg("");
                    const res = await vincularColaborador(onboardEmp.id, onboardEmail);
                    if (res.ok) {
                      setOnboardStatus("success");
                      setOnboardMsg(`Link enviado para ${onboardEmail}`);
                      // Poderia fechar após 2s, mas o feedback é bom de ser lido
                    } else {
                      setOnboardStatus("error");
                      setOnboardMsg(res.error || "Erro ao enviar convite.");
                    }
                  }}
                >
                  {onboardStatus === "loading" ? "Enviando..." : "Enviar magic link"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  onClick,
  align = "left",
}: {
  label: string;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "transparent",
        border: "none",
        color: "var(--text-3)",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        cursor: "pointer",
        padding: 0,
        margin: 0,
        marginLeft: align === "right" ? "auto" : 0,
      }}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );
}

function Avatar({ name }: { name: string }) {
  const color = avatarColor(name || "?");
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 99,
        background: `color-mix(in srgb, ${color} 18%, transparent)`,
        color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials(name)}
    </div>
  );
}
