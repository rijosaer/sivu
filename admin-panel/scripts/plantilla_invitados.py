"""Genera public/plantilla-invitados-sivu.xlsx, la plantilla que el panel
ofrece en «Importar desde Excel».

Uso (desde admin-panel/):  python scripts/plantilla_invitados.py

Las columnas tienen que coincidir con las que reconoce
src/pages/ImportarInvitados.jsx (se buscan por el encabezado). Tipo, Grupo y
Regalo traen listas desplegables; Grupo acepta además cualquier texto.
"""
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation

VINO = "5C0F27"
CREMA = "FBF3E4"
SALIDA = Path(__file__).resolve().parent.parent / "public" / "plantilla-invitados-sivu.xlsx"

COLUMNAS = [
    ("Nombre", 30),
    ("Teléfono", 16),
    ("Teléfono auxiliar", 18),
    ("Personas", 11),
    ("Tipo", 18),
    ("Integrantes", 34),
    ("Grupo", 16),
    ("Regalo", 20),
    ("Detalle del regalo", 30),
]
EJEMPLOS = [
    ("María José Fragozo", "3001234567", "", 1, "Individual", "", "Novia", "Regalo específico", "Juego de copas"),
    ("Carlos y Laura", "3109876543", "", 2, "Pareja", "", "Novio", "Lista de opciones", ""),
    ("Familia Rodríguez", "3204567890", "3157654321", 4, "Familia", "Ana, Luis, Pedro, Sofía", "Ambos", "Lluvia de sobres", ""),
    ("Jorge Ochoa", "3145535187", "", 3, "Titular + cupos", "", "Novio", "", ""),
]
TIPOS = ["Individual", "Pareja", "Familia", "Titular + cupos"]
GRUPOS = ["Novio", "Novia", "Ambos"]
REGALOS = ["Lluvia de sobres", "Regalo específico", "Lista de opciones", "Enlace de tienda"]

libro = Workbook()
hoja = libro.active
hoja.title = "Invitados"
borde = Border(bottom=Side(style="thin", color="E6DCCB"))

for i, (titulo, ancho) in enumerate(COLUMNAS, start=1):
    celda = hoja.cell(row=1, column=i, value=titulo)
    celda.font = Font(bold=True, color="FFFFFF")
    celda.fill = PatternFill("solid", fgColor=VINO)
    celda.alignment = Alignment(vertical="center")
    hoja.column_dimensions[celda.column_letter].width = ancho
hoja.row_dimensions[1].height = 22
hoja.freeze_panes = "A2"

for fila in EJEMPLOS:
    hoja.append(list(fila))
for fila in hoja.iter_rows(min_row=2, max_row=1 + len(EJEMPLOS)):
    for celda in fila:
        celda.font = Font(italic=True, color="8A7D72")
        celda.border = borde
# Teléfonos como texto para que Excel no los vuelva números con notación rara.
for col in ("B", "C"):
    for n in range(2, 501):
        hoja[f"{col}{n}"].number_format = "@"


def lista(valores, columna, estricta=True, ayuda=""):
    v = DataValidation(type="list", formula1='"' + ",".join(valores) + '"', allow_blank=True)
    v.showErrorMessage = estricta
    v.errorTitle = "Valor no válido"
    v.error = "Elige una opción de la lista."
    if ayuda:
        v.showInputMessage = True
        v.promptTitle = COLUMNAS[ord(columna) - ord("A")][0]
        v.prompt = ayuda
    hoja.add_data_validation(v)
    v.add(f"{columna}2:{columna}500")


lista(TIPOS, "E", ayuda="Pareja = dos personas con nombre. Familia = escribe los integrantes. Titular + cupos = no sabes a quién trae.")
lista(GRUPOS, "G", estricta=False, ayuda="De quién es el invitado. Puedes escribir otro grupo: Trabajo, Colegio…")
lista(REGALOS, "H", ayuda="Qué opción de regalo ve este invitado. Déjalo vacío si no ve regalos.")
personas = DataValidation(type="whole", operator="between", formula1="1", formula2="50", allow_blank=True)
personas.error = "Escribe un número de 1 a 50 (total de personas, titular incluido)."
hoja.add_data_validation(personas)
personas.add("D2:D500")

ayuda = libro.create_sheet("Cómo llenarla")
ayuda.column_dimensions["A"].width = 22
ayuda.column_dimensions["B"].width = 90
filas_ayuda = [
    ("Plantilla de invitados de Sivú", ""),
    ("", ""),
    ("Nombre", "Cómo aparece en la invitación: «María José Fragozo», «Carlos y Laura», «Familia Rodríguez»."),
    ("Teléfono", "WhatsApp con 10 dígitos (3001234567). Sin teléfono la fila no se importa."),
    ("Teléfono auxiliar", "Opcional: otro número por si el primero no responde."),
    ("Personas", "Total de personas de esa invitación, titular incluido. Una pareja = 2."),
    ("Tipo", "Individual · Pareja · Familia · Titular + cupos. Si lo dejas vacío, Sivú lo deduce: dos personas con «y» en el nombre quedan como pareja."),
    ("Integrantes", "Solo para Familia: los nombres separados por comas («Ana, Luis, Pedro»)."),
    ("Grupo", "De quién es el invitado (Novio, Novia, Ambos u otro nombre). Sirve para filtrar, contar y enviar por grupo."),
    ("Regalo", "Lluvia de sobres · Regalo específico · Lista de opciones · Enlace de tienda. Vacío = no ve la sección de regalos."),
    ("Detalle del regalo", "Solo para «Regalo específico»: qué regalo le toca a esa persona («Licuadora», «Juego de sábanas»)."),
    ("", ""),
    ("Antes de enviar", "Borra las cuatro filas de ejemplo (en gris) y escribe tus invitados desde la fila 2."),
]
for fila in filas_ayuda:
    ayuda.append(fila)
ayuda["A1"].font = Font(bold=True, size=14, color=VINO)
for n in range(3, len(filas_ayuda) + 1):
    ayuda[f"A{n}"].font = Font(bold=True)
    ayuda[f"B{n}"].alignment = Alignment(wrap_text=True, vertical="top")
for hoja_ in (hoja, ayuda):
    hoja_.sheet_properties.tabColor = VINO

SALIDA.parent.mkdir(parents=True, exist_ok=True)
libro.save(SALIDA)
print("Plantilla escrita en", SALIDA)
