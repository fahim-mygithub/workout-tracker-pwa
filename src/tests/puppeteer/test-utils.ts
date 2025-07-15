import type { Page } from 'puppeteer';
import type { WorkoutData } from '../../types';

/**
 * Navigate to the workout page with a pre-configured workout
 */
export async function navigateToWorkout(page: Page, workoutData: Partial<WorkoutData>) {
  // First navigate to home page
  await page.goto('http://localhost:5173');
  await page.waitForSelector('h1');

  // Create a complete workout data object
  const completeWorkoutData: WorkoutData = {
    id: `test-workout-${Date.now()}`,
    name: workoutData.name || 'Test Workout',
    description: workoutData.description || '',
    exercises: workoutData.exercises || [],
    createdAt: new Date(),
    lastPerformed: null,
    userId: 'test-user',
    tags: []
  };

  // Navigate to workout page with state
  await page.evaluate((workout) => {
    window.history.pushState(
      { workout },
      '',
      '/workout'
    );
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, completeWorkoutData);

  // Wait for workout page to load
  await page.waitForSelector('.font-bold');
}

/**
 * Create a workout with specific exercises
 */
export function createWorkoutWithExercises(exercises: Array<{
  exerciseName: string;
  sets: Array<{
    targetReps: number;
    targetWeight?: number;
    targetTime?: number;
    targetDistance?: number;
  }>;
  restBetweenSets?: number;
  supersetWith?: string[];
}>): Partial<WorkoutData> {
  return {
    name: 'Test Workout',
    exercises: exercises.map((ex, index) => ({
      exerciseId: `exercise-${index}`,
      exerciseName: ex.exerciseName,
      sets: ex.sets.map((set, setIndex) => ({
        setNumber: setIndex + 1,
        targetReps: set.targetReps,
        targetWeight: set.targetWeight,
        targetTime: set.targetTime,
        targetDistance: set.targetDistance,
        actualReps: 0,
        actualWeight: 0,
        actualTime: 0,
        actualDistance: 0,
        completed: false,
        skipped: false,
        rpe: undefined
      })),
      restBetweenSets: ex.restBetweenSets || 120,
      supersetWith: ex.supersetWith,
      notes: ''
    }))
  };
}

/**
 * Complete a set with specific values
 */
export async function completeSet(
  page: Page, 
  actualReps: number, 
  actualWeight?: number
) {
  // Click complete button
  await page.click('button:has-text("Complete")');
  await page.waitForTimeout(500);

  // Fill in actual values
  const inputs = await page.$$('input[type="number"]');
  if (inputs[0]) {
    await inputs[0].click({ clickCount: 3 }); // Select all
    await inputs[0].type(actualReps.toString());
  }
  if (actualWeight && inputs[1]) {
    await inputs[1].click({ clickCount: 3 }); // Select all
    await inputs[1].type(actualWeight.toString());
  }

  // Save the set
  await page.click('button:has-text("Save")');
  await page.waitForTimeout(1000);
}

/**
 * Skip the rest timer
 */
export async function skipRestTimer(page: Page) {
  const skipButton = await page.$('button:has-text("Skip Rest")');
  if (skipButton) {
    await skipButton.click();
    await page.waitForTimeout(500);
  }
}

/**
 * Check if a specific exercise is active
 */
export async function isExerciseActive(page: Page, exerciseName: string): Promise<boolean> {
  const activeCard = await page.$('.ring-2.ring-primary');
  if (!activeCard) return false;
  
  const cardText = await activeCard.evaluate(el => el.textContent || '');
  return cardText.includes(exerciseName);
}

/**
 * Get the current set number
 */
export async function getCurrentSetNumber(page: Page): Promise<number | null> {
  const activeSet = await page.$('.bg-primary.text-primary-foreground');
  if (!activeSet) return null;
  
  const setNumber = await activeSet.evaluate(el => el.textContent || '');
  return parseInt(setNumber) || null;
}

/**
 * Get completed sets count for current exercise
 */
export async function getCompletedSetsCount(page: Page): Promise<number> {
  const completedSets = await page.$$('.bg-green-500\\/20');
  return completedSets.length;
}