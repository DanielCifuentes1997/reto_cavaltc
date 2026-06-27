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

  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("total_compliance_score")
    .eq("id", evaluationId)
    .eq("evaluator_id", session.user.email)
    .single();

  const { data: tasks } = await supabase
    .from("kanban_tasks")
    .select("id, title, mitigation_steps, status, question_id")
    .eq("evaluation_id", evaluationId);

  return NextResponse.json({
    score: evaluation?.total_compliance_score ?? 0,
    tasks: tasks ?? [],
  });
}
