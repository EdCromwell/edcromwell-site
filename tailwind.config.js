/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FAF6F1',
        card: '#F0EBE3',
        cream: '#2C2216',
        gold: '#8B6914',
        accent: '#5C3D1A',
        warm: '#D4C4A8',
        border: 'rgba(92,61,26,0.12)',
      },
      fontFamily: {
        heading: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Karla', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
