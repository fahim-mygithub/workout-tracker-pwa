import { describe, it, expect } from 'vitest';
import { WorkoutParser } from './WorkoutParser';

describe('WorkoutParser', () => {
  describe('Basic sets x reps parsing', () => {
    it('should parse simple exercise with sets and reps', () => {
      const result = WorkoutParser.parse('Bench Press 5x5');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].exercises).toHaveLength(1);
      expect(result.data![0].exercises[0]).toEqual({
        name: 'Bench Press',
        sets: 5,
        reps: 5
      });
      expect(result.data![0].type).toBe('normal');
    });

    it('should parse exercise with different sets and reps', () => {
      const result = WorkoutParser.parse('Squats 3x12');
      
      expect(result.success).toBe(true);
      expect(result.data![0].exercises[0]).toEqual({
        name: 'Squats',
        sets: 3,
        reps: 12
      });
    });

    it('should handle multi-word exercise names', () => {
      const result = WorkoutParser.parse('Incline Dumbbell Press 4x8');
      
      expect(result.success).toBe(true);
      expect(result.data![0].exercises[0].name).toBe('Incline Dumbbell Press');
    });
  });

  describe('Weight parsing', () => {
    it('should parse weight in pounds', () => {
      const result = WorkoutParser.parse('Bench Press 5x5 185lbs');
      
      expect(result.success).toBe(true);
      expect(result.data![0].exercises[0].weight).toBe('185 lbs');
    });

    it('should parse weight in kilograms', () => {
      const result = WorkoutParser.parse('Squats 3x10 80kg');
      
      expect(result.success).toBe(true);
      expect(result.data![0].exercises[0].weight).toBe('80 kg');
    });

    it('should parse decimal weights', () => {
      const result = WorkoutParser.parse('Deadlift 1x5 225.5lbs');
      
      expect(result.success).toBe(true);
      expect(result.data![0].exercises[0].weight).toBe('225.5 lbs');
    });

    it('should handle "pounds" instead of "lbs"', () => {
      const result = WorkoutParser.parse('Press 5x5 135pounds');
      
      expect(result.success).toBe(true);
      expect(result.data![0].exercises[0].weight).toBe('135 pounds');
    });
  });

  describe('RPE parsing', () => {
    it('should parse RPE notation', () => {
      const result = WorkoutParser.parse('Bench Press 5x5 @RPE8');
      
      expect(result.success).toBe(true);
      expect(result.data![0].exercises[0].rpe).toBe(8);
    });

    it('should parse decimal RPE', () => {
      const result = WorkoutParser.parse('Squats 3x8 @RPE7.5');
      
      expect(result.success).toBe(true);
      expect(result.data![0].exercises[0].rpe).toBe(7.5);
    });

    it('should be case insensitive for RPE', () => {
      const result = WorkoutParser.parse('Deadlift 1x5 @rpe9');
      
      expect(result.success).toBe(true);
      expect(result.data![0].exercises[0].rpe).toBe(9);
    });
  });

  describe('Combined weight and RPE', () => {
    it('should parse both weight and RPE', () => {
      const result = WorkoutParser.parse('Bench Press 5x5 185lbs @RPE8');
      
      expect(result.success).toBe(true);
      const exercise = result.data![0].exercises[0];
      expect(exercise.weight).toBe('185 lbs');
      expect(exercise.rpe).toBe(8);
    });

    it('should parse RPE before weight', () => {
      const result = WorkoutParser.parse('Squats 3x10 @RPE7 80kg');
      
      expect(result.success).toBe(true);
      const exercise = result.data![0].exercises[0];
      expect(exercise.weight).toBe('80 kg');
      expect(exercise.rpe).toBe(7);
    });
  });

  describe('Superset parsing', () => {
    it('should parse superset with "ss" notation', () => {
      const result = WorkoutParser.parse('Bench Press 5x5 ss Push-ups 3x10');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].type).toBe('superset');
      expect(result.data![0].exercises).toHaveLength(2);
      expect(result.data![0].exercises[0].name).toBe('Bench Press');
      expect(result.data![0].exercises[1].name).toBe('Push-ups');
    });

    it('should handle case insensitive superset notation', () => {
      const result = WorkoutParser.parse('Squats 3x8 SS Lunges 3x12');
      
      expect(result.success).toBe(true);
      expect(result.data![0].type).toBe('superset');
    });
  });

  describe('Circuit parsing', () => {
    it('should parse circuit with "+" notation', () => {
      const result = WorkoutParser.parse('Push-ups 3x10 + Squats 3x15 + Burpees 3x8');
      
      expect(result.success).toBe(true);
      expect(result.data![0].type).toBe('circuit');
      expect(result.data![0].exercises).toHaveLength(3);
      expect(result.data![0].exercises[0].name).toBe('Push-ups');
      expect(result.data![0].exercises[1].name).toBe('Squats');
      expect(result.data![0].exercises[2].name).toBe('Burpees');
    });
  });

  describe('Multiple workout sets', () => {
    it('should parse multiple exercises separated by commas', () => {
      const result = WorkoutParser.parse('Bench Press 5x5, Squats 3x10, Deadlift 1x5');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data![0].exercises[0].name).toBe('Bench Press');
      expect(result.data![1].exercises[0].name).toBe('Squats');
      expect(result.data![2].exercises[0].name).toBe('Deadlift');
    });

    it('should parse multiple exercises separated by semicolons', () => {
      const result = WorkoutParser.parse('Push-ups 3x10; Pull-ups 3x8');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });

  describe('Error handling', () => {
    it('should return error for empty input', () => {
      const result = WorkoutParser.parse('');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Input cannot be empty');
    });

    it('should return error for whitespace only input', () => {
      const result = WorkoutParser.parse('   ');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Input cannot be empty');
    });

    it('should handle malformed sets x reps', () => {
      const result = WorkoutParser.parse('Bench Press 5x');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should handle missing exercise name', () => {
      const result = WorkoutParser.parse('5x5');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should handle text without sets x reps pattern', () => {
      const result = WorkoutParser.parse('Just some text');
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('Edge cases', () => {
    it('should handle extra whitespace', () => {
      const result = WorkoutParser.parse('  Bench Press   5x5   185lbs   @RPE8  ');
      
      expect(result.success).toBe(true);
      const exercise = result.data![0].exercises[0];
      expect(exercise.name).toBe('Bench Press');
      expect(exercise.sets).toBe(5);
      expect(exercise.reps).toBe(5);
      expect(exercise.weight).toBe('185 lbs');
      expect(exercise.rpe).toBe(8);
    });

    it('should handle mixed case in exercise names', () => {
      const result = WorkoutParser.parse('BENCH press 5x5');
      
      expect(result.success).toBe(true);
      expect(result.data![0].exercises[0].name).toBe('BENCH press');
    });

    it('should handle numbers in exercise names', () => {
      const result = WorkoutParser.parse('21s Bicep Curls 3x1');
      
      expect(result.success).toBe(true);
      expect(result.data![0].exercises[0].name).toBe('21s Bicep Curls');
    });
  });
});