import { useRef, useState } from "react";
import Divider from "./Divider";

const OPCIONES = [
  { key: "confirmado", label: "Sí" },
  { key: "no_asistira", label: "No" },
];

// Una invitación puede cubrir a una persona, a una pareja, a una familia o a
// un titular con cupos. Cada quien responde por separado; el botón de arriba
// es solo un atajo para marcar a todos de una vez.
// En las de cupos no hay una lista de nombres de antemano: el titular
// responde por él y escribe a quién trae, hasta llenar sus cupos. Puede no
// venir y repartirlos igual.
// La fecha límite llega como "2026-10-15". Se le pone el desfase de Colombia
// a propósito: sin él, el navegador la interpreta como medianoche UTC y a un
// invitado en Bogotá le mostraría el día anterior.
function formatearLimite(fecha) {
  const d = new Date(`${fecha}T00:00:00-05:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  });
}

export default function RSVP({ invitacion, fechaLimite, opciones = {}, onSubmit }) {
  const { mostrarRestriccion = true, mostrarObservaciones = true } = opciones;
  const esCupos = invitacion.tipo === "cupos";
  const cupos = esCupos ? invitacion.cupos || 0 : 0;
  // Clave estable para cada renglón de acompañante: sin ella, quitar uno del
  // medio haría que React reutilizara los inputs y el cursor saltara de campo.
  const ultimaClave = useRef(0);
  const nuevaClave = () => ++ultimaClave.current;

  const [personas, setPersonas] = useState(() =>
    (invitacion.miembros || [])
      .filter((m) => !m.es_acompanante)
      .map((m) => ({
        id: m.id,
        nombre: m.nombre,
        estado: m.estado || "pendiente",
        restriccion: m.restriccion || "",
      }))
  );
  // Los acompañantes no se editan uno por uno en el servidor: se manda la
  // lista completa y esa reemplaza a la anterior, así que aquí basta con el
  // nombre y su restricción.
  const [acompanantes, setAcompanantes] = useState(() =>
    (invitacion.miembros || [])
      .filter((m) => m.es_acompanante)
      .map((m) => ({ k: nuevaClave(), nombre: m.nombre, restriccion: m.restriccion || "" }))
  );
  const [observaciones, setObservaciones] = useState(
    invitacion.miembros?.[0]?.comentario || ""
  );
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState("");
  // Si ya había respondido antes, no se le vuelve a preguntar. Se calcula una
  // sola vez, con lo que venía de la base, para que al reabrir el enlace vea
  // el agradecimiento en vez del formulario.
  const [yaRespondio, setYaRespondio] = useState(
    () =>
      (invitacion.miembros || []).length > 0 &&
      invitacion.miembros.every((m) => m.estado && m.estado !== "pendiente")
  );

  // "varias" habla de todos los que puede cubrir la invitación: en una de
  // cupos el titular llega solo a la página, pero se le habla en plural
  // porque puede traer gente.
  const varias = personas.length > 1 || cupos > 0;
  const limiteVencido = fechaLimite && new Date() > new Date(`${fechaLimite}T23:59:59-05:00`);
  const limiteLegible = fechaLimite ? formatearLimite(fechaLimite) : null;
  const faltanPorResponder = personas.filter((p) => p.estado === "pendiente").length;
  const asistentes = personas.filter((p) => p.estado === "confirmado").length + acompanantes.length;
  const cuposLibres = cupos - acompanantes.length;

  function cambiarAcompanante(k, campo, valor) {
    setAcompanantes((prev) => prev.map((a) => (a.k === k ? { ...a, [campo]: valor } : a)));
  }

  function agregarAcompanante() {
    setAcompanantes((prev) => [...prev, { k: nuevaClave(), nombre: "", restriccion: "" }]);
  }

  function quitarAcompanante(k) {
    setAcompanantes((prev) => prev.filter((a) => a.k !== k));
  }

  function marcar(id, estado) {
    setPersonas((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
  }

  function marcarTodos(estado) {
    setPersonas((prev) => prev.map((p) => ({ ...p, estado })));
  }

  function setRestriccion(id, restriccion) {
    setPersonas((prev) => prev.map((p) => (p.id === id ? { ...p, restriccion } : p)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // La única condición para usar un cupo es decir a quién corresponde.
    let lista;
    if (esCupos) {
      lista = acompanantes.map((a) => ({
        nombre: a.nombre.trim(),
        restriccion: a.restriccion.trim(),
      }));
      if (lista.some((a) => !a.nombre)) {
        setError(
          "Escribe el nombre de cada acompañante, o quita el cupo que no vayas a usar."
        );
        return;
      }
    }

    try {
      // Las observaciones generales se guardan en la primera persona; el resto
      // conserva solo su propia restricción alimentaria.
      await onSubmit(
        personas.map((p, i) => ({
          id: p.id,
          estado: p.estado,
          restriccion: p.restriccion,
          comentario: i === 0 ? observaciones : "",
        })),
        lista
      );
      setEnviado(true);
    } catch (e) {
      setError(
        e?.message || "No pudimos guardar tu respuesta. Revisa tu conexión e inténtalo de nuevo."
      );
    }
  }

  const titulo =
    esCupos || !varias
      ? `${personas[0]?.nombre || ""}, confirma tu asistencia`
      : invitacion.tipo === "pareja"
        ? "Confirmen su asistencia"
        : "¿Quiénes nos acompañan?";

  // El agradecimiento cambia según quién termine yendo: en una invitación por
  // cupos el titular puede quedarse y mandar a sus acompañantes, o al revés.
  function gracias() {
    if (asistentes === 0) return "Gracias por avisarnos. Los vamos a extrañar.";
    if (esCupos) {
      const vaTitular = personas[0]?.estado === "confirmado";
      const nombres = acompanantes.map((a) => a.nombre.trim()).filter(Boolean);
      if (!nombres.length) return `¡Gracias por confirmar tu asistencia, ${personas[0]?.nombre}!`;
      const conQuien = `${nombres.slice(0, -1).join(", ")}${
        nombres.length > 1 ? " y " : ""
      }${nombres[nombres.length - 1]}`;
      return vaTitular
        ? `¡Gracias por confirmar! Te esperamos junto a ${conQuien}.`
        : `Gracias por avisarnos. Te vamos a extrañar, pero esperamos a ${conQuien}.`;
    }
    return varias
      ? `¡Gracias por confirmar! Ya tenemos su respuesta: ${asistentes} de ${personas.length} nos acompañan.`
      : `¡Gracias por confirmar tu asistencia, ${personas[0]?.nombre}!`;
  }

  return (
    <section
      className="relative px-6 py-16 max-w-lg mx-auto border-t border-gold/30 overflow-hidden"
      id="rsvp"
    >
      <p className="font-mono text-xs tracking-widest2 uppercase text-gold-dark mb-4 text-center">
        Nos encantaría contar {varias ? "con ustedes" : "contigo"}
      </p>
      <h2 className="font-display text-3xl text-center mb-2 text-gold-dark">{titulo}</h2>

      {invitacion.mensaje && (
        <div className="border border-gold/40 bg-gold/5 px-4 py-3 mt-6 mb-8 text-center">
          <p className="font-body text-sm italic text-ink-light leading-relaxed">
            {invitacion.mensaje}
          </p>
        </div>
      )}

      {!limiteVencido && !enviado && limiteLegible && (
        <p className="text-center font-mono text-[11px] tracking-widest2 uppercase text-gold-dark/80 mt-4 mb-8 leading-relaxed">
          Confirma hasta el {limiteLegible}
        </p>
      )}

      {limiteVencido && !yaRespondio && !enviado ? (
        <p className="text-center text-sm text-seal font-mono uppercase tracking-widest2">
          El plazo de confirmación{limiteLegible ? ` (${limiteLegible})` : ""} ha vencido.
        </p>
      ) : enviado || yaRespondio ? (
        <div className="text-center py-6">
          <Divider className="mb-4" />
          <p className="font-body text-ink-light">{gracias()}</p>
          {/* Pasado el cierre la respuesta queda en firme: se agradece igual,
              pero ya no se ofrece cambiarla. El servidor la rechazaría. */}
          {yaRespondio && !enviado && !limiteVencido && (
            <button
              type="button"
              onClick={() => setYaRespondio(false)}
              className="mt-4 text-[11px] font-mono uppercase tracking-widest2 text-ink/40 underline underline-offset-4 hover:text-gold-dark transition-colors"
            >
              Cambiar mi respuesta
            </button>
          )}
          {limiteVencido && (
            <p className="mt-4 text-[11px] font-mono uppercase tracking-widest2 text-ink/40">
              El plazo para cambiarla ya cerró.
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {varias && !esCupos && (
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => marcarTodos("confirmado")}
                className="text-[11px] font-mono uppercase tracking-wide px-4 py-2 border border-gold/50 text-gold-dark hover:bg-gold hover:text-paper transition-colors"
              >
                {invitacion.tipo === "pareja" ? "Vamos los dos" : "Asistimos todos"}
              </button>
              <button
                type="button"
                onClick={() => marcarTodos("no_asistira")}
                className="text-[11px] font-mono uppercase tracking-wide px-4 py-2 border border-ink/20 text-ink/50 hover:border-seal hover:text-seal transition-colors"
              >
                Ninguno puede
              </button>
            </div>
          )}

          <div className="divide-y divide-gold/20 border-y border-gold/20">
            {personas.map((p) => (
              <div key={p.id} className="py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-body text-ink/85">{p.nombre}</span>
                  <div className="flex gap-2 shrink-0">
                    {OPCIONES.map((o) => (
                      <button
                        type="button"
                        key={o.key}
                        onClick={() => marcar(p.id, o.key)}
                        aria-pressed={p.estado === o.key}
                        className={`w-14 text-xs font-mono uppercase tracking-wide py-2 border transition-colors ${
                          p.estado === o.key
                            ? o.key === "confirmado"
                              ? "bg-gold text-paper border-gold"
                              : "bg-seal text-paper border-seal"
                            : "border-ink/20 text-ink/60 hover:border-gold"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {mostrarRestriccion && p.estado === "confirmado" && (
                  <input
                    type="text"
                    value={p.restriccion}
                    onChange={(e) => setRestriccion(p.id, e.target.value)}
                    placeholder="Restricción alimentaria (opcional)"
                    aria-label={`Restricción alimentaria de ${p.nombre}`}
                    className="mt-3 w-full border-b border-ink/25 bg-transparent px-1 py-2 text-sm focus:outline-none focus:border-gold transition-colors"
                  />
                )}
              </div>
            ))}
          </div>

          {esCupos && cupos > 0 && (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[10px] tracking-widest2 uppercase text-gold-dark">
                  ¿Quién te acompaña?
                </span>
                <span className="font-mono text-[10px] tracking-widest2 uppercase text-ink/40">
                  {acompanantes.length} de {cupos}
                </span>
              </div>

              <p className="text-xs text-ink/55 leading-relaxed">
                Tu invitación incluye {cupos} {cupos === 1 ? "cupo" : "cupos"} además del tuyo. Para
                usarlos solo necesitamos el nombre de cada persona que traes. Si vienes solo, deja
                esta parte vacía.
              </p>

              {acompanantes.map((a, i) => (
                <div key={a.k} className="border-b border-gold/20 pb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={a.nombre}
                      onChange={(e) => cambiarAcompanante(a.k, "nombre", e.target.value)}
                      placeholder={`Nombre del acompañante ${i + 1}`}
                      aria-label={`Nombre del acompañante ${i + 1}`}
                      className="flex-1 min-w-0 border-b border-ink/25 bg-transparent px-1 py-2 text-sm focus:outline-none focus:border-gold transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => quitarAcompanante(a.k)}
                      aria-label={`Quitar al acompañante ${i + 1}`}
                      className="shrink-0 w-9 py-2 border border-ink/20 text-ink/40 text-xs hover:border-seal hover:text-seal transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {mostrarRestriccion && (
                    <input
                      type="text"
                      value={a.restriccion}
                      onChange={(e) => cambiarAcompanante(a.k, "restriccion", e.target.value)}
                      placeholder="Restricción alimentaria (opcional)"
                      aria-label={`Restricción alimentaria del acompañante ${i + 1}`}
                      className="mt-2 w-full border-b border-ink/25 bg-transparent px-1 py-2 text-sm focus:outline-none focus:border-gold transition-colors"
                    />
                  )}
                </div>
              ))}

              {cuposLibres > 0 && (
                <button
                  type="button"
                  onClick={agregarAcompanante}
                  className="w-full border border-dashed border-gold/50 text-gold-dark py-2 font-mono text-[11px] uppercase tracking-wide hover:bg-gold/10 transition-colors"
                >
                  + Agregar acompañante ({cuposLibres} {cuposLibres === 1 ? "cupo" : "cupos"}{" "}
                  {cuposLibres === 1 ? "libre" : "libres"})
                </button>
              )}
            </div>
          )}

          {mostrarObservaciones && (
            <label className="block">
              <span className="font-mono text-[10px] tracking-widest2 uppercase text-gold-dark">
                Observaciones (opcional)
              </span>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                className="mt-2 w-full border-b border-ink/25 bg-transparent px-1 py-2 text-sm focus:outline-none focus:border-gold transition-colors resize-none"
              />
            </label>
          )}

          {error && <p className="text-center text-xs text-seal">{error}</p>}

          <button
            type="submit"
            disabled={faltanPorResponder > 0}
            className="w-full text-paper py-3 font-mono text-xs tracking-widest2 uppercase disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-gold-dark hover:bg-gold"
          >
            Confirmar respuesta
          </button>
          {faltanPorResponder > 0 && (
            <p className="text-center text-xs text-ink/50">
              {varias && !esCupos
                ? `Falta responder por ${faltanPorResponder} ${faltanPorResponder === 1 ? "persona" : "personas"}.`
                : "Marca tu asistencia para continuar."}
            </p>
          )}
        </form>
      )}
    </section>
  );
}
