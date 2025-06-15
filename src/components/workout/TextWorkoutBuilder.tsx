import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { startWorkout } from '../../store/slices/workoutSlice';
import { WorkoutParser, ExerciseMatcher } from '../../parser';
import type { ParseResult, ParseError, Exercise as ParsedExercise } from '../../parser/types';
import type { ActiveWorkout, WorkoutExercise, WorkoutSet } from '../../store/slices/workoutSlice';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Textarea,
  Alert,
  Modal,
  Flex,
  Grid,
} from '../ui';
import { 
  Play, 
  Save, 
  FileText, 
  HelpCircle, 
  Eye, 
  EyeOff, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Weight
} from 'lucide-react';

interface TextWorkoutBuilderProps {
  onWorkoutStart?: (workout: ActiveWorkout) => void;
  initialText?: string;
  className?: string;
}

interface WorkoutPreview {
  totalExercises: number;
  totalSets: number;
  estimatedTime: number;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    weight?: string;
  }>;
}

export const TextWorkoutBuilder: React.FC<TextWorkoutBuilderProps> = ({
  onWorkoutStart,
  initialText = '',
  className = '',
}) => {
  const dispatch = useDispatch();
  const parser = useRef(new WorkoutParser());
  
  const [workoutText, setWorkoutText] = useState(initialText);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [workoutPreview, setWorkoutPreview] = useState<WorkoutPreview | null>(null);

  // Parse workout text with debouncing
  const parseWorkout = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      
      return (text: string) => {
        clearTimeout(timeoutId);
        setIsLoading(true);
        
        timeoutId = setTimeout(() => {
          try {
            const result = parser.current.parse(text);
            setParseResult(result);
            
            if (result.success && result.workout) {
              const preview = generateWorkoutPreview(result.workout);
              setWorkoutPreview(preview);
            } else {
              setWorkoutPreview(null);
            }
          } catch (error) {
            console.error('Parsing error:', error);
            setParseResult({
              success: false,
              errors: [{
                position: 0,
                line: 1,
                column: 1,
                message: 'Unexpected parsing error',
                severity: 'error'
              }],
              suggestions: []
            });
          }
          setIsLoading(false);
        }, 300);
      };
    })(),
    []
  );

  // Generate workout preview data
  const generateWorkoutPreview = (workout: any): WorkoutPreview => {
    let totalExercises = 0;
    let totalSets = 0;
    let estimatedTime = 0;
    const exercises: WorkoutPreview['exercises'] = [];

    workout.groups?.forEach((group: any) => {
      group.exercises?.forEach((exercise: any) => {
        totalExercises++;
        const setCount = exercise.sets?.length || 0;
        totalSets += setCount;
        
        // Estimate time: ~45s per set + rest time
        estimatedTime += setCount * 45;
        if (exercise.rest) {
          estimatedTime += setCount * exercise.rest;
        } else {
          estimatedTime += setCount * 90; // Default rest
        }

        // Format sets display
        const repsDisplay = exercise.sets?.map((set: any) => {
          if (typeof set.reps === 'object' && set.reps.min && set.reps.max) {
            return `${set.reps.min}-${set.reps.max}`;
          }
          return set.reps?.toString() || '?';
        }).join(', ') || '?';

        const weightDisplay = exercise.sets?.[0]?.weight 
          ? `${exercise.sets[0].weight.value}${exercise.sets[0].weight.unit || 'lbs'}`
          : undefined;

        exercises.push({
          name: exercise.name,
          sets: setCount,
          reps: repsDisplay,
          weight: weightDisplay,
        });
      });
    });

    return {
      totalExercises,
      totalSets,
      estimatedTime: Math.round(estimatedTime / 60), // Convert to minutes
      exercises,
    };
  };

  // Convert parsed workout to Redux format
  const convertToWorkoutState = (parsedWorkout: any): ActiveWorkout => {
    const exercises: WorkoutExercise[] = [];
    let exerciseCounter = 0;

    parsedWorkout.groups?.forEach((group: any) => {
      group.exercises?.forEach((exercise: ParsedExercise) => {
        exerciseCounter++;
        
        const sets: WorkoutSet[] = exercise.sets.map((set, index) => ({
          id: `set-${exerciseCounter}-${index + 1}`,
          reps: typeof set.reps === 'object' ? set.reps.min : (set.reps === 'AMRAP' ? undefined : Number(set.reps)),
          weight: set.weight?.value,
          completed: false,
          rpe: set.rpe,
        }));

        exercises.push({
          id: `exercise-${exerciseCounter}`,
          exerciseId: exercise.name.toLowerCase().replace(/\s+/g, '-'),
          exerciseName: exercise.name,
          sets,
          restTimeSeconds: exercise.sets[0]?.rest || 90,
          notes: exercise.notes?.join(', '),
          completed: false,
          isSuperset: group.type === 'superset',
          supersetGroup: group.type === 'superset' ? `superset-${exerciseCounter}` : undefined,
        });
      });
    });

    return {
      id: `workout-${Date.now()}`,
      name: 'Text Workout',
      exercises,
      startTime: new Date().toISOString(),
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      totalDuration: 0,
      isActive: false,
    };
  };

  // Handle text changes
  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setWorkoutText(text);
    if (text.trim()) {
      parseWorkout(text);
    } else {
      setParseResult(null);
      setWorkoutPreview(null);
    }
  };

  // Start workout
  const handleStartWorkout = () => {
    if (parseResult?.success && parseResult.workout) {
      const workoutData = convertToWorkoutState(parseResult.workout);
      dispatch(startWorkout(workoutData));
      onWorkoutStart?.(workoutData);
    }
  };

  // Save workout text
  const handleSaveWorkout = () => {
    if (workoutText.trim()) {
      const savedWorkouts = JSON.parse(localStorage.getItem('savedWorkouts') || '[]');
      const newWorkout = {
        id: Date.now(),
        name: `Workout ${new Date().toLocaleDateString()}`,
        text: workoutText,
        createdAt: new Date().toISOString(),
      };
      savedWorkouts.push(newWorkout);
      localStorage.setItem('savedWorkouts', JSON.stringify(savedWorkouts));
      // Show success feedback
    }
  };

  // Parse initial text on mount
  useEffect(() => {
    if (initialText.trim()) {
      parseWorkout(initialText);
    }
  }, [initialText, parseWorkout]);

  const hasErrors = parseResult?.errors?.some(error => error.severity === 'error');
  const hasWarnings = parseResult?.errors?.some(error => error.severity === 'warning');

  return (
    <Container maxWidth="xl" className={className}>
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center">
          <Typography variant="h3" className="font-bold mb-2">
            Text Workout Builder
          </Typography>
          <Typography variant="body1" color="secondary">
            Create workouts using natural language syntax
          </Typography>
        </div>

        <Grid cols={1} lg={2} gap="lg">
          {/* Text Input Section */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <Typography variant="h6" className="font-semibold">
                    Workout Text
                  </Typography>
                  <Flex gap="sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHelp(true)}
                    >
                      <HelpCircle className="w-4 h-4 mr-1" />
                      Help
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </Flex>
                </div>

                <Textarea
                  value={workoutText}
                  onChange={handleTextChange}
                  placeholder={`Enter your workout using natural language:

5x10 Bench Press @225lbs
3x8-12 RDL 185kg
4x15 Leg Press ss 4x12 Leg Curls
3xAMRAP Push-ups BW
12/10/8 Curls 45lbs (drop set)`}
                  rows={12}
                  autoResize
                  className="font-mono text-sm"
                  helperText="Use natural language to describe your workout"
                />
              </CardContent>
            </Card>

            {/* Parse Status */}
            {parseResult && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {parseResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <Typography variant="h6" className="font-semibold">
                      Parse Status
                    </Typography>
                  </div>

                  {parseResult.success ? (
                    <Alert variant="success" title="Workout parsed successfully!" />
                  ) : (
                    <div className="space-y-2">
                      {parseResult.errors.map((error, index) => (
                        <Alert
                          key={index}
                          variant={error.severity === 'error' ? 'error' : 'warning'}
                          title={`Line ${error.line}: ${error.message}`}
                          description={error.suggestion}
                        />
                      ))}
                    </div>
                  )}

                  {/* Suggestions */}
                  {parseResult.suggestions.length > 0 && (
                    <div className="mt-4">
                      <Typography variant="body2" className="font-medium mb-2">
                        Suggestions:
                      </Typography>
                      {parseResult.suggestions.map((suggestion, index) => (
                        <div key={index} className="text-sm text-blue-600">
                          Did you mean "{suggestion.suggestion}" instead of "{suggestion.original}"?
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="space-y-4">
              {workoutPreview && (
                <Card>
                  <CardContent className="p-4">
                    <Typography variant="h6" className="font-semibold mb-4">
                      Workout Overview
                    </Typography>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {workoutPreview.totalExercises}
                        </div>
                        <Typography variant="body2" color="secondary">
                          Exercises
                        </Typography>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {workoutPreview.totalSets}
                        </div>
                        <Typography variant="body2" color="secondary">
                          Total Sets
                        </Typography>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="text-2xl font-bold text-orange-600">
                            {workoutPreview.estimatedTime}m
                          </span>
                        </div>
                        <Typography variant="body2" color="secondary">
                          Est. Time
                        </Typography>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {workoutPreview.exercises.map((exercise, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 bg-gray-50 rounded"
                        >
                          <div>
                            <Typography variant="body2" className="font-medium">
                              {exercise.name}
                            </Typography>
                            <Typography variant="body2" color="secondary">
                              {exercise.sets} sets × {exercise.reps}
                            </Typography>
                          </div>
                          {exercise.weight && (
                            <div className="flex items-center gap-1">
                              <Weight className="w-3 h-3 text-gray-500" />
                              <Typography variant="body2" color="secondary">
                                {exercise.weight}
                              </Typography>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              {parseResult?.success && (
                <Card>
                  <CardContent className="p-4">
                    <Flex gap="sm" direction="column">
                      <Button
                        variant="primary"
                        onClick={handleStartWorkout}
                        className="w-full"
                        disabled={!parseResult.success}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Workout
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleSaveWorkout}
                        className="w-full"
                        disabled={!workoutText.trim()}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Workout
                      </Button>
                    </Flex>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </Grid>

        {/* Help Modal */}
        <Modal
          isOpen={showHelp}
          onClose={() => setShowHelp(false)}
          title="Workout Syntax Help"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <Typography variant="h6" className="font-semibold mb-2">
                Basic Format
              </Typography>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                sets x reps Exercise Name @weight
              </div>
            </div>

            <div>
              <Typography variant="h6" className="font-semibold mb-2">
                Examples
              </Typography>
              <div className="space-y-2 text-sm">
                <div><strong>5x10 Bench Press @225lbs</strong> - 5 sets of 10 reps at 225 pounds</div>
                <div><strong>3x8-12 RDL 185kg</strong> - 3 sets of 8-12 reps with 185 kg</div>
                <div><strong>4x15 Leg Press ss 4x12 Leg Curls</strong> - Superset</div>
                <div><strong>3xAMRAP Push-ups BW</strong> - 3 sets as many reps as possible, bodyweight</div>
                <div><strong>12/10/8 Curls 45lbs</strong> - Drop set: 12, then 10, then 8 reps</div>
                <div><strong>5x5 Squat @80% RPE8</strong> - With RPE and percentage</div>
              </div>
            </div>

            <div>
              <Typography variant="h6" className="font-semibold mb-2">
                Advanced Features
              </Typography>
              <div className="space-y-1 text-sm">
                <div><strong>ss</strong> - Superset (exercises performed back-to-back)</div>
                <div><strong>RPE8</strong> - Rate of Perceived Exertion (1-10 scale)</div>
                <div><strong>@80%</strong> - Percentage of 1RM</div>
                <div><strong>BW</strong> - Bodyweight</div>
                <div><strong>R90s</strong> - Rest 90 seconds between sets</div>
                <div><strong>tempo 3-1-2</strong> - Tempo: 3s down, 1s pause, 2s up</div>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </Container>
  );
};