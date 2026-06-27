import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  name: z.string().min(2).max(200),
  nit: z.string().min(1).max(50),
  sector: z.string().min(2).max(100),
  size: z.string().min(2).max(100).optional(),
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

  const { name, nit, sector, size } = parsed.data;
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

  // Intentar insertar con NIT (requiere columna en Supabase)
  // Si falla, reintenta sin NIT (columna puede no existir aún)
  let companyId: string | null = null;

  const { data: withNit, error: nitError } = await supabase
    .from("companies")
    .insert({ name, nit, industry_sector: sector, company_size: size ?? null })
    .select("id")
    .single();

  if (nitError) {
    console.warn(
      "[company/setup] Insert con NIT falló (¿columna no existe?):",
      nitError.message
    );
    // Fallback: insertar sin NIT
    const { data: withoutNit, error: fallbackError } = await supabase
      .from("companies")
      .insert({ name, industry_sector: sector, company_size: size ?? null })
      .select("id")
      .single();

    if (fallbackError || !withoutNit) {
      console.error("[company/setup] Fallback también falló:", fallbackError?.message);
      return NextResponse.json(
        { error: `Error al crear empresa: ${fallbackError?.message ?? "desconocido"}` },
        { status: 500 }
      );
    }
    companyId = withoutNit.id;
  } else {
    companyId = withNit!.id;
  }

  // Crear primera evaluación
  const { data: evaluation, error: evalError } = await supabase
    .from("evaluations")
    .insert({
      company_id: companyId,
      evaluator_id: evaluatorId,
      total_compliance_score: 0,
      status: "in_progress",
    })
    .select("id")
    .single();

  if (evalError || !evaluation) {
    console.error("[company/setup] Error creando evaluación:", evalError?.message);
    return NextResponse.json({ error: "Error al crear evaluación" }, { status: 500 });
  }

  return NextResponse.json({
    status: "ready",
    evaluationId: evaluation.id,
    companyId,
    companyName: name,
  });
}
