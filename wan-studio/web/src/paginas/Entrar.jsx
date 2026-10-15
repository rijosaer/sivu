import { useState } from "react";
import { api } from "../api.js";

export default function Entrar({ alEntrar }) {
  const [modo, setModo] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError("");
    try {
      const datos = await api(`/api/auth/${modo === "login" ? "login" : "registro"}`, {
        metodo: "POST",
        cuerpo: { email, password },
      });
      alEntrar(datos);
      if (!window.location.hash || window.location.hash === "#/entrar") window.location.hash = "#/crear";
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="text-2xl font-bold">{modo === "login" ? "Entrar" : "Crear cuenta"}</h1>
      <p className="mt-1 text-sm text-tenue">
        {modo === "login" ? "Inicia sesión para crear videos." : "Las cuentas nuevas reciben créditos de prueba."}
      </p>
      <form onSubmit={enviar} className="mt-6 space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="campo"
        />
        <input
          type="password"
          required
          minLength={modo === "registro" ? 8 : undefined}
          autoComplete={modo === "login" ? "current-password" : "new-password"}
          placeholder={modo === "registro" ? "Contraseña (mínimo 8 caracteres)" : "Contraseña"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="campo"
        />
        {error && <p className="text-sm text-red-300">{error}</p>}
        <button type="submit" disabled={enviando} className="boton-acento w-full">
          {enviando ? "Un momento…" : modo === "login" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>
      <button
        onClick={() => {
          setModo(modo === "login" ? "registro" : "login");
          setError("");
        }}
        className="mt-4 text-sm text-tenue hover:text-white"
      >
        {modo === "login" ? "¿No tienes cuenta? Crea una" : "¿Ya tienes cuenta? Entra"}
      </button>
    </div>
  );
}
