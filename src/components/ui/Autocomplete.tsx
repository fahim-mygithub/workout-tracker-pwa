import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Typography } from './Typography';
import { Search, ChevronDown } from 'lucide-react';

export interface AutocompleteOption {
  id: string;
  label: string;
  value: string;
  description?: string;
  category?: string;
}

export interface AutocompleteProps {
  options: AutocompleteOption[];
  value?: string;
  placeholder?: string;
  maxResults?: number;
  minChars?: number;
  onSelect: (option: AutocompleteOption) => void;
  onInputChange?: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  error?: string;
  helperText?: string;
  allowCustomValue?: boolean;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  options,
  value = '',
  placeholder = 'Type to search...',
  maxResults = 10,
  minChars = 1,
  onSelect,
  onInputChange,
  loading = false,
  disabled = false,
  className = '',
  dropdownClassName = '',
  error,
  helperText,
  allowCustomValue = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState<AutocompleteOption[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on input
  const filterOptions = useCallback((searchValue: string) => {
    if (searchValue.length < minChars) {
      setFilteredOptions([]);
      return;
    }

    const filtered = options
      .filter(option => 
        option.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        option.value.toLowerCase().includes(searchValue.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchValue.toLowerCase())
      )
      .slice(0, maxResults);

    setFilteredOptions(filtered);
  }, [options, minChars, maxResults]);

  // Handle input changes
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    onInputChange?.(newValue);
    filterOptions(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  // Handle option selection
  const handleOptionSelect = (option: AutocompleteOption) => {
    setInputValue(option.label);
    setIsOpen(false);
    setHighlightedIndex(-1);
    onSelect(option);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && filteredOptions.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case 'Enter':
        event.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleOptionSelect(filteredOptions[highlightedIndex]);
        } else if (allowCustomValue && inputValue.trim()) {
          // Handle custom value entry
          const customOption: AutocompleteOption = {
            id: `custom-${Date.now()}`,
            label: inputValue.trim(),
            value: inputValue.trim(),
          };
          handleOptionSelect(customOption);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
      case 'Tab':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Group options by category
  const groupedOptions = filteredOptions.reduce((groups, option) => {
    const category = option.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(option);
    return groups;
  }, {} as Record<string, AutocompleteOption[]>);

  const hasResults = filteredOptions.length > 0;
  const showDropdown = isOpen && (hasResults || loading);

  return (
    <div className={`relative ${className}`}>
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (filteredOptions.length > 0 || inputValue.length >= minChars) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full px-3 py-2 pl-10 pr-8 border rounded-md
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error 
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
        />
        
        {/* Search icon */}
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        
        {/* Dropdown arrow */}
        <ChevronDown 
          className={`
            absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className={`
            absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg
            max-h-60 overflow-y-auto
            ${dropdownClassName}
          `}
        >
          {loading ? (
            <div className="p-3 text-center">
              <Typography variant="body2" color="secondary">
                Loading...
              </Typography>
            </div>
          ) : hasResults ? (
            Object.entries(groupedOptions).map(([category, categoryOptions]) => (
              <div key={category}>
                {/* Category header */}
                {Object.keys(groupedOptions).length > 1 && (
                  <div className="px-3 py-1 bg-gray-50 border-b">
                    <Typography variant="body2" className="font-medium text-gray-600">
                      {category}
                    </Typography>
                  </div>
                )}
                
                {/* Options */}
                {categoryOptions.map((option, globalIndex) => {
                  const optionIndex = filteredOptions.indexOf(option);
                  const isHighlighted = optionIndex === highlightedIndex;
                  
                  return (
                    <div
                      key={option.id}
                      onClick={() => handleOptionSelect(option)}
                      className={`
                        px-3 py-2 cursor-pointer transition-colors duration-150
                        ${isHighlighted 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'hover:bg-gray-50'
                        }
                      `}
                      onMouseEnter={() => setHighlightedIndex(optionIndex)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <Typography 
                            variant="body2" 
                            className={`font-medium ${isHighlighted ? 'text-blue-700' : 'text-gray-900'}`}
                          >
                            {option.label}
                          </Typography>
                          {option.description && (
                            <Typography 
                              variant="body2" 
                              className={`mt-0.5 ${isHighlighted ? 'text-blue-600' : 'text-gray-500'}`}
                            >
                              {option.description}
                            </Typography>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : inputValue.length >= minChars ? (
            <div className="p-3 text-center">
              <Typography variant="body2" color="secondary">
                No results found
              </Typography>
              {allowCustomValue && (
                <Typography variant="body2" color="secondary" className="mt-1">
                  Press Enter to add "{inputValue}"
                </Typography>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Helper text and error */}
      {(error || helperText) && (
        <div className="mt-1">
          {error ? (
            <Typography variant="body2" className="text-red-600">
              {error}
            </Typography>
          ) : (
            <Typography variant="body2" color="secondary">
              {helperText}
            </Typography>
          )}
        </div>
      )}
    </div>
  );
};