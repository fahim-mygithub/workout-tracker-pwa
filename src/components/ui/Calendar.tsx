import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import { Typography } from './Typography';
import { Card, CardContent } from './Card';
import { cn } from '../../lib/utils';

export interface CalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  className?: string;
  highlightedDates?: Date[];
  minDate?: Date;
  maxDate?: Date;
}

export const Calendar: React.FC<CalendarProps> = ({
  selectedDate,
  onDateSelect,
  className,
  highlightedDates = [],
  minDate,
  maxDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const { daysInMonth, firstDayOfWeek } = useMemo(() => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const firstDayOfWeek = monthStart.getDay();

    return { daysInMonth, firstDayOfWeek };
  }, [currentMonth]);

  const isDateHighlighted = (date: Date) => {
    return highlightedDates.some(highlightedDate => 
      date.getDate() === highlightedDate.getDate() &&
      date.getMonth() === highlightedDate.getMonth() &&
      date.getFullYear() === highlightedDate.getFullYear()
    );
  };

  const isDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (!isDateDisabled(clickedDate) && onDateSelect) {
      onDateSelect(clickedDate);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar grid
  const calendarDays = [];
  
  // Empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="relative">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('prev')}
            className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <Typography variant="h6" className="font-semibold text-slate-800">
            {monthName}
          </Typography>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateMonth('next')}
            className="h-8 w-8 p-0 rounded-full hover:bg-primary/10 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>

        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-3">
          {weekDays.map(day => (
            <div key={day} className="text-center p-1">
              <Typography variant="caption" className="font-semibold text-slate-500 text-xs">
                {day}
              </Typography>
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-10" />;
            }

            const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const isSelected = isDateSelected(currentDate);
            const isHighlighted = isDateHighlighted(currentDate);
            const isDisabled = isDateDisabled(currentDate);
            const isToday = 
              currentDate.getDate() === new Date().getDate() &&
              currentDate.getMonth() === new Date().getMonth() &&
              currentDate.getFullYear() === new Date().getFullYear();

            return (
              <button
                key={`day-${day}`}
                onClick={() => handleDateClick(day)}
                disabled={isDisabled}
                className={cn(
                  'relative h-10 w-full rounded-xl text-sm font-medium transition-all duration-200',
                  'hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50',
                  {
                    'bg-gradient-to-br from-primary to-primary/80 text-white shadow-md hover:shadow-lg': isSelected,
                    'bg-green-100 text-green-700 font-semibold': isHighlighted && !isSelected,
                    'ring-2 ring-primary/30 ring-offset-1': isToday && !isSelected,
                    'text-slate-300 cursor-not-allowed hover:scale-100': isDisabled,
                    'text-slate-700 hover:bg-slate-100': !isDisabled && !isSelected && !isHighlighted,
                  }
                )}
              >
                {day}
                {isHighlighted && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};