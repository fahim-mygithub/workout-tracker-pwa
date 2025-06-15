import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { Typography } from './Typography';
import { AlertCircle } from 'lucide-react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  autoResize?: boolean;
  syntaxHighlight?: boolean;
  maxLength?: number;
  showCounter?: boolean;
}

export interface TextareaRef {
  focus: () => void;
  blur: () => void;
  select: () => void;
  getSelectionRange: () => { start: number; end: number };
  setSelectionRange: (start: number, end: number) => void;
}

export const Textarea = forwardRef<TextareaRef, TextareaProps>(({
  label,
  error,
  helperText,
  variant = 'default',
  autoResize = false,
  syntaxHighlight = false,
  maxLength,
  showCounter = false,
  className = '',
  rows = 4,
  value,
  onChange,
  ...props
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    blur: () => textareaRef.current?.blur(),
    select: () => textareaRef.current?.select(),
    getSelectionRange: () => ({
      start: textareaRef.current?.selectionStart || 0,
      end: textareaRef.current?.selectionEnd || 0,
    }),
    setSelectionRange: (start: number, end: number) => {
      textareaRef.current?.setSelectionRange(start, end);
    },
  }));

  // Auto-resize functionality
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (autoResize && textareaRef.current) {
      // Reset height to recalculate
      textareaRef.current.style.height = 'auto';
      // Set height to scrollHeight
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    onChange?.(event);
  };

  // Style variants
  const getVariantClasses = () => {
    const baseClasses = `
      w-full resize-none transition-colors duration-200
      font-mono text-sm leading-relaxed
      focus:outline-none focus:ring-2 focus:ring-blue-500
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    switch (variant) {
      case 'filled':
        return `${baseClasses}
          bg-gray-100 border-0 rounded-lg px-4 py-3
          hover:bg-gray-200 focus:bg-white focus:ring-2
        `;
      case 'outlined':
        return `${baseClasses}
          bg-transparent border-2 border-gray-300 rounded-lg px-4 py-3
          hover:border-gray-400 focus:border-blue-500
        `;
      default:
        return `${baseClasses}
          bg-white border border-gray-300 rounded-md px-3 py-2
          hover:border-gray-400 focus:border-blue-500
        `;
    }
  };

  const errorClasses = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : '';

  const characterCount = typeof value === 'string' ? value.length : 0;
  const isOverLimit = maxLength && characterCount > maxLength;

  return (
    <div className="space-y-1">
      {/* Label */}
      {label && (
        <label
          htmlFor={props.id}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Textarea Container */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={handleChange}
          className={`
            ${getVariantClasses()}
            ${errorClasses}
            ${className}
          `}
          {...props}
        />

        {/* Syntax highlighting overlay (if enabled) */}
        {syntaxHighlight && (
          <div
            className="absolute inset-0 pointer-events-none font-mono text-sm leading-relaxed px-3 py-2"
            style={{ color: 'transparent' }}
          >
            {/* This would contain syntax highlighted version of the text */}
            {/* Implementation would depend on specific syntax highlighting needs */}
          </div>
        )}
      </div>

      {/* Helper text, error, and counter */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              <Typography variant="body2" className="text-red-600">
                {error}
              </Typography>
            </div>
          )}

          {/* Helper text */}
          {helperText && !error && (
            <Typography variant="body2" color="secondary">
              {helperText}
            </Typography>
          )}
        </div>

        {/* Character counter */}
        {(showCounter || maxLength) && (
          <Typography
            variant="body2"
            className={`
              text-right flex-shrink-0 ml-2
              ${isOverLimit ? 'text-red-600' : 'text-gray-500'}
            `}
          >
            {characterCount}
            {maxLength && `/${maxLength}`}
          </Typography>
        )}
      </div>
    </div>
  );
});