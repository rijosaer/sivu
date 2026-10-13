export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // Paleta de la marca Sivú (la misma de heysivu.com y de la cotización):
      // crema de fondo, vino como acento principal y oro para lo que se
      // celebra. El panel sigue siendo una herramienta, así que el vino se usa
      // con medida: la barra lateral, los botones principales y lo activo.
      //
      // Los nombres viejos ("gold", "paper") se conservan porque siguen usados
      // sueltos; lo que cambia es a qué color apuntan.
      fontFamily: {
        sans: ["'Work Sans'", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Arial", "sans-serif"],
        display: ["Fraunces", "Georgia", "'Times New Roman'", "serif"],
        firma: ["'Alex Brush'", "cursive"],
      },
      colors: {
        marca: {
          DEFAULT: "#9B1F3E",
          suave: "#F7E8EB",
          medio: "#C26A80",
          dark: "#5C0F27",
          noche: "#3A0918",
        },
        oro: { DEFAULT: "#E3A63E", suave: "#FBEFD8", oscuro: "#B87F1E" },
        gold: { DEFAULT: "#9B1F3E", light: "#F2DCE1", dark: "#1C1712" },
        paper: "#FFFDF9",
        lienzo: "#FBF6EE",
        ink: {
          DEFAULT: "#1C1712",
          suave: "#6B5F52",
          tenue: "#9A8C7C",
        },
        borde: { DEFAULT: "#EFE4D3", fuerte: "#E3D4BD" },
      },
      boxShadow: {
        tarjeta: "0 1px 2px rgb(60 20 20 / .04), 0 8px 24px -18px rgb(60 20 20 / .18)",
        flotante: "0 18px 40px -16px rgb(60 20 20 / .35)",
      },
    },
  },
  plugins: [],
};
