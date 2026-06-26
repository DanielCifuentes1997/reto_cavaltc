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

  // Verify ownership before returning tasks
  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("id")
    .eq("id", evaluationId)
    .eq("evaluator_id", session.user.email)
    .single();

  if (!evaluation) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const { data: tasks } = await supabase
    .from("kanban_tasks")
    .select("id, title, mitigation_steps, status, question_id")
    .eq("evaluation_id", evaluationId)
    .order("created_at", { ascending: true });

  return NextResponse.json({ tasks: tasks ?? [] });
}
