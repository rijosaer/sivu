import { useState } from "react";
import TarjetaGeneracion from "../componentes/TarjetaGeneracion.jsx";
import { useGeneraciones } from "../componentes/useGeneraciones.js";

export default function Biblioteca({ alCambiarCreditos }) {
  const { lista, cargado, error, recargar, cargarMas, haySiguiente, quitar } = useGeneraciones({
    limite: 24,
    alTerminar: alCambiarCreditos,
  });
  const [cargandoMas, setCargandoMas] = useState(false);

  const mas = async () => {
    setCargandoMas(true);
    try {
      await cargarMas();
    } finally {
      setCargandoMas(false);
    }
  };

  return (
    <div className="py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1 className="text-2xl font-bold">Biblioteca</h1>
        <a href="#/crear" className="boton-acento">
          Crear video
        </a>
      </div>
      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}
      {cargado && !lista.length ? (
        <p className="py-24 text-center text-tenue">Todavía no has generado videos.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lista.map((g) => (
            <TarjetaGeneracion
              key={g.id}
              g={g}
              alCambiar={() => {
                recargar();
                alCambiarCreditos();
              }}
              alBorrar={quitar}
            />
          ))}
        </div>
      )}
      {haySiguiente && (
        <div className="mt-8 text-center">
          <button onClick={mas} disabled={cargandoMas} className="boton-suave">
            {cargandoMas ? "Cargando…" : "Cargar más"}
          </button>
        </div>
      )}
    </div>
  );
}
