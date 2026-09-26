import Corner from "./Corner";
import Divider from "./Divider";

// La tarjeta de los servidores: lo que recibe quien acompaña el evento
// sirviendo. No es una invitación —no pide confirmar ni lleva logística— y a
// propósito NO se parece a la portada: allí los protagonistas son los novios,
// aquí lo es la persona. Su nombre va en grande y en la letra manuscrita, su
// función debajo, y los novios firman al pie.
//
// Dos modos, según el enlace:
//   ?servidores=maria-jose-fragozo  → la tarjeta de esa persona
//   ?servidores=1                   → la común, con los seis
export function comoEnlace(nombre) {
  return String(nombre || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // sin tildes: la URL queda limpia
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Busca a la persona cuyo nombre genera ese trozo de URL. "1" es la tarjeta
// común y "*" es "la primera de la lista", que usa la vista previa del panel:
// apuntando a un nombre concreto, cambiarlo mientras se escribe rompería la
// coincidencia y la previa saltaría a la tarjeta común a media palabra.
export function personaDelEnlace(personas, valor) {
  if (!valor || valor === "1") return null;
  const lista = personas || [];
  if (valor === "*") return lista.find((p) => p?.nombre) || null;
  const buscado = comoEnlace(valor);
  return lista.find((p) => comoEnlace(p?.nombre) === buscado) || null;
}

// {nombre} y {funcion} de la plantilla, con los datos de quien la recibe.
function armar(plantilla, persona) {
  return String(plantilla || "")
    .replaceAll("{nombre}", persona?.nombre || "")
    .replaceAll("{funcion}", persona?.funcion || "");
}

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

// El recuadro con las cuatro esquinas de filigrana. Es lo que hace que la
// tarjeta se lea como una dedicatoria y no como una sección más.
function Pergamino({ children }) {
  return (
    <div className="relative w-full max-w-[22rem] sm:max-w-md">
      <div className="relative border border-gold/45 bg-paper/80 px-7 py-12 sm:px-10 sm:py-14 text-center overflow-hidden">
        {/* Filete interior: dos líneas finas separadas, como en los diplomas. */}
        <span
          aria-hidden="true"
          className="absolute inset-[6px] border border-gold/25 pointer-events-none"
        />
        <Corner corner="top-left" size={86} className="opacity-70" />
        <Corner corner="bottom-right" size={86} className="opacity-70" />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

function Firma({ novios, fecha, cierre }) {
  const fechaLegible = soloFecha(fecha);
  return (
    <div className="mt-10 pt-7 border-t border-gold/25">
      {cierre && (
        <p className="font-body text-xs italic text-ink/55 mb-2">{cierre}</p>
      )}
      <p className="font-script text-3xl sm:text-4xl leading-tight text-gold-dark">
        {novios.el} &amp; {novios.ella}
      </p>
      {fechaLegible && (
        <p className="mt-3 font-mono text-[10px] tracking-widest2 uppercase text-gold-dark/70">
          {fechaLegible}
        </p>
      )}
    </div>
  );
}

// La tarjeta de una persona.
function Personal({ persona, novios, fecha, titulo, texto, versiculo, cierre }) {
  // Lo que se le escribió a ella manda sobre la plantilla común.
  const mensaje = persona.mensaje?.trim() ? persona.mensaje : armar(texto, persona);

  return (
    <Pergamino>
      <p className="font-mono text-[10px] tracking-widest2 uppercase text-gold-dark/80">
        {titulo || "Gracias por ser parte"}
      </p>

      <h1 className="mt-5 font-script text-[2.75rem] sm:text-6xl leading-[1.1] text-gold-dark break-words">
        {persona.nombre}
      </h1>

      {persona.funcion && (
        <p className="mt-4 font-mono text-[10px] tracking-widest2 uppercase text-ink/55">
          {persona.funcion}
        </p>
      )}

      <div className="mt-7">
        <Divider />
      </div>

      {mensaje && (
        <p className="mt-7 font-body text-sm leading-relaxed text-ink/75">{mensaje}</p>
      )}

      {versiculo && (
        <p className="mt-7 font-display italic text-[0.95rem] leading-relaxed text-gold-dark/85">
          {versiculo}
        </p>
      )}

      <Firma novios={novios} fecha={fecha} cierre={cierre} />
    </Pergamino>
  );
}

// El enlace común: la misma tarjeta, pero dedicada a los seis. Sirve de
// respaldo cuando el enlace personal no coincide con nadie.
function Comun({ personas, novios, fecha, titulo, subtitulo, texto, versiculo, cierre }) {
  const lista = (personas || []).filter((p) => p?.nombre);

  return (
    <Pergamino>
      <p className="font-mono text-[10px] tracking-widest2 uppercase text-gold-dark/80">
        {titulo || "Gracias por ser parte"}
      </p>

      {subtitulo && (
        <h1 className="mt-5 font-script text-4xl sm:text-5xl leading-tight text-gold-dark">
          {subtitulo}
        </h1>
      )}

      <div className="mt-7">
        <Divider />
      </div>

      {lista.length > 0 && (
        <ul className="mt-7 space-y-5">
          {lista.map((p, i) => (
            <li key={i}>
              <p className="font-display text-lg leading-snug text-ink-light">{p.nombre}</p>
              {p.funcion && (
                <p className="mt-1 font-mono text-[9px] tracking-widest2 uppercase text-ink/45">
                  {p.funcion}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* La plantilla solo se muestra aquí si no depende de nadie: con
          {nombre} o {funcion} dentro, sin persona a quien dirigirla quedaría
          o con los marcadores a la vista o con un hueco en la frase. */}
      {texto && !/\{(nombre|funcion)\}/.test(texto) && (
        <p className="mt-8 font-body text-sm leading-relaxed text-ink/75">{texto}</p>
      )}

      {versiculo && (
        <p className="mt-7 font-display italic text-[0.95rem] leading-relaxed text-gold-dark/85">
          {versiculo}
        </p>
      )}

      <Firma novios={novios} fecha={fecha} cierre={cierre} />
    </Pergamino>
  );
}

export default function Servidores({ persona, personas = [], novios, fecha, ...textos }) {
  return (
    // Sin fondo propio: se ve el de toda la invitación, el papel de CSS o la
    // imagen que se haya subido desde el panel.
    <div className="fixed inset-0 z-50 text-ink overflow-y-auto overflow-x-hidden">
      <div className="relative min-h-full flex flex-col items-center justify-center px-5 py-12">
        {persona ? (
          <Personal persona={persona} novios={novios} fecha={fecha} {...textos} />
        ) : (
          <Comun personas={personas} novios={novios} fecha={fecha} {...textos} />
        )}
      </div>
    </div>
  );
}
