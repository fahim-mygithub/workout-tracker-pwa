import React, { useState, useEffect } from 'react';
import { Calendar, Activity, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, Typography, LoadingSpinner } from '../ui';
import { exerciseHistoryService } from '../../services/exerciseHistory.service';
import { useAuth } from '../../contexts/AuthContext';
import type { ExerciseHistory } from '../../types';
import { cn } from '../../lib/utils';

interface ExerciseHistoryViewProps {
  exerciseId?: string;
  exerciseName?: string;
  limit?: number;
}

export const ExerciseHistoryView: React.FC<ExerciseHistoryViewProps> = ({
  exerciseId,
  exerciseName,
  limit = 20
}) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<ExerciseHistory[]>([]);
  const [stats, setStats] = useState<{
    totalSets: number;
    totalReps: number;
    totalVolume: number;
    avgWeight: number;
    avgReps: number;
    lastPerformed: Date | null;
    frequency: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadHistory();
      if (exerciseId) {
        loadStats();
      }
    }
  }, [user, exerciseId]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      setLoading(true);
      let data: ExerciseHistory[];
      
      if (exerciseId) {
        data = await exerciseHistoryService.getExerciseHistory(user.uid, exerciseId, limit);
      } else {
        data = await exerciseHistoryService.getUserHistory(user.uid, limit);
      }
      
      setHistory(data);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user || !exerciseId) return;

    try {
      const statsData = await exerciseHistoryService.getExerciseStats(user.uid, exerciseId);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const calculateVolume = (sets: ExerciseHistory['sets']) => {
    return sets.reduce((total, set) => {
      if (set.actualWeight && set.actualReps && set.completed) {
        return total + (set.actualWeight * set.actualReps);
      }
      return total;
    }, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-600" />
            <Typography variant="h3">
              {exerciseName ? `${exerciseName} History` : 'Exercise History'}
            </Typography>
          </div>
          {stats && (
            <Typography variant="body2" color="muted">
              {stats.frequency}x per week
            </Typography>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistics Summary */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Typography variant="body2" color="muted">Total Sets</Typography>
              <Typography variant="h4" className="font-bold">{stats.totalSets}</Typography>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Typography variant="body2" color="muted">Total Reps</Typography>
              <Typography variant="h4" className="font-bold">{stats.totalReps}</Typography>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Typography variant="body2" color="muted">Avg Weight</Typography>
              <Typography variant="h4" className="font-bold">
                {stats.avgWeight.toFixed(1)}kg
              </Typography>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Typography variant="body2" color="muted">Total Volume</Typography>
              <Typography variant="h4" className="font-bold">
                {(stats.totalVolume / 1000).toFixed(1)}t
              </Typography>
            </div>
          </div>
        )}

        {/* History List */}
        {history.length === 0 ? (
          <div className="text-center py-8">
            <Typography variant="body1" color="muted">
              No history recorded yet. Complete some workouts to see your progress!
            </Typography>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((entry) => {
              const volume = calculateVolume(entry.sets);
              const completedSets = entry.sets.filter(s => s.completed);
              const isExpanded = selectedEntry === entry.id;

              return (
                <div
                  key={entry.id}
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-all",
                    "hover:shadow-md hover:border-primary-300",
                    isExpanded && "border-primary-400 shadow-md"
                  )}
                  onClick={() => setSelectedEntry(isExpanded ? null : entry.id)}
                >
                  {/* Summary Row */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Typography variant="body1" className="font-medium">
                          {entry.exerciseName}
                        </Typography>
                        {entry.personalRecords && Object.values(entry.personalRecords).some(v => v) && (
                          <span className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-0.5 rounded">
                            PR
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(entry.performedAt)}
                        </span>
                        <span>{completedSets.length} sets</span>
                        {volume > 0 && (
                          <span>{(volume / 1000).toFixed(1)}t volume</span>
                        )}
                        {entry.workoutName && (
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {entry.workoutName}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Best Set Summary */}
                    {completedSets.length > 0 && completedSets[0].actualWeight && (
                      <div className="text-right">
                        <Typography variant="body2" color="muted">Best set</Typography>
                        <Typography variant="body1" className="font-medium">
                          {completedSets[0].actualWeight}kg × {completedSets[0].actualReps}
                        </Typography>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      <Typography variant="body2" className="font-medium mb-2">
                        Set Details:
                      </Typography>
                      {entry.sets.map((set, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex items-center justify-between text-sm p-2 rounded",
                            set.completed ? "bg-green-50" : "bg-gray-50"
                          )}
                        >
                          <span>Set {set.setNumber}</span>
                          <div className="flex items-center gap-4">
                            {set.actualWeight !== undefined && set.actualReps !== undefined && (
                              <span className="font-medium">
                                {set.actualWeight}kg × {set.actualReps}
                              </span>
                            )}
                            {set.time && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {set.time}s
                              </span>
                            )}
                            {set.rpe && (
                              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                                RPE {set.rpe}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {entry.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded">
                          <Typography variant="body2" color="muted">
                            Notes: {entry.notes}
                          </Typography>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};