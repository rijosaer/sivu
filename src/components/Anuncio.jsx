import OrnateFrame from "./OrnateFrame";
import Divider from "./Divider";
import Gallery from "./Gallery";

// La participación: la página pública que anuncia el matrimonio a quienes no
// van al evento. Muestra solo la noticia, los nombres y la fecha —sin lugar,
// hora exacta, código de vestimenta ni confirmación—, porque esos datos son
// para los invitados. El fondo lo pinta App (PaperBackground) detrás.
function soloFecha(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const texto = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(d);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function Anuncio({
  novios,
  fecha,
  titulo,
  texto,
  fotos = [],
  tituloFotos,
  subtituloFotos,
}) {
  const fechaLegible = soloFecha(fecha);

  return (
    <div className="fixed inset-0 z-50 text-ink overflow-y-auto overflow-x-hidden">
      <div className="relative min-h-full flex flex-col items-center justify-center px-6 py-12 text-center">
        <p className="font-mono text-[11px] tracking-widest2 uppercase mb-3 text-gold-dark">
          {titulo || "Nos vamos a casar"}
        </p>

        <OrnateFrame className="w-72 h-[26rem] sm:w-80 sm:h-[30rem]">
          <h1 className="font-display text-4xl sm:text-5xl leading-tight text-gold-dark">
            {novios.el}
            <span className="font-display italic text-ink/70 text-2xl mx-2 align-middle block sm:inline">
              &
            </span>
            {novios.ella}
          </h1>
        </OrnateFrame>

        {fechaLegible && (
          <p className="mt-6 font-mono text-xs tracking-widest2 uppercase text-gold-dark/80">
            {fechaLegible}
          </p>
        )}

        <div className="mt-6">
          <Divider />
        </div>

        {texto && (
          <p className="mt-6 max-w-[20rem] sm:max-w-md text-ink/70 font-body text-sm leading-relaxed">
            {texto}
          </p>
        )}

        {fotos.length > 0 && (
          <div className="w-full max-w-4xl mt-6">
            <Gallery fotos={fotos} titulo={tituloFotos} subtitulo={subtituloFotos} />
          </div>
        )}
      </div>
    </div>
  );
}
