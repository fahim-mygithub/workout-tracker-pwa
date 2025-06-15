import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Textarea } from '../Textarea';

describe('Textarea', () => {
  describe('Basic Rendering', () => {
    it('renders textarea with basic props', () => {
      render(<Textarea placeholder="Enter text" />);
      
      const textarea = screen.getByPlaceholderText('Enter text');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('rows', '4');
    });

    it('renders with label', () => {
      render(<Textarea label="Description" id="desc" />);
      
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('shows required indicator when required', () => {
      render(<Textarea label="Required Field" required />);
      
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('displays helper text', () => {
      render(<Textarea helperText="Enter detailed description" />);
      
      expect(screen.getByText('Enter detailed description')).toBeInTheDocument();
    });

    it('displays error message', () => {
      render(<Textarea error="This field is required" />);
      
      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
    });
  });

  describe('Variants', () => {
    it('applies default variant styling', () => {
      render(<Textarea variant="default" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('bg-white', 'border', 'border-gray-300');
    });

    it('applies filled variant styling', () => {
      render(<Textarea variant="filled" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('bg-gray-100', 'border-0');
    });

    it('applies outlined variant styling', () => {
      render(<Textarea variant="outlined" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('bg-transparent', 'border-2');
    });
  });

  describe('Character Counter', () => {
    it('shows character count when showCounter is true', () => {
      render(<Textarea value="Hello" showCounter />);
      
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('shows character count with max length', () => {
      render(<Textarea value="Hello" maxLength={100} />);
      
      expect(screen.getByText('5/100')).toBeInTheDocument();
    });

    it('shows red color when over limit', () => {
      render(<Textarea value="Hello World" maxLength={5} />);
      
      const counter = screen.getByText('11/5');
      expect(counter).toHaveClass('text-red-600');
    });
  });

  describe('Auto Resize', () => {
    it('calls onChange with auto resize', () => {
      const handleChange = vi.fn();
      render(<Textarea onChange={handleChange} autoResize />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New text' } });
      
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('Ref Methods', () => {
    it('exposes focus method through ref', () => {
      const ref = { current: null };
      render(<Textarea ref={ref} />);
      
      expect(ref.current).toHaveProperty('focus');
      expect(ref.current).toHaveProperty('blur');
      expect(ref.current).toHaveProperty('select');
      expect(ref.current).toHaveProperty('getSelectionRange');
      expect(ref.current).toHaveProperty('setSelectionRange');
    });
  });

  describe('Accessibility', () => {
    it('associates label with textarea using htmlFor', () => {
      render(<Textarea label="Description" id="description" />);
      
      const label = screen.getByText('Description');
      const textarea = screen.getByLabelText('Description');
      
      expect(label).toHaveAttribute('for', 'description');
      expect(textarea).toHaveAttribute('id', 'description');
    });

    it('applies disabled state correctly', () => {
      render(<Textarea disabled />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeDisabled();
      expect(textarea).toHaveClass('disabled:opacity-50');
    });
  });

  describe('Input Handling', () => {
    it('handles value changes', () => {
      const handleChange = vi.fn();
      render(<Textarea onChange={handleChange} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'New content' } });
      
      expect(handleChange).toHaveBeenCalled();
      expect(handleChange.mock.calls[0][0]).toHaveProperty('type', 'change');
    });

    it('respects controlled value', () => {
      render(<Textarea value="Controlled value" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Controlled value');
    });

    it('handles custom rows prop', () => {
      render(<Textarea rows={8} />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '8');
    });
  });

  describe('Error States', () => {
    it('prioritizes error over helper text', () => {
      render(
        <Textarea 
          error="Error message" 
          helperText="Helper text" 
        />
      );
      
      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('applies error styling to textarea', () => {
      render(<Textarea error="Error message" />);
      
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('border-red-500', 'focus:border-red-500');
    });
  });
});