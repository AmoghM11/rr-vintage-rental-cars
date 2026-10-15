/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // touch screens keep hover styles stuck after a tap; only apply them where hover exists
  future: { hoverOnlyWhenSupported: true },
  theme: {
    extend: {
      colors: {
        night: '#070605',
        coal: '#0f0d0b',
        ivory: '#f3ede2',
        gold: { DEFAULT: '#8e6b36', light: '#c9a56b', pale: '#e6cf9f' },
        parchment: '#e9d4aa',
        claret: '#4a0d18',
      },
      fontFamily: {
        display: ['Italiana', 'serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['Rajdhani', 'sans-serif'],
      },
      letterSpacing: { mega: '0.42em' },
    },
  },
  plugins: [],
}
