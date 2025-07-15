import { extractExerciseName, findExerciseInDirectory } from '../utils/exerciseMatching';
import type { Exercise } from '../types/exercise';

// Test exercise matching
const testExercises: Exercise[] = [
  {
    id: '1',
    name: 'Barbell Incline Bench Press',
    muscleGroup: 'Anterior Deltoid',
    equipment: 'Barbell',
    videoLinks: ['video1.mp4', 'video2.mp4'],
    difficulty: 'Intermediate',
    force: 'Push',
    grips: 'Overhand: Pronated',
    mechanic: 'Compound',
    instructions: [],
    searchKeywords: [],
    createdAt: '',
    updatedAt: '',
  }
];

// Test cases
const testCases = [
  'incline bench press',
  'Incline Bench Press',
  'incline barbell press',
  'barbell incline press',
  'Incline Barbell Press 4x8',
  'incline bench press 3x10'
];

console.log('Testing exercise matching:\n');

testCases.forEach(testCase => {
  const cleanName = extractExerciseName(testCase);
  const match = findExerciseInDirectory(testCase, testExercises);
  
  console.log(`Input: "${testCase}"`);
  console.log(`Clean name: "${cleanName}"`);
  console.log(`Match found: ${match ? match.name : 'None'}`);
  console.log('---');
});