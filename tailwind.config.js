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
        // me.edcromwell.com — forest palette
        'me-bg':      '#0B0F0C',
        'me-bg-2':    '#11170F',
        'me-moss':    '#1F2E22',
        'me-moss-2':  '#2C3E2F',
        'me-bark':    '#2A1E14',
        'me-bark-2':  '#3E2D1F',
        'me-bark-3':  '#5C4530',
        'me-text':    '#E8DDC9',
        'me-dim':     '#8C7E6A',
        'me-gold':    '#A88646',
        'me-pine':    '#5A7A4F',
        'me-spotify': '#1ED760',
      },
      fontFamily: {
        heading: ['"Barlow Condensed"', 'sans-serif'],
        body: ['Karla', 'sans-serif'],
        // me.edcromwell.com — body + graffiti
        'me-body':    ['Inter', 'system-ui', 'sans-serif'],
        'me-scrawl':  ['"Permanent Marker"', 'cursive'],
      },
    },
  },
  plugins: [],
}
