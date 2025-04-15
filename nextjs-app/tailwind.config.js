/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Primary palette
        primary: {
          DEFAULT: '#4F46E5', // Indigo
          dark: '#4338CA',
          light: '#6366F1',
        },
        // Secondary palette 
        secondary: {
          DEFAULT: '#1E293B', // Slate
          dark: '#0F172A',
          light: '#334155',
        },
        // Background colors
        background: {
          dark: '#0B0F19', // Very dark blue
          DEFAULT: '#111827', // Dark blue gray
          light: '#1F2937', // Navy blue
          card: '#1E293B', // Card background
        },
        // Status colors
        status: {
          success: '#10B981', // Green
          warning: '#F59E0B', // Amber
          error: '#EF4444', // Red
          info: '#3B82F6', // Blue
        },
        // Text colors
        text: {
          primary: '#F9FAFB', // Almost white
          secondary: '#9CA3AF', // Gray
          muted: '#6B7280', // Dark gray
        },
        // Border colors
        border: {
          DEFAULT: '#374151', // Medium gray
          light: '#4B5563', // Lighter gray
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
