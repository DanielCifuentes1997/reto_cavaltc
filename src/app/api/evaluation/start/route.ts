import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function getCompanyName(supabase: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>, companyId: string): Promise<string | null> {
  const { data } = await supabase
    .from("companies")
    .select("name")
    .eq("id", companyId)
    .single();
  return data?.name ?? null;
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const evaluatorId = session.user.email;

  // 1. Buscar evaluación activa (in_progress) para este usuario
  const { data: activeEval } = await supabase
    .from("evaluations")
    .select("id, company_id")
    .eq("evaluator_id", evaluatorId)
    .eq("status", "in_progress")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeEval) {
    const companyName = await getCompanyName(supabase, activeEval.company_id);
    return NextResponse.json({
      status: "ready",
      evaluationId: activeEval.id,
      companyId: activeEval.company_id,
      companyName,
    });
  }

  // 2. Buscar cualquier evaluación previa para obtener la empresa
  const { data: anyEval } = await supabase
    .from("evaluations")
    .select("id, company_id")
    .eq("evaluator_id", evaluatorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (anyEval) {
    // Usuario con empresa existente: crear nueva evaluación
    const { data: newEval, error: evalError } = await supabase
      .from("evaluations")
      .insert({
        company_id: anyEval.company_id,
        evaluator_id: evaluatorId,
        total_compliance_score: 0,
        status: "in_progress",
      })
      .select("id")
      .single();

    if (evalError || !newEval) {
      console.error("[evaluation/start] Error creando evaluación:", evalError?.message);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }

    const companyName = await getCompanyName(supabase, anyEval.company_id);
    return NextResponse.json({
      status: "ready",
      evaluationId: newEval.id,
      companyId: anyEval.company_id,
      companyName,
    });
  }

  // 3. Usuario nuevo — necesita registrar su empresa
  return NextResponse.json({ status: "needs_onboarding" });
}
