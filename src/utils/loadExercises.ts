import { parse } from 'papaparse';
import type { ExerciseRaw, Exercise, ExerciseDifficulty, ExerciseForce, ExerciseGrip, ExerciseMechanic } from '../types/exercise';

export const parseExerciseCSV = (csvContent: string): Exercise[] => {
  const result = parse<ExerciseRaw>(csvContent, {
    header: true,
    skipEmptyLines: true,
  });

  return result.data.map((row, index) => {
    const videoLinks = row['Video Links'] 
      ? row['Video Links'].split(',').map(link => link.trim())
      : [];

    const instructions = row['Instructions']
      ? row['Instructions'].split('|').map(instruction => instruction.trim())
      : [];

    // Generate search keywords from name, muscle group, and equipment
    const searchKeywords = [
      row['Exercise Name'].toLowerCase(),
      row['Muscle Group'].toLowerCase(),
      row['Equipment'].toLowerCase(),
      ...row['Exercise Name'].toLowerCase().split(' '),
    ].filter(Boolean);

    return {
      id: `exercise-${index + 1}`,
      muscleGroup: row['Muscle Group'],
      name: row['Exercise Name'],
      equipment: row['Equipment'],
      videoLinks,
      difficulty: (row['Difficulty'] || 'Intermediate') as ExerciseDifficulty,
      force: row['Force'] ? (row['Force'] as ExerciseForce) : null,
      grips: row['Grips'] ? (row['Grips'] as ExerciseGrip) : null,
      mechanic: row['Mechanic'] ? (row['Mechanic'] as ExerciseMechanic) : null,
      instructions,
      searchKeywords,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
};

export const loadExercisesFromCSV = async (): Promise<Exercise[]> => {
  try {
    const response = await fetch('/muscle_exercises.csv');
    const csvContent = await response.text();
    return parseExerciseCSV(csvContent);
  } catch (error) {
    console.error('Failed to load exercises from CSV:', error);
    return [];
  }
};