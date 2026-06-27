// Q1–Q10: 10 % each → max 100 %. Q11 is qualitative, no weight.
const WEIGHTS: Record<number, number> = {
  1: 10, 2: 10, 3: 10, 4: 10, 5: 10,
  6: 10, 7: 10, 8: 10, 9: 10, 10: 10,
};

export function calculateComplianceScore(answers: Record<number, boolean>): number {
  return Object.entries(WEIGHTS).reduce(
    (total, [id, w]) => total + (answers[Number(id)] ? w : 0),
    0
  );
}

export function getQuestionWeight(questionId: number): number {
  return WEIGHTS[questionId] ?? 0;
}
