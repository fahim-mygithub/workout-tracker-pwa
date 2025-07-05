import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { startWorkout } from '../../store/slices/workoutSlice';
import { parserService } from '../../parser/parserService';
import { ExerciseMatcher } from '../../parser';
import type { ParseResult, ParseError, Exercise as ParsedExercise, Workout } from '../../parser';
import type { ActiveWorkout, WorkoutExercise, WorkoutSet } from '../../store/slices/workoutSlice';
import { useAuth } from '../../contexts/AuthContext';
import { userProfileService } from '../../services/userProfile.service';
import type { WorkoutData, WorkoutExercise as ServiceWorkoutExercise } from '../../types';
import { EditableWorkoutPreview } from './EditableWorkoutPreview';
import './TextWorkoutBuilder.css';
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
  Input,
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
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [workoutText, setWorkoutText] = useState(initialText);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [workoutPreview, setWorkoutPreview] = useState<WorkoutPreview | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [workoutTags, setWorkoutTags] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editedWorkout, setEditedWorkout] = useState<Workout | null>(null);
  const [isEditingPreview, setIsEditingPreview] = useState(false);
  const [mobileTab, setMobileTab] = useState<'text' | 'preview'>('text');

  // Parse workout text with debouncing
  const parseWorkout = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      
      return async (text: string) => {
        clearTimeout(timeoutId);
        
        // Get dynamic debounce delay based on text length
        const delay = parserService.getDebounceDelay(text.length);
        
        // Show parsing indicator immediately for better UX
        if (text.length > 100) {
          setIsParsing(true);
        }
        
        timeoutId = setTimeout(async () => {
          setIsLoading(true);
          
          try {
            console.log('Parsing text:', text); // Debug log
            const result = await parserService.parse(text);
            setParseResult(result);
            
            if (result.success && result.workout) {
              const preview = generateWorkoutPreview(result.workout);
              setWorkoutPreview(preview);
              setEditedWorkout(result.workout);
            } else {
              setWorkoutPreview(null);
              setEditedWorkout(null);
            }
          } catch (error) {
            console.error('Parsing error:', error);
            console.error('Text that caused error:', text); // Debug log
            
            // Check for specific errors
            let errorMessage = 'Unexpected parsing error';
            if (error instanceof Error) {
              if (error.message.includes('Invalid array length')) {
                errorMessage = 'Invalid input format. Please check your workout notation.';
              } else {
                errorMessage = error.message;
              }
            }
            
            setParseResult({
              success: false,
              errors: [{
                position: 0,
                line: 1,
                column: 1,
                message: errorMessage,
                severity: 'error'
              }],
              suggestions: []
            });
          } finally {
            setIsLoading(false);
            setIsParsing(false);
          }
        }, delay);
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

        // Format sets display - show unique rep schemes
        const repsDisplay = (() => {
          if (!exercise.sets || exercise.sets.length === 0) return '?';
          
          // Check if all sets have the same reps
          const firstReps = exercise.sets[0].reps;
          const allSame = exercise.sets.every((set: any) => {
            if (typeof set.reps === 'object' && typeof firstReps === 'object') {
              return set.reps.min === firstReps.min && set.reps.max === firstReps.max;
            }
            return set.reps === firstReps;
          });
          
          if (allSame) {
            // Show as "5x8-10" format
            if (typeof firstReps === 'object' && firstReps.min && firstReps.max) {
              return `${firstReps.min}-${firstReps.max}`;
            }
            return firstReps?.toString() || '?';
          } else {
            // Show individual reps for each set
            return exercise.sets.map((set: any) => {
              if (typeof set.reps === 'object' && set.reps.min && set.reps.max) {
                return `${set.reps.min}-${set.reps.max}`;
              }
              return set.reps?.toString() || '?';
            }).join(', ');
          }
        })();

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
  const convertToWorkoutState = (parsedWorkout: Workout): ActiveWorkout => {
    const exercises: WorkoutExercise[] = [];
    let exerciseCounter = 0;
    let supersetCounter = 0;

    parsedWorkout.groups?.forEach((group) => {
      const supersetGroup = group.type === 'superset' ? `superset-${++supersetCounter}` : undefined;
      
      group.exercises?.forEach((exercise) => {
        exerciseCounter++;
        
        const sets: WorkoutSet[] = exercise.sets.map((set, index) => {
          let reps: number | undefined;
          
          if (typeof set.reps === 'object' && 'min' in set.reps) {
            // For ranges, use the minimum as target
            reps = set.reps.min;
          } else if (set.reps === 'AMRAP') {
            reps = undefined; // AMRAP sets don't have a target
          } else {
            reps = Number(set.reps);
          }
          
          return {
            id: `set-${exerciseCounter}-${index + 1}`,
            reps,
            weight: set.weight?.value,
            completed: false,
            rpe: set.rpe,
          };
        });

        exercises.push({
          id: `exercise-${exerciseCounter}`,
          exerciseId: exercise.name.toLowerCase().replace(/\s+/g, '-'),
          exerciseName: exercise.name,
          sets,
          restTimeSeconds: exercise.sets[0]?.rest || 90,
          notes: exercise.notes?.join(', '),
          completed: false,
          isSuperset: group.type === 'superset',
          supersetGroup,
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
    const workoutToStart = editedWorkout || parseResult?.workout;
    if (workoutToStart) {
      const workoutData = convertToWorkoutState(workoutToStart);
      dispatch(startWorkout(workoutData));
      onWorkoutStart?.(workoutData);
    }
  };
  
  // Handle workout update from preview editor
  const handleWorkoutUpdate = (updatedWorkout: Workout) => {
    setEditedWorkout(updatedWorkout);
    const preview = generateWorkoutPreview(updatedWorkout);
    setWorkoutPreview(preview);
  };

  // Convert parsed workout to service format
  const convertToServiceFormat = (parsedWorkout: any): ServiceWorkoutExercise[] => {
    const exercises: ServiceWorkoutExercise[] = [];
    
    parsedWorkout.groups?.forEach((group: any, groupIndex: number) => {
      const exercisesInGroup = group.exercises || [];
      
      exercisesInGroup.forEach((exercise: ParsedExercise, exerciseIndex: number) => {
        const exerciseData: ServiceWorkoutExercise = {
          exerciseId: exercise.name.toLowerCase().replace(/\s+/g, '-'),
          exerciseName: exercise.name,
          sets: exercise.sets.map(set => {
            const cleanSet: any = {};
            if (typeof set.reps === 'object' && set.reps.min) {
              cleanSet.targetReps = set.reps.min;
            } else if (set.reps !== 'AMRAP') {
              cleanSet.targetReps = Number(set.reps);
            }
            if (set.weight?.value && set.weight.value > 0) {
              cleanSet.targetWeight = set.weight.value;
            }
            if (set.rpe) {
              cleanSet.rpe = set.rpe;
            }
            return cleanSet;
          }),
          restTime: exercise.sets[0]?.rest || 90,
        };
        
        // Add notes if available
        if (exercise.notes && exercise.notes.length > 0) {
          exerciseData.notes = exercise.notes.join(', ');
        }
        
        // Handle supersets - link to other exercises in the same group
        if (group.type === 'superset' && exercisesInGroup.length > 1) {
          const otherExerciseIds = exercisesInGroup
            .filter((_, idx) => idx !== exerciseIndex)
            .map(ex => ex.name.toLowerCase().replace(/\s+/g, '-'));
          if (otherExerciseIds.length > 0) {
            exerciseData.supersetWith = otherExerciseIds;
          }
        }
        
        exercises.push(exerciseData);
      });
    });
    
    return exercises;
  };

  // Save workout to Firebase
  const handleSaveWorkout = async () => {
    if (!user) {
      alert('Please sign in to save workouts');
      navigate('/login');
      return;
    }

    if (!parseResult?.success || !parseResult.workout) {
      setSaveError('Please fix parsing errors before saving');
      return;
    }

    setShowSaveModal(true);
  };

  const confirmSaveWorkout = async () => {
    if (!user || !parseResult?.workout || !workoutName.trim()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const exercises = convertToServiceFormat(parseResult.workout);
      const tags = workoutTags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      // Build workout data with only defined values
      const workoutData: any = {
        userId: user.uid,
        name: workoutName,
        exercises,
        tags,
        category: 'custom',
        isPublic: false,
        performanceCount: 0,
      };
      
      // Add description only if it exists
      if (workoutDescription.trim()) {
        workoutData.description = workoutDescription;
      }

      await userProfileService.saveWorkout(workoutData);
      
      // Clear form
      setWorkoutName('');
      setWorkoutDescription('');
      setWorkoutTags('');
      setShowSaveModal(false);
      
      alert('Workout saved successfully!');
      navigate('/profile');
    } catch (error) {
      console.error('Error saving workout:', error);
      setSaveError('Failed to save workout. Please try again.');
    } finally {
      setIsSaving(false);
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
    <Container maxWidth="7xl" className={className}>
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

        {/* Mobile Tabs - Only show on small screens */}
        <div className="flex md:hidden mb-4 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={mobileTab === 'text' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setMobileTab('text')}
            className="flex-1"
          >
            Workout Text
          </Button>
          <Button
            variant={mobileTab === 'preview' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setMobileTab('preview')}
            className="flex-1"
          >
            Preview
          </Button>
        </div>

        <Grid cols={1} lgCols={2} gap="lg" className="w-full">
          {/* Text Input Section */}
          <div className={`space-y-4 ${mobileTab === 'text' ? 'block' : 'hidden md:block'}`}>
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <Typography variant="h6" className="font-semibold">
                    Workout Text
                  </Typography>
                  <Flex gap="sm" wrap className="shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHelp(true)}
                      className="whitespace-nowrap"
                    >
                      <HelpCircle className="w-4 h-4 mr-1" />
                      Help
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                      className="min-w-[40px]"
                    >
                      {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </Flex>
                </div>

                <div className="relative">
                  <Textarea
                    value={workoutText}
                    onChange={handleTextChange}
                    placeholder={`Enter your workout using natural language:

5x10 Bench Press @225lbs
3x8-12 RDL 185kg
4x15 Leg Press ss 4x12 Leg Curls
3xAMRAP Push-ups BW
12/10/8 Curls 45lbs (drop set)
5x Incline DB (2x failure @85lbs) (3x8-10 @75lbs)`}
                    rows={12}
                    autoResize
                    className="font-mono text-sm"
                    helperText="Use natural language to describe your workout"
                  />
                  {isParsing && (
                    <div className="absolute top-2 right-2 flex items-center gap-2 text-sm text-blue-600">
                      <div className="flex gap-1">
                        <span className="animate-pulse">Parsing</span>
                        <span className="animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                        <span className="animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                        <span className="animate-pulse" style={{ animationDelay: '0.6s' }}>.</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Parse Status */}
            {parseResult && (
              <Card className="md:block">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    {parseResult.success ? (
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                    )}
                    <Typography variant="h6" className="font-semibold text-sm md:text-base">
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
                        Exercise Suggestions:
                      </Typography>
                      <div className="space-y-2">
                        {parseResult.suggestions.map((suggestion, index) => (
                          <div key={index} className="p-2 bg-blue-50 rounded-md border border-blue-200">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-blue-600" />
                              <Typography variant="body2" className="text-sm">
                                Unrecognized exercise: <strong>{suggestion.original}</strong>
                              </Typography>
                            </div>
                            <div className="mt-1 ml-6">
                              <Typography variant="body2" className="text-sm text-gray-600">
                                Did you mean: 
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="ml-1 text-blue-600 hover:text-blue-800 p-0 h-auto"
                                  onClick={() => {
                                    const newText = workoutText.replace(suggestion.original, suggestion.suggestion);
                                    setWorkoutText(newText);
                                    parseWorkout(newText);
                                  }}
                                >
                                  {suggestion.suggestion}
                                </Button>
                                ?
                              </Typography>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className={`space-y-4 ${mobileTab === 'preview' ? 'block' : 'hidden md:block'}`}>
              {/* Workout Stats */}
              {workoutPreview && (
                <Card className="md:block">
                  <CardContent className="p-4">
                    <Typography variant="h6" className="font-semibold mb-4">
                      Workout Overview
                    </Typography>

                    <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-xl md:text-2xl font-bold text-blue-600">
                          {workoutPreview.totalExercises}
                        </div>
                        <Typography variant="body2" color="secondary" className="text-xs md:text-sm">
                          Exercises
                        </Typography>
                      </div>
                      <div className="text-center">
                        <div className="text-xl md:text-2xl font-bold text-green-600">
                          {workoutPreview.totalSets}
                        </div>
                        <Typography variant="body2" color="secondary" className="text-xs md:text-sm">
                          Total Sets
                        </Typography>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 md:w-4 md:h-4 text-orange-600" />
                          <span className="text-xl md:text-2xl font-bold text-orange-600">
                            {workoutPreview.estimatedTime}m
                          </span>
                        </div>
                        <Typography variant="body2" color="secondary" className="text-xs md:text-sm">
                          Est. Time
                        </Typography>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Editable Workout Preview */}
              {editedWorkout && (
                <EditableWorkoutPreview
                  workout={editedWorkout}
                  onUpdate={handleWorkoutUpdate}
                  isEditing={isEditingPreview}
                  onEditToggle={setIsEditingPreview}
                />
              )}

              {/* Action Buttons - Hidden on mobile, shown in floating action button instead */}
              {parseResult?.success && (
                <Card className="hidden md:block">
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

        {/* Save Workout Modal */}
        <Modal
          isOpen={showSaveModal}
          onClose={() => {
            setShowSaveModal(false);
            setSaveError(null);
          }}
          title="Save Workout"
          size="md"
        >
          <div className="space-y-4">
            {saveError && (
              <Alert variant="error" title="Error">
                {saveError}
              </Alert>
            )}
            
            <div>
              <Typography variant="body2" className="mb-1">
                Workout Name *
              </Typography>
              <Input
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                placeholder="e.g., Upper Body Strength"
                required
              />
            </div>

            <div>
              <Typography variant="body2" className="mb-1">
                Description
              </Typography>
              <Textarea
                value={workoutDescription}
                onChange={(e) => setWorkoutDescription(e.target.value)}
                placeholder="Brief description of the workout..."
                rows={3}
              />
            </div>

            <div>
              <Typography variant="body2" className="mb-1">
                Tags (comma-separated)
              </Typography>
              <Input
                value={workoutTags}
                onChange={(e) => setWorkoutTags(e.target.value)}
                placeholder="e.g., strength, upper body, push"
              />
            </div>

            <Flex gap="sm" className="mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowSaveModal(false);
                  setSaveError(null);
                }}
                className="flex-1"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmSaveWorkout}
                className="flex-1"
                disabled={!workoutName.trim() || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Workout'}
              </Button>
            </Flex>
          </div>
        </Modal>
        
        {/* Mobile Floating Action Buttons */}
        {parseResult?.success && (
          <div className="fixed bottom-20 right-4 md:hidden flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleSaveWorkout}
              className="rounded-full shadow-lg bg-white"
              size="lg"
              disabled={!workoutText.trim()}
            >
              <Save className="w-5 h-5" />
            </Button>
            <Button
              variant="primary"
              onClick={handleStartWorkout}
              className="rounded-full shadow-lg"
              size="lg"
              disabled={!parseResult.success}
            >
              <Play className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </Container>
  );
};