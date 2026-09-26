// Fondo de toda la invitación. Vive detrás del contenido (position: fixed,
// z-index negativo), así que no se desplaza con el scroll y la imagen se ve
// completa en cualquier alto de página.
//
// Por defecto dibuja un papel artesanal marfil con manchas de acuarela hecho
// solo con CSS. Si desde el panel se sube una imagen de fondo, se usa esa.
export default function PaperBackground({ src }) {
  if (src) {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-center bg-no-repeat"
        style={{
          // El color de debajo evita un parpadeo blanco mientras carga y
          // rellena si la imagen no cubre por relación de aspecto.
          backgroundColor: "#F8F4EE",
          backgroundImage: `url(${src})`,
          backgroundSize: "cover",
        }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10"
      style={{
        backgroundColor: "#F8F4EE",
        backgroundImage: [
          "radial-gradient(ellipse 620px 420px at 8% 10%, rgba(231,216,200,0.55), transparent 62%)",
          "radial-gradient(ellipse 520px 380px at 95% 18%, rgba(215,196,175,0.42), transparent 60%)",
          "radial-gradient(ellipse 560px 420px at 15% 92%, rgba(201,182,138,0.22), transparent 65%)",
          "radial-gradient(ellipse 520px 360px at 88% 95%, rgba(231,216,200,0.4), transparent 60%)",
          "radial-gradient(ellipse 700px 500px at 50% 50%, rgba(215,196,175,0.12), transparent 70%)",
        ].join(", "),
      }}
    >
      {/* grano de papel muy sutil */}
      <div
        className="absolute inset-0"
        style={{
          opacity: 0.05,
          mixBlendMode: "multiply",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "120px 120px",
        }}
      />
    </div>
  );
}
