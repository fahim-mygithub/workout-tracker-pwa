import React, { useState, useEffect } from 'react';
import type { Workout, Exercise, ExerciseSet, RepsValue } from '../../parser/types';
import { ExerciseMatcher } from '../../parser';
import { Card, CardContent, Typography, Input, Button, Flex } from '../ui';
import { Edit2, Check, X, Plus, Trash2, AlertTriangle } from 'lucide-react';

interface EditableWorkoutPreviewProps {
  workout: Workout | null;
  onUpdate: (workout: Workout) => void;
  isEditing: boolean;
  onEditToggle: (editing: boolean) => void;
}

export const EditableWorkoutPreview: React.FC<EditableWorkoutPreviewProps> = ({
  workout,
  onUpdate,
  isEditing,
  onEditToggle,
}) => {
  const [editedWorkout, setEditedWorkout] = useState<Workout | null>(workout);

  useEffect(() => {
    setEditedWorkout(workout);
  }, [workout]);

  if (!editedWorkout) return null;

  const handleExerciseNameChange = (groupIndex: number, exerciseIndex: number, name: string) => {
    const newWorkout = { ...editedWorkout };
    newWorkout.groups[groupIndex].exercises[exerciseIndex].name = name;
    setEditedWorkout(newWorkout);
  };

  const handleSetChange = (
    groupIndex: number,
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: string
  ) => {
    const newWorkout = { ...editedWorkout };
    const set = newWorkout.groups[groupIndex].exercises[exerciseIndex].sets[setIndex];
    
    if (field === 'reps') {
      // Handle rep ranges (e.g., "8-10")
      if (value.includes('-')) {
        const [min, max] = value.split('-').map(v => parseInt(v.trim()));
        if (!isNaN(min) && !isNaN(max)) {
          set.reps = { min, max };
        }
      } else {
        const reps = parseInt(value);
        if (!isNaN(reps)) {
          set.reps = reps;
        }
      }
    } else if (field === 'weight') {
      const weight = parseFloat(value);
      if (!isNaN(weight)) {
        set.weight = { value: weight, unit: set.weight?.unit || 'lbs' };
      }
    }
    
    setEditedWorkout(newWorkout);
  };

  const addSet = (groupIndex: number, exerciseIndex: number) => {
    const newWorkout = { ...editedWorkout };
    const exercise = newWorkout.groups[groupIndex].exercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1];
    
    exercise.sets.push({
      reps: lastSet?.reps || 10,
      weight: lastSet?.weight,
    });
    
    setEditedWorkout(newWorkout);
  };

  const removeSet = (groupIndex: number, exerciseIndex: number, setIndex: number) => {
    const newWorkout = { ...editedWorkout };
    newWorkout.groups[groupIndex].exercises[exerciseIndex].sets.splice(setIndex, 1);
    setEditedWorkout(newWorkout);
  };

  const saveChanges = () => {
    if (editedWorkout) {
      onUpdate(editedWorkout);
      onEditToggle(false);
    }
  };

  const cancelChanges = () => {
    setEditedWorkout(workout);
    onEditToggle(false);
  };

  const formatReps = (reps: RepsValue): string => {
    if (typeof reps === 'object' && 'min' in reps && 'max' in reps) {
      return `${reps.min}-${reps.max}`;
    }
    if (reps === 'AMRAP') {
      return 'AMRAP';
    }
    return reps.toString();
  };

  const getExerciseSuggestions = (exerciseName: string): string[] => {
    const matched = ExerciseMatcher.findExercise(exerciseName);
    if (!matched) {
      return ExerciseMatcher.getSuggestions(exerciseName, 3);
    }
    return [];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h6" className="font-semibold">
          Workout Preview
        </Typography>
        {!isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditToggle(true)}
            className="text-sm"
          >
            <Edit2 className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        ) : (
          <Flex gap="xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={saveChanges}
            >
              <Check className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Save</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelChanges}
            >
              <X className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
          </Flex>
        )}
      </div>

      {editedWorkout.groups.map((group, groupIndex) => (
        <Card key={groupIndex} className="mb-4">
          <CardContent className="p-4">
            {group.type === 'superset' && (
              <Typography variant="body2" className="text-blue-600 font-medium mb-2">
                Superset
              </Typography>
            )}
            
            {group.exercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="mb-4 last:mb-0">
                {isEditing ? (
                  <Input
                    value={exercise.name}
                    onChange={(e) => handleExerciseNameChange(groupIndex, exerciseIndex, e.target.value)}
                    className="mb-2 font-medium"
                  />
                ) : (
                  <div className="mb-2">
                    <div className="flex items-center gap-2">
                      <Typography variant="body1" className="font-medium">
                        {exercise.name}
                      </Typography>
                      {getExerciseSuggestions(exercise.name).length > 0 && (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" title="Exercise not recognized" />
                      )}
                    </div>
                    {getExerciseSuggestions(exercise.name).length > 0 && (
                      <div className="mt-1 text-sm text-gray-600">
                        Did you mean: {getExerciseSuggestions(exercise.name).slice(0, 2).join(' or ')}?
                      </div>
                    )}
                  </div>
                )}
                
                {/* Compact view for mobile, detailed view for desktop */}
                <div className="block sm:hidden">
                  {/* Mobile: Compact set display */}
                  <Typography variant="body2" className="text-sm">
                    {exercise.sets.length} × {formatReps(exercise.sets[0].reps)} 
                    {exercise.sets[0].weight && ` @ ${exercise.sets[0].weight.value}${exercise.sets[0].weight.unit || 'lbs'}`}
                  </Typography>
                </div>

                <div className="hidden sm:block space-y-1">
                  {/* Desktop: Detailed set display */}
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center gap-2">
                      <Typography variant="body2" color="secondary" className="w-12">
                        Set {setIndex + 1}
                      </Typography>
                      
                      {isEditing ? (
                        <>
                          <Input
                            value={formatReps(set.reps)}
                            onChange={(e) => handleSetChange(groupIndex, exerciseIndex, setIndex, 'reps', e.target.value)}
                            className="w-20"
                            placeholder="Reps"
                          />
                          <span className="text-gray-500">×</span>
                          <Input
                            value={set.weight?.value || ''}
                            onChange={(e) => handleSetChange(groupIndex, exerciseIndex, setIndex, 'weight', e.target.value)}
                            className="w-20"
                            placeholder="Weight"
                          />
                          <span className="text-gray-500">{set.weight?.unit || 'lbs'}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSet(groupIndex, exerciseIndex, setIndex)}
                            disabled={exercise.sets.length <= 1}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <Typography variant="body2">
                          {formatReps(set.reps)} reps
                          {set.weight && ` @ ${set.weight.value}${set.weight.unit || 'lbs'}`}
                        </Typography>
                      )}
                    </div>
                  ))}
                  
                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addSet(groupIndex, exerciseIndex)}
                      className="mt-2"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Set
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};