import React, { useState } from 'react';
import { Card, CardContent, Button, Typography } from '../ui';
import { ChevronDown, X, Check } from 'lucide-react';
import type { ExerciseFilter } from '../../types/exercise';

interface ExerciseFiltersProps {
  filters: ExerciseFilter;
  onFiltersChange: (filters: ExerciseFilter) => void;
  onClearFilters: () => void;
  isVisible: boolean;
  className?: string;
}

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// Common muscle groups based on our exercise database
const MUSCLE_GROUPS: FilterOption[] = [
  { value: 'chest', label: 'Chest' },
  { value: 'back', label: 'Back' },
  { value: 'shoulders', label: 'Shoulders' },
  { value: 'arms', label: 'Arms' },
  { value: 'legs', label: 'Legs' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'full body', label: 'Full Body' },
];

// Common equipment types
const EQUIPMENT_OPTIONS: FilterOption[] = [
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbells' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Cable' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'resistance bands', label: 'Resistance Bands' },
  { value: 'stability ball', label: 'Stability Ball' },
];

const DIFFICULTY_OPTIONS: FilterOption[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

interface FilterSectionProps {
  title: string;
  options: FilterOption[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  multiSelect?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  options,
  selectedValues,
  onToggle,
  multiSelect = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <Typography variant="h6" className="font-medium">
          {title}
        </Typography>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="space-y-2">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              
              return (
                <button
                  key={option.value}
                  onClick={() => onToggle(option.value)}
                  className={`
                    w-full flex items-center justify-between p-2 rounded-lg text-left
                    transition-colors hover:bg-gray-50
                    ${isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        w-4 h-4 rounded border-2 flex items-center justify-center
                        ${isSelected 
                          ? 'bg-blue-600 border-blue-600' 
                          : 'border-gray-300'
                        }
                      `}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm font-medium">{option.label}</span>
                  </div>
                  
                  {option.count && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {option.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const ExerciseFilters: React.FC<ExerciseFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  isVisible,
  className = '',
}) => {
  if (!isVisible) return null;

  const handleMuscleGroupToggle = (value: string) => {
    const currentGroups = filters.muscleGroup ? [filters.muscleGroup] : [];
    const newGroups = currentGroups.includes(value)
      ? currentGroups.filter(g => g !== value)
      : [value]; // Single select for now
    
    onFiltersChange({
      ...filters,
      muscleGroup: newGroups[0] || undefined,
    });
  };

  const handleEquipmentToggle = (value: string) => {
    const currentEquipment = filters.equipment ? [filters.equipment] : [];
    const newEquipment = currentEquipment.includes(value)
      ? currentEquipment.filter(e => e !== value)
      : [value]; // Single select for now
    
    onFiltersChange({
      ...filters,
      equipment: newEquipment[0] || undefined,
    });
  };

  const handleDifficultyToggle = (value: string) => {
    onFiltersChange({
      ...filters,
      difficulty: filters.difficulty === value ? undefined : value as any,
    });
  };

  const activeFiltersCount = [
    filters.muscleGroup,
    filters.equipment,
    filters.difficulty,
  ].filter(Boolean).length;

  return (
    <Card className={`${className} animate-in slide-in-from-top-2 duration-300`}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Typography variant="h5">Filters</Typography>
            {activeFiltersCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 font-medium">
                {activeFiltersCount}
              </span>
            )}
          </div>
          
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          )}
        </div>

        {/* Filter Sections */}
        <div className="divide-y divide-gray-100">
          <FilterSection
            title="Muscle Group"
            options={MUSCLE_GROUPS}
            selectedValues={filters.muscleGroup ? [filters.muscleGroup] : []}
            onToggle={handleMuscleGroupToggle}
            multiSelect={false}
          />
          
          <FilterSection
            title="Equipment"
            options={EQUIPMENT_OPTIONS}
            selectedValues={filters.equipment ? [filters.equipment] : []}
            onToggle={handleEquipmentToggle}
            multiSelect={false}
          />
          
          <FilterSection
            title="Difficulty"
            options={DIFFICULTY_OPTIONS}
            selectedValues={filters.difficulty ? [filters.difficulty] : []}
            onToggle={handleDifficultyToggle}
            multiSelect={false}
          />
        </div>

        {/* Active filters display */}
        {activeFiltersCount > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <Typography variant="body2" color="muted" className="mb-2">
              Active Filters:
            </Typography>
            <div className="flex flex-wrap gap-2">
              {filters.muscleGroup && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  {filters.muscleGroup}
                  <button
                    onClick={() => onFiltersChange({ ...filters, muscleGroup: undefined })}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {filters.equipment && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  {filters.equipment}
                  <button
                    onClick={() => onFiltersChange({ ...filters, equipment: undefined })}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {filters.difficulty && (
                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  {filters.difficulty}
                  <button
                    onClick={() => onFiltersChange({ ...filters, difficulty: undefined })}
                    className="hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};