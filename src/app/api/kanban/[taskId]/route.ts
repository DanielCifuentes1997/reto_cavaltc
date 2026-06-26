import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  status: z.enum(["todo", "in_progress", "done"]),
  evaluationId: z.string().uuid(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { taskId } = await params;
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 422 });
  }

  const { status, evaluationId } = parsed.data;
  const supabase = createAdminClient();

  // Verify the task belongs to an evaluation owned by this user
  const { data: task } = await supabase
    .from("kanban_tasks")
    .select("id, evaluation_id, evaluations!inner(evaluator_id)")
    .eq("id", taskId)
    .eq("evaluation_id", evaluationId)
    .single();

  const evaluatorId = (task?.evaluations as unknown as { evaluator_id: string } | null)
    ?.evaluator_id;

  if (!task || evaluatorId !== session.user.email) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const { error } = await supabase
    .from("kanban_tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
