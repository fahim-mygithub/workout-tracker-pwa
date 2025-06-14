import { describe, it, expect } from 'vitest';
import { WorkoutParser } from '../parser';
import { ExerciseGroup, RepsValue } from '../types';

describe('WorkoutParser', () => {
  const parser = new WorkoutParser();

  describe('Standard notation (sets x reps exercise)', () => {
    it('should parse simple sets x reps', () => {
      const result = parser.parse('5x10 Squat');
      
      expect(result.success).toBe(true);
      expect(result.workout?.groups).toHaveLength(1);
      
      const group = result.workout?.groups[0];
      expect(group?.type).toBe('single');
      expect(group?.exercises).toHaveLength(1);
      
      const exercise = group?.exercises[0];
      expect(exercise?.name).toBe('squat'); // Normalized
      expect(exercise?.sets).toHaveLength(5);
      expect(exercise?.sets[0].reps).toBe(10);
    });

    it('should parse rep ranges', () => {
      const result = parser.parse('3x8-12 Bench Press');
      
      const exercise = result.workout?.groups[0].exercises[0];
      expect(exercise?.sets[0].reps).toEqual({ min: 8, max: 12 });
    });

    it('should parse with weight modifier', () => {
      const result = parser.parse('5x5 Squat @225lbs');
      
      const exercise = result.workout?.groups[0].exercises[0];
      expect(exercise?.sets[0].weight).toEqual({
        value: 225,
        unit: 'lbs'
      });
    });

    it('should parse with RPE', () => {
      const result = parser.parse('3x10 Bench @RPE8');
      
      const exercise = result.workout?.groups[0].exercises[0];
      expect(exercise?.sets[0].rpe).toBe(8);
    });

    it('should parse with rest periods', () => {
      const result = parser.parse('4x8 Squat R90');
      
      const exercise = result.workout?.groups[0].exercises[0];
      expect(exercise?.sets[0].rest).toBe(90);
    });

    it('should parse AMRAP sets', () => {
      const result = parser.parse('3xAMRAP Push ups');
      
      const exercise = result.workout?.groups[0].exercises[0];
      expect(exercise?.sets[0].reps).toBe('AMRAP');
    });
  });

  describe('Weight-first notation', () => {
    it('should parse weight before sets x reps', () => {
      const result = parser.parse('225 3x5 Squat');
      
      const exercise = result.workout?.groups[0].exercises[0];
      expect(exercise?.sets).toHaveLength(3);
      expect(exercise?.sets[0].reps).toBe(5);
      expect(exercise?.sets[0].weight?.value).toBe(225);
    });

    it('should parse with weight unit', () => {
      const result = parser.parse('100kg 5x3 Deadlift');
      
      const exercise = result.workout?.groups[0].exercises[0];
      expect(exercise?.sets[0].weight).toEqual({
        value: 100,
        unit: 'kg'
      });
    });
  });

  describe('At notation', () => {
    it('should parse sets x reps @ weight', () => {
      const result = parser.parse('5x5@225 Bench');
      
      const exercise = result.workout?.groups[0].exercises[0];
      expect(exercise?.sets[0].reps).toBe(5);
      expect(exercise?.sets[0].weight?.value).toBe(225);
    });

    it('should parse percentage-based training', () => {
      const result = parser.parse('3x5@80% Squat');
      
      const exercise = result.workout?.groups[0].exercises[0];
      expect(exercise?.sets[0].weight).toEqual({
        value: 80,
        percentage: true
      });
    });
  });

  describe('Comma notation (varying reps)', () => {
    it('should parse different reps per set', () => {
      const result = parser.parse('225x5,5,3 Bench');
      
      const exercise = result.workout?.groups[0].exercises[0];
      expect(exercise?.sets).toHaveLength(3);
      expect(exercise?.sets[0].reps).toBe(5);
      expect(exercise?.sets[1].reps).toBe(5);
      expect(exercise?.sets[2].reps).toBe(3);
      expect(exercise?.sets[2].failed).toBe(true); // Fewer reps suggests failure
    });
  });

  describe('Slash notation (drop sets)', () => {
    it('should parse drop sets', () => {
      const result = parser.parse('12/10/8 Curls');
      
      const exercise = result.workout?.groups[0].exercises[0];
      expect(exercise?.sets).toHaveLength(3);
      expect(exercise?.sets[0].reps).toBe(12);
      expect(exercise?.sets[1].reps).toBe(10);
      expect(exercise?.sets[2].reps).toBe(8);
      expect(exercise?.modifiers?.dropset).toBe(true);
    });
  });

  describe('Supersets', () => {
    it('should parse superset notation', () => {
      const result = parser.parse('4x10 Bench ss 4x12 Flyes');
      
      expect(result.workout?.groups).toHaveLength(1);
      const group = result.workout?.groups[0];
      expect(group?.type).toBe('superset');
      expect(group?.exercises).toHaveLength(2);
      expect(group?.exercises[0].name).toBe('bench press');
      expect(group?.exercises[1].name).toBe('dumbbell flyes');
    });

    it('should handle multiple exercises in superset', () => {
      const result = parser.parse('3x10 Squat ss 3x15 Leg Curls ss 3x20 Calf Raises');
      
      const group = result.workout?.groups[0];
      expect(group?.exercises).toHaveLength(3);
    });
  });

  describe('Circuits', () => {
    it('should parse circuit notation', () => {
      const result = parser.parse('3x10 Squats + 3x15 Push ups + 3x20 Sit ups');
      
      const group = result.workout?.groups[0];
      expect(group?.type).toBe('circuit');
      expect(group?.exercises).toHaveLength(3);
    });
  });

  describe('Exercise name matching', () => {
    it('should normalize exercise names', () => {
      const tests = [
        { input: '5x5 BP', expected: 'bench press' },
        { input: '3x10 DB Bench', expected: 'dumbbell bench press' },
        { input: '4x8 RDL', expected: 'romanian deadlift' },
        { input: '5x5 OHP', expected: 'overhead press' },
      ];

      tests.forEach(({ input, expected }) => {
        const result = parser.parse(input);
        expect(result.workout?.groups[0].exercises[0].name).toBe(expected);
      });
    });

    it('should provide suggestions for misspellings', () => {
      const result = parser.parse('5x10 Bnech Press');
      
      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]).toMatchObject({
        original: 'Bnech Press',
        suggestion: 'bench press',
        confidence: expect.any(Number)
      });
    });
  });

  describe('Complex notations', () => {
    it('should parse tempo notation', () => {
      const result = parser.parse('3x10 Squat tempo 2-1-2');
      
      const exercise = result.workout?.groups[0].exercises[0];
      expect(exercise?.sets[0].tempo).toEqual({
        eccentric: 2,
        pause: 1,
        concentric: 2
      });
    });

    it('should parse bodyweight exercises', () => {
      const result = parser.parse('5x10 Pull ups BW');
      
      const exercise = result.workout?.groups[0].exercises[0];
      expect(exercise?.sets[0].weight?.isBodyweight).toBe(true);
    });

    it('should parse multiple modifiers', () => {
      const result = parser.parse('3x8-12 Bench @225lbs @RPE8 R90s');
      
      const set = result.workout?.groups[0].exercises[0].sets[0];
      expect(set?.reps).toEqual({ min: 8, max: 12 });
      expect(set?.weight?.value).toBe(225);
      expect(set?.rpe).toBe(8);
      expect(set?.rest).toBe(90);
    });
  });

  describe('Real-world examples from Reddit', () => {
    it('should parse "Squat 255, Bench 235X5, 5, 3"', () => {
      const result = parser.parse('Squat 255, Bench 235X5, 5, 3');
      
      // This is actually two exercises
      expect(result.workout?.groups).toHaveLength(2);
      
      // First: Squat 255 (just weight, no sets/reps specified)
      // Second: Bench with varying reps
      const bench = result.workout?.groups[1].exercises[0];
      expect(bench?.name).toBe('bench press');
      expect(bench?.sets).toHaveLength(3);
    });

    it('should parse pyramid sets', () => {
      const result = parser.parse('Deadlift 185×5, 225×4, 275×3');
      
      // This format isn't fully supported yet, but shouldn't crash
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should parse mixed notation workout', () => {
      const input = `5x5 Squat @225
3x8-12 RDL 185lbs
4x10 Leg Press ss 4x15 Leg Curls
3xAMRAP Pull ups`;

      const result = parser.parse(input);
      
      expect(result.success).toBe(true);
      expect(result.workout?.groups).toHaveLength(4);
    });
  });

  describe('Error handling', () => {
    it('should handle missing reps', () => {
      const result = parser.parse('5x Squat');
      
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Expected number');
    });

    it('should handle missing exercise name', () => {
      const result = parser.parse('5x10');
      
      expect(result.success).toBe(false);
      expect(result.errors[0].message).toContain('Expected exercise name');
    });

    it('should provide helpful suggestions', () => {
      const result = parser.parse('Bench 225');
      
      expect(result.errors[0].suggestion).toContain('Try');
    });

    it('should recover from errors and continue parsing', () => {
      const result = parser.parse('5x10 Squat\ninvalid line\n3x10 Bench');
      
      expect(result.workout?.groups).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
    });
  });
});