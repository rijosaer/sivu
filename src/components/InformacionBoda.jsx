import { useEffect, useState } from "react";
import Divider from "./Divider";

// Del campo "mapa incrustado" saca la URL para el iframe. Acepta tanto la URL
// suelta como el <iframe ...> completo que copia Google en "Insertar un mapa",
// y solo deja pasar embeds de Google Maps: así, aunque el campo es de admin,
// no se puede colar un iframe de cualquier otro sitio.
function urlDelMapa(valor) {
  if (!valor) return "";
  const texto = String(valor).trim();
  const conSrc = texto.match(/src\s*=\s*["']([^"']+)["']/i);
  const url = conSrc ? conSrc[1] : texto;
  return /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/i.test(url) ? url : "";
}

function getRemaining(targetDate) {
  const total = Math.max(0, new Date(targetDate).getTime() - Date.now());
  return {
    dias: Math.floor(total / (1000 * 60 * 60 * 24)),
    horas: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((total / (1000 * 60)) % 60),
    segundos: Math.floor((total / 1000) % 60),
  };
}

// Numerales grandes separados por una regla fina en vez de una "caja de app"
// con sombra: la jerarquía la da el tamaño y el espaciado, no un recuadro.
function Unit({ value, label, ultimo }) {
  return (
    <div
      className={`flex flex-col items-center px-4 sm:px-6 ${
        !ultimo ? "border-r border-gold/25" : ""
      }`}
    >
      <span className="font-display text-4xl sm:text-5xl tabular-nums text-gold-dark leading-none">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-3 text-[10px] tracking-widest2 uppercase text-gold-dark/60">
        {label}
      </span>
    </div>
  );
}

// La boda ocurre en Colombia, así que fecha y hora se muestran siempre en
// hora de Bogotá — sin esto, un invitado con el teléfono en otra zona (o de
// viaje) vería una hora distinta a la real.
const ZONA = "America/Bogota";

function formatFecha(iso) {
  return new Date(iso).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONA,
  });
}

function formatHora(iso) {
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: ZONA,
  });
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-gold/25 pb-2">
      <span className="font-mono text-[10px] tracking-widest2 uppercase text-gold-dark shrink-0">
        {label}
      </span>
      <span className="text-right capitalize">{value}</span>
    </div>
  );
}

export default function InformacionBoda({ info, novios }) {
  const [remaining, setRemaining] = useState(() => getRemaining(info.fecha));
  const mapa = urlDelMapa(info.mapaEmbed);

  useEffect(() => {
    const id = setInterval(() => setRemaining(getRemaining(info.fecha)), 1000);
    return () => clearInterval(id);
  }, [info.fecha]);

  return (
    <section className="relative px-6 sm:px-10 py-24 text-ink overflow-hidden">
      <p className="font-mono text-xs tracking-widest2 uppercase mb-4 text-center text-gold-dark">
        {info.overline || "Ceremonia civil"}
      </p>
      <h2 className="font-display text-3xl sm:text-4xl text-center mb-10 text-gold-dark">
        {info.tituloSeccion || "Información de la boda"}
      </h2>

      {/* Cuenta regresiva */}
      <p className="text-center font-mono text-xs tracking-widest2 uppercase text-gold-dark/80 mb-4">
        Faltan
      </p>
      <div className="mb-10">
        <Divider />
      </div>
      <div className="flex justify-center mb-16">
        <Unit value={remaining.dias} label="Días" />
        <Unit value={remaining.horas} label="Horas" />
        <Unit value={remaining.minutos} label="Min" />
        <Unit value={remaining.segundos} label="Seg" ultimo />
      </div>

      {/* Fecha, hora, lugar */}
      <div className="max-w-lg mx-auto grid grid-cols-1 gap-6 font-body">
        <Row label="Fecha" value={formatFecha(info.fecha)} />
        <Row label="Hora" value={formatHora(info.fecha)} />
        <Row label="Lugar" value={info.lugar} />
        <Row label="Dirección" value={info.direccion} />
      </div>

      {/* Mapa */}
      {mapa && (
        <div className="max-w-lg mx-auto mt-12">
          <div className="border border-gold/30 overflow-hidden">
            <iframe
              src={mapa}
              title={`Ubicación: ${info.lugar || "el lugar de la boda"}`}
              className="w-full h-64 sm:h-72 block"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        </div>
      )}

      {/* Cómo llegar */}
      {info.mapsUrl && (
        <div className="max-w-lg mx-auto mt-6 flex justify-center">
          <a
            href={info.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2 font-mono text-xs tracking-widest2 uppercase transition-colors border border-gold/50 text-gold-dark hover:bg-gold hover:text-paper"
          >
            {mapa ? "Cómo llegar" : "Google Maps"}
          </a>
        </div>
      )}

      {/* Itinerario. Tres formas, según lo que se elija en el panel:
          "detallado" con la hora de cada momento, "mensaje" con un texto
          suelto para cuando el orden todavía no está cerrado, u "oculto". */}
      {info.cronogramaModo !== "oculto" && (
        <div className="max-w-lg mx-auto mt-20">
          <h3 className="font-display text-2xl text-center mb-8 text-gold-dark">
            {info.tituloItinerario || "Itinerario"}
          </h3>

          {info.cronogramaModo === "mensaje" ? (
            <div className="border-y border-gold/30 py-7 text-center">
              <p className="font-body italic text-ink-light leading-relaxed whitespace-pre-line">
                {info.cronogramaMensaje}
              </p>
            </div>
          ) : (
            <ol className="space-y-0 border-t border-gold/25">
              {info.cronograma.map((item, i) => (
                <li key={i} className="flex items-start gap-4 py-3.5 border-b border-gold/25">
                  <span className="font-mono text-xs text-gold-dark w-16 shrink-0 pt-0.5">
                    {item.hora}
                  </span>
                  <span className="text-ink/80">{item.titulo}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}
