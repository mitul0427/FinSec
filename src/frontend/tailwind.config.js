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
        finsec: {
          bg: '#090d16',
          card: '#0f172a',
          border: '#1e293b',
          accent: '#06b6d4',
          emerald: '#10b981',
          danger: '#ef4444',
          warning: '#f59e0b',
          purple: '#8b5cf6'
        }
      }
    },
  },
  plugins: [],
}
