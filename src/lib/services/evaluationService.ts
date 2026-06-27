import { createAdminClient } from "@/lib/supabase/admin";
import { calculateComplianceScore, getQuestionWeight } from "@/lib/scoringEngine";

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

  // 1. Read all existing answers to calculate cumulative score
  const { data: currentAnswers } = await supabase
    .from("evaluation_answers")
    .select("question_id, is_compliant")
    .eq("evaluation_id", evaluationId);

  const answersMap: Record<number, boolean> = {};
  currentAnswers?.forEach((ans) => {
    answersMap[ans.question_id] = Boolean(ans.is_compliant);
  });
  // Apply current answer (overrides any previous value for this question)
  answersMap[preguntaId] = cumple;

  const newScore = calculateComplianceScore(answersMap);
  const awardedWeight = cumple ? getQuestionWeight(preguntaId) : 0;

  // 2. Save answer: delete stale row first, then insert fresh one.
  //    Avoids relying on a unique constraint for upsert ON CONFLICT.
  await supabase
    .from("evaluation_answers")
    .delete()
    .eq("evaluation_id", evaluationId)
    .eq("question_id", preguntaId);

  await supabase.from("evaluation_answers").insert({
    evaluation_id: evaluationId,
    question_id: preguntaId,
    is_compliant: cumple,
    ai_justification: justificacion,
    awarded_weight: awardedWeight,
  });

  // 3. Persist cumulative score
  await supabase
    .from("evaluations")
    .update({ total_compliance_score: newScore })
    .eq("id", evaluationId);

  // 4. Sync Kanban task (delete old, insert fresh)
  const taskStatus = cumple ? "done" : "todo";
  const taskTitle = cumple
    ? `Control Validado: Criterio ${preguntaId}`
    : `Brecha detectada: Criterio ${preguntaId}`;
  const taskMitigation = cumple
    ? `Cumplimiento verificado: ${justificacion}`
    : accionMejora;

  await supabase
    .from("kanban_tasks")
    .delete()
    .eq("evaluation_id", evaluationId)
    .eq("question_id", preguntaId);

  const { data: newTask } = await supabase
    .from("kanban_tasks")
    .insert({
      company_id: companyId,
      evaluation_id: evaluationId,
      question_id: preguntaId,
      title: taskTitle,
      mitigation_steps: taskMitigation,
      status: taskStatus,
    })
    .select("id, title, mitigation_steps, status, question_id")
    .single();

  return { newScore, awardedWeight, newTask: newTask ?? null };
}
