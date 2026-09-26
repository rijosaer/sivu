-- Esquema de la invitación — PostgreSQL
-- Diseño: casi todo el contenido vive en columnas JSONB para que el panel
-- pueda editar cualquier campo (incluso nuevos) sin cambios de esquema.

CREATE TABLE IF NOT EXISTS admin_usuarios (
  id SERIAL PRIMARY KEY,
  usuario TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

-- Colores y tipografías del sitio. Cada fila es una variable editable
-- desde "Tema" en el panel (las que empiezan con "color-" se muestran
-- como selector de color; el resto como texto).
CREATE TABLE IF NOT EXISTS tema (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

-- Una fila por bloque/sección de la invitación. "orden" define en qué
-- posición aparece, "activo" si se muestra o no, y "contenido" guarda
-- todos sus textos/datos como JSON — el panel genera un formulario a
-- partir de las claves que tenga ese JSON.
CREATE TABLE IF NOT EXISTS secciones (
  id SERIAL PRIMARY KEY,
  tipo TEXT NOT NULL,          -- welcome | fotos | informacion_boda | sobres | vestimenta | historia | menu | alojamiento | transporte | info_importante | faq | musica
  titulo_panel TEXT NOT NULL,  -- nombre legible en el panel, ej. "Código de vestimenta"
  orden INTEGER NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT true,
  contenido JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Imágenes decorativas (marco, columna, esquina, divisor...). Si "datos"
-- está vacío, el sitio usa la imagen por defecto que trae el código.
CREATE TABLE IF NOT EXISTS decoraciones (
  clave TEXT PRIMARY KEY,      -- scrollwork | bouquet | frame | column | divider
  etiqueta TEXT NOT NULL,      -- nombre legible en el panel
  datos TEXT                   -- imagen en base64 (data URL), o NULL = usar la de fábrica
);

-- Un invitado = un código de enlace único. No se agrupa por familia.
CREATE TABLE IF NOT EXISTS invitados (
  id SERIAL PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  familia TEXT,                -- solo etiqueta de referencia
  mensaje TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente', -- pendiente | confirmado | no_asistira
  restriccion TEXT,
  comentario TEXT,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------
-- Datos iniciales (para que el sitio no arranque vacío)
-- ------------------------------------------------------------------

INSERT INTO tema (clave, valor) VALUES
  ('color-paper', '#F8F4EE'),
  ('color-ink', '#5C4530'),
  ('color-gold', '#B8924A'),
  ('color-gold-light', '#D9BE87'),
  ('color-gold-dark', '#8C6A2E'),
  ('color-marble', '#EFEAE1'),
  ('color-seal', '#8A5A34'),
  ('fuente-titulos', 'Playfair Display'),
  ('fuente-cuerpo', 'Cormorant Garamond')
ON CONFLICT (clave) DO NOTHING;

INSERT INTO decoraciones (clave, etiqueta, datos) VALUES
  ('scrollwork', 'Filigrana de esquina', NULL),
  ('bouquet', 'Ramillete floral', NULL),
  ('frame', 'Marco ornamental (nombres)', NULL),
  ('column', 'Columna', NULL),
  ('divider', 'Divisor de patrón', NULL)
ON CONFLICT (clave) DO NOTHING;

INSERT INTO secciones (tipo, titulo_panel, orden, activo, contenido) VALUES
  ('welcome', 'Bienvenida y nombres', 1, true, '{
    "bienvenidaTexto": "Bienvenidos a nuestra boda civil",
    "novioEl": "Mariana",
    "novioElla": "Andrés",
    "padresTexto": "Con la bendición de nuestros padres",
    "padreElPadre": "Sr. Carlos Vega",
    "padreElMadre": "Sra. Rosa Martínez",
    "padreEllaPadre": "Sr. Luis Andrade",
    "padreEllaMadre": "Sra. Marta Ruiz",
    "fraseIntro": "Nos casamos por lo civil y queremos que lo firmes con nosotros."
  }'::jsonb),
  ('fotos', 'Fotos de los novios', 2, true, '{
    "titulo": "Nuestras fotos",
    "subtitulo": "Los novios",
    "urls": ["https://images.unsplash.com/photo-1509927083803-4bd519298ac4?w=800&q=80","https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80","https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80","https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800&q=80"]
  }'::jsonb),
  ('informacion_boda', 'Información de la boda', 3, true, '{
    "lugar": "Notaría Segunda de Riohacha — Salón Los Cardones",
    "direccion": "Cra. 7 # 4-32, Riohacha, La Guajira",
    "fecha": "2026-11-14T17:00:00-05:00",
    "mapsUrl": "https://maps.google.com/?q=Notaria+Segunda+Riohacha",
    "fechaLimiteConfirmacion": "2026-10-15",
    "cronograma": [
      {"hora": "4:30 pm", "titulo": "Recepción"},
      {"hora": "5:00 pm", "titulo": "Firma del acta civil"},
      {"hora": "6:00 pm", "titulo": "Brindis"},
      {"hora": "6:30 pm", "titulo": "Unas palabras"},
      {"hora": "7:00 pm", "titulo": "Mesa dulce y salada"},
      {"hora": "8:30 pm", "titulo": "Cierre"}
    ]
  }'::jsonb),
  ('sobres', 'Lluvia de sobres', 4, true, '{
    "texto": "Su presencia es el mejor regalo. Si desean tener un detalle con nosotros, lo recibimos con cariño mediante una lluvia de sobres el día del evento."
  }'::jsonb),
  ('vestimenta', 'Código de vestimenta', 5, true, '{
    "titulo": "Formal — tonos beige y marrones",
    "permitidos": "Beige, Camel, Marrón, Verde oliva",
    "evitar": "Blanco, Marfil"
  }'::jsonb),
  ('historia', 'Nuestra historia', 6, true, '{
    "texto": "Nos conocimos discutiendo por un parqueadero y terminamos compartiendo el mismo techo. Cinco años después decidimos que era momento de que quedara constancia legal de lo obvio."
  }'::jsonb),
  ('menu', 'Menú', 7, true, '{
    "nota": "Solo ceremonia, brindis, palabras y mesa dulce y salada. No habrá cena formal.",
    "opciones": [
      {"tipo": "Mesa salada", "items": ["Croquetas de queso", "Mini arepas de choclo", "Bruschettas de tomate"]},
      {"tipo": "Bebidas", "items": ["Vino tinto y blanco", "Champaña para el brindis", "Limonada de coco"]},
      {"tipo": "Mesa dulce", "items": ["Mini postres surtidos", "Torta de bodas"]}
    ]
  }'::jsonb),
  ('alojamiento', 'Alojamiento', 8, true, '{
    "hoteles": [
      {"nombre": "Hotel Arimaca", "distancia": "5 min de la Notaría", "nota": "Tarifa especial mencionando la boda.", "mapsUrl": "https://maps.google.com/?q=Hotel+Arimaca+Riohacha"},
      {"nombre": "Hotel Taroa", "distancia": "10 min de la Notaría", "nota": "Buena opción frente al malecón.", "mapsUrl": "https://maps.google.com/?q=Hotel+Taroa+Riohacha"}
    ]
  }'::jsonb),
  ('transporte', 'Transporte', 9, true, '{
    "opciones": [
      {"titulo": "Parqueadero privado", "detalle": "Disponible en la Notaría para invitados con vehículo propio."},
      {"titulo": "Transporte compartido", "detalle": "Habrá una van saliendo del Hotel Arimaca a las 4:00 pm."},
      {"titulo": "Taxis y apps", "detalle": "La zona tiene buena cobertura de InDrive y taxis locales."}
    ]
  }'::jsonb),
  ('info_importante', 'Información importante', 10, true, '{
    "items": [
      "Ceremonia civil, sin ritual religioso.",
      "Después de la firma: brindis, unas palabras y mesa dulce y salada. No habrá cena.",
      "Evento solo para invitados confirmados, sin acompañantes adicionales.",
      "Sin niños menores de 10 años."
    ]
  }'::jsonb),
  ('faq', 'Preguntas frecuentes', 11, true, '{
    "items": [
      {"p": "¿Puedo llevar acompañante no confirmado?", "r": "Solo las personas confirmadas en tu invitación tienen cupo reservado."},
      {"p": "¿Hay parqueadero?", "r": "Sí, la Notaría cuenta con parqueadero privado para invitados."},
      {"p": "¿Habrá cena?", "r": "No. Solo brindis, unas palabras y mesa dulce y salada."}
    ]
  }'::jsonb),
  ('musica', 'Música de fondo', 12, true, '{
    "titulo": "Perfect — Ed Sheeran (cover instrumental)",
    "src": ""
  }'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO invitados (codigo, nombre, familia, mensaje, estado) VALUES
  ('AB72KD', 'Carlos', 'Familia Rodríguez', 'Carlos, para nosotros sería un honor firmar este nuevo capítulo contigo presente.', 'pendiente'),
  ('DEMO01', 'Invitado', 'Invitado de prueba', 'Esta es una invitación de demostración.', 'pendiente')
ON CONFLICT DO NOTHING;
