import { useEffect, useState } from "react";
import { api } from "../api";
import { vocabulario } from "../vocabulario";
import { useToast } from "../ui/Toast";

// Las claves de la base son técnicas ("color-gold-dark"). Aquí se les pone el
// nombre de lo que pintan y dónde se ve, que es lo único que necesita saber
// quien elige un color.
const COLORES = {
  "color-paper": { nombre: "Fondo", donde: "El papel de toda la invitación." },
  "color-ink": { nombre: "Texto", donde: "Los párrafos y los nombres." },
  "color-gold": { nombre: "Dorado", donde: "Bordes, líneas y el botón de confirmar." },
  "color-gold-light": { nombre: "Dorado claro", donde: "Marcos y adornos suaves." },
  "color-gold-dark": { nombre: "Dorado oscuro", donde: "Títulos y textos destacados." },
  "color-marble": { nombre: "Mármol", donde: "Bloques y columnas del fondo." },
  "color-seal": { nombre: "Sello", donde: "Acentos rojizos, como el «no asisto»." },
};

// Muestra de cómo se ven juntos. Cambia en vivo mientras se elige un color, así
// que se ve el resultado sin salir a la invitación.
function Muestra({ valores }) {
  const c = (clave, respaldo) => valores[clave] || respaldo;
  const { antetitulo, nombres } = vocabulario().muestra;
  return (
    <div
      className="rounded-xl border border-borde overflow-hidden"
      style={{ background: c("color-paper", "#F8F4EE") }}
    >
      <div className="px-5 py-6 text-center">
        <p
          className="text-[10px] uppercase tracking-[.2em]"
          style={{ color: c("color-gold-dark", "#8C6A2E") }}
        >
          {antetitulo}
        </p>
        <p
          className="text-2xl mt-2 font-serif"
          style={{ color: c("color-gold-dark", "#8C6A2E") }}
        >
          {nombres[0]}
          {nombres[1] && (
            <>
              {" "}
              <span style={{ color: c("color-ink", "#5C4530") }}>&</span> {nombres[1]}
            </>
          )}
        </p>
        <div className="flex items-center gap-2 justify-center my-3">
          <span className="h-px w-12" style={{ background: c("color-gold", "#B8924A") }} />
          <span
            className="w-2 h-2 rotate-45"
            style={{ background: c("color-gold-light", "#D9BE87") }}
          />
          <span className="h-px w-12" style={{ background: c("color-gold", "#B8924A") }} />
        </div>
        <p className="text-xs" style={{ color: c("color-ink", "#5C4530") }}>
          Acompáñanos a celebrar este día tan especial.
        </p>
        <div className="flex gap-2 justify-center mt-4">
          <span
            className="text-[10px] uppercase tracking-widest px-4 py-2"
            style={{ background: c("color-gold", "#B8924A"), color: c("color-paper", "#F8F4EE") }}
          >
            Confirmar
          </span>
          <span
            className="text-[10px] uppercase tracking-widest px-4 py-2 border"
            style={{ borderColor: c("color-seal", "#8A5A34"), color: c("color-seal", "#8A5A34") }}
          >
            No podré ir
          </span>
        </div>
      </div>
      <div className="h-6" style={{ background: c("color-marble", "#EFEAE1") }} />
    </div>
  );
}

export default function Tema() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.tema().then((data) => {
      // La tabla "tema" también guarda ajustes que no son colores (como las
      // plantillas de WhatsApp, que se editan en Mensajes). Aquí solo van los
      // colores; si no, aparecerían con un selector de color inútil.
      setItems(data.filter((it) => it.clave.startsWith("color-")));
      setCargando(false);
    });
  }, []);

  function actualizar(clave, valor) {
    setItems((prev) => prev.map((it) => (it.clave === clave ? { ...it, valor } : it)));
  }

  async function restaurar() {
    if (!window.confirm("¿Volver a los colores originales del diseño? Se pierden los colores que hayas cambiado.")) return;
    await api.restaurarTema();
    const data = await api.tema();
    setItems(data.filter((it) => it.clave.startsWith("color-")));
    toast("Colores del diseño restaurados");
  }

  async function guardar(clave, valor) {
    await api.actualizarTema(clave, valor);
    toast(`${COLORES[clave]?.nombre || clave} guardado`);
  }

  if (cargando) return <p className="text-sm text-ink-tenue">Cargando...</p>;

  const valores = Object.fromEntries(items.map((it) => [it.clave, it.valor]));

  return (
    <div>
      <h2 className="panel-titulo">Colores</h2>
      <p className="panel-subtitulo mb-6">
        Se aplican a toda la invitación en cuanto los guardas. Cada cambio se guarda solo al soltar
        el selector.
      </p>
      <button type="button" onClick={restaurar} className="boton-secundario mb-5">
        Restaurar colores del diseño
      </button>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem] gap-5 items-start">
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((it) => {
            const info = COLORES[it.clave];
            return (
              <div key={it.clave} className="tarjeta p-4 flex items-center gap-3">
                <input
                  type="color"
                  value={it.valor}
                  onChange={(e) => actualizar(it.clave, e.target.value)}
                  onBlur={(e) => guardar(it.clave, e.target.value)}
                  aria-label={info?.nombre || it.clave}
                  className="w-11 h-11 shrink-0 border border-borde-fuerte rounded-lg cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{info?.nombre || it.clave}</p>
                  <p className="ayuda">{info?.donde || it.clave}</p>
                  <input
                    className="mt-1 w-full bg-transparent border-b border-borde text-xs font-mono py-0.5 text-ink-suave"
                    value={it.valor}
                    onChange={(e) => actualizar(it.clave, e.target.value)}
                    onBlur={(e) => guardar(it.clave, e.target.value)}
                    aria-label={`Código del color ${info?.nombre || it.clave}`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* En pantallas anchas queda a la vista mientras se prueban colores. */}
        <div className="lg:sticky lg:top-24">
          <span className="etiqueta">Cómo se ven juntos</span>
          <Muestra valores={valores} />
          <p className="ayuda mt-2">
            Es una muestra, no la invitación real. Para verla de verdad, abre «Ver invitación» arriba
            a la derecha.
          </p>
        </div>
      </div>
    </div>
  );
}
