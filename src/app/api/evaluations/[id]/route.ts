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
  const supabase = createAdminClient();

  // Verify ownership before deleting
  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("id")
    .eq("id", id)
    .eq("evaluator_id", session.user.email)
    .maybeSingle();

  if (!evaluation) {
    return NextResponse.json({ error: "No encontrado o acceso denegado" }, { status: 404 });
  }

  // Delete in dependency order
  await supabase.from("kanban_tasks").delete().eq("evaluation_id", id);
  await supabase.from("evaluation_answers").delete().eq("evaluation_id", id);
  await supabase.from("evaluations").delete().eq("id", id);

  return NextResponse.json({ status: "ok" });
}
