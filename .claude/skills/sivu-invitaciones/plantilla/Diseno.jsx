import { useMemo, useRef, useState } from "react";
import "./diseno.css";
import RSVP from "../../components/RSVP";
import {
  partesFecha, limiteLegible, useCuentaRegresiva, pasesDe, useFuentes, useAparecer,
} from "../comun";
// import ramo from "./arte/ramo.webp";

// Diseño «NOMBRE»: una línea con el look (fondo, color principal, arte).
// - Entrada: qué ve el invitado al abrir y qué pasa al tocar.
// - Cuerpo: cómo se presentan las secciones.
// Colores del tema: principal = …, claro = …, oscuro = …, papel = …,
// mármol = …, sello = …. Todo el color sale del tema.
//
// Al copiar: renombra el componente, el archivo CSS y el prefijo «xx» en
// todo (JSX y CSS). Registro en references/registro.md de la skill.

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Great+Vibes&family=Playfair+Display:wght@600;700&family=Libre+Baskerville:wght@400;700&display=swap";

export default function Diseno({ site, contenidoDe, invitacion, onEnviarRSVP, enEditor, variante }) {
  useFuentes(FUENTES);
  // En el panel la entrada se salta para poder ver y editar las secciones.
  const [abierta, setAbierta] = useState(Boolean(enEditor));
  const [rsvpAbierto, setRsvpAbierto] = useState(false);
  const [sonando, setSonando] = useState(false);
  const audioRef = useRef(null);
  const raiz = useAparecer(abierta, "[data-reveal]", "is-in");

  const welcome = contenidoDe("welcome");
  const info = contenidoDe("informacion_boda");
  const vestimenta = contenidoDe("vestimenta");
  const musica = contenidoDe("musica");
  const activo = (tipo) => site.secciones.some((s) => s.tipo === tipo && s.activo !== false);

  const partes = useMemo(() => partesFecha(info.fecha), [info.fecha]);
  const cuenta = useCuentaRegresiva(partes?.fecha);
  const limite = limiteLegible(info.fechaLimiteConfirmacion || site.fechaLimiteConfirmacion);
  const pases = pasesDe(invitacion);
  const nombres = [welcome.novioEl, welcome.novioElla].filter(Boolean);
  const audioSrc = site.audioUrl || musica.src;
  const telefono = (info.telefonoConfirmar || "").trim();
  const digitos = telefono.replace(/\D/g, "");
  const cronograma = info.cronogramaModo === "detallado" ? info.cronograma || [] : [];

  // La música arranca con el toque que abre la invitación, nunca sola.
  function abrir() {
    setAbierta(true);
    audioRef.current?.play().then(() => setSonando(true)).catch(() => {});
  }
  function alternarMusica() {
    const a = audioRef.current;
    if (!a) return;
    if (sonando) { a.pause(); setSonando(false); }
    else a.play().then(() => setSonando(true)).catch(() => {});
  }

  // Con invitación personal se confirma por el formulario; sin código, por
  // WhatsApp al teléfono del anfitrión; si no hay ninguno, no hay botón.
  const confirmar = invitacion
    ? { grande: "Confirmar asistencia", onClick: () => setRsvpAbierto(true) }
    : digitos
      ? { texto: "Favor confirmar al", grande: telefono, href: `https://wa.me/${digitos.length === 10 ? `57${digitos}` : digitos}` }
      : null;

  return (
    <div className={`xx ${variante ? `xx-${variante}` : ""}`} ref={raiz}>
      {audioSrc && <audio ref={audioRef} src={audioSrc} loop />}
      {audioSrc && abierta && (
        <button className="xx-musica" type="button" aria-pressed={sonando} onClick={alternarMusica}>
          {sonando ? "Pausar" : "Música"}
        </button>
      )}

      {/* Entrada: única para este diseño (ver references/estilo.md). */}
      {!abierta && (
        <section className="xx-entrada" aria-label="Abrir invitación">
          {invitacion?.nombre && (
            <div className="xx-invitado">
              <span>Invitación especial para</span>
              <p>{invitacion.nombre}</p>
              {pases > 0 && <span className="xx-pases">{pases} {pases === 1 ? "pase reservado" : "pases reservados"}</span>}
            </div>
          )}
          <button type="button" className="xx-abrir" onClick={abrir}>Toca para abrir</button>
        </section>
      )}

      {abierta && (
        <main className="xx-cuerpo">
          <header className="xx-portada" data-reveal>
            {welcome.bienvenidaTexto && <p className="xx-antetitulo">{welcome.bienvenidaTexto}</p>}
            <h1 className="xx-nombres">{nombres.join(" & ")}</h1>
            {welcome.fraseIntro && <p className="xx-texto">{welcome.fraseIntro}</p>}
            {partes && <p className="xx-fecha">{partes.semana} {partes.dia} de {partes.mes} · {partes.hora}</p>}
          </header>

          {partes && (
            <section className="xx-seccion" aria-labelledby="xx-cuenta" data-reveal>
              <h2 className="xx-h2" id="xx-cuenta">Faltan</h2>
              {cuenta ? (
                <div className="xx-cuenta" role="timer" aria-labelledby="xx-cuenta">
                  {[["dias", "días"], ["horas", "horas"], ["min", "min"], ["seg", "seg"]].map(([k, l]) => (
                    <div key={k}><span className="n">{cuenta[k]}</span><span className="l">{l}</span></div>
                  ))}
                </div>
              ) : (
                <p className="xx-texto">¡Llegó el gran día!</p>
              )}
            </section>
          )}

          {info.lugar && (
            <section className="xx-seccion" aria-labelledby="xx-lugar" data-reveal>
              <h2 className="xx-h2" id="xx-lugar">¿Dónde?</h2>
              <p className="xx-texto"><b>{info.lugar}</b>{info.direccion && <><br />{info.direccion}</>}</p>
              {info.mapsUrl && <a className="xx-btn" href={info.mapsUrl} target="_blank" rel="noopener noreferrer">Cómo llegar</a>}
            </section>
          )}

          {cronograma.length > 0 && (
            <section className="xx-seccion" aria-labelledby="xx-programa" data-reveal>
              <h2 className="xx-h2" id="xx-programa">{info.tituloItinerario || "Programa"}</h2>
              <ol className="xx-programa">
                {cronograma.map((c, i) => <li key={i}><span>{c.hora}</span><b>{c.titulo}</b></li>)}
              </ol>
            </section>
          )}

          {activo("vestimenta") && vestimenta.titulo && (
            <section className="xx-seccion" aria-labelledby="xx-vestimenta" data-reveal>
              <h2 className="xx-h2" id="xx-vestimenta">Vestimenta</h2>
              <p className="xx-texto"><b>{vestimenta.titulo}</b>{vestimenta.nota && <><br />{vestimenta.nota}</>}</p>
            </section>
          )}

          {/* Resto de secciones opcionales: padrinos, historia, regalos, sobres,
              info_importante, faq. Siempre con activo(tipo) + contenido. */}

          {confirmar && (
            <section className="xx-seccion" data-reveal>
              {confirmar.href ? (
                <a className="xx-confirmar" href={confirmar.href} target="_blank" rel="noopener noreferrer">
                  {confirmar.texto} <b>{confirmar.grande}</b>
                </a>
              ) : (
                <button className="xx-confirmar" type="button" onClick={confirmar.onClick}>{confirmar.grande}</button>
              )}
              {limite && <p className="xx-limite">Confirma antes del <b>{limite}</b></p>}
            </section>
          )}
        </main>
      )}

      {rsvpAbierto && invitacion && (
        <div className="xx-modal" role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setRsvpAbierto(false)}>
          <div className="xx-modal-caja">
            <button type="button" className="xx-cerrar" onClick={() => setRsvpAbierto(false)} aria-label="Cerrar">×</button>
            <RSVP
              invitacion={invitacion}
              fechaLimite={info.fechaLimiteConfirmacion || site.fechaLimiteConfirmacion}
              opciones={{
                mostrarRestriccion: info.mostrarRestriccion !== false,
                mostrarObservaciones: info.mostrarObservaciones !== false,
              }}
              onSubmit={onEnviarRSVP}
            />
          </div>
        </div>
      )}
    </div>
  );
}
