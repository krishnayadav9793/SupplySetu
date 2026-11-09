import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastCard, ToastContainer, ToastItem } from '../components/common/Toast';

describe('Toast Component Suite', () => {
  it('renders an error toast correctly with title and message', () => {
    const onDismiss = vi.fn();
    const toast: ToastItem = {
      id: 'toast-1',
      type: 'error',
      title: 'Incorrect Password',
      message: 'The password you entered is incorrect.',
      duration: 5000,
    };

    render(<ToastCard toast={toast} onDismiss={onDismiss} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Incorrect Password')).toBeInTheDocument();
    expect(screen.getByText('The password you entered is incorrect.')).toBeInTheDocument();
  });

  it('triggers onDismiss when close button is clicked', () => {
    const onDismiss = vi.fn();
    const toast: ToastItem = {
      id: 'toast-2',
      type: 'error',
      title: 'Invalid Mobile Number',
      message: 'Please enter a 10-digit number.',
      duration: 5000,
    };

    render(<ToastCard toast={toast} onDismiss={onDismiss} />);

    const closeBtn = screen.getByRole('button', { name: /dismiss notification/i });
    fireEvent.click(closeBtn);

    expect(onDismiss).toHaveBeenCalledWith('toast-2');
  });

  it('renders multiple toasts in ToastContainer', () => {
    const onDismiss = vi.fn();
    const toasts: ToastItem[] = [
      {
        id: 't-1',
        type: 'error',
        title: 'Invalid Mobile Number',
        message: 'Must be 10 digits.',
      },
      {
        id: 't-2',
        type: 'error',
        title: 'Incorrect Password',
        message: 'Verify credentials.',
      },
    ];

    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);

    expect(screen.getByText('Invalid Mobile Number')).toBeInTheDocument();
    expect(screen.getByText('Incorrect Password')).toBeInTheDocument();
  });

  it('returns null when toasts list is empty in ToastContainer', () => {
    const { container } = render(<ToastContainer toasts={[]} onDismiss={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});
