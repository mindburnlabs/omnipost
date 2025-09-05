import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { useTheme } from 'next-themes';
import { ThemeToggle } from '../ThemeToggle';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(),
}));

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockUseTheme.mockClear();
  });

  it('renders with light theme', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: jest.fn(),
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Toggle theme');
  });

  it('renders with dark theme', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: jest.fn(),
      resolvedTheme: 'dark',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'dark',
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('toggles from light to dark theme', () => {
    const mockSetTheme = jest.fn();
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('toggles from dark to light theme', () => {
    const mockSetTheme = jest.fn();
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'dark',
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('handles system theme', () => {
    const mockSetTheme = jest.fn();
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    // When system theme is active, clicking should switch to dark
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('is accessible with keyboard navigation', () => {
    const mockSetTheme = jest.fn();
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      themes: ['light', 'dark', 'system'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    
    // Test keyboard interaction
    fireEvent.keyDown(button, { key: 'Enter' });
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
    
    mockSetTheme.mockClear();
    
    fireEvent.keyDown(button, { key: ' ' });
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });
});
