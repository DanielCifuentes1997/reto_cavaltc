import { streamText, tool } from 'ai';
import { google } from '@ai-sdk/google';
import { systemPrompt } from '@/lib/ai/config';
import { z } from 'zod';

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: google('gemini-1.5-flash'),
    system: systemPrompt,
    messages,
    tools: {
      registrar_evaluacion_ley_1581: tool({
        description: 'Registra el resultado de la evaluacion de un criterio de la Ley 1581 y actualiza el estado',
        parameters: z.object({
          pregunta_id: z.number().int().min(1).max(11),
          cumple: z.boolean(),
          justificacion: z.string(),
          accion_mejora: z.string(),
        }),
        // @ts-expect-error
        execute: async ({ pregunta_id, cumple }) => {
          return {
            success: true,
            pregunta_id,
            estado_actualizado: cumple
          };
        },
      }),
    },
  });

  return result.toTextStreamResponse();
}