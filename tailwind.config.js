/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        '3xl': '1400px',
      },
      keyframes: {
        bump: {
          '0%': { transform: 'scale(1)' },
          '10%': { transform: 'scale(0.85) rotate(-6deg)' },
          '30%': { transform: 'scale(1.2) rotate(4deg)' },
          '60%': { transform: 'scale(0.95) rotate(-3deg)' },
          '80%': { transform: 'scale(1.05) rotate(2deg)' },
          '100%': { transform: 'scale(1) rotate(0)' }
        }
      },
      animation: {
        bump: 'bump 0.6s ease-in-out'
      }
    },
  },
  safelist: [
    // Add color variations for icons
    {
      pattern: /text-(gray|red|yellow|green|blue|purple)-500/,
    }
  ],
  plugins: [],
} 