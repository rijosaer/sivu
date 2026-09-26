export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      // El panel no imita a la invitación: es una herramienta de
      // administración y a futuro manejará muchas invitaciones con un usuario
      // cada una, así que se ve como un producto.
      //
      // Paleta piedra y salvia. La cáscara (barra lateral, cabecera) ya estaba
      // escrita con estos colores a mano; aquí los tokens apuntan a los mismos
      // valores para que las pantallas dejen de verse de otra época. Los
      // nombres viejos ("gold", "paper") se conservan porque siguen usados
      // sueltos; lo que cambia es a qué color apuntan.
      //
      // Al escribir pantallas nuevas, usar los nombres semánticos: marca,
      // lienzo, borde, ink — y las clases de src/index.css (.tarjeta, .campo,
      // .boton-primario, .insignia...) antes que inventar utilidades.
      fontFamily: {
        display: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        // Acento: verde salvia. El botón principal es casi negro (marca-dark),
        // que es como se ve la cáscara; el salvia queda para acentos y foco.
        marca: {
          DEFAULT: "#526555",
          suave: "#eef1ec",
          medio: "#7d8c7f",
          dark: "#202321",
        },
        gold: { DEFAULT: "#526555", light: "#dfe5df", dark: "#202321" },
        // Superficies.
        paper: "#ffffff",
        lienzo: "#f7f7f4",
        // Texto: gris cálido, a juego con el lienzo (el slate azulado que
        // había antes desentonaba sobre un fondo cálido).
        ink: {
          DEFAULT: "#202321",
          suave: "#5f6560",
          tenue: "#8b918a",
        },
        // Bordes: el normal para separar, el fuerte para lo interactivo.
        borde: { DEFAULT: "#e8e8e3", fuerte: "#deded8" },
      },
      boxShadow: {
        tarjeta: "0 1px 1px rgb(30 35 33 / .025)",
        flotante: "0 12px 32px -12px rgb(30 35 33 / .28)",
      },
    },
  },
  plugins: [],
};
