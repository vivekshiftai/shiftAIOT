/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#8d3165', // Main Primary - Magenta Purple
          600: '#6d2450', // Dark Magenta
          700: '#5c1a3f',
          800: '#4a1532',
          900: '#3d1129',
          950: '#2d0f1e',
        },
        secondary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#722f37', // Main Secondary - Wine/Burgundy
          600: '#8b3a42', // Light Wine
          700: '#991b1b', // Dark red text
          800: '#7f1d1d',
          900: '#6b1a1a',
          950: '#450a0a',
        },
        success: {
          50: '#d1fae5', // Light green backgrounds
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981', // Success states
          600: '#059669',
          700: '#047857',
          800: '#065f46', // Dark green text
          900: '#064e3b',
          950: '#022c22',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Amber
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fee2e2', // Light red backgrounds
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Error states
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b', // Dark red text
          900: '#7f1d1d',
          950: '#450a0a',
        },
        info: {
          50: '#dbeafe', // Light blue backgrounds
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Information states
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af', // Dark blue text
          900: '#1e3a8a',
          950: '#172554',
        },
        neutral: {
          50: '#f9fafb', // Very light gray backgrounds
          100: '#f3f4f6', // Light gray backgrounds
          200: '#e5e7eb', // Border colors
          300: '#d1d5db', // Subtle borders
          400: '#9ca3af', // Secondary text
          500: '#6b7280', // Muted text
          600: '#4b5563', // Dark gray text
          700: '#374151', // Primary dark text
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
      },
    },
  },
  plugins: [],
};
