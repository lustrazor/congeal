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