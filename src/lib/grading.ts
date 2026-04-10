/**
 * Compute Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Normalize a string for comparison: lowercase, strip punctuation, collapse whitespace.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ");
}

/**
 * Grade an answer against the correct answer.
 *
 * For MC (forceType === 'mc'): exact match only.
 * For free-text: exact match or within Levenshtein threshold of 15%.
 *
 * Returns true for matches. The host makes the final call on free-text.
 */
export function gradeAnswer(
  submitted: string,
  correct: string,
  forceType?: "mc"
): boolean {
  if (forceType === "mc") {
    return submitted.trim().toUpperCase() === correct.trim().toUpperCase();
  }

  const a = normalize(submitted);
  const b = normalize(correct);

  if (a === b) return true;

  const threshold = Math.max(1, Math.floor(b.length * 0.15));
  return levenshteinDistance(a, b) <= threshold;
}
