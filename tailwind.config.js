/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-black': '#000000',
        'custom-lime': '#D1FE17',
        'custom-blue': '#93B5C6',
        'custom-white': '#FFFFFF',
        'custom-red': '#FF0022',
        
        // Альтернативные имена для удобства
        'neon-lime': '#D1FE17',
        'soft-blue': '#93B5C6',
        'bright-red': '#FF0022',
      },
    },
  },
  plugins: [],
}

