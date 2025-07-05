import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { ExerciseHistory, PerformedSet } from '../types';

class ExerciseHistoryService {
  private readonly COLLECTION_NAME = 'exercise_history';

  /**
   * Log exercise performance during a workout
   */
  async logExercise(history: Omit<ExerciseHistory, 'id'>): Promise<string> {
    try {
      const historyRef = doc(collection(db, this.COLLECTION_NAME));
      const historyData = {
        ...history,
        performedAt: Timestamp.fromDate(history.performedAt),
        createdAt: serverTimestamp()
      };

      await setDoc(historyRef, historyData);
      
      // Check for personal records
      await this.checkAndUpdatePersonalRecords(history.userId, history.exerciseId, history);
      
      return historyRef.id;
    } catch (error) {
      console.error('Error logging exercise:', error);
      throw error;
    }
  }

  /**
   * Get exercise history for a specific user and exercise
   */
  async getExerciseHistory(
    userId: string, 
    exerciseId: string, 
    limitCount: number = 10
  ): Promise<ExerciseHistory[]> {
    try {
      // Simplified query without ordering to avoid index requirement
      const historyQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('exerciseId', '==', exerciseId)
      );

      const snapshot = await getDocs(historyQuery);
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        performedAt: doc.data().performedAt?.toDate() || new Date()
      } as ExerciseHistory));
      
      // Sort and limit on client side
      return history
        .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error getting exercise history:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Get all exercise history for a user
   */
  async getUserHistory(userId: string, limitCount: number = 50): Promise<ExerciseHistory[]> {
    try {
      // Simplified query without ordering to avoid index requirement
      const historyQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(historyQuery);
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        performedAt: doc.data().performedAt?.toDate() || new Date()
      } as ExerciseHistory));
      
      // Sort and limit on client side
      return history
        .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())
        .slice(0, limitCount);
    } catch (error) {
      console.error('Error getting user history:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Get workout history
   */
  async getWorkoutHistory(userId: string, workoutId: string): Promise<ExerciseHistory[]> {
    try {
      const historyQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('workoutId', '==', workoutId),
        orderBy('performedAt', 'desc')
      );

      const snapshot = await getDocs(historyQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        performedAt: doc.data().performedAt.toDate()
      } as ExerciseHistory));
    } catch (error) {
      console.error('Error getting workout history:', error);
      throw error;
    }
  }

  /**
   * Get personal records for an exercise
   */
  async getPersonalRecords(userId: string, exerciseId: string): Promise<{
    maxWeight: { weight: number; reps: number; date: Date } | null;
    maxReps: { weight: number; reps: number; date: Date } | null;
    maxVolume: { volume: number; sets: number; date: Date } | null;
  }> {
    try {
      const history = await this.getExerciseHistory(userId, exerciseId, 100);
      
      let maxWeight: { weight: number; reps: number; date: Date } | null = null;
      let maxReps: { weight: number; reps: number; date: Date } | null = null;
      let maxVolume: { volume: number; sets: number; date: Date } | null = null;

      history.forEach(entry => {
        entry.sets.forEach(set => {
          if (set.actualWeight && set.actualReps) {
            // Check max weight
            if (!maxWeight || set.actualWeight > maxWeight.weight) {
              maxWeight = {
                weight: set.actualWeight,
                reps: set.actualReps,
                date: entry.performedAt
              };
            }

            // Check max reps
            if (!maxReps || set.actualReps > maxReps.reps) {
              maxReps = {
                weight: set.actualWeight,
                reps: set.actualReps,
                date: entry.performedAt
              };
            }
          }
        });

        // Calculate volume for this entry
        const entryVolume = entry.sets.reduce((total, set) => {
          if (set.actualWeight && set.actualReps) {
            return total + (set.actualWeight * set.actualReps);
          }
          return total;
        }, 0);

        if (entryVolume > 0 && (!maxVolume || entryVolume > maxVolume.volume)) {
          maxVolume = {
            volume: entryVolume,
            sets: entry.sets.filter(s => s.completed).length,
            date: entry.performedAt
          };
        }
      });

      return { maxWeight, maxReps, maxVolume };
    } catch (error) {
      console.error('Error getting personal records:', error);
      throw error;
    }
  }

  /**
   * Check and update personal records
   */
  private async checkAndUpdatePersonalRecords(
    userId: string, 
    exerciseId: string, 
    newEntry: Omit<ExerciseHistory, 'id'>
  ): Promise<void> {
    try {
      const records = await this.getPersonalRecords(userId, exerciseId);
      const updates: ExerciseHistory['personalRecords'] = {};

      // Check each set for records
      newEntry.sets.forEach(set => {
        if (set.actualWeight && set.actualReps) {
          if (!records.maxWeight || set.actualWeight > records.maxWeight.weight) {
            updates.maxWeight = true;
          }
          if (!records.maxReps || set.actualReps > records.maxReps.reps) {
            updates.maxReps = true;
          }
        }
      });

      // Check volume
      const newVolume = newEntry.sets.reduce((total, set) => {
        if (set.actualWeight && set.actualReps) {
          return total + (set.actualWeight * set.actualReps);
        }
        return total;
      }, 0);

      if (!records.maxVolume || newVolume > records.maxVolume.volume) {
        updates.maxVolume = true;
      }

      // If any records were broken, update the entry
      if (Object.keys(updates).length > 0) {
        // You might want to trigger notifications here
        console.log('New personal records!', updates);
      }
    } catch (error) {
      console.error('Error checking personal records:', error);
    }
  }

  /**
   * Get exercise statistics
   */
  async getExerciseStats(userId: string, exerciseId: string): Promise<{
    totalSets: number;
    totalReps: number;
    totalVolume: number;
    avgWeight: number;
    avgReps: number;
    lastPerformed: Date | null;
    frequency: number; // times per week
  }> {
    try {
      const history = await this.getExerciseHistory(userId, exerciseId, 100);
      
      if (history.length === 0) {
        return {
          totalSets: 0,
          totalReps: 0,
          totalVolume: 0,
          avgWeight: 0,
          avgReps: 0,
          lastPerformed: null,
          frequency: 0
        };
      }

      let totalSets = 0;
      let totalReps = 0;
      let totalVolume = 0;
      let weightSum = 0;
      let weightCount = 0;

      history.forEach(entry => {
        entry.sets.forEach(set => {
          if (set.completed) {
            totalSets++;
            if (set.actualReps) {
              totalReps += set.actualReps;
            }
            if (set.actualWeight && set.actualReps) {
              totalVolume += set.actualWeight * set.actualReps;
              weightSum += set.actualWeight;
              weightCount++;
            }
          }
        });
      });

      // Calculate frequency (times per week)
      const oldestDate = history[history.length - 1].performedAt;
      const newestDate = history[0].performedAt;
      const weeksDiff = Math.max(1, (newestDate.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
      const frequency = history.length / weeksDiff;

      return {
        totalSets,
        totalReps,
        totalVolume,
        avgWeight: weightCount > 0 ? weightSum / weightCount : 0,
        avgReps: totalSets > 0 ? totalReps / totalSets : 0,
        lastPerformed: history[0].performedAt,
        frequency: Math.round(frequency * 10) / 10
      };
    } catch (error) {
      console.error('Error getting exercise stats:', error);
      throw error;
    }
  }

  /**
   * Delete exercise history entry
   */
  async deleteHistory(historyId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.COLLECTION_NAME, historyId));
    } catch (error) {
      console.error('Error deleting history:', error);
      throw error;
    }
  }

  /**
   * Update exercise history entry
   */
  async updateHistory(historyId: string, updates: Partial<ExerciseHistory>): Promise<void> {
    try {
      const historyRef = doc(db, this.COLLECTION_NAME, historyId);
      await updateDoc(historyRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating history:', error);
      throw error;
    }
  }
}

export const exerciseHistoryService = new ExerciseHistoryService();