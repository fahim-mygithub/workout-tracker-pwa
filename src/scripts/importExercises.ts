import { readFileSync } from 'fs';
import { join } from 'path';
import { CSVParser } from '../utils/csvParser';
import { ExerciseService } from '../services/exerciseService';
import type { Exercise } from '../types/exercise';

export class ExerciseImporter {
  static async importFromCSV(csvPath: string, clearExisting: boolean = false): Promise<{
    success: boolean;
    imported: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let imported = 0;
    
    try {
      console.log('Starting exercise import...');
      
      // Read CSV file
      const csvContent = readFileSync(csvPath, 'utf-8');
      console.log(`Read CSV file: ${csvPath}`);
      
      // Parse CSV
      const rawExercises = CSVParser.parseCSV(csvContent);
      console.log(`Parsed ${rawExercises.length} exercises from CSV`);
      
      // Transform to Exercise objects
      const exercises: Exercise[] = [];
      for (let i = 0; i < rawExercises.length; i++) {
        try {
          const exercise = CSVParser.transformExercise(rawExercises[i], i);
          exercises.push(exercise);
        } catch (error) {
          errors.push(`Error transforming exercise ${i}: ${error}`);
        }
      }
      
      console.log(`Transformed ${exercises.length} exercises`);
      
      // Clear existing exercises if requested
      if (clearExisting) {
        console.log('Clearing existing exercises...');
        await ExerciseService.clearAllExercises();
        console.log('Existing exercises cleared');
      }
      
      // Import to Firestore
      console.log('Importing exercises to Firestore...');
      await ExerciseService.importExercises(exercises);
      imported = exercises.length;
      
      console.log(`Successfully imported ${imported} exercises`);
      
      return {
        success: true,
        imported,
        errors
      };
      
    } catch (error) {
      const errorMessage = `Import failed: ${error}`;
      console.error(errorMessage);
      errors.push(errorMessage);
      
      return {
        success: false,
        imported,
        errors
      };
    }
  }
  
  static async verifyImport(): Promise<{
    success: boolean;
    totalExercises: number;
    sampleExercises: Exercise[];
    stats: any;
  }> {
    try {
      console.log('Verifying import...');
      
      // Get stats
      const stats = await ExerciseService.getExerciseStats();
      console.log(`Total exercises in database: ${stats.totalExercises}`);
      
      // Get sample exercises from different muscle groups
      const sampleExercises: Exercise[] = [];
      const muscleGroups = ['Biceps', 'Chest', 'Legs'];
      
      for (const muscleGroup of muscleGroups) {
        const exercises = await ExerciseService.getExercisesByMuscleGroup(muscleGroup);
        if (exercises.length > 0) {
          sampleExercises.push(exercises[0]);
        }
      }
      
      console.log(`Retrieved ${sampleExercises.length} sample exercises`);
      
      return {
        success: true,
        totalExercises: stats.totalExercises,
        sampleExercises,
        stats
      };
      
    } catch (error) {
      console.error('Verification failed:', error);
      return {
        success: false,
        totalExercises: 0,
        sampleExercises: [],
        stats: null
      };
    }
  }
}

// CLI script runner
export async function runImport() {
  const csvPath = join(process.cwd(), 'muscle_exercises.csv');
  
  console.log('=== Exercise Database Import ===');
  console.log(`CSV Path: ${csvPath}`);
  console.log('');
  
  // Import exercises
  const importResult = await ExerciseImporter.importFromCSV(csvPath, true);
  
  if (importResult.success) {
    console.log(`✅ Import successful: ${importResult.imported} exercises`);
    
    if (importResult.errors.length > 0) {
      console.log(`⚠️  ${importResult.errors.length} warnings:`);
      importResult.errors.forEach(error => console.log(`   - ${error}`));
    }
  } else {
    console.log('❌ Import failed');
    importResult.errors.forEach(error => console.log(`   - ${error}`));
    return;
  }
  
  // Verify import
  console.log('\n=== Verifying Import ===');
  const verifyResult = await ExerciseImporter.verifyImport();
  
  if (verifyResult.success) {
    console.log(`✅ Verification successful`);
    console.log(`📊 Total exercises: ${verifyResult.totalExercises}`);
    console.log(`🏋️  Sample exercises retrieved: ${verifyResult.sampleExercises.length}`);
    
    console.log('\n📈 Stats by muscle group:');
    Object.entries(verifyResult.stats.byMuscleGroup)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .forEach(([muscle, count]) => {
        console.log(`   ${muscle}: ${count} exercises`);
      });
  } else {
    console.log('❌ Verification failed');
  }
}

// Run if called directly
if (require.main === module) {
  runImport().catch(console.error);
}