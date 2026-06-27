// Weights per official hackathon rubric:
// Q1 = gateway (0% direct weight — if false, Q2-Q5 auto-fail)
// Q2-Q5 = 10% each   → Block 1 max = 40%
// Q6-Q8 = 12% each   → Block 2 max = 36%
// Q9    = 16%         → Block 3
// Q10   = 8%          → Block 3 max = 24%
// Q11   = 0%  (complementary, no score impact)
const WEIGHTS: Record<number, number> = {
  1: 0,
  2: 10,
  3: 10,
  4: 10,
  5: 10,
  6: 12,
  7: 12,
  8: 12,
  9: 16,
  10: 8,
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
