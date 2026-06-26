import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  name: z.string().min(2).max(200),
  nit: z.string().min(4).max(50),
  sector: z.string().min(2).max(100),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { name, nit, sector } = parsed.data;
  const supabase = createAdminClient();
  const evaluatorId = session.user.email;

  // Verificar que el usuario no tenga ya una empresa registrada
  const { data: existing } = await supabase
    .from("evaluations")
    .select("company_id")
    .eq("evaluator_id", evaluatorId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Ya tienes una empresa registrada" },
      { status: 409 }
    );
  }

  // Crear empresa con datos completos
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({ name, nit, industry_sector: sector })
    .select("id")
    .single();

  if (companyError || !company) {
    console.error("[company/setup] Error creando empresa:", companyError);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  // Crear primera evaluación
  const { data: evaluation, error: evalError } = await supabase
    .from("evaluations")
    .insert({
      company_id: company.id,
      evaluator_id: evaluatorId,
      total_compliance_score: 0,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (evalError || !evaluation) {
    console.error("[company/setup] Error creando evaluación:", evalError);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  return NextResponse.json({
    status: "ready",
    evaluationId: evaluation.id,
    companyId: company.id,
    companyName: name,
  });
}
