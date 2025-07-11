import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { Exercise } from '../../types/exercise';
import { Modal, Input, Card, Typography, Button, Flex } from '../ui';
import { Search, CheckCircle } from 'lucide-react';

interface ExerciseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  currentExercise?: string;
}

export const ExerciseSearchModal: React.FC<ExerciseSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentExercise
}) => {
  const exercises = useSelector((state: RootState) => state.exercise.exercises);
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredExercises = useMemo(() => {
    if (!searchTerm.trim()) return exercises.slice(0, 20);
    
    const term = searchTerm.toLowerCase();
    return exercises
      .filter(exercise => 
        exercise.name.toLowerCase().includes(term) ||
        exercise.muscleGroup.toLowerCase().includes(term) ||
        exercise.equipment.toLowerCase().includes(term)
      )
      .slice(0, 20);
  }, [exercises, searchTerm]);
  
  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    onClose();
  };
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Search Exercises"
      size="lg"
    >
      <div className="space-y-4">
        {currentExercise && (
          <p className="text-sm text-muted-foreground">
            Replacing: <strong>{currentExercise}</strong>
          </p>
        )}
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, muscle group, or equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredExercises.map((exercise) => (
            <Card
              key={exercise.id}
              className="p-3 hover:bg-accent cursor-pointer transition-colors"
              onClick={() => handleSelect(exercise)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="body1" className="font-medium">
                    {exercise.name}
                  </Typography>
                  <Typography variant="body2" color="secondary">
                    {exercise.muscleGroup} • {exercise.equipment}
                  </Typography>
                </div>
                <CheckCircle className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100" />
              </div>
            </Card>
          ))}
          
          {filteredExercises.length === 0 && (
            <div className="text-center py-8">
              <Typography variant="body2" color="secondary">
                No exercises found matching "{searchTerm}"
              </Typography>
            </div>
          )}
        </div>
        
        <Flex gap="2" className="justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </Flex>
      </div>
    </Modal>
  );
};