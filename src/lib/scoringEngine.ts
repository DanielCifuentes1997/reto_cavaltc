export function calculateComplianceScore(answers: Record<number, boolean>): number {
  let score = 0;

  if (answers[1] === true) {
    if (answers[2]) score += 10;
    if (answers[3]) score += 10;
    if (answers[4]) score += 10;
    if (answers[5]) score += 10;
  }

  if (answers[6]) score += 12;
  if (answers[7]) score += 12;
  if (answers[8]) score += 12;

  if (answers[9]) score += 16;
  if (answers[10]) score += 8;

  return score;
}