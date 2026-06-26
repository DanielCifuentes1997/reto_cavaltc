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

  // Fetch evaluations without relying on FK join (more resilient)
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("id, total_compliance_score, status, created_at, company_id")
    .eq("evaluator_id", session.user.email)
    .order("created_at", { ascending: false });

  if (!evaluations?.length) {
    return NextResponse.json({ evaluations: [] });
  }

  // Fetch company names in a single query
  const companyIds = [...new Set(evaluations.map((e) => e.company_id))];
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, industry_sector")
    .in("id", companyIds);

  const companyMap = new Map(
    (companies ?? []).map((c) => [c.id, c])
  );

  const mapped = evaluations.map((e) => {
    const co = companyMap.get(e.company_id);
    return {
      id: e.id,
      score: e.total_compliance_score,
      status: e.status,
      createdAt: e.created_at,
      companyName: co?.name ?? "—",
      sector: co?.industry_sector ?? "—",
    };
  });

  return NextResponse.json({ evaluations: mapped });
}
