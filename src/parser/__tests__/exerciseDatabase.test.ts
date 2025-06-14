import { describe, it, expect } from 'vitest';
import { ExerciseMatcher } from '../exerciseDatabase';

describe('ExerciseMatcher', () => {
  describe('findExercise', () => {
    it('should find exact matches', () => {
      expect(ExerciseMatcher.findExercise('bench press')).toBe('bench press');
      expect(ExerciseMatcher.findExercise('BENCH PRESS')).toBe('bench press');
      expect(ExerciseMatcher.findExercise('Bench Press')).toBe('bench press');
    });

    it('should find exercises by aliases', () => {
      const tests = [
        { input: 'bp', expected: 'bench press' },
        { input: 'BB bench', expected: 'bench press' },
        { input: 'db bench', expected: 'dumbbell bench press' },
        { input: 'rdl', expected: 'romanian deadlift' },
        { input: 'ohp', expected: 'overhead press' },
        { input: 'cgbp', expected: 'close grip bench press' },
        { input: 'bss', expected: 'bulgarian split squat' },
      ];

      tests.forEach(({ input, expected }) => {
        expect(ExerciseMatcher.findExercise(input)).toBe(expected);
      });
    });

    it('should handle fuzzy matching for misspellings', () => {
      const tests = [
        { input: 'bnech press', expected: 'bench press' },
        { input: 'squats', expected: 'squat' },
        { input: 'deadlifts', expected: 'deadlift' },
        { input: 'pullups', expected: 'pull ups' },
        { input: 'dumbell bench', expected: 'dumbbell bench press' },
      ];

      tests.forEach(({ input, expected }) => {
        expect(ExerciseMatcher.findExercise(input)).toBe(expected);
      });
    });

    it('should return null for unknown exercises', () => {
      expect(ExerciseMatcher.findExercise('totally made up exercise')).toBe(null);
      expect(ExerciseMatcher.findExercise('xyz')).toBe(null);
    });
  });

  describe('getSuggestions', () => {
    it('should provide suggestions for misspellings', () => {
      const suggestions = ExerciseMatcher.getSuggestions('bnech');
      
      expect(suggestions).toContain('bench press');
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should provide multiple relevant suggestions', () => {
      const suggestions = ExerciseMatcher.getSuggestions('press');
      
      expect(suggestions).toContain('bench press');
      expect(suggestions).toContain('overhead press');
    });

    it('should handle partial matches', () => {
      const suggestions = ExerciseMatcher.getSuggestions('dead');
      
      expect(suggestions).toContain('deadlift');
      expect(suggestions).toContain('romanian deadlift');
    });

    it('should return empty array for very different input', () => {
      const suggestions = ExerciseMatcher.getSuggestions('zzzzz');
      
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('containsExercise', () => {
    it('should detect exercises in text', () => {
      expect(ExerciseMatcher.containsExercise('Today I did bench press')).toBe(true);
      expect(ExerciseMatcher.containsExercise('5x5 squat was tough')).toBe(true);
      expect(ExerciseMatcher.containsExercise('Started with RDL')).toBe(true);
    });

    it('should detect multi-word exercises', () => {
      expect(ExerciseMatcher.containsExercise('close grip bench press for triceps')).toBe(true);
      expect(ExerciseMatcher.containsExercise('romanian deadlift form check')).toBe(true);
    });

    it('should return false when no exercise found', () => {
      expect(ExerciseMatcher.containsExercise('Just some random text')).toBe(false);
      expect(ExerciseMatcher.containsExercise('Hello world')).toBe(false);
    });
  });

  describe('Levenshtein distance', () => {
    it('should calculate correct edit distance', () => {
      // Access private method through reflection for testing
      const matcher = ExerciseMatcher as any;
      
      // These would be internal tests, but let's verify the algorithm works
      const findExerciseWithTypo = (typo: string) => ExerciseMatcher.findExercise(typo);
      
      // One character substitution
      expect(findExerciseWithTypo('bqnch press')).toBe('bench press');
      
      // One character deletion
      expect(findExerciseWithTypo('ench press')).toBe('bench press');
      
      // One character insertion
      expect(findExerciseWithTypo('beanch press')).toBe('bench press');
    });
  });

  describe('Case sensitivity and normalization', () => {
    it('should handle various cases and formats', () => {
      const variations = [
        'BENCH PRESS',
        'bench press',
        'Bench Press',
        'BeNcH pReSs',
        'bench  press', // Extra space
        ' bench press ', // Leading/trailing spaces
      ];

      variations.forEach(variation => {
        expect(ExerciseMatcher.findExercise(variation)).toBe('bench press');
      });
    });
  });
});