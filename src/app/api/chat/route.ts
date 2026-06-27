import { getServerSession } from "next-auth";
import { streamText, tool, convertToModelMessages, isStepCount } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { systemPrompt } from "@/lib/ai/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { processAiEvaluation } from "@/lib/services/evaluationService";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json();
  const messages = body.messages ?? [];
  const evaluationId: string | undefined = body.evaluationId;

  if (!evaluationId) {
    return NextResponse.json({ error: "evaluationId requerido" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("id, company_id")
    .eq("id", evaluationId)
    .eq("evaluator_id", session.user.email)
    .single();

  if (!evaluation) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const companyId = evaluation.company_id;

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    stopWhen: [isStepCount(15)],
    tools: {
      registrar_evaluacion_ley_1581: tool({
        description:
          "Registra el resultado de la evaluación de un criterio de la Ley 1581 y actualiza el estado de cumplimiento.",
        inputSchema: z.object({
          pregunta_id: z.number().int().min(1).max(11),
          cumple: z.boolean(),
          justificacion: z.string(),
          accion_mejora: z.string(),
        }),
        execute: async (args: {
          pregunta_id: number;
          cumple: boolean;
          justificacion: string;
          accion_mejora: string;
        }) => {
          const { pregunta_id, cumple, justificacion, accion_mejora } = args;
          console.log(`[tool] P${pregunta_id} cumple=${cumple} eval=${evaluationId}`);
          const { newScore, awardedWeight, newTask } = await processAiEvaluation(
            evaluationId,
            companyId,
            pregunta_id,
            cumple,
            justificacion,
            accion_mejora
          );
          console.log(`[tool] P${pregunta_id} → newScore=${newScore}`);
          return {
            success: true,
            pregunta_id,
            estado_actualizado: cumple,
            nuevo_puntaje_global: newScore,
            peso_otorgado: awardedWeight,
            nueva_tarea: newTask ?? null,
          };
        },
      }),
    },
    onFinish: ({ steps }) => {
      const toolCalls = steps.reduce((n, s) => n + (s.toolCalls?.length ?? 0), 0);
      if (toolCalls === 0) {
        console.warn(`[chat] Gemini NO llamó el tool en esta respuesta (eval=${evaluationId})`);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
