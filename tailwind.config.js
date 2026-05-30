/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Custom harmonious palette
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae2fd',
          300: '#7ccbfd',
          400: '#38b0f8',
          500: '#0ea0ea', // Main bright blue
          600: '#0280c7',
          700: '#0366a1',
          800: '#075685',
          900: '#0c486e',
          950: '#082f49',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        // Theme specific background elements
        kid: {
          bg: '#fffdf0',
          primary: '#ff7b93',
          secondary: '#ffbe0b',
          accent: '#3a86c8',
          text: '#4a3e3d',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'key-press': 'keypress 0.1s ease-out',
        'shake': 'shake 0.2s ease-in-out',
        'bounce-light': 'bounceLight 1.5s ease-in-out infinite',
      },
      keyframes: {
        keypress: {
          '0%': { transform: 'scale(0.95)', filter: 'brightness(0.9)' },
          '100%': { transform: 'scale(1)', filter: 'brightness(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        bounceLight: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-3px)' },
        }
      }
    },
  },
  plugins: [],
}
