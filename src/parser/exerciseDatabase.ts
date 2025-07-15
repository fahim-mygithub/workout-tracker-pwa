// Common exercise names and their variations
export const EXERCISE_DATABASE = {
  // Chest
  'bench press': ['bench', 'bp', 'barbell bench', 'bb bench', 'benchpress', 'bench-press'],
  'dumbbell bench press': ['db bench', 'dumbbell bench', 'db press'],
  'incline bench press': ['incline bench', 'incline press', 'incline bp'],
  'decline bench press': ['decline bench', 'decline press', 'decline bp'],
  'close grip bench press': ['close grip bench', 'cgbp', 'close grip'],
  'dumbbell flyes': ['flyes', 'db flyes', 'flies', 'db flies', 'pec flyes'],
  'cable flyes': ['cable flies', 'cable crossover', 'crossover'],
  'push ups': ['pushups', 'push-ups'],
  'dips': ['chest dips', 'weighted dips'],
  
  // Back
  'deadlift': ['dl', 'conventional deadlift', 'deads'],
  'sumo deadlift': ['sumo', 'sumo dl', 'sumo deads'],
  'romanian deadlift': ['rdl', 'romanian dl', 'stiff leg deadlift', 'sldl'],
  'bent over row': ['bb row', 'barbell row', 'rows', 'bent row'],
  'dumbbell row': ['db row', 'one arm row', 'single arm row'],
  'lat pulldown': ['pulldown', 'lat pull', 'wide grip pulldown'],
  'pull ups': ['pullups', 'pull-ups', 'chins'],
  'chin ups': ['chinups', 'chin-ups', 'underhand pullups'],
  'cable row': ['seated row', 'low row', 'horizontal row'],
  't bar row': ['t-bar row', 'tbar row'],
  
  // Legs
  'squat': ['back squat', 'barbell squat', 'squats', 'bb squat'],
  'front squat': ['front squats', 'fs'],
  'leg press': ['press', 'leg press machine'],
  'lunges': ['walking lunges', 'reverse lunges', 'forward lunges'],
  'bulgarian split squat': ['bss', 'split squats', 'rear foot elevated split squat'],
  'leg curls': ['hamstring curls', 'lying leg curls', 'seated leg curls'],
  'leg extensions': ['leg ext', 'quad extensions'],
  'calf raises': ['calf raise', 'standing calf raises', 'seated calf raises'],
  'hack squat': ['hack squats', 'machine squat'],
  
  // Shoulders
  'overhead press': ['ohp', 'military press', 'shoulder press', 'press'],
  'dumbbell overhead press': ['db ohp', 'db press', 'db shoulder press'],
  'arnold press': ['arnold', 'arnold dumbbell press'],
  'lateral raises': ['lat raises', 'side raises', 'lateral raise', 'side laterals'],
  'front raises': ['front raise', 'frontal raises'],
  'rear delt flyes': ['rear delts', 'reverse flyes', 'rear delt raises'],
  'upright row': ['upright rows'],
  'face pulls': ['face pull', 'facepulls'],
  'shrugs': ['barbell shrugs', 'dumbbell shrugs', 'trap shrugs'],
  'band pull aparts': ['banded pull aparts', 'band pulls', 'pull aparts'],
  
  // Arms
  'barbell curl': ['bb curl', 'curls', 'bicep curls', 'straight bar curl'],
  'dumbbell curl': ['db curl', 'db curls', 'bicep curl'],
  'hammer curl': ['hammer curls', 'neutral grip curls'],
  'preacher curl': ['preacher curls', 'ez bar curl'],
  'cable curl': ['cable curls', 'rope curls'],
  'tricep pushdown': ['pushdowns', 'tricep pushdowns', 'rope pushdown'],
  'overhead tricep extension': ['tricep extension', 'overhead extension', 'french press'],
  'tricep dips': ['dips', 'bench dips'],
  'skullcrushers': ['skull crushers', 'lying tricep extension', 'lte'],
  
  // Core
  'plank': ['planks', 'front plank'],
  'side plank': ['side planks'],
  'crunches': ['crunch', 'ab crunches'],
  'sit ups': ['situps', 'sit-ups'],
  'leg raises': ['hanging leg raises', 'lying leg raises', 'leg raise'],
  'russian twists': ['russian twist', 'twists'],
  'ab wheel': ['ab rollout', 'wheel rollout'],
  'cable crunches': ['cable crunch', 'rope crunches'],
  
  // Olympic/Power
  'clean': ['power clean', 'hang clean', 'clean and jerk'],
  'snatch': ['power snatch', 'hang snatch'],
  'clean and jerk': ['c&j', 'clean & jerk'],
  'push press': ['push presses'],
  'thrusters': ['thruster', 'squat to press']
};

// Create reverse mapping for faster lookup
const EXERCISE_ALIASES: Map<string, string> = new Map();
for (const [canonical, aliases] of Object.entries(EXERCISE_DATABASE)) {
  EXERCISE_ALIASES.set(canonical.toLowerCase(), canonical);
  for (const alias of aliases) {
    EXERCISE_ALIASES.set(alias.toLowerCase(), canonical);
  }
}

export class ExerciseMatcher {
  /**
   * Find the canonical exercise name for a given input
   */
  static findExercise(input: string): string | null {
    const normalized = input.toLowerCase().trim();
    
    // Exact match
    if (EXERCISE_ALIASES.has(normalized)) {
      return EXERCISE_ALIASES.get(normalized)!;
    }
    
    // Try fuzzy matching
    return this.fuzzyMatch(normalized);
  }

  /**
   * Fuzzy match exercise names
   */
  private static fuzzyMatch(input: string): string | null {
    let bestMatch: string | null = null;
    let bestScore = 0;
    const threshold = 0.7; // Minimum similarity score

    for (const [alias, canonical] of EXERCISE_ALIASES.entries()) {
      const score = this.similarity(input, alias);
      if (score > bestScore && score >= threshold) {
        bestScore = score;
        bestMatch = canonical;
      }
    }

    return bestMatch;
  }

  /**
   * Calculate similarity between two strings (0-1)
   */
  private static similarity(s1: string, s2: string): number {
    // Simple similarity based on common characters and order
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private static levenshteinDistance(s1: string, s2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[s2.length][s1.length];
  }

  /**
   * Get suggestions for a misspelled exercise name
   */
  static getSuggestions(input: string, maxSuggestions: number = 3): string[] {
    const normalized = input.toLowerCase().trim();
    const scores: Array<[string, number]> = [];

    for (const [alias, canonical] of EXERCISE_ALIASES.entries()) {
      let score = this.similarity(normalized, alias);
      
      // Boost score for substring matches
      if (alias.includes(normalized) || canonical.toLowerCase().includes(normalized)) {
        score = Math.max(score, 0.8);
      }
      
      // Boost score for word matches within exercise names
      const aliasWords = alias.split(/\s+/);
      const canonicalWords = canonical.toLowerCase().split(/\s+/);
      
      if (aliasWords.includes(normalized) || canonicalWords.includes(normalized)) {
        score = Math.max(score, 0.9);
      }
      
      if (score > 0.5) { // Lower threshold for suggestions
        scores.push([canonical, score]);
      }
    }

    // Sort by score and remove duplicates
    const seen = new Set<string>();
    return scores
      .sort((a, b) => b[1] - a[1])
      .filter(([exercise]) => {
        if (seen.has(exercise)) return false;
        seen.add(exercise);
        return true;
      })
      .slice(0, maxSuggestions)
      .map(([exercise]) => exercise);
  }

  /**
   * Check if a string likely contains an exercise name
   */
  static containsExercise(text: string): boolean {
    const words = text.toLowerCase().split(/\s+/);
    
    // Check if any combination of words matches an exercise
    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j <= words.length; j++) {
        const phrase = words.slice(i, j).join(' ');
        if (this.findExercise(phrase)) {
          return true;
        }
      }
    }
    
    return false;
  }
}