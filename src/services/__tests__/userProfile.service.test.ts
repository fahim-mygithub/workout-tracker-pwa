import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { userProfileService } from '../userProfile.service';
import { UserProfile, WorkoutData, ExerciseHistory } from '../../types';
import * as firestore from 'firebase/firestore';
import * as storage from 'firebase/storage';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  deleteDoc: vi.fn(),
  enableNetwork: vi.fn(),
  disableNetwork: vi.fn(),
  onSnapshot: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() }))
  }
}));

vi.mock('firebase/storage', () => ({
  ref: vi.fn(),
  uploadBytes: vi.fn(),
  getDownloadURL: vi.fn(),
  deleteObject: vi.fn()
}));

vi.mock('../../firebase/config', () => ({
  db: {},
  storage: {}
}));

describe('UserProfileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Unit Converters', () => {
    it('should convert kg to lbs correctly', () => {
      expect(userProfileService.converters.kgToLbs(70)).toBeCloseTo(154.32, 2);
    });

    it('should convert lbs to kg correctly', () => {
      expect(userProfileService.converters.lbsToKg(154.32)).toBeCloseTo(70, 2);
    });

    it('should convert cm to feet and inches correctly', () => {
      const result = userProfileService.converters.cmToFt(180);
      expect(result.feet).toBe(5);
      expect(result.inches).toBe(11);
    });

    it('should convert feet and inches to cm correctly', () => {
      expect(userProfileService.converters.ftToCm(5, 11)).toBeCloseTo(180.34, 1);
    });
  });

  describe('BMI Calculation', () => {
    it('should calculate BMI correctly', () => {
      const result = userProfileService.calculateBMI(180, 75);
      expect(result.bmi).toBeCloseTo(23.1, 1);
      expect(result.category).toBe('normal');
    });

    it('should categorize underweight correctly', () => {
      const result = userProfileService.calculateBMI(170, 50);
      expect(result.category).toBe('underweight');
    });

    it('should categorize overweight correctly', () => {
      const result = userProfileService.calculateBMI(170, 80);
      expect(result.category).toBe('overweight');
    });

    it('should categorize obese correctly', () => {
      const result = userProfileService.calculateBMI(170, 100);
      expect(result.category).toBe('obese');
    });

    it('should calculate healthy weight range', () => {
      const result = userProfileService.calculateBMI(180, 75);
      expect(result.healthyWeightRange.min).toBeCloseTo(60, 0);
      expect(result.healthyWeightRange.max).toBeCloseTo(81, 0);
    });
  });

  describe('User Profile Methods', () => {
    it('should create a new user profile', async () => {
      const mockSetDoc = vi.mocked(firestore.setDoc);
      mockSetDoc.mockResolvedValueOnce();

      const profile = await userProfileService.createUserProfile(
        'test-uid',
        'test@example.com',
        'Test User'
      );

      expect(profile.uid).toBe('test-uid');
      expect(profile.email).toBe('test@example.com');
      expect(profile.displayName).toBe('Test User');
      expect(profile.preferences.darkMode).toBe(false);
      expect(profile.preferences.unitSystem).toBe('metric');
      expect(mockSetDoc).toHaveBeenCalled();
    });

    it('should get user profile', async () => {
      const mockGetDoc = vi.mocked(firestore.getDoc);
      const mockProfile = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: { toDate: () => new Date() },
        updatedAt: { toDate: () => new Date() }
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockProfile
      } as any);

      const profile = await userProfileService.getUserProfile('test-uid');
      expect(profile).toBeTruthy();
      expect(profile?.uid).toBe('test-uid');
    });

    it('should return null for non-existent profile', async () => {
      const mockGetDoc = vi.mocked(firestore.getDoc);
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      } as any);

      const profile = await userProfileService.getUserProfile('non-existent');
      expect(profile).toBeNull();
    });

    it('should update user profile', async () => {
      const mockUpdateDoc = vi.mocked(firestore.updateDoc);
      mockUpdateDoc.mockResolvedValueOnce();

      await userProfileService.updateUserProfile('test-uid', {
        displayName: 'Updated Name',
        weight: 75
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
    });
  });

  describe('Profile Picture Methods', () => {
    it('should upload profile picture', async () => {
      const mockUploadBytes = vi.mocked(storage.uploadBytes);
      const mockGetDownloadURL = vi.mocked(storage.getDownloadURL);
      const mockUpdateDoc = vi.mocked(firestore.updateDoc);

      mockUploadBytes.mockResolvedValueOnce({
        ref: 'mock-ref'
      } as any);
      mockGetDownloadURL.mockResolvedValueOnce('https://example.com/photo.jpg');
      mockUpdateDoc.mockResolvedValueOnce();

      const file = new File([''], 'photo.jpg', { type: 'image/jpeg' });
      const url = await userProfileService.uploadProfilePicture('test-uid', file);

      expect(url).toBe('https://example.com/photo.jpg');
      expect(mockUploadBytes).toHaveBeenCalled();
      expect(mockGetDownloadURL).toHaveBeenCalled();
    });

    it('should delete profile picture', async () => {
      const mockDeleteObject = vi.mocked(storage.deleteObject);
      const mockUpdateDoc = vi.mocked(firestore.updateDoc);

      mockDeleteObject.mockResolvedValueOnce();
      mockUpdateDoc.mockResolvedValueOnce();

      await userProfileService.deleteProfilePicture('test-uid');

      expect(mockDeleteObject).toHaveBeenCalled();
      expect(mockUpdateDoc).toHaveBeenCalled();
    });
  });

  describe('Workout Management', () => {
    it('should save a workout', async () => {
      const mockAddDoc = vi.mocked(firestore.addDoc);
      mockAddDoc.mockResolvedValueOnce({ id: 'workout-123' } as any);

      const workoutData = {
        userId: 'test-uid',
        name: 'Test Workout',
        exercises: [],
        tags: ['strength'],
        isPublic: false
      };

      const id = await userProfileService.saveWorkout(workoutData);
      expect(id).toBe('workout-123');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should get user workouts', async () => {
      const mockGetDocs = vi.mocked(firestore.getDocs);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'workout-123',
          data: () => ({
            name: 'Test Workout',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() }
          })
        }]
      } as any);

      const workouts = await userProfileService.getUserWorkouts('test-uid');
      expect(workouts).toHaveLength(1);
      expect(workouts[0].id).toBe('workout-123');
    });

    it('should update a workout', async () => {
      const mockUpdateDoc = vi.mocked(firestore.updateDoc);
      mockUpdateDoc.mockResolvedValueOnce();

      await userProfileService.updateWorkout('workout-123', {
        name: 'Updated Workout'
      });

      expect(mockUpdateDoc).toHaveBeenCalled();
    });

    it('should delete a workout', async () => {
      const mockDeleteDoc = vi.mocked(firestore.deleteDoc);
      mockDeleteDoc.mockResolvedValueOnce();

      await userProfileService.deleteWorkout('workout-123');
      expect(mockDeleteDoc).toHaveBeenCalled();
    });
  });

  describe('Workout Sharing', () => {
    it('should share a workout', async () => {
      const mockGetDoc = vi.mocked(firestore.getDoc);
      const mockAddDoc = vi.mocked(firestore.addDoc);
      const mockUpdateDoc = vi.mocked(firestore.updateDoc);

      mockGetDoc.mockImplementation(() => Promise.resolve({
        exists: () => true,
        data: () => ({ name: 'Test Workout' })
      } as any));

      mockAddDoc.mockResolvedValueOnce({ id: 'shared-123' } as any);
      mockUpdateDoc.mockResolvedValueOnce();

      const shareableId = await userProfileService.shareWorkout('workout-123', 'test-uid');
      expect(shareableId).toMatch(/^\d+-[a-z0-9]{9}$/);
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should get shared workout', async () => {
      const mockGetDocs = vi.mocked(firestore.getDocs);
      const mockUpdateDoc = vi.mocked(firestore.updateDoc);

      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [{
          id: 'shared-123',
          ref: {},
          data: () => ({
            shareableId: 'test-shareable-id',
            workoutData: { name: 'Shared Workout' },
            sharedBy: { displayName: 'Test User' },
            sharedAt: { toDate: () => new Date() },
            viewCount: 0
          })
        }]
      } as any);

      mockUpdateDoc.mockResolvedValueOnce();

      const shared = await userProfileService.getSharedWorkout('test-shareable-id');
      expect(shared).toBeTruthy();
      expect(shared?.id).toBe('shared-123');
      expect(mockUpdateDoc).toHaveBeenCalled(); // View count increment
    });

    it('should copy shared workout', async () => {
      const mockGetSharedWorkout = vi.spyOn(userProfileService, 'getSharedWorkout');
      const mockSaveWorkout = vi.spyOn(userProfileService, 'saveWorkout');

      mockGetSharedWorkout.mockResolvedValueOnce({
        id: 'shared-123',
        workoutData: {
          name: 'Shared Workout',
          exercises: [],
          tags: []
        } as any,
        sharedBy: { displayName: 'Test User' },
        sharedAt: new Date(),
        viewCount: 1
      });

      mockSaveWorkout.mockResolvedValueOnce('new-workout-123');

      const newId = await userProfileService.copySharedWorkout('test-shareable-id', 'test-uid');
      expect(newId).toBe('new-workout-123');
      expect(mockSaveWorkout).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Shared Workout (Copy)',
          userId: 'test-uid',
          isPublic: false
        })
      );
    });
  });

  describe('Exercise History', () => {
    it('should save exercise history', async () => {
      const mockAddDoc = vi.mocked(firestore.addDoc);
      mockAddDoc.mockResolvedValueOnce({ id: 'history-123' } as any);

      const history = {
        userId: 'test-uid',
        exerciseId: 'exercise-123',
        exerciseName: 'Bench Press',
        sets: [{ reps: 10, weight: 60 }]
      };

      const id = await userProfileService.saveExerciseHistory(history);
      expect(id).toBe('history-123');
      expect(mockAddDoc).toHaveBeenCalled();
    });

    it('should get exercise history', async () => {
      const mockGetDocs = vi.mocked(firestore.getDocs);
      mockGetDocs.mockResolvedValueOnce({
        docs: [{
          id: 'history-123',
          data: () => ({
            exerciseId: 'exercise-123',
            exerciseName: 'Bench Press',
            performedAt: { toDate: () => new Date() }
          })
        }]
      } as any);

      const history = await userProfileService.getExerciseHistory('test-uid');
      expect(history).toHaveLength(1);
      expect(history[0].id).toBe('history-123');
    });

    it('should filter exercise history by exerciseId', async () => {
      const mockQuery = vi.mocked(firestore.query);
      const mockWhere = vi.mocked(firestore.where);
      const mockGetDocs = vi.mocked(firestore.getDocs);

      mockGetDocs.mockResolvedValueOnce({ docs: [] } as any);

      await userProfileService.getExerciseHistory('test-uid', 'exercise-123', 10);
      
      expect(mockWhere).toHaveBeenCalledWith('exerciseId', '==', 'exercise-123');
    });
  });

  describe('Offline Support', () => {
    it('should enable offline support', async () => {
      const mockDisableNetwork = vi.mocked(firestore.disableNetwork);
      mockDisableNetwork.mockResolvedValueOnce();

      await userProfileService.enableOfflineSupport();
      expect(mockDisableNetwork).toHaveBeenCalled();
    });

    it('should enable online support', async () => {
      const mockEnableNetwork = vi.mocked(firestore.enableNetwork);
      mockEnableNetwork.mockResolvedValueOnce();

      await userProfileService.enableOnlineSupport();
      expect(mockEnableNetwork).toHaveBeenCalled();
    });
  });

  describe('Real-time listeners', () => {
    it('should subscribe to profile changes', () => {
      const mockOnSnapshot = vi.mocked(firestore.onSnapshot);
      const mockUnsubscribe = vi.fn();
      const callback = vi.fn();

      mockOnSnapshot.mockReturnValueOnce(mockUnsubscribe);

      const unsubscribe = userProfileService.subscribeToProfile('test-uid', callback);
      
      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });
});