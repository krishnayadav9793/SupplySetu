import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

function BrokenComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Simulated Crash inside test component');
  }
  return <div>Component rendered safely</div>;
}

describe('ErrorBoundary Component', () => {
  it('renders children safely when no error occurs', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Component rendered safely')).toBeInTheDocument();
  });

  it('catches runtime errors and renders accessible error fallback UI', () => {
    // Suppress console.error in Vitest for expected test boundary crash
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Application')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('invokes custom fallback render prop when provided', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary
        fallback={(err, reset) => (
          <div>
            <p>Custom Error: {err.message}</p>
            <button onClick={reset}>Custom Reset</button>
          </div>
        )}
      >
        <BrokenComponent shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(
      screen.getByText('Custom Error: Simulated Crash inside test component')
    ).toBeInTheDocument();
    expect(screen.getByText('Custom Reset')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('resets error state when Try Again is clicked', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    let shouldThrow = true;
    const { rerender } = render(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Fix component condition and trigger reset
    shouldThrow = false;
    rerender(
      <ErrorBoundary>
        <BrokenComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByText('Try Again'));
    expect(screen.getByText('Component rendered safely')).toBeInTheDocument();

    spy.mockRestore();
  });
});
