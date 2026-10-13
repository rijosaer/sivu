// Service worker mínimo: permite instalar el panel como app en el celular.
// No guarda nada en caché a propósito: el panel siempre muestra datos al día.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
