import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = ({ className = '' }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      className={`relative inline-flex h-7 w-13 items-center rounded-full p-1 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
        isDark ? 'bg-[#222631] border border-[#2B313F]' : 'bg-[#E2E8F0] border border-[#CBD5E1]'
      } ${className}`}
    >
      <span className="sr-only">Toggle theme</span>
      <span
        className={`flex h-5 w-5 transform items-center justify-center rounded-full transition-all duration-200 shadow-sm ${
          isDark
            ? 'translate-x-6 bg-[#0C0E12] text-amber-300 border border-[#2B313F]'
            : 'translate-x-0 bg-white text-amber-500 border border-slate-200'
        }`}
      >
        {isDark ? (
          <Moon className="h-3 w-3 fill-amber-300 text-amber-300" />
        ) : (
          <Sun className="h-3 w-3 fill-amber-400 text-amber-500" />
        )}
      </span>
    </button>
  );
};
