import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const isAdmin = session.user.role === "administrador";
  const supabase = createAdminClient();

  // Verify ownership — admin can delete any evaluation
  let check = supabase
    .from("evaluations")
    .select("id")
    .eq("id", id);

  if (!isAdmin) {
    check = check.eq("evaluator_id", session.user.email);
  }

  const { data: evaluation } = await check.maybeSingle();

  if (!evaluation) {
    return NextResponse.json({ error: "No encontrado o acceso denegado" }, { status: 404 });
  }

  // Get company_id before deleting
  const { data: evalData } = await supabase
    .from("evaluations")
    .select("company_id")
    .eq("id", id)
    .single();

  const companyId = evalData?.company_id;

  // Delete in dependency order
  await supabase.from("kanban_tasks").delete().eq("evaluation_id", id);
  await supabase.from("evaluation_answers").delete().eq("evaluation_id", id);
  await supabase.from("evaluations").delete().eq("id", id);

  // Clean up company if it has no other evaluations
  if (companyId) {
    const { count } = await supabase
      .from("evaluations")
      .select("id", { count: "exact", head: true })
      .eq("company_id", companyId);

    if (count === 0) {
      await supabase.from("companies").delete().eq("id", companyId);
    }
  }

  return NextResponse.json({ status: "ok" });
}
