import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const role = session.user.role;
  const isPrivileged = role === "administrador" || role === "auditor";

  const supabase = createAdminClient();

  let query = supabase
    .from("evaluations")
    .select(`
      id,
      total_compliance_score,
      status,
      created_at,
      evaluator_id,
      companies ( name, nit, industry_sector, company_size )
    `)
    .order("created_at", { ascending: false });

  // Evaluadores only see their own; admin/auditor see all
  if (!isPrivileged) {
    query = query.eq("evaluator_id", session.user.email);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const evaluations = (data ?? []).map((ev) => {
    const company = Array.isArray(ev.companies) ? ev.companies[0] : ev.companies;
    return {
      id: ev.id,
      score: ev.total_compliance_score ?? 0,
      status: ev.status ?? "in_progress",
      createdAt: ev.created_at,
      evaluatorId: ev.evaluator_id,
      companyName: company?.name ?? "—",
      companyNit: company?.nit ?? null,
      sector: company?.industry_sector ?? "—",
      companySize: company?.company_size ?? null,
    };
  });

  return NextResponse.json({ evaluations });
}
