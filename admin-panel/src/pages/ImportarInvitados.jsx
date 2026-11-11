import { useState } from "react";
import leerExcel from "read-excel-file/browser";
import { api } from "../api";
import { useToast } from "../ui/Toast";
import { normalizarTelefono, telefonoValido } from "../whatsapp";
import { paraBuscar } from "./Invitados";

// Importar invitaciones desde un Excel (.xlsx). Sivú recibe los listados de
// los clientes en hojas de cálculo; en vez de crear una por una, se sube el
// archivo, se revisa la vista previa y se crean todas de una vez.
//
// Las columnas se reconocen por su encabezado, no por su posición:
//   - Nombre / Titular              → nombre de la invitación (obligatorio)
//   - Teléfono / Celular / WhatsApp → número principal
//   - Teléfono auxiliar / Segundo   → número auxiliar (opcional)
//   - Personas / Cupos              → TOTAL de personas, titular incluido:
//                                     1 = individual, 3 = titular + 2 cupos
//   - Tipo (opcional)               → Individual, Pareja, Familia o Titular + cupos
// Así se escriben los listados que mandan los clientes («3 cupos» es el dueño
// de la invitación y dos más).
//
// Sin columna Tipo, el tipo se deduce: dos personas con «y» en el nombre
// («Mauxy y Junior») son una pareja, y si el nombre lista tantas personas como
// dice la columna Personas («Ana, Luis y Pedro» con 3) es una familia. En la
// vista previa cada fila se puede corregir antes de crear: el tipo no se puede
// cambiar después.

const TIPOS = [
  { key: "individual", label: "Individual" },
  { key: "pareja", label: "Pareja" },
  { key: "familia", label: "Familia" },
  { key: "cupos", label: "Titular + cupos" },
];

function columnas(encabezados) {
  const norm = encabezados.map((h) => paraBuscar(h).trim());
  const buscar = (prueba) => norm.findIndex((h) => h && prueba(h));
  const esAux = (h) => h.includes("aux") || h.includes("segundo") || h.includes("alterno");
  const esTelefono = (h) =>
    (h.includes("telefono") || h.includes("celular") || h.includes("whatsapp")) && !esAux(h);
  const personas = buscar((h) => h.includes("personas") || h.includes("cupos"));
  let nombre = buscar((h) => h.includes("titular") || h.includes("nombre") || h.includes("invitado"));
  // Listados de clientes sin encabezado de nombre («Cupos | Teléfonos» y los
  // nombres en la primera columna): se toma la primera columna.
  if (nombre < 0 && personas > 0 && buscar(esTelefono) > 0) nombre = 0;
  return {
    nombre,
    telefono: buscar(esTelefono),
    aux: buscar(esAux),
    personas,
    tipo: buscar((h) => h === "tipo" || h.startsWith("tipo ") || h.includes("tipo de invitacion")),
  };
}

// La primera fila que tenga una columna de nombre es la de encabezados: los
// listados a veces traen un título arriba.
function filaEncabezados(datos) {
  for (let i = 0; i < Math.min(datos.length, 10); i++) {
    if (columnas(datos[i].map((c) => String(c ?? ""))).nombre >= 0) return i;
  }
  return -1;
}

// «Pareja», «familia», «titular + 2 cupos», «individual»… como lo escriba el
// cliente. Lo que no se reconozca se ignora y manda la deducción.
function tipoEscrito(valor) {
  const t = paraBuscar(String(valor ?? "")).trim();
  if (!t) return "";
  if (t.includes("pareja") || t.includes("esposos") || t.includes("novios")) return "pareja";
  if (t.includes("familia")) return "familia";
  if (t.includes("cupo") || t.includes("titular") || t.includes("acompan")) return "cupos";
  if (t.includes("individual") || t.includes("sola") || t.includes("solo")) return "individual";
  return "";
}

// Separa «Ana, Luis y Pedro» o «Ana & Luis» en nombres sueltos.
function separarNombres(nombre) {
  return nombre
    .replace(/^familia\s+/i, "")
    .split(/\s*,\s*|\s+y\s+|\s+e\s+|\s*&\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Tipo deducido de la fila y los nombres que le corresponden.
function deducirTipo(nombre, personas, escrito) {
  const partes = separarNombres(nombre);
  const pareja = personas === 2 && partes.length === 2;
  const familia = personas >= 3 && partes.length === personas;
  const tipo =
    escrito ||
    (pareja ? "pareja" : familia ? "familia" : personas > 1 ? "cupos" : "individual");
  if (tipo === "pareja") {
    return { tipo, p1: partes[0] || nombre, p2: partes.length === 2 ? partes[1] : "" };
  }
  if (tipo === "familia") {
    return { tipo, integrantes: partes.length > 1 ? partes.join(", ") : "" };
  }
  return { tipo };
}

function analizarHoja(datos, existentes) {
  const inicio = filaEncabezados(datos);
  if (inicio < 0) return { error: "No encontré una columna «Nombre» o «Titular» en esta hoja." };
  const col = columnas(datos[inicio].map((c) => String(c ?? "")));
  if (col.personas < 0) {
    return { error: "No encontré una columna «Personas» o «Cupos» (total de personas por invitación)." };
  }

  const vistos = new Set();
  const filas = [];
  for (const fila of datos.slice(inicio + 1)) {
    const nombre = String(fila[col.nombre] ?? "").replace(/\s+/g, " ").trim();
    if (!nombre || paraBuscar(nombre) === "total") continue;

    // Un mismo campo puede traer dos números («3148623341 - 3207310013»): el
    // segundo pasa a auxiliar si esa columna está vacía.
    const numeros = String(col.telefono >= 0 ? fila[col.telefono] ?? "" : "")
      .split(/\s+-\s+|\s*[/,;]\s*|\s+y\s+/)
      .map((parte) => parte.replace(/\D/g, ""))
      .filter(Boolean);
    const telefono = numeros[0] || "";
    let aux = String(col.aux >= 0 ? fila[col.aux] ?? "" : "").replace(/\D/g, "");
    if (!aux && numeros[1]) aux = numeros[1];

    const crudo = fila[col.personas];
    const n = Number(String(crudo ?? "").trim());
    const personas = Number.isInteger(n) && n >= 1 && n <= 51 ? n : 1;

    const avisos = [];
    if (!(Number.isInteger(n) && n >= 1 && n <= 51)) {
      avisos.push(crudo ? `«${crudo}» no es un número: va como individual` : "Sin personas: va como individual");
    }
    if (aux && !telefonoValido(aux)) avisos.push("El número auxiliar no parece válido");

    let omitir = "";
    const clave = paraBuscar(nombre);
    if (!telefono) omitir = "Sin teléfono";
    else if (!telefonoValido(telefono)) omitir = "Teléfono no válido";
    else if (existentes.has(clave)) omitir = "Ya existe en el evento";
    else if (vistos.has(clave)) omitir = "Repetido en el archivo";
    vistos.add(clave);

    const escrito = col.tipo >= 0 ? tipoEscrito(fila[col.tipo]) : "";
    filas.push({ nombre, telefono, aux, personas, avisos, omitir, ...deducirTipo(nombre, personas, escrito) });
  }
  return { filas };
}

// Une la fila leída con lo que se corrigió en la vista previa y dice si se
// puede crear así.
function efectiva(f, cambio) {
  const g = { ...f, ...cambio };
  const integrantes = separarNombres(g.integrantes || "");
  let falta = "";
  if (g.tipo === "pareja" && (!g.p1?.trim() || !g.p2?.trim())) falta = "Escribe los dos nombres de la pareja";
  if (g.tipo === "familia" && integrantes.length < 2) falta = "Escribe los integrantes separados por comas";
  const personas =
    g.tipo === "individual" ? 1 : g.tipo === "pareja" ? 2 : g.tipo === "familia" ? integrantes.length : Math.max(2, g.personas);
  return { ...g, personas, integrantesLista: integrantes, falta };
}

function cuerpo(f) {
  const base = { telefono: f.telefono, ...(f.aux ? { telefono_aux: f.aux } : {}) };
  if (f.tipo === "pareja") {
    const a = f.p1.trim();
    const b = f.p2.trim();
    return { ...base, nombre: `${a} y ${b}`, tipo: "pareja", miembros: [{ nombre: a }, { nombre: b }] };
  }
  if (f.tipo === "familia") {
    return { ...base, nombre: f.nombre, tipo: "familia", miembros: f.integrantesLista.map((n) => ({ nombre: n })) };
  }
  if (f.tipo === "cupos") return { ...base, nombre: f.nombre, tipo: "cupos", cupos: f.personas - 1 };
  return { ...base, nombre: f.nombre, tipo: "individual" };
}

function textoTipo(f) {
  if (f.tipo === "cupos") return `Titular + ${f.personas - 1} ${f.personas === 2 ? "cupo" : "cupos"}`;
  return TIPOS.find((t) => t.key === f.tipo)?.label || "Individual";
}

export default function ImportarInvitados({ lista, onTerminado, onCerrar }) {
  const toast = useToast();
  const [hojas, setHojas] = useState([]);
  const [hoja, setHoja] = useState("");
  const [archivo, setArchivo] = useState("");
  const [error, setError] = useState("");
  const [creando, setCreando] = useState(false);
  const [avance, setAvance] = useState(0);
  const [resultado, setResultado] = useState(null);
  // Correcciones hechas en la vista previa, por número de fila.
  const [cambios, setCambios] = useState({});

  const existentes = new Set(lista.map((i) => paraBuscar(i.nombre)));
  const actual = hojas.find((h) => h.sheet === hoja);
  const analisis = actual ? analizarHoja(actual.data, existentes) : null;
  const filas = (analisis?.filas || []).map((f, i) => efectiva(f, cambios[i]));
  const aCrear = filas.filter((f) => !f.omitir && !f.falta);
  const pendientes = filas.filter((f) => !f.omitir && f.falta);
  const omitidas = filas.filter((f) => f.omitir);
  const totalPersonas = aCrear.reduce((s, f) => s + f.personas, 0);
  const parejas = aCrear.filter((f) => f.tipo === "pareja").length;

  function corregir(i, datos) {
    setCambios((c) => ({ ...c, [i]: { ...c[i], ...datos } }));
  }

  // Al cambiar el tipo se proponen los nombres a partir del de la fila.
  function cambiarTipo(i, f, tipo) {
    if (tipo === "pareja") {
      const partes = separarNombres(f.nombre);
      corregir(i, { tipo, p1: f.p1 || partes[0] || f.nombre, p2: f.p2 || (partes.length === 2 ? partes[1] : "") });
    } else if (tipo === "familia") {
      const partes = separarNombres(f.nombre);
      corregir(i, { tipo, integrantes: f.integrantes || (partes.length > 1 ? partes.join(", ") : "") });
    } else {
      corregir(i, { tipo });
    }
  }

  async function elegir(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setResultado(null);
    setCambios({});
    try {
      const libro = await leerExcel(file);
      setHojas(libro);
      setArchivo(file.name);
      // Si hay una hoja «Enviar» (como en los listados que arma Sivú) se
      // usa esa; si no, la primera que tenga encabezados reconocibles.
      const preferida =
        libro.find((h) => paraBuscar(h.sheet).trim() === "enviar") ||
        libro.find((h) => filaEncabezados(h.data) >= 0) ||
        libro[0];
      setHoja(preferida?.sheet || "");
    } catch {
      setHojas([]);
      setError("No se pudo leer el archivo. Tiene que ser un Excel .xlsx.");
    }
  }

  async function crear() {
    setCreando(true);
    setAvance(0);
    const fallidas = [];
    let creadas = 0;
    // De la última a la primera: el panel lista primero lo más reciente, así
    // las invitaciones quedan en el mismo orden del Excel.
    for (const f of [...aCrear].reverse()) {
      try {
        await api.crearInvitado(cuerpo(f));
        creadas++;
      } catch (e) {
        fallidas.push({ nombre: f.nombre, error: e.message || "Error" });
      }
      setAvance((a) => a + 1);
    }
    setCreando(false);
    setResultado({ creadas, fallidas });
    toast(`${creadas} invitaciones creadas`);
    onTerminado();
  }

  return (
    <section className="tarjeta p-5 mb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h3 className="bloque-titulo">Importar desde Excel</h3>
          <p className="ayuda mt-0.5 max-w-prose">
            Columnas que se reconocen: <b>Nombre</b> (o Titular), <b>Teléfono</b>,{" "}
            <b>Teléfono auxiliar</b> (opcional), <b>Personas</b> (o Cupos) con el total de
            personas, titular incluido, y <b>Tipo</b> (opcional: Individual, Pareja, Familia o
            Titular + cupos). Sin Tipo, dos personas con «y» en el nombre quedan como pareja.
            Revisa el tipo de cada fila antes de crear: después no se puede cambiar.
          </p>
        </div>
        <button onClick={onCerrar} className="boton-texto" disabled={creando}>
          Cerrar
        </button>
      </div>

      <label className="boton-secundario cursor-pointer inline-flex">
        {archivo ? "Elegir otro archivo" : "Elegir archivo .xlsx"}
        <input type="file" accept=".xlsx" onChange={elegir} className="sr-only" disabled={creando} />
      </label>
      {archivo && <span className="ayuda ml-3">{archivo}</span>}

      {hojas.length > 1 && (
        <label className="block mt-3 max-w-xs">
          <span className="etiqueta">Hoja</span>
          <select
            value={hoja}
            onChange={(e) => {
              setHoja(e.target.value);
              setCambios({});
            }}
            className="campo"
            disabled={creando}
          >
            {hojas.map((h) => (
              <option key={h.sheet} value={h.sheet}>
                {h.sheet}
              </option>
            ))}
          </select>
        </label>
      )}

      {(error || analisis?.error) && (
        <p className="text-xs text-red-600 mt-3">{error || analisis.error}</p>
      )}

      {filas.length > 0 && !resultado && (
        <>
          <p className="text-sm text-ink mt-4">
            Se van a crear <b>{aCrear.length}</b> invitaciones para <b>{totalPersonas}</b> personas
            {parejas > 0 && <> · {parejas} {parejas === 1 ? "pareja" : "parejas"}</>}
            {omitidas.length > 0 && <> · {omitidas.length} se omiten</>}
            {pendientes.length > 0 && (
              <span className="text-amber-700"> · {pendientes.length} por completar</span>
            )}
            .
          </p>

          <div className="mt-3 max-h-[460px] overflow-auto border border-borde rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-papel sticky top-0 z-10 text-left text-ink-tenue">
                <tr>
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Teléfono</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={i} className={`border-t border-borde align-top ${f.omitir ? "text-ink-tenue line-through" : ""}`}>
                    <td className="px-3 py-1.5">
                      {f.omitir || f.tipo !== "pareja" ? (
                        f.tipo === "pareja" ? `${f.p1} y ${f.p2}` : f.nombre
                      ) : (
                        <div className="flex flex-wrap items-center gap-1">
                          <input
                            className="campo py-1 px-2 text-xs w-36"
                            value={f.p1 || ""}
                            onChange={(e) => corregir(i, { p1: e.target.value })}
                            aria-label={`Primera persona de ${f.nombre}`}
                            disabled={creando}
                          />
                          <span className="text-ink-tenue">y</span>
                          <input
                            className="campo py-1 px-2 text-xs w-36"
                            value={f.p2 || ""}
                            placeholder="Segunda persona"
                            onChange={(e) => corregir(i, { p2: e.target.value })}
                            aria-label={`Segunda persona de ${f.nombre}`}
                            disabled={creando}
                          />
                        </div>
                      )}
                      {!f.omitir && f.tipo === "familia" && (
                        <input
                          className="campo py-1 px-2 text-xs w-full mt-1"
                          value={f.integrantes || ""}
                          placeholder="Integrantes separados por comas"
                          onChange={(e) => corregir(i, { integrantes: e.target.value })}
                          aria-label={`Integrantes de ${f.nombre}`}
                          disabled={creando}
                        />
                      )}
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      {f.telefono ? `+${normalizarTelefono(f.telefono)}` : "—"}
                      {f.aux && <span className="block text-ink-tenue">aux. +{normalizarTelefono(f.aux)}</span>}
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      {f.omitir ? (
                        textoTipo(f)
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <select
                            className="campo py-1 px-2 text-xs"
                            value={f.tipo}
                            onChange={(e) => cambiarTipo(i, f, e.target.value)}
                            aria-label={`Tipo de invitación de ${f.nombre}`}
                            disabled={creando}
                          >
                            {TIPOS.map((t) => (
                              <option key={t.key} value={t.key}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                          {f.tipo === "cupos" && (
                            <input
                              type="number"
                              min="1"
                              max="50"
                              className="campo py-1 px-2 text-xs w-14"
                              value={f.personas - 1}
                              onChange={(e) => corregir(i, { personas: Math.max(1, Number(e.target.value) || 1) + 1 })}
                              aria-label={`Cupos adicionales de ${f.nombre}`}
                              disabled={creando}
                            />
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-1.5 no-underline">
                      {f.omitir && <span className="text-amber-700 no-underline inline-block">{f.omitir}</span>}
                      {!f.omitir && f.falta && <span className="text-amber-700">{f.falta}</span>}
                      {!f.omitir && !f.falta && f.avisos.join(" · ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button onClick={crear} disabled={creando || !aCrear.length} className="boton-primario">
              {creando ? `Creando ${avance} de ${aCrear.length}...` : `Crear ${aCrear.length} invitaciones`}
            </button>
            {pendientes.length > 0 && !creando && (
              <span className="ayuda">Las filas por completar no se crean hasta que tengan sus nombres.</span>
            )}
          </div>
        </>
      )}

      {resultado && (
        <div className="mt-4 text-sm">
          <p className="text-emerald-700">
            Listo: {resultado.creadas} invitaciones creadas.
          </p>
          {resultado.fallidas.length > 0 && (
            <ul className="mt-2 text-xs text-red-600 space-y-0.5">
              {resultado.fallidas.map((f, i) => (
                <li key={i}>
                  {f.nombre}: {f.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
