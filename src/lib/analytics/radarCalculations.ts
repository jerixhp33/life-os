export const AXES_COUNT = 5;

export function calculatePolygonPoints(
  scores: number[],
  radius: number,
  center: number,
  axesCount = AXES_COUNT
): string {
  return scores
    .map((score, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / axesCount;
      const normalizedRadius = (score / 100) * radius;
      const x = center + normalizedRadius * Math.cos(angle);
      const y = center + normalizedRadius * Math.sin(angle);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export function computeEquilibriumIndex(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
