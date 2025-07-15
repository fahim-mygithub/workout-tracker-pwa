import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { findExerciseInDirectory } from '../utils/exerciseMatching';
import { Container, Typography, Card, CardContent, Input, Button } from '../components/ui';
import { setExercises, setLoading, setError } from '../store/slices/exerciseSlice';
import { loadExercisesFromCSV } from '../utils/loadExercises';

export const WorkoutDirectoryTest: React.FC = () => {
  const { exercises, isLoading, error, lastUpdated } = useSelector((state: RootState) => state.exercise);
  const dispatch = useDispatch();
  const [testInput, setTestInput] = useState('incline bench press');
  const [matchResult, setMatchResult] = useState<any>(null);
  const [csvStatus, setCsvStatus] = useState<string>('Checking...');

  const testMatch = () => {
    const result = findExerciseInDirectory(testInput, exercises);
    setMatchResult({
      input: testInput,
      found: result !== null,
      matchedName: result?.name || 'Not found',
      videoCount: result?.videoLinks?.length || 0,
      videos: result?.videoLinks || []
    });
  };

  // Test on mount
  useEffect(() => {
    testMatch();
  }, [exercises]);

  // Check CSV file
  useEffect(() => {
    fetch('/muscle_exercises.csv')
      .then(response => {
        setCsvStatus(`CSV Response: ${response.status} ${response.statusText}`);
        return response.text();
      })
      .then(text => {
        const lines = text.split('\n');
        setCsvStatus(`CSV loaded: ${lines.length} lines, First line: ${lines[0]?.substring(0, 50)}...`);
      })
      .catch(err => {
        setCsvStatus(`CSV Error: ${err.message}`);
      });
  }, []);

  // Manual load function
  const manualLoadExercises = async () => {
    dispatch(setLoading(true));
    try {
      const loadedExercises = await loadExercisesFromCSV();
      dispatch(setExercises(loadedExercises));
      console.log(`Manually loaded ${loadedExercises.length} exercises`);
      alert(`Loaded ${loadedExercises.length} exercises!`);
    } catch (error) {
      console.error('Failed to load exercises:', error);
      dispatch(setError('Failed to load exercises'));
      alert('Failed to load exercises: ' + error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <Container maxWidth="4xl" padding="lg">
      <Typography variant="h1" className="mb-6">Exercise Directory Test</Typography>
      
      <Card className="mb-6">
        <CardContent>
          <Typography variant="h4" className="mb-4">Directory Status</Typography>
          <Typography variant="body1">
            Exercises loaded: {exercises.length}
          </Typography>
          <Typography variant="body2" className="mt-2">
            Loading: {isLoading ? 'Yes' : 'No'}
          </Typography>
          <Typography variant="body2">
            Error: {error || 'None'}
          </Typography>
          <Typography variant="body2">
            Last Updated: {lastUpdated || 'Never'}
          </Typography>
          <Typography variant="body2" className="mt-2">
            CSV Status: {csvStatus}
          </Typography>
          <Typography variant="body2" className="mt-2">
            Incline exercises: {exercises.filter(e => e.name.toLowerCase().includes('incline')).length}
          </Typography>
          <Typography variant="body2">
            Bench press exercises: {exercises.filter(e => e.name.toLowerCase().includes('bench press')).length}
          </Typography>
          <Button 
            onClick={manualLoadExercises}
            disabled={isLoading}
            className="mt-4"
            variant="primary"
          >
            {isLoading ? 'Loading...' : 'Manually Load Exercises'}
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent>
          <Typography variant="h4" className="mb-4">Test Exercise Matching</Typography>
          <div className="flex gap-2 mb-4">
            <Input
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter exercise name"
              className="flex-1"
            />
            <Button onClick={testMatch}>Test Match</Button>
          </div>
          
          {matchResult && (
            <div className="bg-gray-50 p-4 rounded">
              <Typography variant="body2">Input: "{matchResult.input}"</Typography>
              <Typography variant="body2">Found: {matchResult.found ? 'Yes' : 'No'}</Typography>
              <Typography variant="body2">Matched: {matchResult.matchedName}</Typography>
              <Typography variant="body2">Videos: {matchResult.videoCount}</Typography>
              {matchResult.videos.length > 0 && (
                <div className="mt-2">
                  <Typography variant="caption">Video URLs:</Typography>
                  {matchResult.videos.map((url: string, i: number) => (
                    <Typography key={i} variant="caption" className="block text-xs truncate">
                      {url}
                    </Typography>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h4" className="mb-4">Sample Incline Exercises</Typography>
          {exercises
            .filter(e => e.name.toLowerCase().includes('incline'))
            .slice(0, 10)
            .map(exercise => (
              <div key={exercise.id} className="mb-2 pb-2 border-b">
                <Typography variant="body2" className="font-medium">
                  {exercise.name}
                </Typography>
                <Typography variant="caption">
                  Videos: {exercise.videoLinks?.length || 0}
                </Typography>
              </div>
            ))}
        </CardContent>
      </Card>
    </Container>
  );
};