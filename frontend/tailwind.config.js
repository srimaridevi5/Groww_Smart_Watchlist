/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        groww: {
          primary: '#00D09C',
          primaryDark: '#00B386',
          bgDark: '#0B0E14',
          cardDark: '#141822',
          borderDark: '#232A3B',
          textMuted: '#8F9BBA',
          up: '#00D09C',
          down: '#FF5252',
        },
      },
    },
  },
  plugins: [],
};
