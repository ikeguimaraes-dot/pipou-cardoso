// Recibo de gorjeta individual. Renderizado no servidor via @react-pdf/renderer.
// NÃO usa React DOM — só os primitivos do react-pdf.

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

const KPH_GOLD = "#C9A96E";
const TEXT      = "#1A1A1A";
const TEXT_2    = "#525252";
const BORDER    = "#E5E5E5";
const BG_LIGHT  = "#F9F7F4";

const styles = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingHorizontal: 44,
    paddingBottom: 36,
    fontSize: 10,
    color: TEXT,
    fontFamily: "Helvetica",
  },

  // ── Cabeçalho ────────────────────────────────────────────────
  header: {
    borderBottomWidth: 2,
    borderBottomColor: KPH_GOLD,
    paddingBottom: 14,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  brand: {
    fontSize: 8,
    letterSpacing: 3,
    color: KPH_GOLD,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginTop: 5,
    color: TEXT,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 9,
    color: TEXT_2,
    marginTop: 3,
  },
  docMeta: {
    alignItems: "flex-end",
  },
  docMetaLabel: {
    fontSize: 7,
    color: TEXT_2,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  docMetaValue: {
    fontSize: 9,
    color: TEXT,
    marginTop: 2,
    fontFamily: "Helvetica-Bold",
  },

  // ── Dados do colaborador ─────────────────────────────────────
  colaboradorBox: {
    backgroundColor: BG_LIGHT,
    borderRadius: 4,
    padding: "12 16",
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  colaboradorNome: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: TEXT,
  },
  colaboradorCargo: {
    fontSize: 10,
    color: TEXT_2,
    marginTop: 3,
  },
  periodoBadge: {
    backgroundColor: KPH_GOLD + "22",
    borderRadius: 4,
    padding: "6 12",
    alignItems: "center",
  },
  periodoLabel: {
    fontSize: 7,
    color: KPH_GOLD,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  periodoValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: KPH_GOLD,
    marginTop: 3,
  },

  // ── Tabela de cálculo ────────────────────────────────────────
  sectionLabel: {
    fontSize: 7,
    letterSpacing: 2,
    color: TEXT_2,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 16,
  },
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F0EDE8",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: TEXT_2,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    flex: 1,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  tableCell: {
    fontSize: 10,
    color: TEXT,
    flex: 1,
  },
  tableCellRight: {
    fontSize: 10,
    color: TEXT,
    flex: 1,
    textAlign: "right",
  },

  // ── Destaque do valor líquido ─────────────────────────────────
  liquidoBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    padding: "14 16",
    backgroundColor: BG_LIGHT,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: KPH_GOLD,
  },
  liquidoLabel: {
    fontSize: 8,
    letterSpacing: 1.8,
    color: TEXT_2,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  liquidoSub: {
    fontSize: 8,
    color: TEXT_2,
    marginTop: 3,
  },
  liquidoValue: {
    fontSize: 26,
    color: KPH_GOLD,
    fontFamily: "Helvetica-Bold",
  },

  // ── Assinatura ───────────────────────────────────────────────
  signatureBlock: {
    marginTop: 56,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureLine: {
    width: "42%",
    borderTopWidth: 1,
    borderTopColor: TEXT_2,
    paddingTop: 6,
    fontSize: 8,
    color: TEXT_2,
    textAlign: "center",
  },

  // ── Rodapé ───────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 24,
    left: 44,
    right: 44,
    fontSize: 7,
    color: TEXT_2,
    textAlign: "center",
    letterSpacing: 0.5,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 6,
  },
});

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
}).format;

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export interface GorjetaReciboData {
  nome: string;
  cargo: string;
  mes: number;
  ano: number;
  dias_trabalhados: number;
  pontuacao: number;
  percentual: number;
  valor_bruto: number;
  valor_liquido: number;
  responsavel?: string;
  gerado_em?: string;
}

export function GorjetaReciboPdf({ data }: { data: GorjetaReciboData }) {
  const periodo = `${MESES[data.mes - 1]} / ${data.ano}`;
  const geradoEm = data.gerado_em
    ? new Date(data.gerado_em).toLocaleDateString("pt-BR")
    : new Date().toLocaleDateString("pt-BR");

  return (
    <Document title={`Recibo de Gorjeta — ${data.nome} — ${periodo}`}>
      <Page size="A4" style={styles.page}>

        {/* ── Cabeçalho ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>KPH PARTICIPAÇÕES</Text>
            <Text style={styles.title}>Recibo de Gorjeta</Text>
            <Text style={styles.subtitle}>Comprovante de Distribuição · Sistema de Pontos</Text>
          </View>
          <View style={styles.docMeta}>
            <Text style={styles.docMetaLabel}>Emitido em</Text>
            <Text style={styles.docMetaValue}>{geradoEm}</Text>
          </View>
        </View>

        {/* ── Colaborador + Período ── */}
        <View style={styles.colaboradorBox}>
          <View>
            <Text style={styles.colaboradorNome}>{data.nome}</Text>
            <Text style={styles.colaboradorCargo}>{data.cargo}</Text>
          </View>
          <View style={styles.periodoBadge}>
            <Text style={styles.periodoLabel}>Período</Text>
            <Text style={styles.periodoValue}>{periodo}</Text>
          </View>
        </View>

        {/* ── Cálculo ── */}
        <Text style={styles.sectionLabel}>Composição da gorjeta</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={{ ...styles.tableHeaderCell, flex: 2 }}>Descrição</Text>
            <Text style={{ ...styles.tableHeaderCell, textAlign: "right" }}>Valor</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, flex: 2 }}>Dias trabalhados no período</Text>
            <Text style={styles.tableCellRight}>{data.dias_trabalhados} dias</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, flex: 2 }}>Pontuação por cargo ({data.cargo})</Text>
            <Text style={styles.tableCellRight}>{data.pontuacao.toFixed(2)} pts</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, flex: 2 }}>Percentual sobre total distribuído</Text>
            <Text style={styles.tableCellRight}>{(data.percentual * 100).toFixed(4)}%</Text>
          </View>

          <View style={styles.tableRow}>
            <Text style={{ ...styles.tableCell, flex: 2 }}>Valor bruto calculado</Text>
            <Text style={styles.tableCellRight}>{BRL(data.valor_bruto)}</Text>
          </View>

          <View style={{ ...styles.tableRow, borderBottomWidth: 0 }}>
            <Text style={{ ...styles.tableCell, flex: 2, color: TEXT_2 }}>
              Deduções (INSS, tributações aplicáveis)
            </Text>
            <Text style={{ ...styles.tableCellRight, color: TEXT_2 }}>
              − {BRL(data.valor_bruto - data.valor_liquido)}
            </Text>
          </View>
        </View>

        {/* ── Valor líquido ── */}
        <View style={styles.liquidoBox}>
          <View>
            <Text style={styles.liquidoLabel}>Valor a receber (líquido)</Text>
            <Text style={styles.liquidoSub}>Referente a {periodo}</Text>
          </View>
          <Text style={styles.liquidoValue}>{BRL(data.valor_liquido)}</Text>
        </View>

        {/* ── Assinaturas ── */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLine}>
            {data.responsavel ?? "Gestor de Pessoas / RH"}
          </Text>
          <Text style={styles.signatureLine}>
            {data.nome}
            {"\n"}Colaborador(a)
          </Text>
        </View>

        {/* ── Rodapé ── */}
        <Text style={styles.footer}>
          KPH Participações · Este recibo é gerado eletronicamente e dispensa assinatura física quando
          acompanhado de autenticação digital. {periodo} · {geradoEm}
        </Text>
      </Page>
    </Document>
  );
}
