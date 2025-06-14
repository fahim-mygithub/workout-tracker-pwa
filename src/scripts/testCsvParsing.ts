import { readFileSync } from 'fs';
import { join } from 'path';
import { CSVParser } from '../utils/csvParser';

async function testCSVParsing() {
  try {
    console.log('=== Testing CSV Parsing ===');
    
    const csvPath = join(process.cwd(), 'muscle_exercises.csv');
    console.log(`Reading CSV: ${csvPath}`);
    
    const csvContent = readFileSync(csvPath, 'utf-8');
    console.log(`CSV file size: ${csvContent.length} characters`);
    
    // Parse CSV
    const rawExercises = CSVParser.parseCSV(csvContent);
    console.log(`✅ Parsed ${rawExercises.length} raw exercises`);
    
    // Test first few exercises
    console.log('\n📋 Sample exercises:');
    for (let i = 0; i < Math.min(3, rawExercises.length); i++) {
      const raw = rawExercises[i];
      const transformed = CSVParser.transformExercise(raw, i);
      
      console.log(`\n${i + 1}. ${transformed.name}`);
      console.log(`   Muscle Group: ${transformed.muscleGroup}`);
      console.log(`   Equipment: ${transformed.equipment}`);
      console.log(`   Difficulty: ${transformed.difficulty}`);
      console.log(`   Instructions: ${transformed.instructions.length} steps`);
      console.log(`   Video Links: ${transformed.videoLinks.length} videos`);
      console.log(`   Search Keywords: ${transformed.searchKeywords.join(', ')}`);
      console.log(`   ID: ${transformed.id}`);
    }
    
    // Transform all exercises
    const exercises = rawExercises.map((raw, index) => 
      CSVParser.transformExercise(raw, index)
    );
    
    console.log(`\n✅ Transformed ${exercises.length} exercises`);
    
    // Analyze data
    const stats = {
      muscleGroups: new Set<string>(),
      equipment: new Set<string>(),
      difficulties: new Set<string>(),
      withVideos: 0,
      withInstructions: 0
    };
    
    exercises.forEach(exercise => {
      stats.muscleGroups.add(exercise.muscleGroup);
      stats.equipment.add(exercise.equipment);
      stats.difficulties.add(exercise.difficulty);
      if (exercise.videoLinks.length > 0) stats.withVideos++;
      if (exercise.instructions.length > 0) stats.withInstructions++;
    });
    
    console.log('\n📊 Data Statistics:');
    console.log(`   Total exercises: ${exercises.length}`);
    console.log(`   Unique muscle groups: ${stats.muscleGroups.size}`);
    console.log(`   Unique equipment types: ${stats.equipment.size}`);
    console.log(`   Difficulty levels: ${Array.from(stats.difficulties).join(', ')}`);
    console.log(`   Exercises with videos: ${stats.withVideos}`);
    console.log(`   Exercises with instructions: ${stats.withInstructions}`);
    
    console.log('\n🎯 Top muscle groups:');
    const muscleGroupCounts = new Map<string, number>();
    exercises.forEach(ex => {
      muscleGroupCounts.set(ex.muscleGroup, (muscleGroupCounts.get(ex.muscleGroup) || 0) + 1);
    });
    
    Array.from(muscleGroupCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([muscle, count]) => {
        console.log(`   ${muscle}: ${count} exercises`);
      });
    
    console.log('\n✅ CSV parsing test completed successfully!');
    
    return {
      success: true,
      totalExercises: exercises.length,
      stats
    };
    
  } catch (error) {
    console.error('❌ CSV parsing test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Run test
testCSVParsing();

export { testCSVParsing };