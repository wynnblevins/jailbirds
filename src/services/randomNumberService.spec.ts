import { getRandNumInRange } from "./randomNumberService";

describe('getRandNumInRange', () => {
  it('generates a random number between 5 and 10', () => {
    const upper = 10;
    const lower = 5;

    const result = getRandNumInRange(lower, upper);
    console.log(result);
    
    expect(result).toBeGreaterThanOrEqual(lower);
    expect(result).toBeLessThanOrEqual(upper);
  });
});