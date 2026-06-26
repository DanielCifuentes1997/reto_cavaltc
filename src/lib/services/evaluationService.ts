import { createClient } from '@/lib/supabase/server';
import { calculateComplianceScore } from '@/lib/scoringEngine';

export async function processAiEvaluation(
  evaluationId: string,
  companyId: string,
  preguntaId: number,
  cumple: boolean,
  justificacion: string,
  accionMejora: string
) {
  const supabase = await createClient();

  const { data: currentAnswers } = await supabase
    .from('evaluation_answers')
    .select('question_id, is_compliant')
    .eq('evaluation_id', evaluationId);

  const answersMap: Record<number, boolean> = {};
  if (currentAnswers) {
    currentAnswers.forEach(ans => {
      answersMap[ans.question_id] = ans.is_compliant;
    });
  }
  
  answersMap[preguntaId] = cumple;

  const newScore = calculateComplianceScore(answersMap);
  let awardedWeight = 0;
  
  if (preguntaId >= 2 && preguntaId <= 5 && cumple && answersMap[1]) awardedWeight = 10;
  else if (preguntaId >= 6 && preguntaId <= 8 && cumple) awardedWeight = 12;
  else if (preguntaId === 9 && cumple) awardedWeight = 16;
  else if (preguntaId === 10 && cumple) awardedWeight = 8;

  await supabase
    .from('evaluation_answers')
    .insert({
      evaluation_id: evaluationId,
      question_id: preguntaId,
      is_compliant: cumple,
      ai_justification: justificacion,
      awarded_weight: awardedWeight
    });

  await supabase
    .from('evaluations')
    .update({ total_compliance_score: newScore })
    .eq('id', evaluationId);

  if (!cumple) {
    await supabase
      .from('kanban_tasks')
      .insert({
        company_id: companyId,
        evaluation_id: evaluationId,
        question_id: preguntaId,
        title: `Mitigar riesgo normativo: Criterio ${preguntaId}`,
        mitigation_steps: accionMejora,
        status: 'todo'
      });
  }

  return { newScore, awardedWeight };
}