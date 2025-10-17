/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Inter', 'Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        'agribank': {
          primary: '#B91C3B',
          dark: '#8B1530',
          light: '#D4234E',
        },
      },
    },
  },
  plugins: [],
}