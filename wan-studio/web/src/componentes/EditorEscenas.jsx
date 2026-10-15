// Guion por escenas: cada escena tiene su texto, duración y preset. Se generan
// en orden y cada una arranca del último cuadro de la anterior.
export default function EditorEscenas({ escenas, setEscenas, presets, presetBase, maxEscenas, duracion }) {
  const cambiar = (i, campos) => setEscenas(escenas.map((e, k) => (k === i ? { ...e, ...campos } : e)));
  const quitar = (i) => setEscenas(escenas.filter((_, k) => k !== i));
  const mover = (i, d) => {
    const otra = [...escenas];
    [otra[i], otra[i + d]] = [otra[i + d], otra[i]];
    setEscenas(otra);
  };
  const lleno = escenas.length >= maxEscenas;
  const segundos = Array.from({ length: duracion.max - duracion.min + 1 }, (_, k) => duracion.min + k);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-tenue">Escenas</h2>
        <span className="text-xs text-tenue">
          {escenas.length} / {Number.isFinite(maxEscenas) ? maxEscenas : "∞"} · {escenas.reduce((s, e) => s + e.duracion, 0)} s
        </span>
      </div>

      {escenas.map((e, i) => (
        <div key={e.id} className="rounded-xl border border-borde bg-panel p-3">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-acento/15 font-semibold text-acento">{i + 1}</span>
            <select
              value={e.preset ?? presetBase}
              onChange={(ev) => cambiar(i, { preset: ev.target.value })}
              className="min-w-0 flex-1 rounded-lg border border-borde bg-fondo px-2 py-1 text-white focus:border-acento focus:outline-none"
              aria-label={`Preset de la escena ${i + 1}`}
            >
              {presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
            <select
              value={e.duracion}
              onChange={(ev) => cambiar(i, { duracion: Number(ev.target.value) })}
              className="rounded-lg border border-borde bg-fondo px-2 py-1 text-white focus:border-acento focus:outline-none"
              aria-label={`Duración de la escena ${i + 1}`}
            >
              {segundos.map((s) => (
                <option key={s} value={s}>
                  {s} s
                </option>
              ))}
            </select>
            <div className="flex">
              <button type="button" disabled={i === 0} onClick={() => mover(i, -1)} className="px-1 text-tenue hover:text-white disabled:opacity-30" aria-label="Subir escena">
                ↑
              </button>
              <button
                type="button"
                disabled={i === escenas.length - 1}
                onClick={() => mover(i, 1)}
                className="px-1 text-tenue hover:text-white disabled:opacity-30"
                aria-label="Bajar escena"
              >
                ↓
              </button>
              <button
                type="button"
                disabled={escenas.length === 1}
                onClick={() => quitar(i)}
                className="px-1 text-tenue hover:text-red-300 disabled:opacity-30"
                aria-label={`Quitar escena ${i + 1}`}
              >
                ✕
              </button>
            </div>
          </div>
          <textarea
            value={e.prompt}
            onChange={(ev) => cambiar(i, { prompt: ev.target.value })}
            maxLength={1000}
            rows={2}
            placeholder={i === 0 ? "Escena 1: cómo empieza…" : `Escena ${i + 1}: qué pasa después…`}
            className="campo resize-y"
          />
        </div>
      ))}

      <button
        type="button"
        disabled={lleno}
        onClick={() => setEscenas([...escenas, { id: crypto.randomUUID(), prompt: "", duracion: duracion.defecto, preset: null }])}
        className="boton-suave w-full py-2 text-xs"
      >
        {lleno ? `Tu plan permite hasta ${maxEscenas} escenas` : "+ Agregar escena"}
      </button>
      <p className="text-xs text-tenue">
        Cada escena sigue desde el último cuadro de la anterior y al final se unen en un solo video. Describe qué cambia en
        cada una; mantener el mismo personaje y lugar en el texto ayuda a que se vea continuo.
      </p>
    </div>
  );
}
