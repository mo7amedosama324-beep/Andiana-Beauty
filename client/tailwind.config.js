/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fcfaf7',
          100: '#f7f1ea',
          200: '#eadfce',
          300: '#ddc7af',
          400: '#d1b28f',
          500: '#c5a880',
          600: '#a98861',
          700: '#896a49',
          800: '#694f37',
          900: '#4b3927',
          950: '#2b1f16',
        },
        sand: {
          50: '#fdfcfb',
          100: '#f7f3f0',
          200: '#ede3da',
          300: '#e1d2c7',
          400: '#d2c0b4',
          500: '#c1aea2',
          600: '#a99386',
          700: '#887064',
          800: '#68554c',
          900: '#483935',
          950: '#2b2220',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Inter', 'Tajawal', 'system-ui', 'sans-serif'],
        arabic: ['Tajawal', 'Inter', 'sans-serif'],
        en: ['Inter', 'sans-serif'],
        ar: ['Tajawal', 'sans-serif'],
      },
      borderRadius: {
        'card': '1.5rem',
        'button': '9999px',
        'page': '2rem',
      },
      boxShadow: {
        soft: '0 10px 30px -18px rgba(43, 31, 22, 0.25)',
        glow: '0 0 0 1px rgba(197, 168, 128, 0.18), 0 18px 45px -24px rgba(197, 168, 128, 0.55)',
        elevated: '0 24px 70px -35px rgba(43, 31, 22, 0.3)',
      }
    },
  },
  plugins: [],
}