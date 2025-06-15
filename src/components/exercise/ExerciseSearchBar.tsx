import React, { useState, useCallback } from 'react';
import { Input, Button } from '../ui';
import { Search, Filter, X } from 'lucide-react';

interface ExerciseSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  filtersActive?: boolean;
  className?: string;
}

export const ExerciseSearchBar: React.FC<ExerciseSearchBarProps> = ({
  value,
  onChange,
  onClear,
  placeholder = "Search exercises...",
  showFilters = true,
  onToggleFilters,
  filtersActive = false,
  className = '',
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = useCallback(() => {
    onChange('');
    onClear();
  }, [onChange, onClear]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Search icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        {/* Search input */}
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            pl-10 pr-20 py-3 text-base
            ${isFocused ? 'ring-2 ring-blue-500' : ''}
            ${value ? 'pr-32' : ''}
          `}
        />

        {/* Clear button */}
        {value && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-8 w-8 p-0 mr-2 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Filter button */}
        {showFilters && (
          <div className={`absolute inset-y-0 right-0 flex items-center ${value ? 'mr-12' : 'mr-2'}`}>
            <Button
              variant={filtersActive ? 'primary' : 'ghost'}
              size="sm"
              onClick={onToggleFilters}
              className={`
                h-8 px-3 flex items-center gap-2
                ${filtersActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
              `}
            >
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters</span>
              {filtersActive && (
                <span className="bg-white text-blue-600 text-xs rounded-full px-1.5 py-0.5 font-medium">
                  •
                </span>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Search suggestions/recent searches */}
      {isFocused && value.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3">
          <div className="text-sm text-gray-500 mb-2">Popular searches:</div>
          <div className="flex flex-wrap gap-2">
            {['Bench Press', 'Squat', 'Deadlift', 'Pull-ups', 'Push-ups'].map((term) => (
              <button
                key={term}
                onClick={() => onChange(term)}
                onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};