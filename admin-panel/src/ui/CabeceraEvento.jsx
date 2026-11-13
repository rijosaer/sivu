import { useState } from "react";
import Icono from "./Icono";
import { SITIO_BASE } from "../api";
import { NOMBRE_TIPO_EVENTO } from "../tiposEvento";
import { useEvento, diasPara, fechaBonita, pasosDelEvento } from "../estado/Evento";
import { iniciales } from "../estado/recientes";

// Cabecera de cada evento: una franja con los colores de SU invitación (así se
// reconoce el evento sin leer) y debajo las pestañas en el orden real del
// trabajo. El subrayado dice dónde estás; el círculo, cómo vas.

function Estado({ progreso, numero, icono, actual }) {
  if (icono) return <Icono nombre={icono} className={`w-[18px] h-[18px] ${actual ? "text-marca" : "text-ink-suave"}`} />;
  if (progreso === "hecho")
    return (
      <span className="estado-paso bg-emerald-600 text-white">
        <Icono nombre="check" className="w-3.5 h-3.5" />
      </span>
    );
  if (progreso === "encurso") return <span className="estado-paso bg-marca-suave text-marca ring-[1.5px] ring-marca">{numero}</span>;
  return <span className="estado-paso bg-lienzo text-ink-suave ring-1 ring-borde-fuerte">{numero}</span>;
}

// Las plantillas traen un lugar de ejemplo; ese no se muestra como si fuera real.
const LUGARES_DE_EJEMPLO = ["lugar de la ceremonia", "iglesia o parroquia", "lugar del evento", "lugar", "direccion"];
const lugarReal = (l) => l && !LUGARES_DE_EJEMPLO.includes(l.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim());

export const PESTANAS_EVENTO = [
  { key: "inicio", label: "Inicio", icono: "inicio" },
  { key: "invitacion", label: "Invitación", paso: 1 },
  { key: "invitados", label: "Invitados", paso: 2 },
  { key: "envios", label: "Envíos", paso: 3 },
  { key: "respuestas", label: "Respuestas", paso: 4 },
  { key: "regalos", label: "Regalos", icono: "regalo", aparte: true },
  { key: "ajustes", label: "Ajustes", icono: "ajustes", aparte: true },
];

export default function CabeceraEvento({ visibles, activo, onIr, onVolver, hayPendientes, acciones }) {
  const { evento, info, resumen, colores, fecha, datosInfo } = useEvento();
  const [copiado, setCopiado] = useState(false);
  const pasos = pasosDelEvento({ resumen, info, hayPendientes });
  const dias = diasPara(fecha);
  const tipo = NOMBRE_TIPO_EVENTO[evento.tipo_evento] || "Evento";
  const diseno = info?.diseno ? info.diseno.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()) : null;
  const claro = colores?.clara;
  const texto = colores?.texto || "#fff";

  async function copiar() {
    try {
      await navigator.clipboard.writeText(SITIO_BASE);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      window.prompt("Copia el enlace de la invitación:", SITIO_BASE);
    }
  }

  const pestanas = PESTANAS_EVENTO.filter((p) => visibles.includes(p.key));
  const detalleRegalos = null;

  return (
    <header className="bg-paper border-b border-borde">
      <div className="franja-evento" style={{ background: colores?.franja, color: texto }}>
        <div
          className="hidden sm:grid place-items-center w-[58px] h-[84px] rounded-[10px] shrink-0 shadow-[0_6px_14px_-4px_rgb(0_0_0/.35)] border"
          style={{ background: `linear-gradient(170deg, ${colores?.papel || "#FBF3E4"}, ${colores?.acento || "#9B1F3E"})`, borderColor: claro ? "rgb(0 0 0 / .12)" : "rgb(255 255 255 / .35)" }}
          aria-hidden="true"
        >
          <span className="font-firma text-[19px]" style={{ color: colores?.fondo }}>
            {iniciales(evento.nombre)}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          {onVolver && (
            <button onClick={onVolver} className="flex items-center gap-1 text-[12.5px] opacity-75 hover:opacity-100 mb-0.5">
              <Icono nombre="volver" className="w-3.5 h-3.5" />
              Eventos
            </button>
          )}
          <h1 className="font-display text-[1.5rem] sm:text-[1.85rem] leading-tight font-medium line-clamp-2 sm:truncate">{evento.nombre}</h1>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-1.5 text-[13.5px]">
            <span className="chip-franja" style={{ background: claro ? "rgb(255 255 255 / .55)" : "rgb(255 255 255 / .15)" }}>
              {tipo}
              {diseno ? ` · ${diseno}` : ""}
            </span>
            {fecha && (
              <span className="opacity-85">
                {fechaBonita(fecha)}
                {lugarReal(datosInfo?.lugar) ? ` · ${datosInfo.lugar}` : ""}
              </span>
            )}
            {dias !== null && dias >= 0 && (
              <span className="chip-franja !bg-oro !text-marca-noche font-semibold">{dias === 0 ? "¡Es hoy!" : dias === 1 ? "Es mañana" : `Faltan ${dias} días`}</span>
            )}
            {dias !== null && dias < 0 && <span className="chip-franja" style={{ background: "rgb(255 255 255 / .15)" }}>Ya pasó</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-center">
          {acciones}
          <button onClick={copiar} className="boton-franja hidden md:inline-flex" style={{ borderColor: claro ? "rgb(0 0 0 / .2)" : "rgb(255 255 255 / .35)" }}>
            <Icono nombre={copiado ? "check" : "copiar"} className="w-4 h-4" />
            {copiado ? "Copiado" : "Copiar enlace"}
          </button>
          <a
            href={SITIO_BASE}
            target="_blank"
            rel="noreferrer"
            className="boton-franja"
            style={{ borderColor: claro ? "rgb(0 0 0 / .2)" : "rgb(255 255 255 / .35)", background: claro ? "rgb(255 255 255 / .5)" : "rgb(255 255 255 / .16)" }}
          >
            <Icono nombre="ojo" className="w-4 h-4" />
            <span className="hidden sm:inline">Ver invitación</span>
          </a>
        </div>
      </div>

      <nav className="pestanas-evento" aria-label="Partes del evento">
        {pestanas.map((p, i) => {
          const estado = pasos[p.key];
          const actual = activo === p.key;
          const primeraAparte = p.aparte && !pestanas[i - 1]?.aparte;
          const detalle = p.key === "regalos" ? detalleRegalos : estado?.detalle;
          return (
            <span key={p.key} className={`contents`}>
              {primeraAparte && <span className="flex-1 min-w-4" aria-hidden="true" />}
              <button onClick={() => onIr(p.key)} aria-current={actual ? "page" : undefined} className="pestana-evento">
                <Estado progreso={estado?.progreso} numero={p.paso} icono={p.icono} actual={actual} />
                <span className="text-left">
                  <span className={`block text-[14px] leading-tight ${actual ? "font-semibold text-ink" : "font-medium text-ink"}`}>{p.label}</span>
                  {detalle && <span className="block text-[12.5px] text-ink-suave leading-tight mt-0.5 whitespace-nowrap">{detalle}</span>}
                </span>
              </button>
            </span>
          );
        })}
      </nav>
    </header>
  );
}
