import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";


const bodySchema = z.object({
  type: z.enum(["peticion", "queja", "reclamo", "sugerencia"]),
  subject: z.string().min(5).max(200),
  message: z.string().min(10).max(2000),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 422 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("pqrs")
    .insert({
      user_email: session.user.email,
      user_name: session.user.name ?? null,
      type: parsed.data.type,
      subject: parsed.data.subject,
      message: parsed.data.message,
      status: "pendiente",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[pqrs] Error:", error.message);
    return NextResponse.json({ error: "Error al guardar la solicitud" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", id: data.id });
}
