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

  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("id, total_compliance_score, status, created_at, companies(name, industry_sector)")
    .eq("evaluator_id", session.user.email)
    .order("created_at", { ascending: false });

  const mapped = (evaluations ?? []).map((e) => ({
    id: e.id,
    score: e.total_compliance_score,
    status: e.status,
    createdAt: e.created_at,
    companyName:
      (e.companies as unknown as { name: string; industry_sector: string } | null)?.name ?? "—",
    sector:
      (e.companies as unknown as { name: string; industry_sector: string } | null)
        ?.industry_sector ?? "—",
  }));

  return NextResponse.json({ evaluations: mapped });
}
