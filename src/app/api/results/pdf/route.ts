import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { renderToStream, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ReportPDF } from "@/lib/pdf/ReportPDF";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const evaluationId = searchParams.get("evaluationId");
  if (!evaluationId) {
    return NextResponse.json({ error: "evaluationId requerido" }, { status: 400 });
  }

  const role = session.user.role;
  const isPrivileged = role === "administrador" || role === "auditor";

  const supabase = createAdminClient();

  // Admin and auditor can download any PDF; evaluador only their own
  let query = supabase
    .from("evaluations")
    .select("id, total_compliance_score, status, created_at, company_id")
    .eq("id", evaluationId);

  if (!isPrivileged) {
    query = query.eq("evaluator_id", session.user.email);
  }

  const { data: evaluation } = await query.single();

  if (!evaluation) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  // Fetch company
  const { data: company } = await supabase
    .from("companies")
    .select("name, nit, industry_sector")
    .eq("id", evaluation.company_id)
    .single();

  // Fetch answers
  const { data: answers } = await supabase
    .from("evaluation_answers")
    .select("question_id, is_compliant, ai_justification, awarded_weight")
    .eq("evaluation_id", evaluationId)
    .order("question_id", { ascending: true });

  const data = {
    evaluation,
    company: company ?? { name: "—", nit: null, industry_sector: "—" },
    answers: answers ?? [],
  };

  // Render PDF to Node.js stream
  // Cast needed: TypeScript can't infer that ReportPDF returns <Document> (DocumentProps)
  const pdfStream = await renderToStream(
    React.createElement(ReportPDF, { data }) as React.ReactElement<DocumentProps>
  );

  // Convert Node.js Readable to Web ReadableStream
  const webStream = new ReadableStream({
    start(controller) {
      (pdfStream as NodeJS.ReadableStream).on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      (pdfStream as NodeJS.ReadableStream).on("end", () => controller.close());
      (pdfStream as NodeJS.ReadableStream).on("error", (err: Error) =>
        controller.error(err)
      );
    },
  });

  const safeCompanyName = (company?.name ?? "empresa")
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()
    .slice(0, 40);

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="informe-1581-${safeCompanyName}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
