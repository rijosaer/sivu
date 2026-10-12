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
// Así se escriben los listados que mandan los clientes («3 cupos» es el dueño
// de la invitación y dos más).

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

    filas.push({ nombre, telefono, aux, personas, avisos, omitir });
  }
  return { filas };
}

function cuerpo(f) {
  return {
    nombre: f.nombre,
    telefono: f.telefono,
    ...(f.aux ? { telefono_aux: f.aux } : {}),
    ...(f.personas > 1 ? { tipo: "cupos", cupos: f.personas - 1 } : { tipo: "individual" }),
  };
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

  const existentes = new Set(lista.map((i) => paraBuscar(i.nombre)));
  const actual = hojas.find((h) => h.sheet === hoja);
  const analisis = actual ? analizarHoja(actual.data, existentes) : null;
  const filas = analisis?.filas || [];
  const aCrear = filas.filter((f) => !f.omitir);
  const omitidas = filas.filter((f) => f.omitir);
  const totalPersonas = aCrear.reduce((s, f) => s + f.personas, 0);

  async function elegir(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setResultado(null);
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
            <b>Teléfono auxiliar</b> (opcional) y <b>Personas</b> (o Cupos) con el total de
            personas, titular incluido: 1 = individual, 3 = titular + 2 cupos. Las filas sin
            teléfono y los nombres que ya existen en el evento se omiten.
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
          <select value={hoja} onChange={(e) => setHoja(e.target.value)} className="campo" disabled={creando}>
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
            {omitidas.length > 0 && <> · {omitidas.length} se omiten</>}.
          </p>

          <div className="mt-3 max-h-[420px] overflow-auto border border-borde rounded-lg">
            <table className="w-full text-xs">
              <thead className="bg-papel sticky top-0 text-left text-ink-tenue">
                <tr>
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="px-3 py-2 font-medium">Teléfono</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Nota</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={i} className={`border-t border-borde ${f.omitir ? "text-ink-tenue line-through" : ""}`}>
                    <td className="px-3 py-1.5">{f.nombre}</td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      {f.telefono ? `+${normalizarTelefono(f.telefono)}` : "—"}
                      {f.aux && <span className="block text-ink-tenue">aux. +{normalizarTelefono(f.aux)}</span>}
                    </td>
                    <td className="px-3 py-1.5 whitespace-nowrap">
                      {f.personas > 1 ? `Titular + ${f.personas - 1} ${f.personas === 2 ? "cupo" : "cupos"}` : "Individual"}
                    </td>
                    <td className="px-3 py-1.5 no-underline">
                      {f.omitir && <span className="text-amber-700 no-underline inline-block">{f.omitir}</span>}
                      {!f.omitir && f.avisos.join(" · ")}
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
