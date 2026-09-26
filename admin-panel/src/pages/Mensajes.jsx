import { useEffect, useRef, useState } from "react";
import { api, SITIO_BASE } from "../api";
import { useToast } from "../ui/Toast";
import Icono from "../ui/Icono";
import {
  armarMensaje,
  diasHasta,
  enlaceWhatsApp,
  marcadoresDesconocidos,
} from "../whatsapp";
import { comoEnlace } from "../servidores";

// Texto con el que se comparte la participación a quienes no van a la boda
// civil. Es solo el punto de partida: se edita aquí y queda guardado en el
// tema ("whatsapp-noticia"), igual que los otros dos mensajes.
const NOTICIA_POR_DEFECTO = `¡Tenemos una hermosa noticia! ✨

Muy pronto comenzaremos una nueva etapa de nuestras vidas: ¡nos casamos! ❤️

Aunque no podamos celebrar este día con todas las personas que apreciamos, queríamos compartir contigo nuestra felicidad y este momento tan especial.


{enlace}`;

// Los marcadores, explicados en una línea cada uno. Antes vivían en un párrafo
// de doce renglones que nadie leía; aquí se insertan con un clic donde esté el
// cursor, que es como se aprenden de verdad.
const MARCADORES = [
  { clave: "{nombre}", que: "El nombre de esa invitación" },
  { clave: "{enlace}", que: "Su enlace personal" },
  { clave: "{cupos}", que: "Frase de los cupos (vacío si no tiene)" },
  { clave: "{plazo}", que: "«quedan 5 días para confirmar»" },
  { clave: "{dias}", que: "Días que faltan para la boda" },
  { clave: "{dias_limite}", que: "Días para el cierre (solo el número)" },
];

const MARCADORES_NOTICIA = [{ clave: "{enlace}", que: "Enlace de la participación" }];

// Texto con el que se comparte la tarjeta de los servidores. Cada uno tiene su
// propia tarjeta y su propio enlace, así que el mensaje sí lleva {nombre}.
const SERVIDORES_POR_DEFECTO = `Hola {nombre} 🎶

Queremos darte las gracias por acompañarnos en un día tan importante para nosotros. Te dejamos algo escrito para ti:

{enlace}`;

const MARCADORES_SERVIDORES = [
  { clave: "{nombre}", que: "El nombre de esa persona" },
  { clave: "{enlace}", que: "Su enlace personal" },
];

// Datos de mentira para la vista previa. Son los de una invitación por cupos a
// propósito: es el único caso donde se ven todos los marcadores a la vez.
const EJEMPLO = {
  nombre: "Carlos Rodríguez",
  enlace: `${SITIO_BASE}?i=ABC123`,
  cupos: 3,
};

function Burbuja({ texto }) {
  return (
    <div className="bg-[#e7f6d8] border border-[#d4ecc0] rounded-xl rounded-tr-sm px-3.5 py-2.5 text-[13px] leading-relaxed text-[#111b21] whitespace-pre-wrap break-words">
      {texto || <span className="text-ink-tenue italic">El mensaje está vacío.</span>}
    </div>
  );
}

function Editor({ titulo, descripcion, valor, marcadores, ejemplo, onGuardar }) {
  const [texto, setTexto] = useState(valor);
  const [guardando, setGuardando] = useState(false);
  const areaRef = useRef(null);

  // Si el valor llega después (o lo cambia otra pestaña), se refleja mientras
  // no se esté editando algo distinto.
  useEffect(() => setTexto(valor), [valor]);

  const sinGuardar = texto !== valor;
  const desconocidos = marcadoresDesconocidos(texto);
  const previa = armarMensaje(texto, ejemplo);

  // Inserta el marcador donde está el cursor, no al final: así se puede
  // colocar en mitad de una frase sin cortar y pegar.
  function insertar(clave) {
    const area = areaRef.current;
    const inicio = area?.selectionStart ?? texto.length;
    const fin = area?.selectionEnd ?? texto.length;
    setTexto(texto.slice(0, inicio) + clave + texto.slice(fin));
    requestAnimationFrame(() => {
      area?.focus();
      area?.setSelectionRange(inicio + clave.length, inicio + clave.length);
    });
  }

  async function guardar() {
    setGuardando(true);
    await onGuardar(texto);
    setGuardando(false);
  }

  return (
    <section className="tarjeta p-5 mb-5">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
        <div>
          <h3 className="bloque-titulo">{titulo}</h3>
          <p className="ayuda mt-0.5">{descripcion}</p>
        </div>
        {sinGuardar && <span className="insignia insignia-aviso">Sin guardar</span>}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-4">
        <div>
          <span className="etiqueta">Texto del mensaje</span>
          <textarea
            ref={areaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={10}
            className="campo font-[inherit] leading-relaxed resize-y"
          />

          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-[11px] text-ink-tenue mr-1">Insertar:</span>
            {marcadores.map((m) => (
              <button
                key={m.clave}
                type="button"
                onClick={() => insertar(m.clave)}
                title={m.que}
                className="chip-filtro font-mono"
              >
                {m.clave}
              </button>
            ))}
          </div>

          {desconocidos.length > 0 && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-2 mt-3">
              {desconocidos.map((m) => (
                <code key={m} className="mr-1 font-mono">
                  {m}
                </code>
              ))}
              {desconocidos.length === 1 ? "no se reconoce" : "no se reconocen"}: va a salir así
              mismo en el mensaje del invitado, sin reemplazar.
            </p>
          )}

          <div className="flex items-center gap-3 mt-4">
            <button onClick={guardar} disabled={!sinGuardar || guardando} className="boton-primario">
              {guardando ? "Guardando..." : "Guardar mensaje"}
            </button>
            {sinGuardar && (
              <button onClick={() => setTexto(valor)} className="boton-texto">
                Descartar
              </button>
            )}
          </div>
        </div>

        {/* Vista previa: lo que le llega al invitado, con los marcadores ya
            reemplazados. Es la forma más corta de explicar qué hace cada uno. */}
        <div>
          <span className="etiqueta">Así lo recibe {ejemplo.nombre || "quien lo lea"}</span>
          <div className="rounded-xl bg-[#efeae2] border border-borde p-3">
            <Burbuja texto={previa} />
          </div>
          <p className="ayuda mt-2">
            Ejemplo con una invitación de 3 cupos. En una invitación sin cupos, esa frase
            desaparece sola.
          </p>
        </div>
      </div>
    </section>
  );
}

// Una página pública: un solo enlace, sin código ni confirmación, que se
// reparte tal cual. Hoy solo la usa la participación (?anuncio=1); las
// tarjetas de los servidores llevan un enlace por persona y tienen la suya.
function EnlacePublico({ titulo, ayuda, enlace, plantilla, cuenta }) {
  const [copiado, setCopiado] = useState(false);
  const mensaje = armarMensaje(plantilla, { enlace, ...cuenta });

  return (
    <div className="tarjeta p-5 mb-5">
      <h3 className="bloque-titulo">{titulo}</h3>
      <p className="ayuda mt-0.5 mb-3">{ayuda}</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="text-xs bg-lienzo border border-borde rounded-md px-2.5 py-2 text-ink-suave break-all">
          {enlace}
        </code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(enlace);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1500);
          }}
          className="boton-secundario"
        >
          <Icono nombre="copiar" className="w-3.5 h-3.5" />
          {copiado ? "¡Copiado!" : "Copiar enlace"}
        </button>
        <a href={enlace} target="_blank" rel="noreferrer" className="boton-secundario">
          <Icono nombre="ojo" className="w-3.5 h-3.5" />
          Ver
        </a>
        <a
          href={enlaceWhatsApp("", mensaje)}
          target="_blank"
          rel="noreferrer"
          className="boton-verde"
        >
          Compartir por WhatsApp
        </a>
      </div>
    </div>
  );
}

// Una fila por persona: su enlace propio, para copiarlo o mandarlo por
// WhatsApp. A diferencia de la participación, aquí no hay un enlace único —
// cada tarjeta está escrita para quien la abre.
function Servidor({ persona, plantilla, cuenta }) {
  const [copiado, setCopiado] = useState(false);
  const enlace = `${SITIO_BASE}?servidores=${comoEnlace(persona.nombre)}`;
  const mensaje = armarMensaje(plantilla, { nombre: persona.nombre, enlace, ...cuenta });

  return (
    <div className="flex flex-wrap items-center gap-2 py-2.5 border-t border-borde first:border-t-0">
      <div className="min-w-[9rem] flex-1">
        <p className="text-sm text-ink">{persona.nombre}</p>
        {persona.funcion && (
          <p className="text-[11px] text-ink-tenue truncate">{persona.funcion}</p>
        )}
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(enlace);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 1500);
        }}
        className="boton-secundario"
      >
        <Icono nombre="copiar" className="w-3.5 h-3.5" />
        {copiado ? "¡Copiado!" : "Copiar"}
      </button>
      <a href={enlace} target="_blank" rel="noreferrer" className="boton-secundario">
        <Icono nombre="ojo" className="w-3.5 h-3.5" />
        Ver
      </a>
      <a href={enlaceWhatsApp("", mensaje)} target="_blank" rel="noreferrer" className="boton-verde">
        WhatsApp
      </a>
    </div>
  );
}

function TarjetasServidores({ personas, plantilla, cuenta }) {
  const lista = (personas || []).filter((p) => p?.nombre);

  return (
    <div className="tarjeta p-5 mb-5">
      <h3 className="bloque-titulo">Tarjetas de los servidores</h3>
      <p className="ayuda mt-0.5 mb-3">
        Cada uno tiene su propia tarjeta, con su nombre y su función. Los nombres, las funciones y
        el mensaje se editan en Contenido → Tarjeta de los servidores. Nadie confirma asistencia
        desde aquí.
      </p>

      {lista.length === 0 ? (
        <p className="text-sm text-ink-tenue">
          Todavía no hay nadie en la lista. Se agregan en Contenido → Tarjeta de los servidores.
        </p>
      ) : (
        <>
          <div>
            {lista.map((p, i) => (
              <Servidor key={i} persona={p} plantilla={plantilla} cuenta={cuenta} />
            ))}
          </div>
          <p className="ayuda mt-3">
            El enlace de cada quien sale de su nombre: si lo cambias en Contenido, el enlace cambia
            y el anterior deja de abrir su tarjeta.
          </p>
        </>
      )}
    </div>
  );
}

function claveTema(tema, clave) {
  if (Array.isArray(tema)) return tema.find((x) => x.clave === clave)?.valor;
  return tema?.[clave];
}

export default function Mensajes() {
  const toast = useToast();
  const [plantilla, setPlantilla] = useState("");
  const [recordatorio, setRecordatorio] = useState("");
  const [noticia, setNoticia] = useState(NOTICIA_POR_DEFECTO);
  const [servidores, setServidores] = useState(SERVIDORES_POR_DEFECTO);
  const [fechas, setFechas] = useState({});
  const [personas, setPersonas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    Promise.all([api.tema(), api.secciones().catch(() => [])]).then(([tema, secciones]) => {
      if (!vivo) return;
      setFechas(secciones.find((s) => s.tipo === "informacion_boda")?.contenido || {});
      setPersonas(secciones.find((s) => s.tipo === "servidores")?.contenido?.personas || []);
      setPlantilla(
        claveTema(tema, "whatsapp-plantilla") ||
          "Hola {nombre}, te compartimos tu invitación: {enlace}"
      );
      setRecordatorio(
        claveTema(tema, "whatsapp-recordatorio") ||
          "Hola {nombre}, te recordamos confirmar tu asistencia ({plazo}): {enlace}"
      );
      setNoticia(claveTema(tema, "whatsapp-noticia") || NOTICIA_POR_DEFECTO);
      setServidores(claveTema(tema, "whatsapp-servidores") || SERVIDORES_POR_DEFECTO);
      setCargando(false);
    });
    return () => {
      vivo = false;
    };
  }, []);

  // Se recalcula en cada render: si el panel queda abierto de un día para otro,
  // el mensaje sale con los días correctos igual.
  const cuenta = {
    dias: diasHasta(fechas.fecha),
    diasLimite: diasHasta(fechas.fechaLimiteConfirmacion),
  };
  const ejemplo = { ...EJEMPLO, ...cuenta };

  // La previa del mensaje de los servidores se hace con una persona de verdad
  // de la lista: es la forma de ver que su enlace queda bien escrito.
  const primero = personas.find((p) => p?.nombre);
  const ejemploServidor = {
    nombre: primero?.nombre || "María José",
    enlace: `${SITIO_BASE}?servidores=${comoEnlace(primero?.nombre || "María José")}`,
    ...cuenta,
  };

  // Un marcador que no se puede calcular se reemplaza por nada, y el mensaje
  // sale con un hueco ("¡Faltan solo  días!") sin que nadie se entere hasta que
  // el invitado lo recibe. Si falta la fecha, mejor decirlo aquí y en grande.
  const faltanFechas = [
    cuenta.dias === null && "{dias}",
    cuenta.diasLimite === null && "{dias_limite} y {plazo}",
  ].filter(Boolean);

  async function guardar(clave, texto, setter, aviso) {
    await api.actualizarTema(clave, texto);
    setter(texto);
    toast(aviso);
  }

  if (cargando) return <p className="text-sm text-ink-tenue">Cargando...</p>;

  return (
    <div>
      <h2 className="panel-titulo">Mensajes</h2>
      <p className="panel-subtitulo mb-6">
        Los textos con los que sale cada WhatsApp. Lo que escribas entre llaves se reemplaza por los
        datos de cada invitación al momento de enviar.
      </p>

      {faltanFechas.length > 0 && (
        <div className="tarjeta p-4 mb-5 border-l-4 border-l-amber-400">
          <p className="text-sm text-ink">
            Los mensajes van a salir con un hueco donde diga <code>{faltanFechas.join(" o ")}</code>.
          </p>
          <p className="ayuda mt-1">
            {cuenta.diasLimite === null && cuenta.dias === null
              ? "No se pudieron leer las fechas de la boda."
              : cuenta.diasLimite === null
                ? "Falta la fecha límite de confirmación."
                : "Falta la fecha de la boda."}{" "}
            Se configuran en Contenido → Información de la boda.
          </p>
        </div>
      )}

      <Editor
        titulo="Invitación"
        descripcion="El primer mensaje, con el que le mandas su enlace a cada invitado."
        valor={plantilla}
        marcadores={MARCADORES}
        ejemplo={ejemplo}
        onGuardar={(t) => guardar("whatsapp-plantilla", t, setPlantilla, "Mensaje guardado")}
      />

      <Editor
        titulo="Recordatorio"
        descripcion="Se usa con el botón «Recordar», para quienes aún no confirman."
        valor={recordatorio}
        marcadores={MARCADORES}
        ejemplo={ejemplo}
        onGuardar={(t) =>
          guardar("whatsapp-recordatorio", t, setRecordatorio, "Recordatorio guardado")
        }
      />

      <Editor
        titulo="Participación"
        descripcion="Para quienes no van a la boda civil: solo la noticia, sin confirmación."
        valor={noticia}
        marcadores={MARCADORES_NOTICIA}
        ejemplo={{ enlace: `${SITIO_BASE}?anuncio=1`, ...cuenta }}
        onGuardar={(t) => guardar("whatsapp-noticia", t, setNoticia, "Mensaje de la noticia guardado")}
      />

      <Editor
        titulo="Servidores"
        descripcion="Para quienes acompañan sirviendo: la tarjeta de agradecimiento, sin confirmación."
        valor={servidores}
        marcadores={MARCADORES_SERVIDORES}
        ejemplo={ejemploServidor}
        onGuardar={(t) =>
          guardar("whatsapp-servidores", t, setServidores, "Mensaje de los servidores guardado")
        }
      />

      <EnlacePublico
        titulo="Dar la noticia a quienes no van"
        ayuda="Página pública con la noticia y la fecha, sin lugar ni confirmación. Su texto se edita en Contenido → Bienvenida (campos «Participación»)."
        enlace={`${SITIO_BASE}?anuncio=1`}
        plantilla={noticia}
        cuenta={cuenta}
      />

      <TarjetasServidores personas={personas} plantilla={servidores} cuenta={cuenta} />
    </div>
  );
}
