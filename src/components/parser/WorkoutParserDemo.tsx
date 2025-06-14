import React, { useState } from 'react';
import { WorkoutParser } from '../../parser';
import type { ParseResult } from '../../parser/types';

export const WorkoutParserDemo: React.FC = () => {
  const [input, setInput] = useState('5x5 Squat @225lbs\n3x8-12 RDL 185lbs\n4x10 Leg Press ss 4x15 Leg Curls');
  const [result, setResult] = useState<ParseResult | null>(null);
  const parser = new WorkoutParser();

  const handleParse = () => {
    const parseResult = parser.parse(input);
    setResult(parseResult);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Workout Parser Demo</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Enter your workout (one exercise per line):
        </label>
        <textarea
          className="w-full p-2 border rounded-md"
          rows={5}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="5x10 Bench Press @225lbs"
        />
      </div>
      
      <button
        onClick={handleParse}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Parse Workout
      </button>

      {result && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Parse Result:</h3>
          
          {result.success ? (
            <div className="bg-green-50 p-4 rounded-md">
              <p className="text-green-800 mb-2">✓ Successfully parsed!</p>
              
              {result.workout?.groups.map((group, i) => (
                <div key={i} className="mb-4 p-3 bg-white rounded shadow">
                  <p className="font-medium">
                    {group.type === 'superset' ? 'Superset:' : 
                     group.type === 'circuit' ? 'Circuit:' : ''}
                  </p>
                  
                  {group.exercises.map((exercise, j) => (
                    <div key={j} className="mt-2">
                      <p className="font-medium">{exercise.name}</p>
                      <div className="ml-4 text-sm text-gray-600">
                        {exercise.sets.map((set, k) => (
                          <p key={k}>
                            Set {k + 1}: {
                              typeof set.reps === 'object' && 'min' in set.reps
                                ? `${set.reps.min}-${set.reps.max} reps`
                                : `${set.reps} reps`
                            }
                            {set.weight && ` @ ${set.weight.value}${set.weight.unit || 'lbs'}`}
                            {set.rpe && ` RPE${set.rpe}`}
                            {set.rest && ` (${set.rest}s rest)`}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              
              {result.suggestions.length > 0 && (
                <div className="mt-4">
                  <p className="font-medium text-yellow-700">Suggestions:</p>
                  {result.suggestions.map((suggestion, i) => (
                    <p key={i} className="text-sm text-yellow-600">
                      Did you mean "{suggestion.suggestion}" instead of "{suggestion.original}"?
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded-md">
              <p className="text-red-800 mb-2">✗ Parse errors:</p>
              {result.errors.map((error, i) => (
                <p key={i} className="text-sm text-red-600">
                  Line {error.line}, Column {error.column}: {error.message}
                  {error.suggestion && (
                    <span className="block text-red-500 ml-4">
                      Suggestion: {error.suggestion}
                    </span>
                  )}
                </p>
              ))}
            </div>
          )}

          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-600">
              Show raw output
            </summary>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};