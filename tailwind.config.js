/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          dark: '#0F1419',
          light: '#F6F7F9',
        },
        surface: {
          dark: '#161B22',
          light: '#FFFFFF',
          hover: {
            dark: '#21262D',
            light: '#F3F4F6',
          },
          border: {
            dark: '#30363D',
            light: '#E5E7EB',
          },
        },
        text: {
          primary: {
            dark: '#E6EDF3',
            light: '#1A1F26',
          },
          muted: {
            dark: '#8B949E',
            light: '#6B7280',
          },
        },
        streak: '#E8590C',
        category: {
          leetcode: '#4C9AFF',
          java: '#9F7AEA',
          aptitude: '#F6AD55',
          'personal-project': '#48BB78',
          'major-project': '#F56565',
          exercise: '#38B2AC',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
