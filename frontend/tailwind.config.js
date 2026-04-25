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
        rolex: {
          black: "#0a0a0a",
          silver: "#c0c0c0",
          gold: "#d4af37",
          blue: "#0070f3",
          glow: "rgba(0, 112, 243, 0.5)",
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          'from': { 'box-shadow': '0 0 5px rgba(0, 112, 243, 0.2)' },
          'to': { 'box-shadow': '0 0 20px rgba(0, 112, 243, 0.6)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
