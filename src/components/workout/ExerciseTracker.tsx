import React, { useState, useEffect } from 'react';
import { Plus, Minus, Check, X, TrendingUp } from 'lucide-react';
import { Card, CardContent, Typography, Button, Input } from '../ui';
import { exerciseHistoryService } from '../../services/exerciseHistory.service';
import { useAuth } from '../../contexts/AuthContext';
import type { ExerciseSet, PerformedSet, ExerciseHistory } from '../../types';
import { cn } from '../../lib/utils';

interface ExerciseTrackerProps {
  exerciseId: string;
  exerciseName: string;
  plannedSets: ExerciseSet[];
  workoutId?: string;
  workoutName?: string;
  onComplete: (history: Omit<ExerciseHistory, 'id'>) => void;
  onSkip: () => void;
}

export const ExerciseTracker: React.FC<ExerciseTrackerProps> = ({
  exerciseId,
  exerciseName,
  plannedSets,
  workoutId,
  workoutName,
  onComplete,
  onSkip
}) => {
  const { user } = useAuth();
  const [performedSets, setPerformedSets] = useState<PerformedSet[]>([]);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [personalRecords, setPersonalRecords] = useState<{
    maxWeight: { weight: number; reps: number; date: Date } | null;
    maxReps: { weight: number; reps: number; date: Date } | null;
    maxVolume: { volume: number; sets: number; date: Date } | null;
  } | null>(null);
  const [lastPerformance, setLastPerformance] = useState<ExerciseHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    initializeSets();
    loadHistory();
  }, [exerciseId]);

  const initializeSets = () => {
    const initialSets: PerformedSet[] = plannedSets.map((set, index) => ({
      setNumber: index + 1,
      targetReps: set.targetReps,
      targetWeight: set.targetWeight,
      actualReps: set.targetReps,
      actualWeight: set.targetWeight,
      time: set.targetTime,
      distance: set.targetDistance,
      rpe: set.rpe,
      completed: false,
      notes: ''
    }));
    setPerformedSets(initialSets);
  };

  const loadHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Load last performance
      const history = await exerciseHistoryService.getExerciseHistory(user.uid, exerciseId, 1);
      if (history.length > 0) {
        setLastPerformance(history[0]);
      }

      // Load personal records
      const records = await exerciseHistoryService.getPersonalRecords(user.uid, exerciseId);
      setPersonalRecords(records);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSet = (index: number, updates: Partial<PerformedSet>) => {
    setPerformedSets(prev => {
      const newSets = [...prev];
      newSets[index] = { ...newSets[index], ...updates };
      return newSets;
    });
  };

  const completeSet = (index: number) => {
    updateSet(index, { completed: true });
    if (index < performedSets.length - 1) {
      setCurrentSetIndex(index + 1);
    }
  };

  const undoSet = (index: number) => {
    updateSet(index, { completed: false });
    setCurrentSetIndex(index);
  };

  const addSet = () => {
    const lastSet = performedSets[performedSets.length - 1];
    const newSet: PerformedSet = {
      setNumber: performedSets.length + 1,
      targetReps: lastSet.targetReps,
      targetWeight: lastSet.targetWeight,
      actualReps: lastSet.actualReps,
      actualWeight: lastSet.actualWeight,
      time: lastSet.time,
      distance: lastSet.distance,
      rpe: lastSet.rpe,
      completed: false,
      notes: ''
    };
    setPerformedSets([...performedSets, newSet]);
  };

  const removeSet = (index: number) => {
    if (performedSets.length > 1) {
      setPerformedSets(prev => prev.filter((_, i) => i !== index));
      if (currentSetIndex >= index && currentSetIndex > 0) {
        setCurrentSetIndex(currentSetIndex - 1);
      }
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    const completedSets = performedSets.filter(set => set.completed);
    if (completedSets.length === 0) {
      alert('Please complete at least one set');
      return;
    }

    const history: Omit<ExerciseHistory, 'id'> = {
      userId: user.uid,
      exerciseId,
      exerciseName,
      workoutId,
      workoutName,
      performedAt: new Date(),
      sets: performedSets,
      notes
    };

    onComplete(history);
  };

  const isNewPR = (weight?: number, reps?: number) => {
    if (!personalRecords || !weight || !reps) return false;
    
    return (
      (personalRecords.maxWeight && weight > personalRecords.maxWeight.weight) ||
      (personalRecords.maxReps && reps > personalRecords.maxReps.reps)
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent>
        <div className="space-y-4">
          {/* Exercise Header */}
          <div className="flex justify-between items-start">
            <div>
              <Typography variant="h3" className="font-bold">
                {exerciseName}
              </Typography>
              {loading ? (
                <Typography variant="body2" color="muted">Loading history...</Typography>
              ) : lastPerformance && (
                <Typography variant="body2" color="muted">
                  Last: {lastPerformance.sets.filter(s => s.completed).length} sets
                  {lastPerformance.sets[0]?.actualWeight && 
                    ` @ ${lastPerformance.sets[0].actualWeight}kg`}
                </Typography>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              leftIcon={<X className="w-4 h-4" />}
            >
              Skip
            </Button>
          </div>

          {/* Personal Records */}
          {personalRecords && (
            <div className="bg-primary-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary-600" />
                <Typography variant="body2" className="font-semibold text-primary-800">
                  Personal Records
                </Typography>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                {personalRecords.maxWeight && (
                  <div>
                    <span className="text-gray-600">Max Weight: </span>
                    <span className="font-medium">{personalRecords.maxWeight.weight}kg</span>
                  </div>
                )}
                {personalRecords.maxReps && (
                  <div>
                    <span className="text-gray-600">Max Reps: </span>
                    <span className="font-medium">{personalRecords.maxReps.reps}</span>
                  </div>
                )}
                {personalRecords.maxVolume && (
                  <div>
                    <span className="text-gray-600">Max Volume: </span>
                    <span className="font-medium">{personalRecords.maxVolume.volume}kg</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Set Tracking */}
          <div className="space-y-2">
            {performedSets.map((set, index) => (
              <div
                key={index}
                className={cn(
                  "border rounded-lg p-3 transition-all",
                  set.completed ? "bg-green-50 border-green-300" : 
                  index === currentSetIndex ? "border-primary-400 bg-primary-50" : 
                  "border-gray-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Typography variant="body2" className="font-medium">
                      Set {set.setNumber}
                    </Typography>
                    
                    {/* Weight Input */}
                    {set.targetWeight !== undefined && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={set.actualWeight || ''}
                          onChange={(e) => updateSet(index, { actualWeight: parseFloat(e.target.value) || 0 })}
                          className="w-20 text-center"
                          disabled={set.completed}
                        />
                        <span className="text-sm text-gray-600">kg</span>
                      </div>
                    )}

                    {/* Reps Input */}
                    {set.targetReps !== undefined && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateSet(index, { actualReps: Math.max(0, (set.actualReps || 0) - 1) })}
                          disabled={set.completed}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Input
                          type="number"
                          value={set.actualReps || ''}
                          onChange={(e) => updateSet(index, { actualReps: parseInt(e.target.value) || 0 })}
                          className="w-16 text-center"
                          disabled={set.completed}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateSet(index, { actualReps: (set.actualReps || 0) + 1 })}
                          disabled={set.completed}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-gray-600">reps</span>
                      </div>
                    )}

                    {/* Time Input */}
                    {set.time !== undefined && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={set.time || ''}
                          onChange={(e) => updateSet(index, { time: parseInt(e.target.value) || 0 })}
                          className="w-20 text-center"
                          disabled={set.completed}
                        />
                        <span className="text-sm text-gray-600">sec</span>
                      </div>
                    )}

                    {/* PR Indicator */}
                    {isNewPR(set.actualWeight, set.actualReps) && (
                      <span className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-1 rounded">
                        NEW PR!
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {set.completed ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => undoSet(index)}
                      >
                        Undo
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => completeSet(index)}
                        leftIcon={<Check className="w-4 h-4" />}
                      >
                        Done
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSet(index)}
                      className="text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Set Notes */}
                {index === currentSetIndex && !set.completed && (
                  <Input
                    type="text"
                    placeholder="Add notes for this set..."
                    value={set.notes || ''}
                    onChange={(e) => updateSet(index, { notes: e.target.value })}
                    className="mt-2 text-sm"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Add Set Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={addSet}
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full"
          >
            Add Set
          </Button>

          {/* Exercise Notes */}
          <div>
            <Typography variant="body2" className="mb-1">Notes</Typography>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this exercise..."
              className="w-full p-2 border rounded-md text-sm resize-none"
              rows={2}
            />
          </div>

          {/* Complete Exercise Button */}
          <Button
            variant="primary"
            size="lg"
            onClick={handleComplete}
            disabled={!performedSets.some(set => set.completed)}
            className="w-full"
          >
            Complete Exercise ({performedSets.filter(s => s.completed).length}/{performedSets.length} sets)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};