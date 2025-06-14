import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BottomNavigation } from '../BottomNavigation';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('BottomNavigation', () => {
  it('renders all navigation items', () => {
    renderWithRouter(<BottomNavigation />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Workout')).toBeInTheDocument();
    expect(screen.getByText('Build')).toBeInTheDocument();
    expect(screen.getByText('Exercises')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders navigation links with correct href attributes', () => {
    renderWithRouter(<BottomNavigation />);
    
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /workout/i })).toHaveAttribute('href', '/workout');
    expect(screen.getByRole('link', { name: /build/i })).toHaveAttribute('href', '/build');
    expect(screen.getByRole('link', { name: /exercises/i })).toHaveAttribute('href', '/exercises');
    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/profile');
  });

  it('applies custom className', () => {
    const { container } = renderWithRouter(<BottomNavigation className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with proper navigation structure', () => {
    renderWithRouter(<BottomNavigation />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('fixed', 'bottom-0', 'left-0', 'right-0');
  });

  it('contains SVG icons for each navigation item', () => {
    renderWithRouter(<BottomNavigation />);
    
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.querySelector('svg')).toBeInTheDocument();
    });
  });
});