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

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 422 });
  }

  const { name, nit, sector, size } = parsed.data;
  const supabase = createAdminClient();

  // Find the user's company via their latest evaluation
  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("company_id")
    .eq("evaluator_id", session.user.email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!evaluation?.company_id) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  const { error } = await supabase
    .from("companies")
    .update({ name, nit, industry_sector: sector, company_size: size ?? null })
    .eq("id", evaluation.company_id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", name, nit, sector, size });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("company_id, companies ( name, nit, industry_sector, company_size )")
    .eq("evaluator_id", session.user.email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!evaluation) {
    return NextResponse.json({ company: null });
  }

  const company = evaluation.companies as {
    name: string;
    nit: string | null;
    industry_sector: string;
    company_size: string | null;
  } | null;

  return NextResponse.json({ company });
}
