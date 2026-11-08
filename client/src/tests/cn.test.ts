import { describe, it, expect } from 'vitest';
import { cn } from '../utils/cn';

describe('cn utility (Tailwind + clsx merge)', () => {
  it('combines multiple class strings', () => {
    expect(cn('px-2', 'py-1', 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500');
  });

  it('merges conflicting Tailwind utility classes properly', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('handles conditional falsy values correctly', () => {
    const isHidden = false;
    expect(cn('flex', isHidden && 'hidden', null, undefined, 'items-center')).toBe(
      'flex items-center'
    );
  });
});
