import type { 
  Exercise, 
  ExerciseRaw, 
  ExerciseDifficulty, 
  ExerciseForce, 
  ExerciseGrip, 
  ExerciseMechanic 
} from '../types/exercise';

export class CSVParser {
  static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
  
  static parseCSV(csvContent: string): ExerciseRaw[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = this.parseCSVLine(lines[0]);
    const exercises: ExerciseRaw[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === headers.length) {
        const exercise: ExerciseRaw = {} as ExerciseRaw;
        headers.forEach((header, index) => {
          exercise[header as keyof ExerciseRaw] = values[index] || '';
        });
        exercises.push(exercise);
      }
    }
    
    return exercises;
  }
  
  static transformExercise(raw: ExerciseRaw, index: number): Exercise {
    const id = this.generateExerciseId(raw['Exercise Name'], raw['Muscle Group']);
    
    return {
      id,
      muscleGroup: raw['Muscle Group'].trim(),
      name: raw['Exercise Name'].trim(),
      equipment: raw['Equipment'].trim(),
      videoLinks: this.parseVideoLinks(raw['Video Links']),
      difficulty: this.parseDifficulty(raw['Difficulty']),
      force: this.parseForce(raw['Force']),
      grips: this.parseGrip(raw['Grips']),
      mechanic: this.parseMechanic(raw['Mechanic']),
      instructions: this.parseInstructions(raw['Instructions']),
      searchKeywords: this.generateSearchKeywords(raw),
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  private static generateExerciseId(name: string, muscleGroup: string): string {
    const cleanName = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    const cleanMuscle = muscleGroup.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    return `${cleanMuscle}-${cleanName}`;
  }
  
  private static parseVideoLinks(links: string): string[] {
    if (!links.trim()) return [];
    return links.split(',')
      .map(link => link.trim())
      .filter(link => link.length > 0);
  }
  
  private static parseDifficulty(difficulty: string): ExerciseDifficulty {
    const cleaned = difficulty.trim();
    const validDifficulties: ExerciseDifficulty[] = ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];
    return validDifficulties.includes(cleaned as ExerciseDifficulty) 
      ? cleaned as ExerciseDifficulty 
      : 'Beginner';
  }
  
  private static parseForce(force: string): ExerciseForce | null {
    const cleaned = force.trim();
    if (!cleaned) return null;
    const validForces: ExerciseForce[] = ['Push', 'Pull', 'Hold', 'Static'];
    return validForces.includes(cleaned as ExerciseForce) 
      ? cleaned as ExerciseForce 
      : null;
  }
  
  private static parseGrip(grip: string): ExerciseGrip | null {
    const cleaned = grip.trim();
    if (!cleaned || cleaned === '-') return null;
    
    const validGrips: ExerciseGrip[] = [
      'Overhand: Pronated', 'Underhand: Supinated', 'Neutral', 
      'Mixed', 'Hook', 'Wide', 'Narrow'
    ];
    
    return validGrips.includes(cleaned as ExerciseGrip) 
      ? cleaned as ExerciseGrip 
      : null;
  }
  
  private static parseMechanic(mechanic: string): ExerciseMechanic | null {
    const cleaned = mechanic.trim();
    if (!cleaned || cleaned === '-') return null;
    const validMechanics: ExerciseMechanic[] = ['Isolation', 'Compound'];
    return validMechanics.includes(cleaned as ExerciseMechanic) 
      ? cleaned as ExerciseMechanic 
      : null;
  }
  
  private static parseInstructions(instructions: string): string[] {
    if (!instructions.trim()) return [];
    return instructions.split('|')
      .map(instruction => instruction.trim())
      .filter(instruction => instruction.length > 0);
  }
  
  private static generateSearchKeywords(raw: ExerciseRaw): string[] {
    const keywords = new Set<string>();
    
    // Add name words
    raw['Exercise Name'].toLowerCase().split(/\s+/).forEach(word => {
      if (word.length > 2) keywords.add(word);
    });
    
    // Add muscle group
    keywords.add(raw['Muscle Group'].toLowerCase());
    
    // Add equipment
    if (raw['Equipment'].trim()) {
      raw['Equipment'].toLowerCase().split(/\s+/).forEach(word => {
        if (word.length > 2) keywords.add(word);
      });
    }
    
    // Add difficulty
    if (raw['Difficulty'].trim()) {
      keywords.add(raw['Difficulty'].toLowerCase());
    }
    
    // Add force type
    if (raw['Force'].trim()) {
      keywords.add(raw['Force'].toLowerCase());
    }
    
    return Array.from(keywords);
  }
}