// Anti-clickjacking sin depender del servidor: si el panel se carga dentro de
// un iframe (window !== top), se rompe el marco y se navega fuera. Va en un
// archivo aparte (no en línea) para que la CSP pueda prohibir scripts en línea.
if (window.top !== window.self) {
  window.top.location = window.self.location;
}
