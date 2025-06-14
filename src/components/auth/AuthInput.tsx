import React, { forwardRef, InputHTMLAttributes } from 'react';

interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div>
        <label htmlFor={props.id} className="sr-only">
          {label}
        </label>
        <input
          ref={ref}
          className={`
            appearance-none rounded-md relative block w-full px-3 py-2 border 
            ${error ? 'border-red-300' : 'border-gray-300'} 
            placeholder-gray-500 text-gray-900 focus:outline-none 
            ${error ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}
            focus:z-10 sm:text-sm ${className}
          `}
          placeholder={label}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);