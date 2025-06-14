import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  writeBatch,
  DocumentSnapshot,
  QueryConstraint 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Exercise, ExerciseFilter, ExerciseSearchResult, ExerciseStats } from '../types/exercise';

export class ExerciseService {
  private static readonly COLLECTION_NAME = 'exercises';
  private static readonly BATCH_SIZE = 500; // Firestore batch limit

  // Import exercises in batches
  static async importExercises(exercises: Exercise[]): Promise<void> {
    const batches = this.createBatches(exercises, this.BATCH_SIZE);
    
    for (let i = 0; i < batches.length; i++) {
      const batch = writeBatch(db);
      const exerciseBatch = batches[i];
      
      exerciseBatch.forEach(exercise => {
        const docRef = doc(collection(db, this.COLLECTION_NAME), exercise.id);
        batch.set(docRef, exercise);
      });
      
      await batch.commit();
      console.log(`Imported batch ${i + 1}/${batches.length} (${exerciseBatch.length} exercises)`);
    }
  }

  // Get exercise by ID
  static async getExerciseById(id: string): Promise<Exercise | null> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Exercise;
      }
      return null;
    } catch (error) {
      console.error('Error getting exercise:', error);
      throw error;
    }
  }

  // Search exercises with filters and pagination
  static async searchExercises(
    filter: ExerciseFilter = {}, 
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot
  ): Promise<ExerciseSearchResult> {
    try {
      const constraints: QueryConstraint[] = [];
      
      // Add filters
      if (filter.muscleGroup) {
        constraints.push(where('muscleGroup', '==', filter.muscleGroup));
      }
      
      if (filter.equipment) {
        constraints.push(where('equipment', '==', filter.equipment));
      }
      
      if (filter.difficulty) {
        constraints.push(where('difficulty', '==', filter.difficulty));
      }
      
      if (filter.force) {
        constraints.push(where('force', '==', filter.force));
      }
      
      if (filter.mechanic) {
        constraints.push(where('mechanic', '==', filter.mechanic));
      }
      
      if (filter.searchTerm) {
        constraints.push(where('searchKeywords', 'array-contains', filter.searchTerm.toLowerCase()));
      }
      
      // Add ordering and pagination
      constraints.push(orderBy('name'));
      constraints.push(limit(pageSize + 1)); // Get one extra to check if there are more
      
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }
      
      const q = query(collection(db, this.COLLECTION_NAME), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const exercises: Exercise[] = [];
      const docs = querySnapshot.docs;
      
      for (let i = 0; i < Math.min(docs.length, pageSize); i++) {
        const doc = docs[i];
        exercises.push({ id: doc.id, ...doc.data() } as Exercise);
      }
      
      return {
        exercises,
        totalCount: exercises.length,
        hasMore: docs.length > pageSize
      };
    } catch (error) {
      console.error('Error searching exercises:', error);
      throw error;
    }
  }

  // Get exercises by muscle group
  static async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    const result = await this.searchExercises({ muscleGroup }, 100);
    return result.exercises;
  }

  // Get unique values for filters
  static async getFilterOptions(): Promise<{
    muscleGroups: string[];
    equipment: string[];
    difficulties: string[];
  }> {
    try {
      // In a real implementation, you might want to maintain these in a separate collection
      // For now, we'll return predefined values based on the CSV structure
      return {
        muscleGroups: [
          'Biceps', 'Triceps', 'Chest', 'Back', 'Shoulders', 'Legs', 'Glutes', 
          'Abs', 'Forearms', 'Calves', 'Hamstrings', 'Quadriceps'
        ],
        equipment: [
          'Barbell', 'Dumbbells', 'Kettlebells', 'Cable', 'Machine', 
          'Bodyweight', 'Resistance Bands', 'Medicine Ball', 'Stretches'
        ],
        difficulties: ['Novice', 'Beginner', 'Intermediate', 'Advanced', 'Expert']
      };
    } catch (error) {
      console.error('Error getting filter options:', error);
      throw error;
    }
  }

  // Get exercise statistics
  static async getExerciseStats(): Promise<ExerciseStats> {
    try {
      const q = query(collection(db, this.COLLECTION_NAME));
      const querySnapshot = await getDocs(q);
      
      const stats: ExerciseStats = {
        totalExercises: querySnapshot.size,
        byMuscleGroup: {},
        byEquipment: {},
        byDifficulty: {
          'Novice': 0,
          'Beginner': 0,
          'Intermediate': 0,
          'Advanced': 0,
          'Expert': 0
        }
      };
      
      querySnapshot.forEach(doc => {
        const exercise = doc.data() as Exercise;
        
        // Count by muscle group
        stats.byMuscleGroup[exercise.muscleGroup] = 
          (stats.byMuscleGroup[exercise.muscleGroup] || 0) + 1;
        
        // Count by equipment
        stats.byEquipment[exercise.equipment] = 
          (stats.byEquipment[exercise.equipment] || 0) + 1;
        
        // Count by difficulty
        stats.byDifficulty[exercise.difficulty]++;
      });
      
      return stats;
    } catch (error) {
      console.error('Error getting exercise stats:', error);
      throw error;
    }
  }

  // Add a new exercise
  static async addExercise(exercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const exerciseData = {
        ...exercise,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), exerciseData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding exercise:', error);
      throw error;
    }
  }

  // Update an exercise
  static async updateExercise(id: string, updates: Partial<Exercise>): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating exercise:', error);
      throw error;
    }
  }

  // Delete an exercise
  static async deleteExercise(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting exercise:', error);
      throw error;
    }
  }

  // Helper method to create batches
  private static createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  // Clear all exercises (useful for re-import)
  static async clearAllExercises(): Promise<void> {
    try {
      const q = query(collection(db, this.COLLECTION_NAME));
      const querySnapshot = await getDocs(q);
      
      const batches = this.createBatches(querySnapshot.docs, this.BATCH_SIZE);
      
      for (const batch of batches) {
        const deleteBatch = writeBatch(db);
        batch.forEach(doc => {
          deleteBatch.delete(doc.ref);
        });
        await deleteBatch.commit();
      }
    } catch (error) {
      console.error('Error clearing exercises:', error);
      throw error;
    }
  }
}