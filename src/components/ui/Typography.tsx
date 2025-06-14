import React from 'react';
import { cn } from '../../utils/cn';

export interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body1' | 'body2' | 'caption' | 'overline';
  component?: keyof JSX.IntrinsicElements;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'muted';
}

const typographyVariants = {
  h1: 'text-4xl font-bold leading-tight',
  h2: 'text-3xl font-bold leading-tight',
  h3: 'text-2xl font-semibold leading-tight',
  h4: 'text-xl font-semibold leading-tight',
  h5: 'text-lg font-semibold leading-tight',
  h6: 'text-base font-semibold leading-tight',
  body1: 'text-base leading-relaxed',
  body2: 'text-sm leading-relaxed',
  caption: 'text-xs leading-normal',
  overline: 'text-xs uppercase tracking-wider font-medium'
};

const typographyColors = {
  primary: 'text-gray-900',
  secondary: 'text-gray-600',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  muted: 'text-gray-500'
};

const defaultComponents = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span'
} as const;

export const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ 
    className, 
    variant = 'body1', 
    component, 
    color = 'primary', 
    children,
    ...props 
  }, ref) => {
    const Component = component || defaultComponents[variant];
    
    return React.createElement(
      Component,
      {
        ref,
        className: cn(
          typographyVariants[variant],
          typographyColors[color],
          className
        ),
        ...props
      },
      children
    );
  }
);

Typography.displayName = 'Typography';