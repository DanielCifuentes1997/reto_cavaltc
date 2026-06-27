import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("evaluations")
    .select(`
      id,
      total_compliance_score,
      status,
      created_at,
      companies ( name, industry_sector )
    `)
    .eq("evaluator_id", session.user.email)
    .order("created_at", { ascending: false });

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
      companyName: company?.name ?? "—",
      sector: company?.industry_sector ?? "—",
    };
  });

  return NextResponse.json({ evaluations });
}
