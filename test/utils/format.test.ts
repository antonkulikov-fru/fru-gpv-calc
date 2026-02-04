import { fromPercent, toPercent } from '../../src/utils/format';

describe('format percent helpers', () => {
    it('preserves small percent inputs for rate conversion', () => {
        expect(fromPercent(2)).toBeCloseTo(0.02, 5);
        expect(fromPercent(5)).toBeCloseTo(0.05, 5);
    });

    it('rounds percent display to one decimal', () => {
        expect(toPercent(0.025)).toBe(2.5);
        expect(toPercent(0.0549)).toBe(5.5);
    });
});
