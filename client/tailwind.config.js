/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"SF Pro Display"',
          '"SF Pro Text"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"San Francisco"',
          '"Helvetica Neue"',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        display: ['"SF Pro Display"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: [
          '"SF Mono"',
          'SFMono-Regular',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        brand: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          accent: '#10B981',
          gradientStart: '#10B981',
          gradientEnd: '#34D399',
        },
        dark: {
          bg: '#0C0E12',
          card: '#16181E',
          elevated: '#1C2028',
          subtle: '#222631',
          border: '#252A35',
          borderSubtle: 'rgba(255, 255, 255, 0.07)',
          text: {
            primary: '#FFFFFF',
            secondary: '#94A3B8',
            muted: '#64748B',
          },
        },
        light: {
          bg: '#F4F6F9',
          card: '#FFFFFF',
          elevated: '#F8FAFC',
          subtle: '#F1F5F9',
          border: '#E2E8F0',
          borderSubtle: 'rgba(0, 0, 0, 0.06)',
          text: {
            primary: '#0F172A',
            secondary: '#64748B',
            muted: '#94A3B8',
          },
        },
        crypto: {
          btc: '#F7931A',
          blue: '#3B82F6',
          danger: '#EF4444',
          success: '#10B981',
        },
      },
      boxShadow: {
        'glow-emerald': '0 4px 20px -2px rgba(16, 185, 129, 0.38)',
        'glow-emerald-lg': '0 8px 30px -4px rgba(16, 185, 129, 0.50)',
        'card-light': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-dark': '0 4px 20px 0 rgba(0, 0, 0, 0.40)',
      },
      backgroundImage: {
        'gradient-emerald': 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
        'gradient-emerald-vertical':
          'linear-gradient(180deg, rgba(16, 185, 129, 0.25) 0%, rgba(16, 185, 129, 0) 100%)',
      },
    },
  },
  plugins: [],
};
