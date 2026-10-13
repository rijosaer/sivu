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
      {m.qr && (
        <div className="sv-qr">
          <img src={m.qr} alt={`QR de ${nombreDe(m)}`} />
          <div>
            <p className="sv-ayuda" style={{ marginTop: 0 }}>
              Escanéalo desde tu app. Si estás en el celular, guárdalo y en tu app elige «pagar con QR» desde la galería.
            </p>
            <a className="sv-copiar" style={{ display: "inline-block", marginTop: 8, textDecoration: "none" }} href={m.qr} download={`QR-${nombreDe(m)}.png`}>
              Guardar QR
            </a>
          </div>
        </div>
      )}
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
  const [reportado, setReportado] = useState(c.pagoReportado ? "antes" : "");
  const [comprobante, setComprobante] = useState(null); // { datos, nombre, vista }

  if (!metodos.length && !c.pago) return null;

  async function elegirComprobante(file) {
    if (!file) return;
    if (file.type === "application/pdf") {
      const datos = await new Promise((ok) => {
        const r = new FileReader();
        r.onload = () => ok(r.result);
        r.readAsDataURL(file);
      });
      setComprobante({ datos, nombre: file.name, vista: "" });
      return;
    }
    // La captura se achica (los celulares sacan imágenes enormes).
    try {
      const bmp = await createImageBitmap(file);
      const escala = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bmp.width * escala);
      canvas.height = Math.round(bmp.height * escala);
      canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
      const datos = canvas.toDataURL("image/jpeg", 0.85);
      setComprobante({ datos, nombre: file.name, vista: datos });
    } catch {
      alert("No pudimos abrir esa imagen. Prueba con una captura de pantalla en JPG o PNG.");
    }
  }

  async function reportar(e) {
    e.preventDefault();
    setEnviando(true);
    const monto = Number(valor.replace(/\D/g, "")) || 0;
    // Sin captura, el comprobante se manda por WhatsApp: la ventana se abre
    // antes de la petición porque en el celular abrirla después la bloquea.
    const ventana = comprobante ? null : window.open("", "_blank");
    try {
      const r = await fetch(`${API_URL}/api/public/cotizacion/${encodeURIComponent(token)}/pague`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metodo, valor: monto, comprobante: comprobante?.datos || null }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || "No se pudo enviar");
      }
    } catch (err) {
      ventana?.close();
      alert(`${err.message}. Inténtalo de nuevo o escríbenos por WhatsApp.`);
      setEnviando(false);
      return;
    }
    if (!comprobante) {
      const texto = `¡Hola Sivú! Ya hice el pago de ${peso(monto)}${metodo ? ` por ${metodo}` : ""} de mi cotización${
        c.evento ? ` (${c.evento})` : ""
      }. Te envío el comprobante 👇`;
      const url = `https://wa.me/${c.whatsapp}?text=${encodeURIComponent(texto)}`;
      if (ventana) ventana.location.href = url;
      else window.location.href = url;
    }
    setReportado(comprobante ? "con-comprobante" : "sin-comprobante");
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
            {reportado === "con-comprobante" ? (
              <>
                <b>✓ Recibimos tu comprobante.</b> En cuanto confirmemos el pago te escribimos por WhatsApp para arrancar con tu
                invitación 💌
              </>
            ) : (
              "✓ Ya nos avisaste de tu pago. Si no enviaste el comprobante, mándalo por WhatsApp y te confirmamos."
            )}
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
            <div style={{ marginTop: 12 }}>
              <span className="sv-label">Captura del comprobante</span>
              {comprobante ? (
                <div className="sv-archivo">
                  {comprobante.vista ? (
                    <img src={comprobante.vista} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8 }} />
                  ) : (
                    <span>📄</span>
                  )}
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{comprobante.nombre}</span>
                  <button type="button" onClick={() => setComprobante(null)}>
                    Cambiar
                  </button>
                </div>
              ) : (
                <label className="sv-subir">
                  📎 Adjuntar captura o PDF
                  <input type="file" accept="image/*,application/pdf" hidden onChange={(e) => elegirComprobante(e.target.files?.[0])} />
                </label>
              )}
              <span className="sv-ayuda">
                {comprobante ? "Listo: te confirmamos apenas veamos el pago." : "Si no la tienes a mano, puedes enviarla después por WhatsApp."}
              </span>
            </div>
            <div className="sv-botones" style={{ marginTop: 12 }}>
              <button className="sv-btn sv-btn-oro" disabled={enviando}>
                {enviando ? "Enviando..." : comprobante ? "Enviar comprobante" : "Avisar y enviar por WhatsApp"}
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
