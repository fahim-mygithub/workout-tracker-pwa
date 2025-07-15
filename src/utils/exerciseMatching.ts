import type { Exercise } from '../types/exercise';

/**
 * Extract exercise name from a workout string that includes sets/reps
 * Examples:
 * - "Barbell Curl 3x10" -> "Barbell Curl"
 * - "Dumbbell Press 4x12 @75lbs" -> "Dumbbell Press"
 * - "Push-ups 3xAMRAP" -> "Push-ups"
 */
export function extractExerciseName(workoutString: string): string {
  // Remove common set/rep patterns
  const patterns = [
    /\s+\d+x\d+/gi,        // 3x10, 4x12
    /\s+\d+\s*x\s*\d+/gi,  // 3 x 10, 4 x 12
    /\s+\d+xAMRAP/gi,      // 3xAMRAP
    /\s+\d+x\s*AMRAP/gi,   // 3x AMRAP
    /\s+@\s*\d+\s*(?:lbs?|kgs?|pounds?|kilos?)?/gi,  // @75lbs, @100kg, @75
    /\s+\d+\s*(?:lbs?|kgs?|pounds?|kilos?)/gi,       // weight units
    /\s*\([^)]*\)/g,       // anything in parentheses
    /\s+(?:sets?|reps?)/gi, // words "sets" or "reps"
  ];
  
  let cleanName = workoutString;
  patterns.forEach(pattern => {
    cleanName = cleanName.replace(pattern, '');
  });
  
  return cleanName.trim();
}

/**
 * Calculate similarity score between two strings
 * Returns a score between 0 and 1, where 1 is identical
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Exact match
  if (s1 === s2) return 1;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.9;
  
  // Split into words and check overlap
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  // Check if all words from one are in the other
  const allWords1InWords2 = words1.every(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));
  const allWords2InWords1 = words2.every(w => words1.some(w1 => w1.includes(w) || w.includes(w1)));
  
  if (allWords1InWords2 || allWords2InWords1) return 0.8;
  
  // Count matching words
  const matchingWords = words1.filter(w1 => 
    words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))
  ).length;
  
  const totalWords = Math.max(words1.length, words2.length);
  const wordMatchRatio = matchingWords / totalWords;
  
  // Handle word order variations (e.g., "barbell incline press" vs "incline barbell press")
  const sortedWords1 = [...words1].sort().join(' ');
  const sortedWords2 = [...words2].sort().join(' ');
  if (sortedWords1 === sortedWords2) return 0.95;
  
  return wordMatchRatio * 0.7; // Scale down for partial matches
}

/**
 * Find the best matching exercise from the directory
 * Returns the exercise if found with a good enough match, null otherwise
 */
export function findExerciseInDirectory(
  exerciseName: string,
  exercises: Exercise[],
  minSimilarity = 0.7
): Exercise | null {
  // First, extract the exercise name without sets/reps
  const cleanName = extractExerciseName(exerciseName);
  
  if (!cleanName) return null;
  
  // Calculate similarity scores for all exercises
  const matches = exercises.map(exercise => ({
    exercise,
    similarity: calculateSimilarity(cleanName, exercise.name),
  }));
  
  // Sort by similarity score
  matches.sort((a, b) => b.similarity - a.similarity);
  
  // Return the best match if it meets the minimum threshold
  const bestMatch = matches[0];
  if (bestMatch && bestMatch.similarity >= minSimilarity) {
    return bestMatch.exercise;
  }
  
  return null;
}

/**
 * Get video links for an exercise by looking it up in the directory
 */
export function getExerciseVideoLinks(
  exerciseName: string,
  exercises: Exercise[]
): string[] {
  const exercise = findExerciseInDirectory(exerciseName, exercises);
  return exercise?.videoLinks || [];
}