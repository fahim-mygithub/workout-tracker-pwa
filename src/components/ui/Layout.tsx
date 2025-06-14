import React from 'react';
import { cn } from '../../utils/cn';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'col';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
}

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  lgCols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  responsive?: boolean;
}

const containerMaxWidths = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full'
};

const containerPadding = {
  none: '',
  sm: 'px-4',
  md: 'px-6',
  lg: 'px-8'
};

const flexJustify = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly'
};

const flexAlign = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline'
};

const gapSizes = {
  none: 'gap-0',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8'
};

const gridCols = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-6',
  12: 'grid-cols-12'
};

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, maxWidth = 'lg', padding = 'md', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'mx-auto w-full',
        containerMaxWidths[maxWidth],
        containerPadding[padding],
        className
      )}
      {...props}
    />
  )
);

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  ({ 
    className, 
    direction = 'row', 
    justify = 'start', 
    align = 'start', 
    gap = 'md',
    wrap = false,
    ...props 
  }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex',
        direction === 'col' ? 'flex-col' : 'flex-row',
        flexJustify[justify],
        flexAlign[align],
        gapSizes[gap],
        wrap && 'flex-wrap',
        className
      )}
      {...props}
    />
  )
);

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  ({ 
    className, 
    cols = 2, 
    lgCols,
    gap = 'md',
    responsive = true,
    ...props 
  }, ref) => {
    const baseClasses = ['grid', gapSizes[gap]];
    
    if (responsive) {
      baseClasses.push('grid-cols-1');
      if (lgCols) {
        baseClasses.push(`lg:${gridCols[lgCols]}`);
      } else {
        baseClasses.push(`md:${gridCols[cols]}`);
      }
    } else {
      baseClasses.push(gridCols[cols]);
    }

    return (
      <div
        ref={ref}
        className={cn(...baseClasses, className)}
        {...props}
      />
    );
  }
);

Container.displayName = 'Container';
Flex.displayName = 'Flex';
Grid.displayName = 'Grid';