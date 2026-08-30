/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      colors: {
        fintech: {
          bg: '#080F1A',
          bgSecondary: '#0D1724',
          card: '#111D2B',
          elevated: '#162335',
          border: 'rgba(255, 255, 255, 0.08)',
          blue: '#2563EB',
          purple: '#7C3AED',
          cyan: '#06B6D4',
          low: '#10B981',
          medium: '#F59E0B',
          high: '#EF4444',
          textPrimary: '#F8FAFC',
          textSecondary: '#94A3B8',
          textMuted: '#64748B'
        }
      }
    },
  },
  plugins: [],
}
