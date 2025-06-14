import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Calendar } from '../Calendar';

describe('Calendar', () => {
  it('renders calendar with current month', () => {
    render(<Calendar />);
    
    // Should display month navigation
    expect(screen.getByText('←')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
    
    // Should display week day headers
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('calls onDateSelect when a date is clicked', () => {
    const onDateSelect = vi.fn();
    render(<Calendar onDateSelect={onDateSelect} />);
    
    // Click on day 15 (assuming it exists in current month)
    const dayButton = screen.getByRole('button', { name: '15' });
    fireEvent.click(dayButton);
    
    expect(onDateSelect).toHaveBeenCalledWith(expect.any(Date));
  });

  it('highlights selected date', () => {
    const selectedDate = new Date(2024, 0, 15); // January 15, 2024
    render(<Calendar selectedDate={selectedDate} />);
    
    const selectedButton = screen.getByRole('button', { name: '15' });
    expect(selectedButton).toHaveClass('bg-blue-500', 'text-white');
  });

  it('highlights specified dates', () => {
    const highlightedDates = [new Date(2024, 0, 10), new Date(2024, 0, 20)];
    render(<Calendar highlightedDates={highlightedDates} />);
    
    const highlightedButton = screen.getByRole('button', { name: '10' });
    expect(highlightedButton).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('navigates to previous month', () => {
    render(<Calendar />);
    
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(screen.getByText(currentMonth)).toBeInTheDocument();
    
    // Click previous month button
    fireEvent.click(screen.getByText('←'));
    
    // Should show previous month (exact month depends on current date)
    expect(screen.queryByText(currentMonth)).not.toBeInTheDocument();
  });

  it('navigates to next month', () => {
    render(<Calendar />);
    
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    expect(screen.getByText(currentMonth)).toBeInTheDocument();
    
    // Click next month button
    fireEvent.click(screen.getByText('→'));
    
    // Should show next month (exact month depends on current date)
    expect(screen.queryByText(currentMonth)).not.toBeInTheDocument();
  });

  it('disables dates outside min/max range', () => {
    const minDate = new Date(2024, 0, 10);
    const maxDate = new Date(2024, 0, 20);
    
    render(<Calendar minDate={minDate} maxDate={maxDate} />);
    
    // Dates before min should be disabled
    const earlyButton = screen.getByRole('button', { name: '5' });
    expect(earlyButton).toBeDisabled();
    
    // Dates after max should be disabled
    const lateButton = screen.getByRole('button', { name: '25' });
    expect(lateButton).toBeDisabled();
  });

  it('shows today with special styling', () => {
    const today = new Date();
    render(<Calendar />);
    
    const todayButton = screen.getByRole('button', { name: today.getDate().toString() });
    expect(todayButton).toHaveClass('ring-2', 'ring-blue-400');
  });
});