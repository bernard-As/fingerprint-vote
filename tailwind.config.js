/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // Refined to typical React/Vite TSX usage. Add vue, svelte if needed.
  ],
  theme: {
    extend: {
      colors: {
        // Core Brand Palette (already good)
        'navy-primary': '#001f3f',
        'accent-teal': '#00A9B7',
        'accent-teal-dark': '#008C9A', // For hover/active states
        'bg-navy-primary': 'red',
        // Text Colors (already good)
        'neutral-light-text': '#E0F7FA', // For dark backgrounds
        // Pro-Tip: Consider adding a dark text color for light backgrounds if needed beyond default black/grays
        'navy-text-primary': '#0D2A4A', // Example: A slightly softer dark text than pure black

        // Background & Surface Colors (already good for current components)
        'almost-white': '#F8F9FA', // For light cards/surfaces

        // UI Neutral Palette (NEW/ENHANCED)
        // These provide consistent shades for borders, disabled states, secondary text, etc.
        // Naming them thematically helps if you decide to change your base gray.
        'ui-neutral': { // You can define shades, e.g., from 100 to 900
          DEFAULT: '#6B7280', // Default gray, similar to Tailwind's gray-500
          light: '#D1D5DB',     // Lighter, for borders (similar to gray-300)
          medium: '#4B5563',    // Medium, for secondary text (similar to gray-600)
          dark: '#374151',      // Darker (similar to gray-700)
          placeholder: '#9CA3AF',// For input placeholders (similar to gray-400 or 500)
        },

        // Semantic Colors (NEW/ENHANCED)
        'status-error': {
          DEFAULT: '#DC2626', // Tailwind's red-600
          light: '#FEE2E2',   // Tailwind's red-100 (for backgrounds)
          dark: '#B91C1C',    // Tailwind's red-700
        },
        // You could add 'status-success', 'status-warning', 'status-info' here as well.
        'status-success': {
          DEFAULT: '#16A34A', // green-600
          light: '#D1FAE5',   // green-100
        },
      },
      minHeight: { // Fitts's Law (already good)
        '44px': '44px',
        '48px': '48px',
      },
      minWidth: { // Fitts's Law (already good)
        '44px': '44px',
        '48px': '48px',
      },
      // Pro-Tip: Consider defining a consistent spacing scale if you need more control than Tailwind's default,
      // or if you want to enforce an 8px grid strictly.
      // spacing: {
      //   'px': '1px',
      //   '0': '0',
      //   '0.5': '0.125rem', // 2px
      //   '1': '0.25rem',  // 4px
      //   '1.5': '0.375rem', // 6px
      //   '2': '0.5rem',   // 8px  (your base unit)
      //   '2.5': '0.625rem', // 10px
      //   '3': '0.75rem',  // 12px
      //   '3.5': '0.875rem', // 14px
      //   '4': '1rem',     // 16px (2 * base unit)
      //   // ...and so on, typically in multiples of your base unit
      // },
      // Pro-Tip: Define project-specific font families if not using Tailwind's defaults
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Example with Inter font
        // serif: [...],
      },
    },
  },
  plugins: [
    // Consider adding require('@tailwindcss/forms'); if you want pre-styled form elements,
    // though we've styled them manually which gives more control.
  ],
};