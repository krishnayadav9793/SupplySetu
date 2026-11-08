import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { ThemeProvider } from '../context/ThemeContext';

describe('ThemeToggle Component', () => {
  it('renders correctly and has accessible aria label', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button.getAttribute('aria-label')).toMatch(/Switch to (light|dark) mode/i);
  });

  it('toggles theme state when clicked', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    const initialLabel = button.getAttribute('aria-label');

    fireEvent.click(button);

    const updatedLabel = button.getAttribute('aria-label');
    expect(updatedLabel).not.toBe(initialLabel);
  });
});
