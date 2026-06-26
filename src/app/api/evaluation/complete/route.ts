import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const bodySchema = z.object({
  evaluationId: z.string().uuid(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 422 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("evaluations")
    .update({ status: "completed" })
    .eq("id", parsed.data.evaluationId)
    .eq("evaluator_id", session.user.email);

  if (error) {
    return NextResponse.json({ error: "Error al completar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
