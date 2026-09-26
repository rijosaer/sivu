import { createContext, useContext, useMemo } from "react";
import columnImg from "../assets/classic/column.webp";
import scrollworkImg from "../assets/classic/scrollwork.webp";
import bouquetImg from "../assets/classic/flower-bouquet.webp";
import frameImg from "../assets/classic/ornate-frame.webp";
import patternImg from "../assets/classic/pattern-divider.webp";

// Las cinco de fábrica vienen empaquetadas con el sitio. El panel puede
// reemplazar su imagen, y también crear decoraciones nuevas (que no tienen
// versión de fábrica y siempre llegan del servidor).
const DEFAULTS = {
  column: columnImg,
  scrollwork: scrollworkImg,
  bouquet: bouquetImg,
  frame: frameImg,
  divider: patternImg,
};

const DecorContext = createContext({
  ...DEFAULTS,
  ubicaciones: [],
  imagenDe: (clave) => DEFAULTS[clave] || null,
});

export function DecorProvider({ overrides = {}, ubicaciones = [], children }) {
  const valor = useMemo(() => {
    const imagenDe = (clave) => overrides[clave] || DEFAULTS[clave] || null;
    return {
      // Accesos directos que usan los componentes clásicos (Corner, Divider...).
      column: imagenDe("column"),
      scrollwork: imagenDe("scrollwork"),
      bouquet: imagenDe("bouquet"),
      frame: imagenDe("frame"),
      divider: imagenDe("divider"),
      ubicaciones,
      imagenDe,
    };
  }, [overrides, ubicaciones]);

  return <DecorContext.Provider value={valor}>{children}</DecorContext.Provider>;
}

export function useDecor() {
  return useContext(DecorContext);
}
