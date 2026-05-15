export function bhutanPercentageToGpa(percentage: number) {
  return Math.max(0, Math.min(4, (percentage / 100) * 4));
}

export function indiaGradeToGpa(gradePoint10: number) {
  return Math.max(0, Math.min(4, (gradePoint10 / 10) * 4));
}

export function usGradeToGpa(letter: string) {
  const map: Record<string, number> = { A: 4, "A-": 3.7, "B+": 3.3, B: 3, "B-": 2.7, "C+": 2.3, C: 2, D: 1, F: 0 };
  return map[letter.toUpperCase()] ?? 0;
}

export function australiaGradeToGpa(grade: string) {
  const map: Record<string, number> = { HD: 4, D: 3.5, C: 2.8, P: 2, N: 0 };
  return map[grade.toUpperCase()] ?? 0;
}
