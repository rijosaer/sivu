import { useState } from "react";
import { api, setToken, setInvitacionActual, setEventoFijo } from "../api";

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const { token, invitacion } = await api.login(usuario, password);
      setToken(token);
      // Un cliente entra directo a su evento; el dueño elige en "Tus eventos".
      setEventoFijo(Boolean(invitacion));
      if (invitacion) setInvitacionActual(invitacion);
      onLogin(invitacion);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10 barra-lateral !flex-row">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <p className="marca-firma !text-[3.2rem]">Sivú</p>
          <p className="marca-de">invitaciones digitales</p>
        </div>

        <form onSubmit={handleSubmit} className="tarjeta p-7">
          <h1 className="font-display text-2xl font-medium text-ink">Entra a tu panel</h1>
          <p className="ayuda mt-1 mb-6">Administra las invitaciones y el contenido del evento.</p>

          <label className="block mb-4">
            <span className="etiqueta">Usuario</span>
            <input
              className="campo"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              autoFocus
              autoComplete="username"
            />
          </label>

          <label className="block mb-5">
            <span className="etiqueta">Contraseña</span>
            <input
              type="password"
              className="campo"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && (
            <p className="text-red-600 text-sm mb-4 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button disabled={cargando} className="boton-primario w-full py-3 text-sm">
            {cargando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
