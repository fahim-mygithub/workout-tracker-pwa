import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    type = 'text', 
    label, 
    error, 
    helperText, 
    leftIcon, 
    rightIcon, 
    disabled,
    ...props 
  }, ref) => {
    const inputId = React.useId();
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label 
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium',
              error ? 'text-destructive' : 'text-foreground'
            )}
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-muted-foreground">
                {leftIcon}
              </div>
            </div>
          )}
          
          <input
            id={inputId}
            type={type}
            className={cn(
              'flex w-full rounded-lg border-2 bg-background px-3 py-3 text-base',
              'placeholder:text-muted-foreground',
              'transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'h-12',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error 
                ? 'border-destructive text-destructive focus-visible:ring-destructive' 
                : 'border-input hover:border-muted-foreground/50',
              className
            )}
            disabled={disabled}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="h-5 w-5 text-muted-foreground">
                {rightIcon}
              </div>
            </div>
          )}
        </div>
        
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        
        {helperText && !error && (
          <p className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';