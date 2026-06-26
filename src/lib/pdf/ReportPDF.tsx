import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Svg,
  Rect,
} from "@react-pdf/renderer";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface PDFAnswer {
  question_id: number;
  is_compliant: boolean;
  ai_justification: string;
  awarded_weight: number;
}

export interface PDFData {
  company: {
    name: string;
    nit?: string | null;
    industry_sector: string;
  };
  evaluation: {
    total_compliance_score: number;
    created_at: string;
    status: string;
  };
  answers: PDFAnswer[];
}

// ── Question metadata ─────────────────────────────────────────────────────────
const QUESTIONS = [
  { id: 1,  block: 1, label: "Política de Tratamiento de Datos Personales",    weight: 20 },
  { id: 2,  block: 1, label: "Aviso de Privacidad",                             weight:  5 },
  { id: 3,  block: 1, label: "Consentimiento Previo y Documentado",             weight:  7 },
  { id: 4,  block: 1, label: "Mecanismos KARS/ARCO",                            weight:  4 },
  { id: 5,  block: 1, label: "Registro de Actividades de Tratamiento",          weight:  4 },
  { id: 6,  block: 2, label: "Medidas de Seguridad Técnicas",                   weight: 15 },
  { id: 7,  block: 2, label: "Medidas de Seguridad Administrativas",            weight: 10 },
  { id: 8,  block: 2, label: "Medidas de Seguridad Físicas",                    weight: 11 },
  { id: 9,  block: 3, label: "Protocolo de Notificación de Incidentes",         weight:  8 },
  { id: 10, block: 3, label: "Retención y Eliminación de Datos",                weight: 16 },
  { id: 11, block: 3, label: "Responsable de Protección de Datos (DPO)",        weight:  0, qualitative: true },
];

const BLOCKS = [
  { id: 1, name: "Política y Consentimiento", max: 40 },
  { id: 2, name: "Seguridad",                 max: 36 },
  { id: 3, name: "Gobernanza y Notificación", max: 24 },
];

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  dark:     "#0a1628",
  blue:     "#1a3a5c",
  gold:     "#f0b429",
  white:    "#ffffff",
  slate100: "#f1f5f9",
  slate200: "#e2e8f0",
  slate400: "#94a3b8",
  slate500: "#64748b",
  slate700: "#334155",
  green:    "#16a34a",
  red:      "#dc2626",
  yellow:   "#ca8a04",
  greenBg:  "#dcfce7",
  redBg:    "#fee2e2",
};

function scoreColor(s: number) {
  return s >= 80 ? C.green : s >= 50 ? C.yellow : C.red;
}
function scoreLabel(s: number) {
  return s >= 80 ? "Alto cumplimiento" : s >= 50 ? "Cumplimiento parcial" : "Bajo cumplimiento";
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric", month: "long", day: "numeric",
  });
}

// ── Progress bar (SVG) ────────────────────────────────────────────────────────
function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const W = 180, H = 8;
  const fill = Math.max(1, (pct / 100) * W);
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Rect x={0} y={0} width={W} height={H} rx={4} fill={C.slate200} />
      <Rect x={0} y={0} width={fill} height={H} rx={4} fill={color} />
    </Svg>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page:          { fontFamily: "Helvetica", fontSize: 9, color: C.slate700, paddingBottom: 48 },

  // Header
  header:        { backgroundColor: C.dark, padding: "20 32 16 32", flexDirection: "row", alignItems: "center" },
  headerLeft:    { flex: 1 },
  brandName:     { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: 1 },
  brandGold:     { color: C.gold },
  brandSub:      { fontSize: 7, color: "#94a3b8", marginTop: 2 },
  headerRight:   { alignItems: "flex-end" },
  headerTitle:   { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.white },
  headerSub:     { fontSize: 7, color: "#94a3b8", marginTop: 2 },

  // Company bar
  companyBar:    { backgroundColor: C.blue, padding: "8 32", flexDirection: "row", gap: 24 },
  companyItem:   { flexDirection: "column", gap: 2 },
  companyLabel:  { fontSize: 6, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 },
  companyValue:  { fontSize: 9, fontFamily: "Helvetica-Bold", color: C.white },

  // Body
  body:          { padding: "16 32" },

  // Section titles
  sectionTitle:  { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 8, marginTop: 16,
                   borderBottomWidth: 1, borderBottomColor: C.slate200, paddingBottom: 4 },

  // Score hero
  scoreHero:     { flexDirection: "row", gap: 16, backgroundColor: C.slate100, borderRadius: 8,
                   padding: "12 16", marginBottom: 4, alignItems: "center" },
  scoreBigNum:   { fontSize: 36, fontFamily: "Helvetica-Bold" },
  scorePct:      { fontSize: 16, fontFamily: "Helvetica-Bold" },
  scoreLabel:    { fontSize: 9, marginTop: 2 },
  statsGrid:     { flex: 1, flexDirection: "row", gap: 12 },
  statBox:       { flex: 1, backgroundColor: C.white, borderRadius: 6, padding: "8 10",
                   alignItems: "center", justifyContent: "center" },
  statNum:       { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.dark },
  statLbl:       { fontSize: 7, color: C.slate400, marginTop: 2, textAlign: "center" },

  // Blocks
  blocksRow:     { flexDirection: "row", gap: 8, marginBottom: 4 },
  blockCard:     { flex: 1, backgroundColor: C.slate100, borderRadius: 6, padding: "8 10" },
  blockName:     { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.dark, marginBottom: 4 },
  blockScore:    { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  blockMax:      { fontSize: 7, color: C.slate400 },
  blockBarRow:   { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },

  // Question cards
  qCard:         { marginBottom: 6, borderRadius: 6, overflow: "hidden", borderWidth: 1, borderColor: C.slate200 },
  qHeader:       { flexDirection: "row", alignItems: "center", padding: "6 10", gap: 8 },
  qBadge:        { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  qBadgeText:    { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white },
  qId:           { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.slate400 },
  qLabel:        { flex: 1, fontSize: 8, fontFamily: "Helvetica-Bold", color: C.dark },
  qWeightText:   { fontSize: 7, color: C.slate400 },
  qBody:         { padding: "4 10 8 10", backgroundColor: C.white },
  qBodyLabel:    { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.slate500, marginBottom: 2, textTransform: "uppercase" },
  qBodyText:     { fontSize: 8, color: C.slate700, lineHeight: 1.5 },
  qDivider:      { height: 1, backgroundColor: C.slate200, marginVertical: 4 },

  // Footer
  footer:        { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.dark,
                   padding: "8 32", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  footerText:    { fontSize: 7, color: "#64748b" },
  footerBrand:   { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.gold },

  // Page number
  pageNum:       { fontSize: 7, color: "#64748b" },
});

// ── PDF Document ───────────────────────────────────────────────────────────────
export function ReportPDF({ data }: { data: PDFData }) {
  const { company, evaluation, answers } = data;
  const score = evaluation.total_compliance_score;
  const color = scoreColor(score);

  const answerMap = new Map(answers.map((a) => [a.question_id, a]));

  const compliantCount = answers.filter((a) => a.is_compliant && a.question_id < 11).length;
  const gapCount = answers.filter((a) => !a.is_compliant && a.question_id < 11).length;

  return (
    <Document
      title={`Informe Ley 1581 — ${company.name}`}
      author="CAVALTEC"
      subject="Diagnóstico de Cumplimiento Ley 1581 de 2012"
      keywords="CAVALTEC, Ley 1581, protección de datos, Colombia"
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.brandName}>
              CAVAL<Text style={s.brandGold}>TEC</Text>
            </Text>
            <Text style={s.brandSub}>Ciberseguridad · Bogotá, Colombia</Text>
          </View>
          <View style={s.headerRight}>
            <Text style={s.headerTitle}>Informe de Diagnóstico Ley 1581</Text>
            <Text style={s.headerSub}>Protección de Datos Personales · {formatDate(evaluation.created_at)}</Text>
          </View>
        </View>

        {/* ── Company bar ── */}
        <View style={s.companyBar}>
          <View style={s.companyItem}>
            <Text style={s.companyLabel}>Empresa</Text>
            <Text style={s.companyValue}>{company.name}</Text>
          </View>
          {company.nit ? (
            <View style={s.companyItem}>
              <Text style={s.companyLabel}>NIT</Text>
              <Text style={s.companyValue}>{company.nit}</Text>
            </View>
          ) : null}
          <View style={s.companyItem}>
            <Text style={s.companyLabel}>Sector</Text>
            <Text style={s.companyValue}>{company.industry_sector}</Text>
          </View>
          <View style={[s.companyItem, { marginLeft: "auto" }]}>
            <Text style={s.companyLabel}>Estado</Text>
            <Text style={[s.companyValue, { color: color }]}>
              {scoreLabel(score)}
            </Text>
          </View>
        </View>

        <View style={s.body}>

          {/* ── Score hero ── */}
          <Text style={s.sectionTitle}>Puntaje Global de Cumplimiento</Text>
          <View style={s.scoreHero}>
            <View style={{ alignItems: "center", marginRight: 8 }}>
              <Text style={[s.scoreBigNum, { color }]}>{score}
                <Text style={[s.scorePct, { color }]}>%</Text>
              </Text>
              <Text style={[s.scoreLabel, { color }]}>{scoreLabel(score)}</Text>
            </View>
            <View style={s.statsGrid}>
              <View style={s.statBox}>
                <Text style={[s.statNum, { color: C.green }]}>{compliantCount}</Text>
                <Text style={s.statLbl}>Criterios{"\n"}cumplidos</Text>
              </View>
              <View style={s.statBox}>
                <Text style={[s.statNum, { color: C.red }]}>{gapCount}</Text>
                <Text style={s.statLbl}>Brechas{"\n"}detectadas</Text>
              </View>
              <View style={s.statBox}>
                <Text style={[s.statNum, { color: C.slate700 }]}>11</Text>
                <Text style={s.statLbl}>Criterios{"\n"}evaluados</Text>
              </View>
            </View>
          </View>

          {/* ── Block breakdown ── */}
          <Text style={s.sectionTitle}>Resultados por Bloque</Text>
          <View style={s.blocksRow}>
            {BLOCKS.map((block) => {
              const blockAnswers = answers.filter((a) => {
                const q = QUESTIONS.find((q) => q.id === a.question_id);
                return q?.block === block.id;
              });
              const earned = blockAnswers.reduce((sum, a) => sum + (a.awarded_weight ?? 0), 0);
              const pct = block.max > 0 ? Math.round((earned / block.max) * 100) : 0;
              const bColor = scoreColor(pct);

              return (
                <View key={block.id} style={s.blockCard}>
                  <Text style={s.blockName}>{block.name}</Text>
                  <Text style={[s.blockScore, { color: bColor }]}>
                    {earned.toFixed(1)}
                    <Text style={s.blockMax}> / {block.max}%</Text>
                  </Text>
                  <View style={s.blockBarRow}>
                    <ProgressBar pct={pct} color={bColor} />
                    <Text style={{ fontSize: 7, color: bColor, fontFamily: "Helvetica-Bold" }}>
                      {pct}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── Question detail ── */}
          <Text style={s.sectionTitle}>Detalle por Criterio</Text>
          {QUESTIONS.map((q) => {
            const ans = answerMap.get(q.id);
            const compliant = ans?.is_compliant ?? false;
            const cardBg = compliant ? C.greenBg : C.redBg;
            const badgeColor = compliant ? C.green : C.red;

            return (
              <View key={q.id} style={s.qCard}>
                <View style={[s.qHeader, { backgroundColor: cardBg }]}>
                  <View style={[s.qBadge, { backgroundColor: badgeColor }]}>
                    <Text style={s.qBadgeText}>{compliant ? "✓" : "✗"}</Text>
                  </View>
                  <Text style={s.qId}>P{q.id}</Text>
                  <Text style={s.qLabel}>{q.label}</Text>
                  <Text style={s.qWeightText}>
                    {q.qualitative ? "Cualitativo" : `Peso: ${q.weight}%`}
                  </Text>
                </View>

                {ans && (
                  <View style={s.qBody}>
                    <Text style={s.qBodyLabel}>Diagnóstico del auditor</Text>
                    <Text style={s.qBodyText}>{ans.ai_justification || "—"}</Text>
                    {!compliant && (
                      <>
                        <View style={s.qDivider} />
                        <Text style={[s.qBodyLabel, { color: C.red }]}>Acción de mejora recomendada</Text>
                        <Text style={s.qBodyText}>
                          {/* The action is embedded in the kanban task title/mitigation — show from justification context */}
                          Revisar e implementar controles correspondientes al criterio P{q.id}.
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })}

        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Generado por <Text style={s.footerBrand}>CAVALTEC</Text> · Diagnóstico Ley 1581 de 2012 · SIC Colombia
          </Text>
          <Text style={s.pageNum} render={({ pageNumber, totalPages }) =>
            `Página ${pageNumber} de ${totalPages}`
          } />
        </View>

      </Page>
    </Document>
  );
}
