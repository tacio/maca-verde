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
        brand: {
          50: '#f2fce2',
          100: '#e1f8c0',
          200: '#c5f28a',
          300: '#a3e64d',
          400: '#84d521',
          500: '#68ba0c', // crisp green apple
          600: '#509506',
          700: '#3e730a',
          800: '#345b0e',
          900: '#2d4d10',
          950: '#142b03',
        },
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
