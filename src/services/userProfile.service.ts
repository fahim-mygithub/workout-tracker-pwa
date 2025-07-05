import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  addDoc,
  deleteDoc,
  enableNetwork,
  disableNetwork,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import type { 
  UserProfile, 
  WorkoutData, 
  ExerciseHistory, 
  SharedWorkout,
  BMIData,
  UnitConverters 
} from '../types';

class UserProfileService {
  private readonly USERS_COLLECTION = 'users';
  private readonly WORKOUTS_COLLECTION = 'workouts';
  private readonly EXERCISE_HISTORY_COLLECTION = 'exercise_history';
  private readonly SHARED_WORKOUTS_COLLECTION = 'shared_workouts';

  // Unit converters
  readonly converters: UnitConverters = {
    kgToLbs: (kg: number) => kg * 2.20462,
    lbsToKg: (lbs: number) => lbs / 2.20462,
    cmToFt: (cm: number) => {
      const totalInches = cm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return { feet, inches };
    },
    ftToCm: (feet: number, inches: number) => (feet * 12 + inches) * 2.54
  };

  // User Profile Methods
  async createUserProfile(uid: string, email: string, displayName: string): Promise<UserProfile> {
    const profile: UserProfile = {
      uid,
      email,
      displayName,
      heightUnit: 'cm',
      weightUnit: 'kg',
      preferences: {
        darkMode: false,
        unitSystem: 'metric',
        defaultRestTime: 90,
        autoStartTimer: true,
        notifications: {
          workoutReminders: true,
          restTimerAlerts: true,
          achievements: true
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await setDoc(doc(db, this.USERS_COLLECTION, uid), profile);
    return profile;
  }

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docRef = doc(db, this.USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        birthday: data.birthday?.toDate(),
        lastSyncedAt: data.lastSyncedAt?.toDate()
      } as UserProfile;
    }
    
    return null;
  }

  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const docRef = doc(db, this.USERS_COLLECTION, uid);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  async uploadProfilePicture(uid: string, file: File): Promise<string> {
    const storageRef = ref(storage, `profile-pictures/${uid}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    await this.updateUserProfile(uid, { photoURL: downloadURL });
    return downloadURL;
  }

  async deleteProfilePicture(uid: string): Promise<void> {
    const storageRef = ref(storage, `profile-pictures/${uid}`);
    try {
      await deleteObject(storageRef);
      await this.updateUserProfile(uid, { photoURL: undefined });
    } catch (error) {
      console.error('Error deleting profile picture:', error);
    }
  }

  // BMI Calculation
  calculateBMI(heightCm: number, weightKg: number): BMIData {
    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    
    let category: BMIData['category'];
    if (bmi < 18.5) category = 'underweight';
    else if (bmi < 25) category = 'normal';
    else if (bmi < 30) category = 'overweight';
    else category = 'obese';

    // Calculate healthy weight range (BMI 18.5-24.9)
    const minHealthyWeight = 18.5 * heightM * heightM;
    const maxHealthyWeight = 24.9 * heightM * heightM;

    return {
      bmi: Math.round(bmi * 10) / 10,
      category,
      healthyWeightRange: {
        min: Math.round(minHealthyWeight),
        max: Math.round(maxHealthyWeight)
      }
    };
  }

  // Workout Management
  async saveWorkout(workout: Omit<WorkoutData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.WORKOUTS_COLLECTION), {
      ...workout,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      performanceCount: 0
    });
    
    return docRef.id;
  }

  async getUserWorkouts(uid: string): Promise<WorkoutData[]> {
    try {
      // Simplified query without ordering to avoid index requirement
      const q = query(
        collection(db, this.WORKOUTS_COLLECTION),
        where('userId', '==', uid)
      );
      
      const snapshot = await getDocs(q);
      const workouts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastPerformedAt: doc.data().lastPerformedAt?.toDate()
      } as WorkoutData));
      
      // Sort by updatedAt on the client side
      return workouts.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error getting user workouts:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  async updateWorkout(workoutId: string, updates: Partial<WorkoutData>): Promise<void> {
    const docRef = doc(db, this.WORKOUTS_COLLECTION, workoutId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  }

  async deleteWorkout(workoutId: string): Promise<void> {
    await deleteDoc(doc(db, this.WORKOUTS_COLLECTION, workoutId));
  }

  // Workout Sharing
  async shareWorkout(workoutId: string, userId: string): Promise<string> {
    const workout = await getDoc(doc(db, this.WORKOUTS_COLLECTION, workoutId));
    if (!workout.exists()) throw new Error('Workout not found');
    
    const userProfile = await this.getUserProfile(userId);
    if (!userProfile) throw new Error('User profile not found');

    const shareableId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    await addDoc(collection(db, this.SHARED_WORKOUTS_COLLECTION), {
      shareableId,
      workoutData: workout.data(),
      sharedBy: {
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL
      },
      sharedAt: Timestamp.now(),
      viewCount: 0
    });

    await this.updateWorkout(workoutId, { shareableId, isPublic: true });
    
    return shareableId;
  }

  async getSharedWorkout(shareableId: string): Promise<SharedWorkout> {
    const q = query(
      collection(db, this.SHARED_WORKOUTS_COLLECTION),
      where('shareableId', '==', shareableId),
      firestoreLimit(1)
    );
    
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      throw new Error('Shared workout not found');
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    // Increment view count
    await updateDoc(doc.ref, { viewCount: (data.viewCount || 0) + 1 });
    
    return {
      id: doc.id,
      ...data,
      sharedAt: data.sharedAt?.toDate() || new Date()
    } as SharedWorkout;
  }

  async copySharedWorkout(shareableId: string, userId: string): Promise<string> {
    const sharedWorkout = await this.getSharedWorkout(shareableId);
    if (!sharedWorkout) throw new Error('Shared workout not found');
    
    return this.saveWorkout({
      ...sharedWorkout.workoutData,
      userId,
      name: `${sharedWorkout.workoutData.name} (Copy)`,
      isPublic: false,
      shareableId: undefined
    });
  }

  // Exercise History
  async saveExerciseHistory(history: Omit<ExerciseHistory, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, this.EXERCISE_HISTORY_COLLECTION), {
      ...history,
      performedAt: Timestamp.now()
    });
    
    return docRef.id;
  }

  async getExerciseHistory(
    userId: string, 
    exerciseId?: string, 
    limit: number = 50
  ): Promise<ExerciseHistory[]> {
    try {
      // Build query without ordering to avoid index requirement
      let q = query(
        collection(db, this.EXERCISE_HISTORY_COLLECTION),
        where('userId', '==', userId)
      );
      
      if (exerciseId) {
        q = query(q, where('exerciseId', '==', exerciseId));
      }
      
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        performedAt: doc.data().performedAt?.toDate() || new Date()
      } as ExerciseHistory));
      
      // Sort by performedAt on the client side and apply limit
      return history
        .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting exercise history:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  }

  // Offline Support
  async enableOfflineSupport(): Promise<void> {
    await disableNetwork(db);
  }

  async enableOnlineSupport(): Promise<void> {
    await enableNetwork(db);
  }

  // Real-time listeners
  subscribeToProfile(uid: string, callback: (profile: UserProfile | null) => void): () => void {
    const docRef = doc(db, this.USERS_COLLECTION, uid);
    
    return onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          birthday: data.birthday?.toDate(),
          lastSyncedAt: data.lastSyncedAt?.toDate()
        } as UserProfile);
      } else {
        callback(null);
      }
    });
  }
}

export const userProfileService = new UserProfileService();