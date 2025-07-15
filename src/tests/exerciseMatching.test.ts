import { describe, it, expect } from 'vitest';
import { extractExerciseName, findExerciseInDirectory } from '../utils/exerciseMatching';
import type { Exercise } from '../types/exercise';

describe('Exercise Matching', () => {
  describe('extractExerciseName', () => {
    it('should extract exercise name from sets notation', () => {
      expect(extractExerciseName('Barbell Curl 3x10')).toBe('Barbell Curl');
      expect(extractExerciseName('Dumbbell Press 4x12')).toBe('Dumbbell Press');
      expect(extractExerciseName('Push-ups 3xAMRAP')).toBe('Push-ups');
    });

    it('should handle spaces in set notation', () => {
      expect(extractExerciseName('Barbell Curl 3 x 10')).toBe('Barbell Curl');
      expect(extractExerciseName('Bench Press 5 x 5')).toBe('Bench Press');
    });

    it('should remove weight notations', () => {
      expect(extractExerciseName('Barbell Curl 3x10 @75lbs')).toBe('Barbell Curl');
      expect(extractExerciseName('Squat 5x5 @225lbs')).toBe('Squat');
      expect(extractExerciseName('Deadlift 3x5 @315kg')).toBe('Deadlift');
    });

    it('should remove parentheses content', () => {
      expect(extractExerciseName('Barbell Curl (EZ bar) 3x10')).toBe('Barbell Curl');
      expect(extractExerciseName('Bench Press (Close Grip) 4x8')).toBe('Bench Press');
    });
  });

  describe('findExerciseInDirectory', () => {
    const mockExercises: Exercise[] = [
      {
        id: '1',
        name: 'Barbell Curl',
        muscleGroup: 'Biceps',
        equipment: 'Barbell',
        videoLinks: ['video1.mp4', 'video2.mp4'],
        difficulty: 'Intermediate',
        force: 'Pull',
        grips: 'Underhand: Supinated',
        mechanic: 'Isolation',
        instructions: [],
        searchKeywords: ['barbell', 'curl'],
        createdAt: '',
        updatedAt: '',
      },
      {
        id: '2',
        name: 'Incline Barbell Press',
        muscleGroup: 'Chest',
        equipment: 'Barbell',
        videoLinks: ['video3.mp4'],
        difficulty: 'Intermediate',
        force: 'Push',
        grips: 'Overhand: Pronated',
        mechanic: 'Compound',
        instructions: [],
        searchKeywords: ['incline', 'barbell', 'press'],
        createdAt: '',
        updatedAt: '',
      },
    ];

    it('should find exact matches', () => {
      const result = findExerciseInDirectory('Barbell Curl 3x10', mockExercises);
      expect(result).toBeTruthy();
      expect(result?.name).toBe('Barbell Curl');
    });

    it('should handle word order variations', () => {
      const result1 = findExerciseInDirectory('Barbell Incline Press 4x8', mockExercises);
      expect(result1).toBeTruthy();
      expect(result1?.name).toBe('Incline Barbell Press');
    });

    it('should return null for non-matching exercises', () => {
      const result = findExerciseInDirectory('Unknown Exercise 3x10', mockExercises);
      expect(result).toBeNull();
    });

    it('should handle partial matches above threshold', () => {
      const result = findExerciseInDirectory('Barbell Curls 3x10', mockExercises); // with 's'
      expect(result).toBeTruthy();
      expect(result?.name).toBe('Barbell Curl');
    });
  });
});