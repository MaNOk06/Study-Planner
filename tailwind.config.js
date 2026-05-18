/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'ui-serif', 'serif'],
        sans: ['Manrope', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        cream: '#FAF6EE',
        paper: '#F7F4ED',
        navy: '#1E3A5F',
        gold: '#B08A3E',
      },
    },
  },
  plugins: [],
}
