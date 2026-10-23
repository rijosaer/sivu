// Arma el documento que se imprime o se guarda como PDF.
//
// Es una función pura que devuelve HTML completo: el mismo texto se pinta en la
// vista previa (dentro de un iframe) y se manda a la ventana de impresión. Si
// fueran dos caminos distintos, la previa mentiría tarde o temprano.
//
// El documento se pinta con los colores de la propia invitación (los de la
// pantalla «Colores»), no con los del panel: lo que se imprime es de la boda,
// no de la herramienta. Por eso el PDF de antes se veía plano — era una tabla
// del navegador sin nada más.

import { contextoDe, esUnaSolaPersona } from "../relaciones";
import { vocabulario } from "../vocabulario";

export const FORMATOS = [
  {
    key: "lista",
    label: "Lista de personas",
    para: "Una línea por persona. Es la que se le pasa al catering.",
  },
  {
    key: "invitaciones",
    label: "Agrupada por invitación",
    para: "Cada invitación con su gente debajo y su código. Para entender a quién pertenece cada nombre.",
  },
  {
    key: "tarjetas",
    label: "Tarjetas de recepción",
    para: "Una tarjeta por invitación con casillas para ir marcando en la puerta.",
  },
  {
    key: "resumen",
    label: "Resumen del evento",
    para: "Una página con los números, el avance y quién falta por responder.",
  },
];

export const OPCIONES_INICIALES = {
  formato: "lista",
  portada: true,
  color: true,
  restriccion: true,
  observaciones: true,
  codigo: true,
  tamano: "letter",
  orientacion: "portrait",
  notas: "",
};

const ESTADOS = {
  confirmado: { etiqueta: "Asiste", tono: "si" },
  no_asistira: { etiqueta: "No asiste", tono: "no" },
  pendiente: { etiqueta: "Sin responder", tono: "quiza" },
};

function esc(v) {
  return String(v ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
  );
}

function fechaLarga(valor) {
  if (!valor) return "";
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(valor) ? `${valor}T12:00:00-05:00` : valor);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  });
}

function hoyLargo() {
  return new Date().toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota",
  });
}

// Los colores de la invitación. En blanco y negro se cambian por grises: sale
// más barato de imprimir y se lee igual.
function paleta(tema, color) {
  // Estos valores van dentro de un <style>: solo se acepta un color de
  // verdad, para que un valor raro no pueda cerrar la etiqueta e inyectar HTML.
  const t = (clave, respaldo) => {
    const v = String(tema?.[clave] || "").trim();
    return /^(#[0-9a-f]{3}|#[0-9a-f]{6}|\d{1,3}[\s,]+\d{1,3}[\s,]+\d{1,3})$/i.test(v) ? v : respaldo;
  };
  if (!color) {
    return {
      oro: "#8a8a8a",
      oroClaro: "#d8d8d8",
      oroOscuro: "#3a3a3a",
      tinta: "#1c1c1c",
      papel: "#ffffff",
      sello: "#4a4a4a",
      si: "#1c1c1c",
      no: "#6b6b6b",
      quiza: "#9a9a9a",
    };
  }
  return {
    oro: t("color-gold", "#B8924A"),
    oroClaro: t("color-gold-light", "#D9BE87"),
    oroOscuro: t("color-gold-dark", "#8C6A2E"),
    tinta: t("color-ink", "#5C4530"),
    papel: "#ffffff",
    sello: t("color-seal", "#8A5A34"),
    si: "#2f7d48",
    no: t("color-seal", "#8A5A34"),
    quiza: "#9b8f7d",
  };
}

function estilos(p, opciones) {
  const alto = opciones.orientacion === "landscape";
  const medida =
    opciones.tamano === "a4"
      ? alto
        ? { w: "29.7cm", h: "21cm" }
        : { w: "21cm", h: "29.7cm" }
      : alto
        ? { w: "27.9cm", h: "21.6cm" }
        : { w: "21.6cm", h: "27.9cm" };

  return `
    @page { size: ${opciones.tamano === "a4" ? "A4" : "letter"} ${opciones.orientacion}; margin: 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: ${p.tinta};
      font-size: 11px;
      line-height: 1.45;
      /* Sin esto, el navegador quita los fondos al imprimir y las etiquetas de
         estado salen en blanco. */
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .hoja { background: ${p.papel}; }
    @media screen {
      body { background: #eceae6; padding: 18px; }
      .hoja {
        width: ${medida.w};
        min-height: ${medida.h};
        margin: 0 auto;
        padding: 14mm;
        box-shadow: 0 6px 24px rgba(0,0,0,.16);
      }
    }
    h1, h2, h3 { font-family: Georgia, "Times New Roman", serif; font-weight: 400; margin: 0; }

    /* ---------- Portada ---------- */
    .portada { text-align: center; padding: 26mm 0 20mm; page-break-after: always; }
    .portada .antetitulo { font-size: 9px; letter-spacing: .32em; text-transform: uppercase; color: ${p.oroOscuro}; }
    .portada h1 { font-size: 34px; color: ${p.oroOscuro}; margin: 10px 0; }
    .portada .amp { font-style: italic; color: ${p.tinta}; font-size: 22px; margin: 0 6px; }
    .portada .fecha { font-size: 12px; color: ${p.tinta}; }
    .portada .doc { margin-top: 22mm; font-size: 15px; letter-spacing: .16em; text-transform: uppercase; color: ${p.tinta}; }
    .portada .sub { font-size: 10px; color: ${p.oroOscuro}; margin-top: 6px; }
    .filete { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 14px 0; }
    .filete i { display: block; height: 1px; width: 70px; background: ${p.oro}; }
    .filete b { display: block; width: 6px; height: 6px; background: ${p.oroClaro}; transform: rotate(45deg); }

    /* ---------- Cabecera de las páginas de contenido ---------- */
    .cabecera { display: flex; justify-content: space-between; align-items: flex-end;
      border-bottom: 2px solid ${p.oro}; padding-bottom: 8px; margin-bottom: 14px; }
    .cabecera h2 { font-size: 19px; color: ${p.oroOscuro}; }
    .cabecera .meta { text-align: right; font-size: 9px; color: ${p.quiza}; line-height: 1.6; }
    .notas { border-left: 3px solid ${p.oroClaro}; padding: 6px 10px; margin-bottom: 14px;
      font-size: 10.5px; color: ${p.tinta}; background: rgba(0,0,0,.02); }

    /* ---------- Tabla ---------- */
    table { width: 100%; border-collapse: collapse; }
    thead { display: table-header-group; }
    th { text-align: left; font-size: 8.5px; letter-spacing: .12em; text-transform: uppercase;
      color: ${p.oroOscuro}; border-bottom: 1px solid ${p.oroClaro}; padding: 0 6px 5px; font-weight: 600; }
    td { padding: 6px; border-bottom: 1px solid rgba(0,0,0,.07); vertical-align: top; }
    tr { page-break-inside: avoid; }
    .nombre { font-size: 11.5px; }
    .apagado { color: ${p.quiza}; }
    .num { width: 26px; color: ${p.quiza}; font-variant-numeric: tabular-nums; }

    .marca { display: inline-block; font-size: 8.5px; letter-spacing: .06em; text-transform: uppercase;
      padding: 2px 7px; border-radius: 999px; white-space: nowrap; border: 1px solid; }
    .marca.si { color: ${p.si}; border-color: ${p.si}; background: ${opciones.color ? "rgba(47,125,72,.08)" : "transparent"}; }
    .marca.no { color: ${p.no}; border-color: ${p.no}; background: ${opciones.color ? "rgba(138,90,52,.08)" : "transparent"}; }
    .marca.quiza { color: ${p.quiza}; border-color: ${p.oroClaro}; }
    .codigo { font-family: "SF Mono", Consolas, monospace; font-size: 9px; color: ${p.quiza}; letter-spacing: .08em; }

    /* ---------- Agrupado por invitación ---------- */
    .grupo { page-break-inside: avoid; margin-bottom: 12px; border: 1px solid ${p.oroClaro}; border-radius: 3px; }
    .grupo .tapa { display: flex; justify-content: space-between; align-items: baseline;
      background: ${opciones.color ? "rgba(184,146,74,.10)" : "#f2f2f2"}; padding: 6px 9px; }
    .grupo .tapa strong { font-size: 12px; font-weight: 600; }
    /* Las invitaciones de una sola persona van en una línea, sin tabla debajo. */
    .grupo.suelto .tapa { background: transparent; border-bottom: 1px solid rgba(0,0,0,.07); }
    .grupo.suelto { border-color: rgba(0,0,0,.10); margin-bottom: 6px; }
    .grupo .extra { margin: 0; padding: 5px 9px; font-size: 10px; }
    .grupo table { padding: 0; }
    .grupo td { padding: 5px 9px; }

    /* ---------- Tarjetas ---------- */
    .tarjetas { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .tarjeta { border: 1px solid ${p.oroClaro}; border-radius: 4px; padding: 10px 12px; page-break-inside: avoid; }
    .tarjeta .cab { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid rgba(0,0,0,.08); padding-bottom: 5px; margin-bottom: 6px; }
    .tarjeta h3 { font-size: 14px; color: ${p.oroOscuro}; }
    .tarjeta .persona { display: flex; align-items: center; gap: 7px; padding: 3px 0; font-size: 11px; }
    .casilla { display: inline-block; width: 11px; height: 11px; border: 1px solid ${p.oro}; border-radius: 2px; flex: 0 0 auto; }
    .tarjeta .pie { margin-top: 6px; font-size: 9px; color: ${p.quiza}; }

    /* ---------- Resumen ---------- */
    .cifras { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .cifra { border: 1px solid ${p.oroClaro}; border-radius: 4px; padding: 12px; text-align: center; }
    .cifra b { display: block; font-family: Georgia, serif; font-size: 27px; color: ${p.oroOscuro}; font-weight: 400; }
    .cifra span { font-size: 8.5px; letter-spacing: .1em; text-transform: uppercase; color: ${p.quiza}; }
    .barra { height: 7px; background: rgba(0,0,0,.07); border-radius: 999px; overflow: hidden; margin: 6px 0 18px; }
    .barra i { display: block; height: 100%; background: ${p.oro}; }
    .dos { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
    .titulillo { font-size: 9px; letter-spacing: .14em; text-transform: uppercase; color: ${p.oroOscuro};
      border-bottom: 1px solid ${p.oroClaro}; padding-bottom: 4px; margin-bottom: 7px; }
    .lineas li { list-style: none; padding: 3px 0; border-bottom: 1px solid rgba(0,0,0,.05);
      display: flex; justify-content: space-between; gap: 10px; }
    ul { margin: 0; padding: 0; }

    .pie-doc { margin-top: 16px; padding-top: 8px; border-top: 1px solid ${p.oroClaro};
      font-size: 8.5px; color: ${p.quiza}; display: flex; justify-content: space-between; }
  `;
}

function portada(evento, opciones, titulo, cuantos) {
  if (!opciones.portada) return "";
  const novios = [evento.novioEl, evento.novioElla].filter(Boolean);
  return `
    <section class="portada">
      <p class="antetitulo">${esc(evento.antetitulo || vocabulario().muestra.antetitulo)}</p>
      <h1>${esc(novios[0] || "")}${novios.length === 2 ? `<span class="amp">&amp;</span>${esc(novios[1])}` : ""}</h1>
      <div class="filete"><i></i><b></b><i></i></div>
      ${evento.fecha ? `<p class="fecha">${esc(fechaLarga(evento.fecha))}</p>` : ""}
      ${evento.lugar ? `<p class="fecha apagado">${esc(evento.lugar)}</p>` : ""}
      <p class="doc">${esc(titulo)}</p>
      <p class="sub">${esc(cuantos)} · Generado el ${esc(hoyLargo())}</p>
    </section>`;
}

function cabecera(evento, titulo, cuantos) {
  const novios = [evento.novioEl, evento.novioElla].filter(Boolean).join(" & ");
  return `
    <div class="cabecera">
      <h2>${esc(titulo)}</h2>
      <div class="meta">
        ${novios ? `${esc(novios)}<br>` : ""}
        ${esc(cuantos)} · ${esc(hoyLargo())}
      </div>
    </div>`;
}

function marca(estado) {
  const e = ESTADOS[estado] || { etiqueta: estado, tono: "quiza" };
  return `<span class="marca ${e.tono}">${esc(e.etiqueta)}</span>`;
}

// ---------------------------------------------------------------- formatos

function cuerpoLista(filas, o, porCodigo) {
  const cols = ["", "Nombre", "Estado", "Invitación"];
  if (o.codigo) cols.push("Código");
  if (o.restriccion) cols.push("Restricción");
  if (o.observaciones) cols.push("Observaciones");

  const filasHtml = filas
    .map((f, i) => {
      // En una individual la persona es la invitación, y en una de pareja el
      // título ya lleva su nombre: repetirlo no dice nada. Ahí se muestra con
      // quién viene, que es lo que falta por saber.
      const grupo = porCodigo?.get(f.codigo);
      const otros = (grupo?.personas || [])
        .filter((p) => p.id !== f.id)
        .map((p) => p.nombre);
      const contexto = contextoDe(f.nombre, f.invitacion, otros);

      const celdas = [
        `<td class="num">${i + 1}</td>`,
        `<td class="nombre">${esc(f.nombre)}</td>`,
        `<td>${marca(f.estado)}</td>`,
        `<td class="apagado">${esc(contexto) || "—"}</td>`,
      ];
      if (o.codigo) celdas.push(`<td class="codigo">${esc(f.codigo)}</td>`);
      if (o.restriccion) celdas.push(`<td>${esc(f.restriccion) || "—"}</td>`);
      if (o.observaciones) celdas.push(`<td class="apagado">${esc(f.comentario) || "—"}</td>`);
      return `<tr>${celdas.join("")}</tr>`;
    })
    .join("");

  return `<table><thead><tr>${cols
    .map((c) => `<th>${esc(c)}</th>`)
    .join("")}</tr></thead><tbody>${filasHtml}</tbody></table>`;
}

function cuerpoInvitaciones(grupos, o) {
  return grupos
    .map((g) => {
      const codigo = `<span class="codigo">${esc(g.tipo)}${
        o.codigo ? ` · ${esc(g.codigo)}` : ""
      }</span>`;

      // Una invitación de una sola persona que además le da nombre se pinta en
      // una línea: el encabezado y su única fila decían lo mismo.
      if (esUnaSolaPersona(g)) {
        const f = g.personas[0];
        const extras = [
          o.restriccion ? f.restriccion : "",
          o.observaciones ? f.comentario : "",
        ].filter(Boolean);
        return `
      <div class="grupo suelto">
        <div class="tapa">
          <strong>${esc(f.nombre)}</strong>
          <span>${marca(f.estado)} ${codigo}</span>
        </div>
        ${extras.length ? `<p class="extra apagado">${esc(extras.join(" · "))}</p>` : ""}
      </div>`;
      }

      return `
      <div class="grupo">
        <div class="tapa">
          <strong>${esc(g.invitacion)}</strong>
          ${codigo}
        </div>
        <table><tbody>
          ${g.personas
            .map(
              (f) => `<tr>
                <td class="nombre">${esc(f.nombre)}</td>
                <td style="width:90px">${marca(f.estado)}</td>
                ${o.restriccion ? `<td class="apagado">${esc(f.restriccion) || ""}</td>` : ""}
                ${o.observaciones ? `<td class="apagado">${esc(f.comentario) || ""}</td>` : ""}
              </tr>`
            )
            .join("")}
        </tbody></table>
      </div>`;
    })
    .join("");
}

function cuerpoTarjetas(grupos, o) {
  return `<div class="tarjetas">${grupos
    .map((g) => {
      // En una individual el título de la tarjeta y su única persona son lo
      // mismo: la casilla se pone junto al título y no se repite el nombre.
      const sola = esUnaSolaPersona(g);
      const personas = sola ? [] : g.personas;

      return `
      <div class="tarjeta">
        <div class="cab">
          <h3>${sola ? `<span class="casilla"></span> ` : ""}${esc(g.invitacion)}</h3>
          ${o.codigo ? `<span class="codigo">${esc(g.codigo)}</span>` : ""}
        </div>
        ${personas
          .map(
            (f) => `<div class="persona">
              <span class="casilla"></span>
              <span>${esc(f.nombre)}</span>
              ${f.estado !== "confirmado" ? marca(f.estado) : ""}
              ${o.restriccion && f.restriccion ? `<span class="apagado">· ${esc(f.restriccion)}</span>` : ""}
            </div>`
          )
          .join("")}
        ${
          sola && o.restriccion && g.personas[0].restriccion
            ? `<p class="pie">🍽 ${esc(g.personas[0].restriccion)}</p>`
            : ""
        }
        <p class="pie">${esc(g.tipo)}${
          g.cuposLibres > 0
            ? ` · ${g.cuposLibres} ${g.cuposLibres === 1 ? "cupo libre" : "cupos libres"}`
            : ""
        }</p>
      </div>`;
    })
    .join("")}</div>`;
}

function cuerpoResumen(datos) {
  const { conteo, porTipo, pendientes, cupos } = datos;
  const respondieron = conteo.confirmado + conteo.no_asistira;
  const avance = conteo.total ? Math.round((respondieron / conteo.total) * 100) : 0;

  const cifra = (n, t) => `<div class="cifra"><b>${n}</b><span>${esc(t)}</span></div>`;

  return `
    <div class="cifras">
      ${cifra(conteo.total, "Personas")}
      ${cifra(conteo.confirmado, "Asisten")}
      ${cifra(conteo.no_asistira, "No asisten")}
      ${cifra(conteo.pendiente, "Sin responder")}
    </div>
    <p class="titulillo">Avance de confirmaciones — ${respondieron} de ${conteo.total} · ${avance}%</p>
    <div class="barra"><i style="width:${avance}%"></i></div>
    <div class="dos">
      <div>
        <p class="titulillo">Invitaciones por tipo</p>
        <ul class="lineas">
          ${Object.entries(porTipo)
            .map(([t, n]) => `<li><span>${esc(t)}</span><strong>${n}</strong></li>`)
            .join("")}
          ${
            cupos.totales > 0
              ? `<li><span>Cupos sin nombre</span><strong>${cupos.libres} de ${cupos.totales}</strong></li>`
              : ""
          }
        </ul>
      </div>
      <div>
        <p class="titulillo">Faltan por responder (${pendientes.length})</p>
        <ul class="lineas">
          ${
            pendientes.length
              ? pendientes
                  .slice(0, 24)
                  .map(
                    (f) =>
                      `<li><span>${esc(f.nombre)}</span><span class="apagado">${esc(f.invitacion)}</span></li>`
                  )
                  .join("")
              : `<li><span class="apagado">Nadie: ya respondieron todos.</span></li>`
          }
          ${pendientes.length > 24 ? `<li><span class="apagado">y ${pendientes.length - 24} más…</span></li>` : ""}
        </ul>
      </div>
    </div>`;
}

// ------------------------------------------------------------------ armado

export function construirDocumento({ opciones, filas, grupos, datos, evento, tema, etiquetaFiltro }) {
  const p = paleta(tema, opciones.color);
  const formato = FORMATOS.find((f) => f.key === opciones.formato) || FORMATOS[0];

  const titulo =
    opciones.formato === "resumen"
      ? "Resumen de confirmaciones"
      : `Lista de invitados${etiquetaFiltro ? ` — ${etiquetaFiltro}` : ""}`;

  const cuantos =
    opciones.formato === "tarjetas" || opciones.formato === "invitaciones"
      ? `${grupos.length} ${grupos.length === 1 ? "invitación" : "invitaciones"}`
      : `${filas.length} ${filas.length === 1 ? "persona" : "personas"}`;

  let cuerpo;
  if (opciones.formato === "invitaciones") cuerpo = cuerpoInvitaciones(grupos, opciones);
  else if (opciones.formato === "tarjetas") cuerpo = cuerpoTarjetas(grupos, opciones);
  else if (opciones.formato === "resumen") cuerpo = cuerpoResumen(datos);
  else cuerpo = cuerpoLista(filas, opciones, new Map(grupos.map((g) => [g.codigo, g])));

  const novios = [evento.novioEl, evento.novioElla].filter(Boolean).join(" & ");

  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>${esc(titulo)}</title>
<style>${estilos(p, opciones)}</style>
</head><body>
<div class="hoja">
  ${portada(evento, opciones, formato.label, cuantos)}
  ${cabecera(evento, titulo, cuantos)}
  ${opciones.notas.trim() ? `<p class="notas">${esc(opciones.notas)}</p>` : ""}
  ${cuerpo}
  <div class="pie-doc">
    <span>${esc(novios || "Invitación")}</span>
    <span>${esc(formato.label)} · ${esc(hoyLargo())}</span>
  </div>
</div>
</body></html>`;
}

// Abre el documento en una ventana nueva y lanza el diálogo de impresión, donde
// se puede elegir «Guardar como PDF». Sin dependencias ni servidor.
export function imprimirDocumento(html) {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(html);
  win.document.close();

  // El print va tras el load para que el navegador ya tenga el CSS aplicado;
  // si no, la primera impresión sale sin estilos. Pero con document.write el
  // load puede haber ocurrido ya cuando llegamos aquí, y entonces un
  // win.onload no se dispara nunca y no se abre el diálogo: hay que mirar
  // primero en qué estado quedó.
  //
  // El disparo va aquí y no dentro del HTML a propósito: ese mismo HTML se
  // pinta en la vista previa, y un <script>print()</script> dentro abriría el
  // diálogo de impresión con solo mirar la previa.
  const lanzar = () => {
    win.focus();
    win.print();
  };
  if (win.document.readyState === "complete") setTimeout(lanzar, 150);
  else win.addEventListener("load", lanzar);
  return true;
}
