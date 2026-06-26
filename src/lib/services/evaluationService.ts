import { createAdminClient } from "@/lib/supabase/admin";
import { calculateComplianceScore } from "@/lib/scoringEngine";

interface KanbanTask {
  id: string;
  title: string;
  mitigation_steps: string;
  status: "todo" | "in_progress" | "done";
  question_id: number;
}

export async function processAiEvaluation(
  evaluationId: string,
  companyId: string,
  preguntaId: number,
  cumple: boolean,
  justificacion: string,
  accionMejora: string
): Promise<{ newScore: number; awardedWeight: number; newTask: KanbanTask | null }> {
  const supabase = createAdminClient();

  // Obtener respuestas actuales para recalcular puntaje
  const { data: currentAnswers } = await supabase
    .from("evaluation_answers")
    .select("question_id, is_compliant")
    .eq("evaluation_id", evaluationId);

  const answersMap: Record<number, boolean> = {};
  currentAnswers?.forEach((ans) => {
    answersMap[ans.question_id] = ans.is_compliant;
  });
  answersMap[preguntaId] = cumple;

  const newScore = calculateComplianceScore(answersMap);

  // Calcular peso otorgado a esta pregunta específica
  let awardedWeight = 0;
  if (preguntaId >= 2 && preguntaId <= 5 && cumple && answersMap[1]) awardedWeight = 10;
  else if (preguntaId >= 6 && preguntaId <= 8 && cumple) awardedWeight = 12;
  else if (preguntaId === 9 && cumple) awardedWeight = 16;
  else if (preguntaId === 10 && cumple) awardedWeight = 8;

  // Registrar respuesta (upsert para evitar duplicados si la IA reenvía)
  await supabase.from("evaluation_answers").upsert(
    {
      evaluation_id: evaluationId,
      question_id: preguntaId,
      is_compliant: cumple,
      ai_justification: justificacion,
      awarded_weight: awardedWeight,
    },
    { onConflict: "evaluation_id,question_id" }
  );

  // Actualizar puntaje global en la evaluación
  await supabase
    .from("evaluations")
    .update({ total_compliance_score: newScore })
    .eq("id", evaluationId);

  // Si hay incumplimiento, crear tarea de mitigación en Kanban
  if (!cumple) {
    const { data: newTask } = await supabase
      .from("kanban_tasks")
      .insert({
        company_id: companyId,
        evaluation_id: evaluationId,
        question_id: preguntaId,
        title: `Brecha detectada: Criterio ${preguntaId}`,
        mitigation_steps: accionMejora,
        status: "todo",
      })
      .select("id, title, mitigation_steps, status, question_id")
      .single();

    return { newScore, awardedWeight, newTask: newTask ?? null };
  }

  return { newScore, awardedWeight, newTask: null };
}
