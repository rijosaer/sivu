import { useState } from "react";
import { API_URL } from "../api/site";

// «Cómo pagar» de la cotización: el anticipo calculado, una tarjeta por
// método (con botón para copiar el número o pagar en línea) y «Ya pagué»,
// que avisa al equipo y abre WhatsApp para mandar el comprobante.
// Espejo visual de TIPOS_PAGO del panel (admin-panel/src/dueno/comun.js).

const TIPOS = {
  nequi: { nombre: "Nequi", emoji: "💜", color: "#2a0a4a", numero: "Número Nequi" },
  daviplata: { nombre: "Daviplata", emoji: "❤️", color: "#c8102e", numero: "Número Daviplata" },
  bancolombia: { nombre: "Bancolombia", emoji: "💛", color: "#1d1d1b", numero: "Número de cuenta" },
  banco: { nombre: "Cuenta bancaria", emoji: "🏦", color: "#0e4676", numero: "Número de cuenta" },
  llave: { nombre: "Llave Bre-B", emoji: "🔑", color: "#146b4e", numero: "Llave" },
  enlace: { nombre: "Pago en línea", emoji: "💳", color: "#5c0f27", numero: "" },
  efectivo: { nombre: "Efectivo", emoji: "💵", color: "#6b5f52", numero: "" },
  otro: { nombre: "Otro", emoji: "💠", color: "#6b5f52", numero: "Dato" },
};

const peso = (n) => `$${Math.round(Number(n) || 0).toLocaleString("es-CO")}`;
const nombreDe = (m) => m.nombre || TIPOS[m.tipo]?.nombre || "Pago";

function Copiable({ etiqueta, valor }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(String(valor).replace(/\s+/g, ""));
    } catch {
      const t = document.createElement("textarea");
      t.value = valor;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  }
  return (
    <div className="sv-copiable">
      <div style={{ minWidth: 0 }}>
        <span className="sv-mini">{etiqueta}</span>
        <span className="sv-numero">{valor}</span>
      </div>
      <button type="button" onClick={copiar} className="sv-copiar">
        {copiado ? "¡Copiado!" : "Copiar"}
      </button>
    </div>
  );
}

function Metodo({ m }) {
  const t = TIPOS[m.tipo] || TIPOS.otro;
  const filas = [
    m.tipo === "banco" && m.banco && ["Banco", m.banco],
    m.tipoCuenta && ["Tipo de cuenta", m.tipoCuenta],
    m.titular && ["A nombre de", m.titular],
    m.documento && ["Cédula o NIT", m.documento],
  ].filter(Boolean);
  return (
    <div className="sv-metodo" style={{ "--c": t.color }}>
      <div className="sv-metodo-cab">
        <span className="sv-metodo-ico">{t.emoji}</span>
        <b>{nombreDe(m)}</b>
      </div>
      {m.numero && <Copiable etiqueta={t.numero || "Número"} valor={m.numero} />}
      {filas.length > 0 && (
        <dl className="sv-metodo-filas">
          {filas.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {m.enlace && (
        <a className="sv-btn sv-btn-vino" style={{ width: "100%", marginTop: 10 }} href={m.enlace} target="_blank" rel="noreferrer">
          Pagar en línea
        </a>
      )}
      {m.nota && <p className="sv-ayuda">{m.nota}</p>}
    </div>
  );
}

export default function ComoPagar({ c, token, aceptada, onPagado }) {
  const { pagos } = c;
  const metodos = pagos?.metodos || [];
  const anticipo = pagos?.anticipo ? Math.round((c.total * pagos.anticipo) / 100) : 0;
  const [abierto, setAbierto] = useState(false);
  const [metodo, setMetodo] = useState(metodos[0] ? nombreDe(metodos[0]) : "");
  const [valor, setValor] = useState(String(anticipo || c.total || ""));
  const [enviando, setEnviando] = useState(false);
  const [reportado, setReportado] = useState(c.pagoReportado);

  if (!metodos.length && !c.pago) return null;

  async function reportar(e) {
    e.preventDefault();
    setEnviando(true);
    const monto = Number(valor.replace(/\D/g, "")) || 0;
    // Se abre la ventana antes de la petición: en el celular, abrirla
    // después de esperar la bloquea el navegador.
    const ventana = window.open("", "_blank");
    try {
      await fetch(`${API_URL}/api/public/cotizacion/${encodeURIComponent(token)}/pague`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodo, valor: monto }),
      });
    } catch {
      /* el WhatsApp con el comprobante es lo importante */
    }
    const texto = `¡Hola Sivú! Ya hice el pago de ${peso(monto)}${metodo ? ` por ${metodo}` : ""} de mi cotización${
      c.evento ? ` (${c.evento})` : ""
    }. Te envío el comprobante 👇`;
    const url = `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(texto)}`;
    if (ventana) ventana.location.href = url;
    else window.location.href = url;
    setReportado(true);
    setAbierto(false);
    setEnviando(false);
    onPagado?.();
  }

  return (
    <section className="sv-tarjeta">
      <span className="sv-etiqueta">Cómo pagar</span>
      {anticipo > 0 && (
        <div className="sv-anticipo">
          <div>
            <span className="sv-mini">Para separar tu fecha ({pagos.anticipo} %)</span>
            <b>{peso(anticipo)}</b>
          </div>
          {pagos.anticipo < 100 && (
            <div style={{ textAlign: "right" }}>
              <span className="sv-mini">El resto</span>
              <span style={{ fontWeight: 600 }}>{peso(c.total - anticipo)}</span>
            </div>
          )}
        </div>
      )}

      {metodos.length > 0 && (
        <div className="sv-metodos">
          {metodos.map((m) => (
            <Metodo key={m.id} m={m} />
          ))}
        </div>
      )}

      {c.pago && <p className="sv-nota" style={{ marginTop: 12 }}>{c.pago}</p>}
      {pagos?.instrucciones && <p className="sv-nota" style={{ marginTop: 10 }}>{pagos.instrucciones}</p>}

      {!c.vencida &&
        (reportado ? (
          <div className="sv-aviso sv-aviso-ok" style={{ marginTop: 14 }}>
            ✓ Ya nos avisaste de tu pago. Si no enviaste el comprobante, mándalo por WhatsApp y te confirmamos.
          </div>
        ) : abierto ? (
          <form onSubmit={reportar} className="sv-ya-pague">
            <div className="sv-grid sv-grid-2">
              <label>
                <span className="sv-label">¿Por dónde pagaste?</span>
                <select className="sv-campo" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                  {metodos.map((m) => (
                    <option key={m.id}>{nombreDe(m)}</option>
                  ))}
                  <option>Otro</option>
                </select>
              </label>
              <label>
                <span className="sv-label">¿Cuánto?</span>
                <input
                  className="sv-campo"
                  inputMode="numeric"
                  value={valor ? Number(valor.replace(/\D/g, "")).toLocaleString("es-CO") : ""}
                  onChange={(e) => setValor(e.target.value.replace(/\D/g, ""))}
                />
              </label>
            </div>
            <div className="sv-botones" style={{ marginTop: 12 }}>
              <button className="sv-btn sv-btn-oro" disabled={enviando}>
                {enviando ? "Un momento..." : "Avisar y enviar comprobante"}
              </button>
              <button type="button" className="sv-btn sv-btn-borde" onClick={() => setAbierto(false)}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className="sv-botones">
            <button className={`sv-btn ${aceptada ? "sv-btn-oro" : "sv-btn-vino"}`} onClick={() => setAbierto(true)}>
              Ya pagué
            </button>
          </div>
        ))}
    </section>
  );
}
