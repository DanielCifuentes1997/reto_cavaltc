import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const supabase = createAdminClient();

  // Verify ownership and fetch evaluation
  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("id, total_compliance_score, status, created_at, company_id")
    .eq("id", evaluationId)
    .eq("evaluator_id", session.user.email)
    .single();

  if (!evaluation) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  // Fetch all answers for this evaluation
  const { data: answers } = await supabase
    .from("evaluation_answers")
    .select("question_id, is_compliant, ai_justification, awarded_weight")
    .eq("evaluation_id", evaluationId)
    .order("question_id", { ascending: true });

  // Fetch company info
  const { data: company } = await supabase
    .from("companies")
    .select("name, nit, industry_sector")
    .eq("id", evaluation.company_id)
    .single();

  return NextResponse.json({
    evaluation: {
      id: evaluation.id,
      score: evaluation.total_compliance_score,
      status: evaluation.status,
      createdAt: evaluation.created_at,
    },
    company: company ?? null,
    answers: answers ?? [],
  });
}
