/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          500: '#C5A880', // لون ذهبي/بيج للبراند
          600: '#A68B66',
        },
        sand: {
          50: '#FDFCFB',
          100: '#F7F3F0',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        ar: ['Tajawal', 'sans-serif'],
        en: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(197, 168, 128, 0.3)',
      }
    },
  },
  plugins: [],
}