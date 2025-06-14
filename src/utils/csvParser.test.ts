import { describe, it, expect } from 'vitest';
import { CSVParser } from './csvParser';
import { ExerciseRaw } from '../types/exercise';

describe('CSVParser', () => {
  describe('parseCSVLine', () => {
    it('should parse simple comma-separated values', () => {
      const line = 'Biceps,Barbell Curl,Barbell';
      const result = CSVParser.parseCSVLine(line);
      expect(result).toEqual(['Biceps', 'Barbell Curl', 'Barbell']);
    });

    it('should handle quoted values with commas', () => {
      const line = 'Biceps,"Barbell Curl, Standing",Barbell';
      const result = CSVParser.parseCSVLine(line);
      expect(result).toEqual(['Biceps', 'Barbell Curl, Standing', 'Barbell']);
    });

    it('should handle quoted values with pipes', () => {
      const line = 'Biceps,Barbell Curl,"1. Stand up | 2. Curl the weight"';
      const result = CSVParser.parseCSVLine(line);
      expect(result).toEqual(['Biceps', 'Barbell Curl', '1. Stand up | 2. Curl the weight']);
    });

    it('should handle empty values', () => {
      const line = 'Biceps,,Barbell,';
      const result = CSVParser.parseCSVLine(line);
      expect(result).toEqual(['Biceps', '', 'Barbell', '']);
    });
  });

  describe('parseCSV', () => {
    it('should parse complete CSV content', () => {
      const csvContent = `Muscle Group,Exercise Name,Equipment
Biceps,Barbell Curl,Barbell
Triceps,Dips,Bodyweight`;
      
      const result = CSVParser.parseCSV(csvContent);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        'Muscle Group': 'Biceps',
        'Exercise Name': 'Barbell Curl',
        'Equipment': 'Barbell'
      });
      expect(result[1]).toEqual({
        'Muscle Group': 'Triceps',
        'Exercise Name': 'Dips',
        'Equipment': 'Bodyweight'
      });
    });

    it('should skip malformed lines', () => {
      const csvContent = `Muscle Group,Exercise Name,Equipment
Biceps,Barbell Curl,Barbell
Triceps,Dips
Chest,Push-ups,Bodyweight`;
      
      const result = CSVParser.parseCSV(csvContent);
      
      expect(result).toHaveLength(2);
      expect(result[0]['Exercise Name']).toBe('Barbell Curl');
      expect(result[1]['Exercise Name']).toBe('Push-ups');
    });
  });

  describe('transformExercise', () => {
    const sampleRaw: ExerciseRaw = {
      'Muscle Group': 'Biceps',
      'Exercise Name': 'Barbell Curl',
      'Equipment': 'Barbell',
      'Video Links': 'https://example.com/video1.mp4, https://example.com/video2.mp4',
      'Difficulty': 'Intermediate',
      'Force': 'Pull',
      'Grips': 'Underhand: Supinated',
      'Mechanic': 'Isolation',
      'Instructions': '1. Stand up straight | 2. Curl the weight forward | 3. Lower slowly'
    };

    it('should transform raw exercise data correctly', () => {
      const result = CSVParser.transformExercise(sampleRaw, 0);
      
      expect(result.muscleGroup).toBe('Biceps');
      expect(result.name).toBe('Barbell Curl');
      expect(result.equipment).toBe('Barbell');
      expect(result.difficulty).toBe('Intermediate');
      expect(result.force).toBe('Pull');
      expect(result.grips).toBe('Underhand: Supinated');
      expect(result.mechanic).toBe('Isolation');
      expect(result.id).toBe('biceps-barbell-curl');
    });

    it('should parse video links correctly', () => {
      const result = CSVParser.transformExercise(sampleRaw, 0);
      
      expect(result.videoLinks).toHaveLength(2);
      expect(result.videoLinks[0]).toBe('https://example.com/video1.mp4');
      expect(result.videoLinks[1]).toBe('https://example.com/video2.mp4');
    });

    it('should parse instructions correctly', () => {
      const result = CSVParser.transformExercise(sampleRaw, 0);
      
      expect(result.instructions).toHaveLength(3);
      expect(result.instructions[0]).toBe('1. Stand up straight');
      expect(result.instructions[1]).toBe('2. Curl the weight forward');
      expect(result.instructions[2]).toBe('3. Lower slowly');
    });

    it('should generate search keywords', () => {
      const result = CSVParser.transformExercise(sampleRaw, 0);
      
      expect(result.searchKeywords).toContain('barbell');
      expect(result.searchKeywords).toContain('curl');
      expect(result.searchKeywords).toContain('biceps');
      expect(result.searchKeywords).toContain('intermediate');
      expect(result.searchKeywords).toContain('pull');
    });

    it('should handle empty/null values gracefully', () => {
      const emptyRaw: ExerciseRaw = {
        'Muscle Group': 'Biceps',
        'Exercise Name': 'Test Exercise',
        'Equipment': 'Bodyweight',
        'Video Links': '',
        'Difficulty': '',
        'Force': '',
        'Grips': '',
        'Mechanic': '',
        'Instructions': ''
      };
      
      const result = CSVParser.transformExercise(emptyRaw, 0);
      
      expect(result.videoLinks).toHaveLength(0);
      expect(result.instructions).toHaveLength(0);
      expect(result.difficulty).toBe('Beginner'); // Default
      expect(result.force).toBeNull();
      expect(result.grips).toBeNull();
      expect(result.mechanic).toBeNull();
    });

    it('should generate unique IDs', () => {
      const exercise1 = CSVParser.transformExercise({
        ...sampleRaw,
        'Exercise Name': 'Barbell Curl'
      }, 0);
      
      const exercise2 = CSVParser.transformExercise({
        ...sampleRaw,
        'Exercise Name': 'Dumbbell Curl'
      }, 1);
      
      expect(exercise1.id).not.toBe(exercise2.id);
      expect(exercise1.id).toBe('biceps-barbell-curl');
      expect(exercise2.id).toBe('biceps-dumbbell-curl');
    });

    it('should handle special characters in names', () => {
      const specialRaw: ExerciseRaw = {
        ...sampleRaw,
        'Exercise Name': 'Barbell Curl (21\'s)',
        'Muscle Group': 'Biceps & Forearms'
      };
      
      const result = CSVParser.transformExercise(specialRaw, 0);
      
      expect(result.id).toBe('biceps-forearms-barbell-curl-21s');
      expect(result.name).toBe('Barbell Curl (21\'s)');
    });
  });
});