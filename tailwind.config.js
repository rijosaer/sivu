/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Los colores del tema se escriben como "rgb(var(...) / <alpha-value>)"
      // y sus variables guardan los canales sueltos ("184 146 74"), no un hex.
      // Es la única forma de que funcionen los modificadores de opacidad:
      // con "var(--color-gold)" a secas, clases como border-gold/40 o
      // bg-gold/5 no producían color y quedaban transparentes o en el gris
      // por defecto de Tailwind.
      colors: {
        // "ink" = warm dark brown para texto — editable desde el panel (Tema)
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          light: "#7A5C45", // café madera (no editable desde el panel todavía)
        },
        // "paper" = fondo — editable desde el panel (Tema)
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        // "stone"/"dusk": quedan del set original, ya sin uso activo en
        // el tema dorado único, pero se mantienen por si reactivas algún
        // componente que aún las referencie.
        stone: {
          DEFAULT: "#D7C4AF",
          light: "#E7D8C8",
          dark: "#7A5C45",
        },
        dusk: {
          DEFAULT: "#7B8F73",
          light: "#8D9775",
          dark: "#5C6B57",
        },
        sand: "#C9B68A",
        seal: "rgb(var(--color-seal) / <alpha-value>)",
        // paleta dorada — editable desde el panel (Tema)
        gold: {
          DEFAULT: "rgb(var(--color-gold) / <alpha-value>)",
          light: "rgb(var(--color-gold-light) / <alpha-value>)",
          dark: "rgb(var(--color-gold-dark) / <alpha-value>)",
        },
        marble: {
          DEFAULT: "rgb(var(--color-marble) / <alpha-value>)",
          shadow: "#C9BFAE",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        script: ["'Alex Brush'", "cursive"],
        body: ["'Work Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      letterSpacing: {
        widest2: "0.25em",
      },
    },
  },
  plugins: [],
}
