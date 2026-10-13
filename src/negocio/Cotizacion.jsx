import { useEffect, useState } from "react";
import { API_URL } from "../api/site";
import { cargarFuentes } from "./fuentes";
import "./negocio.css";

// La cotización que Sivú le manda a un cliente: /cotizacion/<token>. Muestra
// lo que incluye, el total, las condiciones y los datos de pago; el cliente
// puede aceptarla con un toque (al equipo le llega el aviso) o preguntar por
// WhatsApp.

const peso = (n) => `$${Math.round(Number(n) || 0).toLocaleString("es-CO")}`;
const fechaLarga = (v) =>
  v
    ? new Date(`${String(v).slice(0, 10)}T12:00:00-05:00`).toLocaleDateString("es-CO", {
        day: "numeric", month: "long", year: "numeric", timeZone: "America/Bogota",
      })
    : "";
const wa = (numero, texto) => `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;

export default function Cotizacion({ token }) {
  const [c, setC] = useState(null);
  const [error, setError] = useState("");
  const [aceptando, setAceptando] = useState(false);
  const [aceptada, setAceptada] = useState(false);

  useEffect(() => {
    cargarFuentes();
    document.title = "Tu cotización · Sivú";
    const vista = new URLSearchParams(window.location.search).get("vista");
    fetch(`${API_URL}/api/public/cotizacion/${encodeURIComponent(token)}${vista === "panel" ? "?vista=panel" : ""}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "No se pudo cargar");
        setC(d);
        setAceptada(d.aceptada);
      })
      .catch((e) => setError(e.message));
  }, [token]);

  async function aceptar() {
    setAceptando(true);
    try {
      const r = await fetch(`${API_URL}/api/public/cotizacion/${encodeURIComponent(token)}/aceptar`, { method: "POST" });
      if (!r.ok) throw new Error();
      setAceptada(true);
    } catch {
      alert("No pudimos registrar tu respuesta. Escríbenos por WhatsApp, por favor.");
    } finally {
      setAceptando(false);
    }
  }

  if (error) {
    return (
      <div className="sv" style={{ display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
        <div>
          <div className="sv-logo" style={{ color: "var(--vino-osc)" }}>Sivú</div>
          <p style={{ marginTop: 12, color: "var(--suave)" }}>{error}</p>
        </div>
      </div>
    );
  }
  if (!c) return <div className="sv" />;

  const subtotal = c.items.reduce((s, it) => s + it.valor * (it.cantidad || 1), 0);
  const nombre = (c.cliente || "").split(/\s+/)[0];

  return (
    <div className="sv">
      <header className="sv-cabecera">
        <div className="sv-cont">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div className="sv-eyebrow">Cotización</div>
              <h1 className="sv-titulo">
                {nombre ? (
                  <>
                    Para ti, <i>{nombre}</i>
                  </>
                ) : (
                  "Tu cotización"
                )}
              </h1>
              {c.evento && <p className="sv-sub">{c.evento}</p>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="sv-logo">Sivú</div>
              <div className="sv-de">de Nova</div>
            </div>
          </div>
        </div>
      </header>

      <main className="sv-cuerpo">
        {c.vencida && !aceptada && (
          <div className="sv-aviso sv-aviso-oro" style={{ marginBottom: 14 }}>
            Esta cotización venció el {fechaLarga(c.vigencia)}. Escríbenos y te la actualizamos.
          </div>
        )}
        {aceptada && (
          <div className="sv-aviso sv-aviso-ok" style={{ marginBottom: 14 }}>
            <b>¡Gracias{nombre ? `, ${nombre}` : ""}! 🎉</b> Recibimos tu aceptación. Escríbenos por WhatsApp para separar tu fecha y
            empezar con tu invitación.
          </div>
        )}

        <section className="sv-tarjeta">
          <span className="sv-etiqueta">Lo que incluye</span>
          {c.items.map((it, i) => (
            <div key={i} className="sv-item">
              <div style={{ minWidth: 0 }}>
                <h3>
                  {it.descripcion}
                  {it.cantidad > 1 && <span style={{ color: "var(--suave)", fontSize: 15 }}> × {it.cantidad}</span>}
                </h3>
                {it.detalle && <p className="sv-detalle">{it.detalle}</p>}
              </div>
              <span className="sv-valor">{peso(it.valor * (it.cantidad || 1))}</span>
            </div>
          ))}
          {c.descuento > 0 && (
            <>
              <div className="sv-fila">
                <span>Subtotal</span>
                <span>{peso(subtotal)}</span>
              </div>
              <div className="sv-fila">
                <span>Descuento</span>
                <span>− {peso(c.descuento)}</span>
              </div>
            </>
          )}
          <div className="sv-total">
            <span style={{ fontWeight: 600 }}>Total</span>
            <b>{peso(c.total)}</b>
          </div>
          {c.vigencia && !c.vencida && (
            <p className="sv-ayuda" style={{ textAlign: "right" }}>
              Válida hasta el {fechaLarga(c.vigencia)}
            </p>
          )}
        </section>

        {c.notas && (
          <section className="sv-tarjeta">
            <span className="sv-etiqueta">Condiciones</span>
            <p className="sv-nota">{c.notas}</p>
          </section>
        )}

        {c.pago && (
          <section className="sv-tarjeta">
            <span className="sv-etiqueta">Datos de pago</span>
            <p className="sv-nota" style={{ color: "var(--tinta)" }}>
              {c.pago}
            </p>
          </section>
        )}

        <div className="sv-botones">
          {aceptada ? (
            <a
              className="sv-btn sv-btn-oro"
              href={wa(c.whatsapp, `¡Hola Sivú! Acepté la cotización${c.evento ? ` de ${c.evento}` : ""} y quiero separar la fecha 💌`)}
              target="_blank"
              rel="noreferrer"
            >
              Separar mi fecha por WhatsApp
            </a>
          ) : (
            !c.vencida && (
              <button className="sv-btn sv-btn-oro" onClick={aceptar} disabled={aceptando}>
                {aceptando ? "Un momento..." : "Acepto la cotización"}
              </button>
            )
          )}
          <a
            className="sv-btn sv-btn-borde"
            href={wa(c.whatsapp, `¡Hola Sivú! Tengo una pregunta sobre mi cotización${c.evento ? ` (${c.evento})` : ""}:`)}
            target="_blank"
            rel="noreferrer"
          >
            Tengo una pregunta
          </a>
          <button className="sv-btn sv-btn-borde" onClick={() => window.print()}>
            Guardar en PDF
          </button>
        </div>

        <p className="sv-pie">Sivú · Invitaciones digitales · de NOVA Optimiza</p>
      </main>
    </div>
  );
}
