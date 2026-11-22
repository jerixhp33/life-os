import {
  calculatePolygonPoints,
  computeEquilibriumIndex,
  AXES_COUNT,
} from '../../src/lib/analytics/radarCalculations';

describe('Life Balance Radar Calculations', () => {
  it('has 5 life axes', () => {
    expect(AXES_COUNT).toBe(5);
  });

  it('calculates polygon points correctly for 5 dimensions at max score', () => {
    const scores = [100, 100, 100, 100, 100];
    const pointsStr = calculatePolygonPoints(scores, 100, 150);

    const points = pointsStr.split(' ').map((p) => p.split(',').map(Number));
    expect(points).toHaveLength(5);

    // Top point (angle = -pi/2) -> x = 150, y = 150 - 100 = 50
    expect(points[0][0]).toBeCloseTo(150, 0);
    expect(points[0][1]).toBeCloseTo(50, 0);
  });

  it('handles variable scores correctly', () => {
    const scores = [50, 80, 20, 90, 60];
    const pointsStr = calculatePolygonPoints(scores, 100, 150);
    const points = pointsStr.split(' ');
    expect(points).toHaveLength(5);
  });

  it('computes equilibrium average index accurately', () => {
    expect(computeEquilibriumIndex([100, 80, 60, 40, 20])).toBe(60);
    expect(computeEquilibriumIndex([])).toBe(0);
  });
});
