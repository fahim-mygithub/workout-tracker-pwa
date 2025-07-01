import { describe, it, expect } from 'vitest';
import { WorkoutParser } from '../parser';

describe('Complex Notation Parser', () => {
  const parser = new WorkoutParser();

  it('should parse exercises with parenthetical set variations', () => {
    const input = '5x Incline DB Press (2x failure @85lbs) (3x8-10 @75lbs)';
    const result = parser.parse(input);
    
    expect(result.success).toBe(true);
    expect(result.workout?.groups).toHaveLength(1);
    
    const exercise = result.workout?.groups[0].exercises[0];
    expect(exercise?.name).toBe('Incline DB Press');
    expect(exercise?.sets).toHaveLength(5);
    
    // First 2 sets should be to failure at 85lbs
    expect(exercise?.sets[0].reps).toBe('AMRAP');
    expect(exercise?.sets[0].weight?.value).toBe(85);
    expect(exercise?.sets[1].reps).toBe('AMRAP');
    expect(exercise?.sets[1].weight?.value).toBe(85);
    
    // Next 3 sets should be 8-10 reps at 75lbs
    expect(exercise?.sets[2].reps).toEqual({ min: 8, max: 10 });
    expect(exercise?.sets[2].weight?.value).toBe(75);
    expect(exercise?.sets[3].reps).toEqual({ min: 8, max: 10 });
    expect(exercise?.sets[4].reps).toEqual({ min: 8, max: 10 });
  });

  it('should parse supersets with complex notation', () => {
    const input = `4x Axel bar standing OHP 8 (25-35lbs on each side) SS DB constant tension lateral raises 12-15 (15-20lb DBs)`;
    const result = parser.parse(input);
    
    expect(result.success).toBe(true);
    expect(result.workout?.groups).toHaveLength(1);
    expect(result.workout?.groups[0].type).toBe('superset');
    expect(result.workout?.groups[0].exercises).toHaveLength(2);
    
    const ohp = result.workout?.groups[0].exercises[0];
    expect(ohp?.name).toContain('OHP');
    expect(ohp?.sets).toHaveLength(4);
    expect(ohp?.sets[0].reps).toBe(8);
    expect(ohp?.sets[0].weight?.value).toBe(25);
    expect(ohp?.sets[0].weight?.max).toBe(35);
    expect(ohp?.sets[0].weight?.perSide).toBe(true);
    
    const lateralRaises = result.workout?.groups[0].exercises[1];
    expect(lateralRaises?.name).toContain('lateral raises');
    expect(lateralRaises?.sets[0].reps).toEqual({ min: 12, max: 15 });
    expect(lateralRaises?.sets[0].weight?.value).toBe(15);
    expect(lateralRaises?.sets[0].weight?.max).toBe(20);
  });

  it('should parse exercises with @ symbol for weight', () => {
    const input = '3x8-10 @ 75lbs Romanian Deadlifts';
    const result = parser.parse(input);
    
    expect(result.success).toBe(true);
    const exercise = result.workout?.groups[0].exercises[0];
    expect(exercise?.sets[0].reps).toEqual({ min: 8, max: 10 });
    expect(exercise?.sets[0].weight?.value).toBe(75);
  });

  it('should handle special instructions', () => {
    const input = '4x Cable flys feet together 12 SS Trx face pull 15';
    const result = parser.parse(input);
    
    expect(result.success).toBe(true);
    expect(result.workout?.groups[0].type).toBe('superset');
    
    const cableFlys = result.workout?.groups[0].exercises[0];
    expect(cableFlys?.name).toContain('Cable flys');
    expect(cableFlys?.notes).toContain('feet together');
  });

  it('should parse weight ranges correctly', () => {
    const input = '4x10 Dumbbell Press 40-50lbs';
    const result = parser.parse(input);
    
    expect(result.success).toBe(true);
    const exercise = result.workout?.groups[0].exercises[0];
    expect(exercise?.sets[0].weight?.value).toBe(40);
    expect(exercise?.sets[0].weight?.max).toBe(50);
  });

  it('should handle failure notation', () => {
    const input = '3x failure Pull-ups';
    const result = parser.parse(input);
    
    expect(result.success).toBe(true);
    const exercise = result.workout?.groups[0].exercises[0];
    expect(exercise?.sets[0].reps).toBe('AMRAP');
  });

  it('should parse complex multi-line workouts', () => {
    const input = `5x Incline db (2x failure at 85lbs) (3x8-10 @ 75lbs) SS Prone banded pull aparts 12-15

4x Axel bar standing OHP 8 (25-35lbs on each side) SS DB constant tension lateral raises 12 - 15 (15-20lb DBs)

4x Banded Dips 8-10 SS glute raises 12`;
    
    const result = parser.parse(input);
    
    expect(result.success).toBe(true);
    expect(result.workout?.groups).toHaveLength(3);
    
    // All groups should be supersets
    expect(result.workout?.groups[0].type).toBe('superset');
    expect(result.workout?.groups[1].type).toBe('superset');
    expect(result.workout?.groups[2].type).toBe('superset');
    
    // Each superset should have 2 exercises
    expect(result.workout?.groups[0].exercises).toHaveLength(2);
    expect(result.workout?.groups[1].exercises).toHaveLength(2);
    expect(result.workout?.groups[2].exercises).toHaveLength(2);
  });
});