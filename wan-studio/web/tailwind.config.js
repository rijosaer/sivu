/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        fondo: "#0b0b0d",
        panel: "#151518",
        borde: "#26262b",
        tenue: "#8b8b94",
        acento: { DEFAULT: "#c8f560", oscuro: "#9fd12f" },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
