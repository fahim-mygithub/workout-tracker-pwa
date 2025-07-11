import type { Exercise } from '../types/exercise';
import { findExerciseInDirectory } from '../utils/exerciseMatching';
import { ExerciseMatcher } from './exerciseDatabase';

export interface ExerciseValidationResult {
  isValid: boolean;
  unmatchedExercises: UnmatchedExercise[];
  matchedExercises: MatchedExercise[];
  warnings: ValidationWarning[];
  allExercisesValid: boolean;
  requiresConfirmation: boolean;
}

export interface UnmatchedExercise {
  original: string;
  position: number;
  line: number;
  suggestions: ExerciseSuggestion[];
}

export interface MatchedExercise {
  original: string;
  matched: string;
  position: number;
  line: number;
  confidence: number;
  exercise?: Exercise;
  needsConfirmation: boolean;
}

export interface ExerciseSuggestion {
  name: string;
  confidence: number;
  source: 'parser' | 'directory';
  exercise?: Exercise;
}

export interface ValidationWarning {
  message: string;
  severity: 'warning' | 'info';
}

export class ExerciseValidator {
  /**
   * Pre-validate workout text before parsing
   * Extracts potential exercise names and validates them against the exercise directory
   */
  static async validateWorkoutText(
    workoutText: string,
    exerciseDirectory: Exercise[],
    alwaysConfirm: boolean = true
  ): Promise<ExerciseValidationResult> {
    const unmatchedExercises: UnmatchedExercise[] = [];
    const matchedExercises: MatchedExercise[] = [];
    const warnings: ValidationWarning[] = [];
    
    // Extract potential exercise names from the text
    const exerciseNames = this.extractExerciseNames(workoutText);
    
    if (exerciseNames.length === 0) {
      warnings.push({
        message: 'No exercises detected in the workout text',
        severity: 'warning'
      });
      return {
        isValid: false,
        unmatchedExercises: [],
        matchedExercises: [],
        warnings,
        allExercisesValid: false,
        requiresConfirmation: false
      };
    }
    
    // Validate each exercise
    for (const exerciseInfo of exerciseNames) {
      const { name, position, line } = exerciseInfo;
      
      // First check against parser's exercise database
      const parserMatch = ExerciseMatcher.findExercise(name);
      
      // Then check against loaded exercise directory
      const directoryMatch = exerciseDirectory.length > 0
        ? findExerciseInDirectory(name, exerciseDirectory, 0.7)
        : null;
      
      if (!parserMatch && !directoryMatch) {
        // Exercise not found in either database
        const suggestions: ExerciseSuggestion[] = [];
        
        // Get suggestions from exercise directory first (more accurate)
        if (exerciseDirectory.length > 0) {
          const directorySuggestions = this.getSuggestionsFromDirectory(name, exerciseDirectory, 5);
          directorySuggestions.forEach(suggestion => {
            suggestions.push({
              ...suggestion,
              exercise: suggestion.exercise
            });
          });
        }
        
        // Get suggestions from parser database
        const parserSuggestions = ExerciseMatcher.getSuggestions(name, 3);
        parserSuggestions.forEach(suggestion => {
          // Find matching exercise in directory if available
          const matchingExercise = exerciseDirectory.find(e => 
            e.name.toLowerCase() === suggestion.toLowerCase()
          );
          
          if (!suggestions.some(s => s.name.toLowerCase() === suggestion.toLowerCase())) {
            suggestions.push({
              name: suggestion,
              confidence: 0.7,
              source: 'parser',
              exercise: matchingExercise
            });
          }
        });
        
        unmatchedExercises.push({
          original: name,
          position,
          line,
          suggestions: suggestions.slice(0, 5) // Top 5 suggestions
        });
      } else {
        // Exercise was matched - but we still want confirmation
        const matchedName = parserMatch || directoryMatch?.name || name;
        const matchedExercise = directoryMatch || 
          exerciseDirectory.find(e => e.name.toLowerCase() === matchedName.toLowerCase());
        
        // Calculate confidence based on how exact the match is
        let confidence = 1.0;
        if (name.toLowerCase() !== matchedName.toLowerCase()) {
          confidence = 0.8; // Not exact match
        }
        
        matchedExercises.push({
          original: name,
          matched: matchedName,
          position,
          line,
          confidence,
          exercise: matchedExercise,
          needsConfirmation: alwaysConfirm || confidence < 0.9
        });
        
        if (!directoryMatch && exerciseDirectory.length > 0) {
          // Found in parser but not in directory (might not have video/details)
          warnings.push({
            message: `"${matchedName}" is recognized but may not have full exercise details`,
            severity: 'info'
          });
        }
      }
    }
    
    const allExercisesValid = unmatchedExercises.length === 0;
    const isValid = unmatchedExercises.length === 0 || unmatchedExercises.every(e => e.suggestions.length > 0);
    const requiresConfirmation = alwaysConfirm || unmatchedExercises.length > 0 || 
      matchedExercises.some(e => e.needsConfirmation);
    
    return {
      isValid,
      unmatchedExercises,
      matchedExercises,
      warnings,
      allExercisesValid,
      requiresConfirmation
    };
  }
  
  /**
   * Extract potential exercise names from workout text
   * This is a lightweight extraction that doesn't do full parsing
   */
  private static extractExerciseNames(text: string): Array<{name: string, position: number, line: number}> {
    const exercises: Array<{name: string, position: number, line: number}> = [];
    const lines = text.split('\n');
    
    let position = 0;
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      
      // Skip empty lines
      if (!line.trim()) {
        position += line.length + 1;
        continue;
      }
      
      // Check for superset first
      if (line.toLowerCase().includes(' ss ')) {
        const supersetParts = line.split(/\s+ss\s+/i);
        
        for (const part of supersetParts) {
          // Extract exercise from each part of the superset
          const trimmedPart = part.trim();
          
          // Pattern 1: Sets x Reps Exercise Name
          let match = trimmedPart.match(/^\s*\d+\s*x\s*(?:\d+|\d+-\d+|AMRAP)\s+(.+?)(?:\s+[@\d]|$)/i);
          if (match) {
            exercises.push({
              name: match[1].trim(),
              position,
              line: lineNum + 1
            });
            continue;
          }
          
          // Pattern 2: Sets x Exercise Name
          match = trimmedPart.match(/^\s*\d+x\s+(.+?)(?:\s+[@\d]|$)/i);
          if (match) {
            exercises.push({
              name: match[1].trim(),
              position,
              line: lineNum + 1
            });
            continue;
          }
          
          // Pattern 3: Just exercise name
          if (trimmedPart && !trimmedPart.match(/^\d+/)) {
            exercises.push({
              name: trimmedPart.replace(/@.*$/, '').trim(),
              position,
              line: lineNum + 1
            });
          }
        }
        position += line.length + 1;
        continue;
      }
      
      // Look for exercise patterns (non-superset)
      // Pattern 1: Sets x Reps Exercise Name
      const pattern1 = /^\s*\d+\s*x\s*(?:\d+|\d+-\d+|AMRAP)\s+(.+?)(?:\s+[@\d]|$)/i;
      // Pattern 2: Exercise Name Sets x Reps (less common but valid)
      const pattern2 = /^(.+?)\s+\d+\s*x\s*(?:\d+|\d+-\d+|AMRAP)/i;
      // Pattern 3: Weight Sets x Reps Exercise
      const pattern3 = /^\s*\d+(?:lbs?|kg)?\s+\d+\s*x\s*\d+\s+(.+?)$/i;
      // Pattern 4: Complex notation - 5x Exercise Name
      const pattern4 = /^\s*\d+x\s+([^(]+?)(?:\s*\(|$)/i;
      
      let match = line.match(pattern1);
      if (match) {
        exercises.push({
          name: match[1].trim(),
          position: position + (match.index || 0),
          line: lineNum + 1
        });
      } else if ((match = line.match(pattern2))) {
        exercises.push({
          name: match[1].trim(),
          position: position + (match.index || 0),
          line: lineNum + 1
        });
      } else if ((match = line.match(pattern3))) {
        exercises.push({
          name: match[1].trim(),
          position: position + (match.index || 0),
          line: lineNum + 1
        });
      } else if ((match = line.match(pattern4))) {
        exercises.push({
          name: match[1].trim(),
          position: position + (match.index || 0),
          line: lineNum + 1
        });
      } else {
        // Fallback: Look for any text that might be an exercise
        // This handles free-form text that doesn't match standard patterns
        // Handle supersets specially
        if (line.toLowerCase().includes(' ss ')) {
          const supersetParts = line.split(/\s+ss\s+/i);
          
          for (const part of supersetParts) {
            // Try to extract exercise from each part
            const partMatch = part.match(/^\s*(?:\d+x\d+\s+)?(.+?)(?:\s+[@\d]|$)/i) ||
                             part.match(/^(.+?)(?:\s+\d+x\d+|\s*$)/i);
            if (partMatch) {
              const exerciseName = partMatch[1].trim();
              if (exerciseName && exerciseName.length > 0) {
                exercises.push({
                  name: exerciseName,
                  position,
                  line: lineNum + 1
                });
              }
            }
          }
        } else {
          // Original fallback logic for non-superset lines
          const words = line.trim().split(/\s+/);
          const exerciseWords: string[] = [];
          
          for (const word of words) {
            // Stop at certain keywords
            if (/^\d+x\d+$/i.test(word) || /^@\d+/i.test(word) || /^\d+(?:lbs?|kg)?$/i.test(word)) {
              break;
            }
            exerciseWords.push(word);
          }
          
          if (exerciseWords.length > 0 && exerciseWords.length <= 5) {
            const potentialExercise = exerciseWords.join(' ');
            // Check if it might be an exercise
            if (ExerciseMatcher.containsExercise(potentialExercise)) {
              exercises.push({
                name: potentialExercise,
                position,
                line: lineNum + 1
              });
            }
          }
        }
      }
      
      position += line.length + 1;
    }
    
    return exercises;
  }
  
  /**
   * Get exercise suggestions from the loaded directory
   */
  private static getSuggestionsFromDirectory(
    exerciseName: string,
    exercises: Exercise[],
    maxSuggestions: number = 3
  ): ExerciseSuggestion[] {
    const cleanName = exerciseName.toLowerCase().trim();
    const scores: Array<[Exercise, number]> = [];
    
    for (const exercise of exercises) {
      const similarity = this.calculateSimilarity(cleanName, exercise.name.toLowerCase());
      if (similarity > 0.5) {
        scores.push([exercise, similarity]);
      }
    }
    
    return scores
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxSuggestions)
      .map(([exercise, score]) => ({
        name: exercise.name,
        confidence: score,
        source: 'directory' as const,
        exercise
      }));
  }
  
  /**
   * Calculate similarity between two strings
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    // Exact match
    if (str1 === str2) return 1;
    
    // Check if one contains the other
    if (str1.includes(str2) || str2.includes(str1)) return 0.9;
    
    // Split into words and check overlap
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    // Count matching words
    const matchingWords = words1.filter(w1 => 
      words2.some(w2 => w1 === w2 || w1.includes(w2) || w2.includes(w1))
    ).length;
    
    const totalWords = Math.max(words1.length, words2.length);
    return matchingWords / totalWords;
  }
}