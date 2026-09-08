# IPM — Especificaciones de wireframes
## Tareas T09 · T12 · T13 · T14
> Basado en el relevamiento del archivo Figma KYRA — Wireframes (0x75mAFodDwQfGMmR8ImDK)

---

## DESIGN TOKENS

### Tipografía
Todas las pantallas usan exclusivamente **Manrope** e **Inter**.

| Rol | Font | Weight | Size | Color |
|---|---|---|---|---|
| Título de página | Manrope | Bold | 40px | #000000 |
| Subtítulo de sección | Manrope | Bold | 28px | #000000 |
| Título de card/sección | Inter | SemiBold | 16px | #000000 |
| Tab activo | Manrope | SemiBold | 15px | #000000 |
| Tab inactivo | Manrope | Medium | 15px | #727272 |
| Nav activo | Manrope | SemiBold | 14px | #000000 |
| Nav inactivo | Manrope | Medium | 14px | #727272 |
| Header de tabla | Manrope | SemiBold | 16px | #727272 (uppercase) |
| Cuerpo de tabla | Inter | Regular | 14px | #000000 |
| Label de campo | Inter | Medium | 13px | #727272 |
| Valor de campo | Inter | Regular | 13px | #000000 |
| Texto secundario / subtítulo | Inter | Regular | 13px | #727272 |
| Badge texto | Inter | Medium | 11px | ver tabla de badges |
| Botón primario | Inter | Medium | 13px | #FFFFFF |
| Footer links | Inter | Regular | 12px | #727272 |
| Breadcrumb | Inter | Medium | 13px | #727272 |

### Colores base
```
Blanco:          #FFFFFF
Negro:           #000000
Sidebar bg:      #F8F8F8
Borde/divider:   #E0E0E0
Texto gris:      #727272
Row alt bg:      #F9F9F9
Card bg:         #F8F8F8
```

### Badges de estado (pastilla redondeada, corner-radius 4px)
```
PENDIENTE    bg #000000  text #FFFFFF  (negro sólido)
APROBADA     bg #000000  text #FFFFFF  (negro sólido)
EMITIDA      bg #888888  text #FFFFFF  (gris medio)
ENVIADA      bg #888888  text #FFFFFF
ERROR        bg #CC0000  text #FFFFFF  (rojo)
ACTIVA       bg #000000  text #FFFFFF
PAUSADA      bg #888888  text #FFFFFF
FINALIZADO   bg #E0E0E0  text #727272  (gris claro, texto oscuro)

— Nuevos badges para ARCA —
VIGENTE      bg #E8F5EC  text #1A7A3A  border 1px #A8D5B5
POR VENCER   bg #FFF3CC  text #7A5A00  border 1px #E8D080
VENCIDO      bg #FFE8E8  text #B00000  border 1px #F0AAAA
SIN CERT.    bg #EFEFEF  text #555555  border 1px #CCCCCC
NO APLICA    bg #EFEFEF  text #727272  border 1px #CCCCCC

— Para pago —
PAGO PARCIAL bg #FFF3CC  text #7A5A00  border 1px #E8D080
PAGADA       bg #E8F5EC  text #1A7A3A  border 1px #A8D5B5
VENCIDA SIN  bg #FFE8E8  text #B00000  border 1px #F0AAAA
PAGO
```

### Layout global (1440px)
```
Frame total:         1440 × variable alto
Sidebar:             x=0  y=0  w=191  h=100%  bg=#F8F8F8  border-right 1px #E0E0E0
Content area:        x=191  y=0  w=1249
Content padding-x:   80px desde el borde del content area
Título de página:    x=80 (content)  y=43
Tabs de sección:     x=80 (content)  y=108
Línea divisora tabs: y=138  h=1px  w=1249  color #E0E0E0
Footer separator:    1px #E0E0E0 antes del footer
Footer y:            últimos ~80px del frame
```

### Sidebar (estructura fija, igual en todas las pantallas)
```
Logo "'Kyra"         Manrope Bold 22px  x=24  y=28  color #000
Nav items:           x=36  gap vertical 40px  primer item y=108
  Indicador activo:  rect 3×16px  x=0  y=nav_item_y+1  color #000
Configuración:       x=36  y=frame_h - 70  Manrope Medium 13px  #727272
```

### Botón primario (NUEVO +)
```
bg #000000  text #FFFFFF  padding 12px 20px  corner-radius 6px
font Inter Medium 13px  uppercase
```

### Botón secundario (Renovar / Cargar)
```
bg #F0F0F0  border 1px #E0E0E0  text #000000  padding 10px 16px  corner-radius 6px
font Inter Medium 13px
```

### Campo dropdown (filtros)
```
w=190  h=44  border 1px #E0E0E0  corner-radius 6px  bg #FFFFFF
Label flotante: Inter Medium 11px #727272  y=6 desde top del campo
Valor: Inter Regular 14px #000000  y=22
Chevron ∨: #727272  right: 14px
```

### Card contenedor
```
bg #FFFFFF  border 1px #E0E0E0  corner-radius 8px  padding 20px
```

---

## T09 — GESTIÓN CERTIFICADO ARCA
**Nueva pantalla: perfil de entidad emisora**
Se accede haciendo clic en una fila de la tabla Administración > Entidades.
Produce 5 variantes de la sección ARCA + 1 modal de bloqueo en facturación.

---

### T09_01 · Entidad detalle — Certificado VIGENTE
**Frame:** `T09_01 — Kyra SRL — Cert. VIGENTE`  **1440 × 1480px**

#### Sidebar
Igual al global. Nav activo: **Administración**.

#### Header (content area)
```
Título "Administración"          Manrope Bold 40px  x=80  y=43
```

**Tabs de sección** (y=108):
```
Clientes    Manrope Medium 15px  #727272
Proveedores Manrope Medium 15px  #727272
Entidades   Manrope SemiBold 15px  #000000  ← activo
  └─ underline: rect h=2px  mismo ancho que el texto  y=130  color #000000
Servicios   Manrope Medium 15px  #727272
(gap entre tabs: 36px)
```
Línea horizontal separadora: y=138, w=1249, h=1px, #E0E0E0.

#### Breadcrumb + encabezado de entidad (y=164)
```
"← Entidades"    Inter Medium 13px  #727272  x=80  y=164  (clickeable → vuelve a la tabla)

"Kyra SRL"       Manrope Bold 28px  #000000  x=80  y=193

Badge ACTIVA     bg #000000  text #FFFFFF  x= (80 + ancho "Kyra SRL" + 16)  y=200  
                 w=72  h=26  corner-radius 4px  "ACTIVA" Inter Medium 11px

"Entidad emisora · Responsable Inscripta · CUIT 30-71234567-8"
                 Inter Regular 13px  #727272  x=80  y=231

Línea divisora   h=1px  x=80  y=260  w=1089  #E0E0E0
```

#### Cuerpo: dos columnas en y=280
Layout: dos cards side-by-side con gap 40px, ambas a x=80.

**Card izquierda — "Datos de la entidad"** (w=520 h=auto min 170px)
```
bg #F8F8F8  border 1px #E0E0E0  corner-radius 8px  padding 20px

Título sección: "Datos de la entidad"  Inter SemiBold 13px  #727272  y=18

Filas de dato (y=45, gap 22px entre filas):
  Label (w=130):  Inter Medium 12px  #727272
  Valor:          Inter Regular 12px  #000000

  Tipo:                   "SRL (Sociedad de Responsabilidad Limitada)"
  Cuenta bancaria:        "Santander Río — CBU 072 0001 0087 ..."
  Comprobante default:    "Factura A"
  Identificación fiscal:  "CUIT 30-71234567-8"
  Entidades Mercury:      (no aplica)
```

**Card derecha — "Certificado ARCA"** (x= 80+520+40 = 640, w=520 h=240px)
```
bg #FFFFFF  border 1px #E0E0E0  corner-radius 8px  padding 20px

Título: "Certificado ARCA"   Inter SemiBold 16px  #000000  y=18
Subtítulo: "Necesario para la emisión automática de comprobantes A y B"
           Inter Regular 12px  #727272  y=42

Divider: h=1px  y=64  w=480  #E0E0E0

Label "Estado del certificado"   Inter Medium 13px  #727272  y=82

━━━━ ESTADO: VIGENTE ━━━━
Badge VIGENTE:   bg #E8F5EC  text #1A7A3A  border 1px #A8D5B5
                 "● VIGENTE"  Inter Medium 11px
                 w=88  h=26  corner-radius 4px  x=20  y=104

Label "Vence el:"        Inter Medium 13px  #727272  x=20  y=145
Valor "15 de diciembre de 2026"  Inter Regular 13px  #000000  x=108  y=145

Botón "↑  Renovar certificado"   (botón secundario)
  w=190  h=36  x=20  y=174
  bg #F0F0F0  border 1px #E0E0E0  corner-radius 6px
  Inter Medium 13px  #000000
```

#### Sección inferior: historial de certificados (y=550)
```
Título "Historial de certificados"  Inter SemiBold 16px  #000000  x=80  y=550

Tabla simple (w=1089, empieza x=80 y=580):
  Headers: FECHA CARGA | VENCIMIENTO | CARGADO POR | ESTADO
  Manrope SemiBold 14px  #727272  uppercase  h=40  bg #F8F8F8

  Filas (h=48 cada una, alternando bg #FFFFFF / #F9F9F9):
    Inter Regular 14px  #000000

  Fila ejemplo 1: 15/12/2024 | 15/12/2026 | Mai Brandao | Badge VIGENTE
  Fila ejemplo 2: 10/12/2022 | 10/12/2024 | Mai Brandao | Badge gris "EXPIRADO" bg#EFEFEF text#555555
```

#### Footer (y=1400)
```
Línea 1px #E0E0E0 en y=1400
Logo "'Kyra"  Manrope Medium 18px  x=80  y=1420
Links: "Administración | Ingresos | Egresos | Emails"  Inter Regular 12px  #727272  y=1450
Copyright: "© 2026 Todos los derechos reservados."  Inter Regular 12px  #727272  y=1474
```

---

### T09_02 · Entidad detalle — Certificado POR VENCER
**Frame:** `T09_02 — Kyra SRL — Cert. POR VENCER`  **1440 × 1480px**

Idéntica a T09_01 **excepto** el card "Certificado ARCA":

```
━━━━ ESTADO: POR VENCER ━━━━
Badge POR VENCER:  bg #FFF3CC  text #7A5A00  border 1px #E8D080
                   "⚠  POR VENCER"  Inter Medium 11px
                   w=114  h=26  corner-radius 4px  x=20  y=104

Alerta amarilla (justo debajo del badge, y=138):
  rect w=480 h=40 bg #FFF9E6 border 1px #E8D080 corner-radius 6px  x=20
  "Vence en 23 días. Renovar antes del 15 de agosto de 2026."
  Inter Medium 12px  #7A5A00  padding-left 12px  centrado vertical

Label "Vence el:"  Inter Medium 13px  #727272  x=20  y=190
Valor "15 de agosto de 2026"  Inter Regular 13px  #B00000  x=108  y=190
  (valor en rojo para enfatizar urgencia)

Botón "↑  Renovar certificado"  (mismo estilo) x=20  y=218
  → Este botón debe estar en foco / más prominente:
    bg #000000  text #FFFFFF  corner-radius 6px  (botón primario en lugar de secundario)
```

Card ligeramente más alta: h=260px para acomodar la alerta.

**Alerta adicional en Dashboard** (nota para Dev):
Cuando alguna entidad tiene cert por vencer, el Dashboard muestra una alerta en la parte superior del content area:
```
Banner alerta (w=1249 h=44 y=0):
  bg #FFF9E6  border-bottom 1px #E8D080
  "⚠  El certificado de Kyra SRL vence en 23 días. Renovar →"
  Inter Medium 13px  #7A5A00  x=80
  Link "Renovar →"  Inter SemiBold 13px  #7A5A00  underline
```

---

### T09_03 · Entidad detalle — Certificado VENCIDO
**Frame:** `T09_03 — Kyra SRL — Cert. VENCIDO`  **1440 × 1480px**

Card "Certificado ARCA" diferente:
```
━━━━ ESTADO: VENCIDO ━━━━
Badge VENCIDO:  bg #FFE8E8  text #B00000  border 1px #F0AAAA
                "✕  VENCIDO"  Inter Medium 11px
                w=88  h=26  corner-radius 4px  x=20  y=104

Alerta roja (y=138):
  rect w=480 h=40 bg #FFF2F2 border 1px #F0AAAA corner-radius 6px  x=20
  "Certificado vencido el 15 de agosto de 2026. La emisión automática está bloqueada."
  Inter Medium 12px  #B00000  padding-left 12px

Label "Venció el:"  Inter Medium 13px  #727272  x=20  y=190
Valor "15 de agosto de 2026"  Inter Regular 13px  #B00000  x=108  y=190

Botón "↑  Renovar certificado"  (primario negro)
  w=190  h=36  x=20  y=218
  bg #000000  text #FFFFFF  corner-radius 6px
```

---

### T09_04 · Entidad detalle — SIN CERTIFICADO
**Frame:** `T09_04 — Kyra SRL — Sin Certificado`  **1440 × 1480px**

Card "Certificado ARCA" con estado vacío:
```
━━━━ ESTADO: SIN CERTIFICADO ━━━━
Badge SIN CERT:  bg #EFEFEF  text #555555  border 1px #CCCCCC
                 "— SIN CERTIFICADO"  Inter Medium 11px
                 w=156  h=26  corner-radius 4px  x=20  y=104

Texto descriptivo (y=144):
  "Esta entidad aún no tiene un certificado ARCA cargado."
  Inter Regular 13px  #727272  x=20

  "Sin el certificado, el sistema no puede emitir comprobantes A o B automáticamente."
  Inter Regular 13px  #727272  x=20  y=164  (multiline si es necesario)

Botón "↑  Cargar certificado"  (primario negro — acción principal)
  w=190  h=36  x=20  y=208
  bg #000000  text #FFFFFF  corner-radius 6px

Nota: La sección de historial de certificados queda vacía con estado empty-state:
  Texto "No se han cargado certificados anteriores."  Inter Regular 13px  #727272  centrado
```

---

### T09_05 · Entidad detalle — Mercury LLC (NO APLICA)
**Frame:** `T09_05 — Mercury LLC — No Aplica`  **1440 × 1480px**

Estructura idéntica al T09_01 **excepto**:
- Nombre: "Mercury LLC"
- Subtítulo: "Entidad emisora · Facturación propia (LLC) · EIN 12-3456789"
- Badge: **SIN CERT** → reemplazado por "NO APLICA"

Card "Certificado ARCA":
```
bg #F8F8F8  (card en tono diferente para señalar que es inactiva)
border 1px #E0E0E0  corner-radius 8px  padding 20px

Título: "Certificado ARCA"  Inter SemiBold 16px  #727272  (gris, no negro)

Divider: h=1px  y=44  #E0E0E0

Bloque "no aplica" (y=64):
  Ícono o rect neutral: rect 40×40 bg #EFEFEF corner-radius 6px  x=20  y=64
    Texto centrado "—"  Inter Medium 18px  #AAAAAA

  Título: "No aplica"  Inter SemiBold 14px  #555555  x=72  y=70
  Texto:  "Mercury LLC genera PDFs de factura propios."  Inter Regular 13px  #727272  x=72  y=90
          "No utiliza la API de ARCA para la emisión."   Inter Regular 13px  #727272  x=72  y=108

(sin botones de acción, sin historial de certificados en esta entidad)
```

---

### T09_06 · Modal — Bloqueo en facturación por certificado vencido/ausente
**Frame:** `T09_06 — Modal Bloqueo Certificado`  **1440 × 1480px**

Es la pantalla **FACTURACION-DEL-MES-1** (tab "Listas para aprobar") con un modal overlay.

**Overlay:**
```
Fondo: rect 1440×1480 bg rgba(0,0,0,0.5) — en Figma: fills SOLID #000000 opacity 50%
```

**Modal central:**
```
w=520  h=auto (~280px)
centrado en el frame: x= (1440-520)/2 = 460  y= (1480-280)/2 = 600
bg #FFFFFF  corner-radius 12px  shadow: x=0 y=4 blur=24 color #000 opacity 12%
padding 32px

Ícono de error (rect 48×48, corner-radius 8px, bg #FFE8E8):
  Texto "✕"  Inter Bold 24px  #B00000  centrado  x=236  y=32

Título: "No se puede emitir"
  Manrope Bold 22px  #000000  centrado  y=100

Descripción (text multiline, max-width=456px, centrado):
  "El certificado de Kyra SRL está vencido desde el 15 de agosto de 2026."
  Inter Regular 14px  #000000  y=134

  "La emisión automática de comprobantes A y B está bloqueada hasta renovarlo."
  Inter Regular 14px  #727272  y=158

Divider h=1px #E0E0E0 y=190

Dos botones en fila (y=210 gap=12px):
  Botón "Ir a Certificados →"  primario negro  w=220  h=40  corner-radius 6px
  Botón "Cancelar"             secundario       w=200  h=40  corner-radius 6px
    centrados horizontalmente en el modal
```

**Nota para Dev:** Este modal se dispara cuando Mai intenta aprobar una factura de una entidad cuyo certificado está VENCIDO o SIN CERTIFICADO. El botón "Ir a Certificados →" navega a Administración > Entidades > detalle de la entidad bloqueada, con scroll directo a la sección de ARCA.

---

## T12 — ERRORES ARCA + REINTENTO

Tres entregables: (1) fila en error en tabla, (2) modal de detalle del error, (3) notificación proactiva.

---

### T12_01 · Ingresos — Fila en estado ERROR
**Frame:** `T12_01 — Ingresos ERROR Fila`  **1440 × 1363px**  (mismo alto que INGRESOS existente)

Tomar como base la pantalla **INGRESOS - SIN SCROLLBAR - v1** y modificar la fila 6 para mostrar el estado de error.

**Diferencias de la fila en ERROR:**
```
Fila normal:    bg #FFFFFF  borde inferior 1px #E0E0E0
Fila ERROR:     bg #FFF8F8  (tinte rojo muy sutil)
                border-left 3px #CC0000  (franja izquierda roja, reemplaza el padding de 8px)
                borde inferior 1px #F0AAAA

Badge estado:   "ERROR"  bg #CC0000  text #FFFFFF  Inter Medium 11px
                w=68  h=26  corner-radius 4px

Texto NRO:      Inter Regular 14px  #CC0000  (número en rojo para visibilidad)

Ícono de alerta antes del NRO:  
  rect 18×18  corner-radius 2px  bg #CC0000
  Texto "!"  Inter Bold 10px  #FFFFFF  centrado
  x= (checkbox_x + 20)  —  se ubica justo antes del número de factura
```

**Ejemplo de fila completa (columnas: checkbox | NRO | ESTADO | CLIENTE | SERVICIO | IMPORTE | TOTAL | TIPO | FECHA | ⋮):**
```
☐ | [!] 138 | [ERROR] | Maped | Social Media | $50,000.00 | $62,400.00 | A | 27/05/2026 | ⋮
```

El menú **⋮** de esta fila tiene un punto rojo en la esquina superior derecha (indicador visual de que hay algo accionable):
```
Círculo rojo 6×6px  bg #CC0000  posición: corner superior derecho del ícono ⋮
```

---

### T12_02 · Modal — Detalle del error
**Frame:** `T12_02 — Modal Detalle Error Emisión`  **1440 × 1363px**

Mostrar INGRESOS como fondo + modal overlay.

**Overlay:**
```
rect 1440×1363 bg #000000 opacity 45%
```

**Modal (panel lateral derecho):**
```
w=480  h=100%  (panel deslizable desde la derecha)
x=960  y=0
bg #FFFFFF
shadow: x=-4 y=0 blur=32 color #000 opacity 15%
padding 32px

HEADER DEL PANEL:
  "Detalle del error"  Manrope Bold 20px  #000000  y=32
  Botón cerrar "✕"    Inter Regular 18px  #727272  x=416  y=30

  Divider h=1px #E0E0E0 y=70

SECCIÓN: IDENTIFICACIÓN (y=90)
  Factura:        Inter Medium 13px #727272  + valor Inter Regular 14px #000000
                  "A 0001-00000138"
  Cliente:        valor "Maped"
  Entidad:        valor "Kyra SRL"
  Fecha intento:  valor "27/05/2026 — 11:32 hs"
  (cada fila: label x=0, valor x=140, gap 22px entre filas)

  Divider h=1px #E0E0E0 y=190

SECCIÓN: ERROR (y=210)
  Rect badge error: w=416 h=36 bg #FFF2F2 border 1px #F0AAAA corner-radius 6px
    "✕  Error de validación fiscal"  Inter SemiBold 14px  #B00000

  Texto descriptivo (y=262):
    "ARCA rechazó el comprobante porque los datos del receptor"
    "no coinciden con los registros fiscales vigentes."
    Inter Regular 14px  #000000  max-width 416px  line-height 22px

  Texto técnico (y=320):
    "(Código ARCA: ERR_RECEPTOR_DATA_MISMATCH)"
    Inter Regular 12px  #AAAAAA  (placeholder — Dev mapea los códigos reales)

  Divider h=1px #E0E0E0 y=355

SECCIÓN: ACCIONES (y=375)
  Titulo "¿Qué hacer?"  Inter SemiBold 14px  #000000  y=375

  Paso 1 (y=400):
    Bullet "1"  rect 20×20 bg #000 corner-radius 10px  text #FFF Inter Bold 11px
    "Verificar los datos fiscales del cliente Maped"
    Inter Regular 13px  #000000  x=32
    Link "→ Ir al perfil del cliente"  Inter Medium 13px  #000000  underline  y=418

  Paso 2 (y=445):
    Bullet "2"  mismo estilo
    "Corregir y reintentar la emisión"

  Divider h=1px #E0E0E0 y=482

BOTONES (y=500 gap=12px):
  "↺  Reintentar emisión"   primario negro  w=416  h=44  corner-radius 6px
    Inter Medium 13px  #FFFFFF
  (si el error es tipo certificado, agregar primero:)
  "Renovar certificado →"   primario negro  w=416  h=44  corner-radius 6px

  "Cancelar"   secundario  w=416  h=44  corner-radius 6px  y=556
    Inter Medium 13px  #000000
```

**Tipos de error y su descripción legible (para Dev):**

| Código placeholder | Label visible | Descripción |
|---|---|---|
| ERR_CERT_EXPIRED | Certificado vencido | El certificado ARCA de [entidad] está vencido. Renovarlo para reintentar. |
| ERR_CERT_MISSING | Sin certificado | No hay certificado ARCA cargado para [entidad]. |
| ERR_RECEPTOR_DATA | Error de validación fiscal | Los datos del receptor no coinciden con registros fiscales. Verificar CUIT/datos. |
| ERR_TIMEOUT | Tiempo de espera agotado | ARCA no respondió en el tiempo esperado. Reintentar más tarde. |
| ERR_DUPLICATE | Comprobante duplicado | ARCA detectó un comprobante duplicado. Verificar si ya fue emitido. |

---

### T12_03 · Notificación proactiva
**Frame:** `T12_03 — Notificación Error en Nav y Dashboard`  **1440 × 1577px**  (alto del Dashboard)

Muestra el **Dashboard** existente con las notificaciones de error superpuestas.

**Badge en nav (sidebar):**
```
En el item "Ingresos" del sidebar:
  Círculo rojo 18×18px  corner-radius 9px  bg #CC0000
  texto "3"  Inter Bold 11px  #FFFFFF
  posición: right=12px  top= (nav_item_y + 2)  (justo a la derecha del texto del nav)
```

**Banner en el Dashboard** (debajo del título, antes de los KPIs):
```
rect w=1249 h=52 x=0 y=98 (dentro del content area, sobre los KPIs)
bg #FFF2F2  border-bottom 1px #F0AAAA

Ícono "✕" rect 24×24 corner-radius 4px bg #CC0000 x=80 centrado vertical
  texto "✕" Inter Bold 13px #FFFFFF

Texto (x=116):
  "3 facturas tienen errores de emisión y requieren atención."
  Inter Medium 13px  #B00000

Link (a la derecha):
  "Ver facturas con error →"  Inter SemiBold 13px  #B00000  underline
  x=900  (alineado derecha del content, aprox x=1089)
```

**Nota de decisión de diseño:** Se eligió la combinación badge en nav + banner en Dashboard porque:
1. El badge en nav es visible desde cualquier sección del sistema.
2. El banner en Dashboard lo interpela activamente cuando abre la app.
3. No interrumpe el flujo con un modal no solicitado.
No se implementa email automático a Mai en esta versión.

---

## T13 — SERVICIOS (MODELO A: CATÁLOGO + INSTANCIAS)

**Decisión de arquitectura (justificada):** Se elige **Modelo A** — catálogo global de templates + instancias por cliente.

Razones:
- Kyra tiene múltiples clientes con el mismo servicio (ej: Social Media) pero tarifas distintas → el catálogo evita ingresar "Social Media" N veces.
- Mai es la única usuaria y cargar un template base es más rápido que escribir desde cero.
- El Dashboard puede listar todos los servicios activos usando el catálogo global.
- Las instancias por cliente almacenan: tarifa propia, moneda, periodicidad, estado, historial.

---

### T13_01 · Administración > Servicios (catálogo global rediseñado)
**Frame:** `T13_01 — Admin Servicios Catálogo`  **1440 × 1363px**

Tomar como base **ADMINISTRACIÓN - Servicios** y rediseñar la tabla.

**Header idéntico a pantallas de Administración existentes.**
Tab activo: **Servicios**.

**Tabla rediseñada** (w=1089, x=80, y=180):

Headers:
```
NOMBRE | TIPO | PRECIO BASE | MONEDA | CLIENTES ACTIVOS | ESTADO | (vacío para acciones)
Manrope SemiBold 14px  #727272  uppercase  h=44  bg #F8F8F8
```

Filas (h=52 alternando #FFFFFF / #F9F9F9):
```
Nombre:          Inter SemiBold 14px  #000000  (nombre del template)
Tipo:            Inter Regular 14px   #727272  "Fijo" o "Por hora"
Precio base:     Inter Regular 14px   #000000  "$50,000" o "—" (si es por hora)
Moneda:          Inter Medium 13px    #000000  "ARS" o "USD"  (badge pequeño gris)
Clientes activos:Inter Regular 14px   #000000  número (ej: "4")
Estado:          Badge: ACTIVO (negro) o INACTIVO (gris claro texto gris)
⋮                ícono menú de acciones
```

Ejemplo de datos en la tabla:
```
Social Media     | Fijo     | $85,000  | ARS | 6 | [ACTIVO]
Diseño UX/UI     | Fijo     | $120,000 | ARS | 3 | [ACTIVO]
Dev a medida     | Por hora | —        | ARS | 2 | [ACTIVO]
Reporting        | Fijo     | $4,500   | USD | 1 | [ACTIVO]
```

**Nota** en la parte inferior de la tabla (y= tabla_bottom + 16):
```
Texto: "Los precios y condiciones por cliente se configuran en el perfil de cada cliente."
Inter Regular 12px  #727272  italic  x=80
```

---

### T13_02 · Modal — Alta de servicio (template de catálogo)
**Frame:** `T13_02 — Modal Alta Servicio`  **1440 × 1363px**

Fondo: pantalla T13_01 + overlay negro 45%.

**Modal:**
```
w=560  h=auto (~640px)
centrado: x=(1440-560)/2=440  y=80
bg #FFFFFF  corner-radius 12px  padding 32px 40px
shadow: y=4 blur=24 opacity 12%

Header:
  "Nuevo servicio"   Manrope Bold 22px  #000000  y=32
  "✕" cierre          x=488  y=32  Inter Regular 18px  #727272

  Divider h=1px #E0E0E0 y=68

CAMPOS DEL FORM (y=84, gap 24px entre campos):

Campo "Nombre del servicio" (required)
  Label: Inter Medium 13px  #727272  y=84
  Input: h=44  w=480  border 1px #E0E0E0  corner-radius 6px  bg #FFF
         placeholder "ej: Social Media"  Inter Regular 14px  #AAAAAA

Campo "Descripción" (optional)
  Label: Inter Medium 13px  #727272  y=152
  Textarea: h=72  w=480  border 1px #E0E0E0  corner-radius 6px
            placeholder "Descripción breve del servicio (opcional)"

Campo "Tipo" (required)
  Label: Inter Medium 13px  #727272  y=248
  Dos radio buttons side-by-side (w=232 each, gap=16):
    ○ Precio fijo      rect w=232 h=44 border 1px  corner-radius 6px
    ○ Por hora         (mismas dimensiones)
    El seleccionado: border 2px #000000  bg #F8F8F8

Campo "Precio base" — visible solo si Tipo = Fijo
  Label: Inter Medium 13px  #727272  y=316
  Input: h=44  w=232  con prefijo "$"  placeholder "0.00"

Campo "Moneda" — visible siempre
  Label: Inter Medium 13px  #727272  y=316 (o y=388 si Tipo=Por hora)
  Dropdown: h=44  w=232  opciones: ARS / USD
  (mismo estilo que filtros: border 1px #E0E0E0 corner-radius 6px)

Campo "Estado inicial"
  Label: Inter Medium 13px  #727272
  Toggle switch: ON=Activo (negro) / OFF=Inactivo (gris)

  Divider h=1px #E0E0E0

Footer del modal:
  Nota: "Los precios y condiciones específicas se configuran en el perfil de cada cliente."
        Inter Regular 12px  #727272  italic

  Botones (en fila, gap=12):
    "Guardar"    primario negro  w=232  h=44  corner-radius 6px
    "Cancelar"   secundario     w=232  h=44  corner-radius 6px
```

---

### T13_03 · Perfil de cliente — Sección Servicios
**Frame:** `T13_03 — Perfil Cliente Sección Servicios`  **1440 × 1600px**

Esta es la pantalla de detalle de un cliente (similar en estructura a T09_01 pero para clientes).

**Estructura idéntica al T09_01** hasta el breadcrumb. Cambiar:
- Tab activo en tabs de Administración: **Clientes**
- Nombre: "Maped"
- Subtítulo: "Cliente activo · facturación mensual · Kyra SRL"

**Tabs del perfil del cliente** (debajo del encabezado, y=300):
```
Datos generales | Servicios | Historial de facturas | Documentos

Tab "Servicios" activo:
  Manrope SemiBold 15px  #000000  subrayado h=2px  y=322
```
Divider h=1px #E0E0E0 y=328.

**Sub-sección Servicios** (y=348):

Encabezado de sección:
```
"Servicios de Maped"   Inter SemiBold 16px  #000000  x=80  y=360
Botón "+ Agregar servicio"  primario negro  h=36  x=913  y=355  (alineado derecha)
```

**Tabla de servicios del cliente** (x=80 y=400 w=1089):

Headers:
```
SERVICIO | TIPO | TARIFA | MONEDA | PERIODICIDAD | ESTADO | HISTORIAL | (acciones)
Manrope SemiBold 14px  #727272  uppercase  h=44  bg #F8F8F8
```

Filas (h=52):
```
Servicio:      Inter SemiBold 14px  #000000  (nombre del template de catálogo)
Tipo:          Inter Regular 14px   #727272  "Fijo" o "Por hora"
Tarifa:        Inter Regular 14px   #000000  "$85,000.00" o "$3,500/h"
Moneda:        Inter Medium 12px    badge gris pequeño  "ARS"
Periodicidad:  Inter Regular 14px   #727272  "Mensual" / "Trimestral"
Estado:        Badge ACTIVO / PAUSADO / FINALIZADO
Historial:     link "Ver →"  Inter Medium 13px  #000000  underline
⋮              menú acciones: Editar | Pausar | Finalizar
```

Ejemplo de datos:
```
Social Media  | Fijo     | $85,000.00    | ARS | Mensual    | [ACTIVO]   | Ver →  | ⋮
Diseño UX/UI  | Por hora | $4,500.00/h   | ARS | Mensual    | [ACTIVO]   | Ver →  | ⋮
Reporting     | Fijo     | $4,500.00     | USD | Trimestral | [PAUSADO]  | Ver →  | ⋮
```

**Modal "+ Agregar servicio" al cliente** (al hacer clic en el botón):
```
w=520  h=auto
Selección del template del catálogo (dropdown con los servicios existentes del catálogo)
+ campos de instancia:
  - Tarifa propia (para este cliente)  →  number input
  - Moneda                             →  dropdown ARS / USD
  - Periodicidad de facturación        →  dropdown: Mensual / Bimestral / Trimestral
  - Estado inicial                     →  toggle Activo / Pausado
```

---

### T13_04 · Panel lateral — Historial de precios de un servicio
**Frame:** `T13_04 — Panel Historial Precios`  **1440 × 1600px**

Fondo: T13_03 + overlay negro 45%.

**Panel lateral derecho:**
```
w=480  h=100%  x=960  y=0
bg #FFFFFF  shadow izquierdo
padding 32px

Header:
  "Historial de precios"  Manrope Bold 20px  #000000  y=32
  Subtítulo: "Social Media · Maped"  Inter Regular 13px  #727272  y=58
  "✕"  x=416  y=30

  Divider h=1px y=80

Lista de cambios (y=100, cada ítem h=72 con divider inferior):

  Ítem (estructura de cada cambio de precio):
    Fecha:        Inter SemiBold 13px  #000000  x=0  y=12
    Monto anterior → Monto nuevo:
      Inter Regular 14px  #727272  "$70,000"  →  Inter SemiBold 14px  #000000  "$85,000"
      flecha "→" entre valores
    Motivo:       Inter Regular 12px  #727272  italic  y=50
                  (ej: "Actualización IPC — julio 2026")
    Divider h=1px #E0E0E0 al pie de cada ítem

  Ejemplo de datos (cronológico, más reciente primero):
    01/07/2026   $70,000 → $85,000   "Actualización IPC — julio 2026"
    01/04/2026   $60,000 → $70,000   "Actualización IPC — abril 2026"
    01/01/2026   $50,000 → $60,000   "Revisión anual — enero 2026"
    15/03/2025   —  → $50,000       "Alta del servicio"

Botón "Cerrar" secundario w=416 h=40 corner-radius 6px  y=580
```

---

## T14 — CONTROL DE PAGOS (MÓDULO COMPLETO)

**Decisión de integración:** Control de Pagos vive como **tab adicional en el módulo Ingresos** (junto a Pendientes | Historial), no como sección separada en el nav. Razón: el seguimiento de cobros es una extensión natural de la emisión de facturas; agruparlos evita fragmentar el nav principal que ya es completo.

---

### T14_01 · Ingresos — Tab "Control de Pagos" (vista principal)
**Frame:** `T14_01 — Control de Pagos Vista Principal`  **1440 × 1480px**

Parte de la pantalla de Ingresos existente. Las tabs cambian:
```
Tabs (y=226):  Pendientes  |  Historial  |  Control de Pagos   ← nueva tab
Tab "Control de Pagos" activo:
  Manrope SemiBold 15px  #000000  subrayado h=2px
```

**Filtros rápidos** (debajo de las tabs, y=258):
```
Dos botones tipo pill:
  [Por cobrar]  [Cobradas]
  Activo:   bg #000000  text #FFFFFF  corner-radius 20px  h=32  padding 0 16px
  Inactivo: bg #F0F0F0  text #727272  corner-radius 20px  h=32
```

**Tabla principal — "Por cobrar"** (x=80 y=308 w=1089):

Headers:
```
NRO | CLIENTE | PERÍODO | TOTAL FACTURADO | ESTADO PAGO | SALDO PENDIENTE | DÍAS DEMORA | (acciones)
Manrope SemiBold 14px  #727272  uppercase  h=44  bg #F8F8F8
```

Filas (h=52 alternando #FFFFFF / #F9F9F9):
```
NRO:              Inter Regular 14px  #000000  underline (link al detalle de la factura)
Cliente:          Inter Regular 14px  #000000
Período:          Inter Regular 14px  #727272  "mayo 2026"
Total facturado:  Inter Regular 14px  #000000  "$62,400.00"
Estado pago:      Badge: PENDIENTE / PAGO PARCIAL / PAGADA / VENCIDA SIN PAGO
Saldo pendiente:  Inter SemiBold 14px  #000000 (o #B00000 si vencida)
Días demora:      Inter SemiBold 14px  color según estado:
                    0-7 días:   #000000
                    8-15 días:  #7A5A00
                    +15 días:   #B00000
⋮                 menú: "Registrar pago" | "Ver factura" | "Copiar datos"
```

Ordenada por defecto: días de demora DESC (más atrasadas primero).

Ejemplo de datos:
```
138 | Maped     | mayo 2026  | $62,400.00 | [VENCIDA SIN PAGO] | $62,400.00 | 28 días  | ⋮
139 | ALAIAB    | mayo 2026  | $45,200.00 | [PAGO PARCIAL]     | $20,200.00 | 15 días  | ⋮
140 | Suprasafe | mayo 2026  | $85,000.00 | [PENDIENTE]        | $85,000.00 |  8 días  | ⋮
141 | Kretz     | mayo 2026  | $32,000.00 | [PENDIENTE]        | $32,000.00 |  3 días  | ⋮
142 | Fate      | mayo 2026  | $28,500.00 | [PAGADA]           | —          |  —       | ⋮
```

**Fila VENCIDA SIN PAGO** (visual diferenciado):
```
bg #FFF8F8  (tinte rojo muy sutil)
badge "VENCIDA SIN PAGO"  bg #FFE8E8  text #B00000  border 1px #F0AAAA
Días demora:  #B00000  Inter SemiBold 14px
Saldo pendiente:  #B00000  Inter SemiBold 14px
```

**Totales al pie de la tabla** (y= tabla_bottom + 12):
```
rect w=1089 h=44 bg #F8F8F8 border-top 1px #E0E0E0
"Total por cobrar:"  Inter SemiBold 14px  #000000  x=80
"$200,200.00"        Inter Bold 16px  #000000  x=800
```

---

### T14_02 · Modal — Registro de pago
**Frame:** `T14_02 — Modal Registro de Pago`  **1440 × 1480px**

Fondo: T14_01 + overlay negro 45%.

**Modal:**
```
w=560  h=auto (~520px)
centrado: x=440  y=100
bg #FFFFFF  corner-radius 12px  padding 32px 40px
shadow: y=4 blur=24 opacity 12%

Header:
  "Registrar pago recibido"  Manrope Bold 20px  #000000  y=32
  Subtítulo: "Factura #138 · Maped · Total $62,400.00"
             Inter Regular 13px  #727272  y=58
  "✕"  x=488  y=32

  Divider h=1px y=78

CAMPOS (y=94 gap 20px):

"Fecha de pago recibido" (required)
  Label: Inter Medium 13px  #727272
  Date input: h=44  w=480  border 1px #E0E0E0  corner-radius 6px
              placeholder "dd/mm/aaaa"

"Monto recibido" (required)
  Label: Inter Medium 13px  #727272
  Nota bajo el label: "Puede ser menor al total (pago parcial)"
    Inter Regular 11px  #727272  italic
  Input numérico: h=44  w=480  prefijo "$"  placeholder "0.00"
  Cálculo live debajo del input:
    "Saldo pendiente tras este pago: $XX,XXX.XX"
    Inter Medium 12px  #000000  (se actualiza en tiempo real)

"Medio de pago" (required)
  Label: Inter Medium 13px  #727272
  Dropdown h=44 w=480  opciones:
    Transferencia bancaria | Efectivo | Cheque | Otro

"Banco de destino"
  Label: Inter Medium 13px  #727272
  Input texto h=44 w=480 placeholder "Nombre del banco o cuenta"

"Retenciones aplicadas" (optional)
  Label: Inter Medium 13px  #727272
  Nota: "(IIBB, Ganancias, etc.)"  Inter Regular 11px  #727272
  Input numérico: h=44  w=480  prefijo "$"  placeholder "0.00 (opcional)"

"Notas internas" (optional)
  Label: Inter Medium 13px  #727272
  Textarea: h=64  w=480  placeholder "Observaciones del pago (opcional)"

  Divider h=1px

Botones:
  "Guardar pago"  primario negro  w=480  h=44  corner-radius 6px
  "Cancelar"      secundario       w=480  h=44  corner-radius 6px  mt=8
```

---

### T14_03 · Ingresos — Fila con PAGO PARCIAL (estado expandido)
**Frame:** `T14_03 — Control de Pagos Pago Parcial`  **1440 × 1480px**

Variante de T14_01 mostrando cómo se ve la fila 139 (ALAIAB) en detalle expandido.

**Fila expandida** (al hacer clic en la fila con pago parcial):
```
La fila se expande con una sub-sección (h=120 adicionales) bg #FFFDF5 border 1px #E8D080 corner-radius 0 0 4px 4px:

  Título: "Historial de pagos parciales recibidos"  Inter SemiBold 13px  #000000  x=24 y=8

  Sub-tabla (sin headers):
    Fecha pago | Monto recibido | Medio | Notas
    Inter Regular 13px  #000000 / #727272

  Ejemplo:
    15/05/2026  |  $25,000.00  |  Transferencia  |  "Pago parcial acordado con cliente"
    28/05/2026  |  0  (pendiente del segundo pago)  |  —  |  —

  "Saldo pendiente: $20,200.00"  Inter SemiBold 14px  #7A5A00  x=24  y=92
  Botón "+ Registrar siguiente pago"  secundario negro pequeño  h=28  y=90  right=24
```

---

### T14_04 · Dashboard — Widget "Clientes pendientes de pago" actualizado
**Frame:** `T14_04 — Dashboard Widget Pagos`  **1440 × 1577px**

Mostrar el **Dashboard existente** con el widget "Clientes Pendientes de Pago" actualizado con datos reales.

**Widget (columna izquierda inferior, mismas dimensiones que el existente):**
```
Título "Clientes pendientes de pago"  Inter SemiBold 16px  #000000
Subtítulo "Actualizado hace 2 minutos"  Inter Regular 11px  #727272

Lista de filas (cada fila h=52, divider inferior 1px #E0E0E0):
  Cliente:         Inter SemiBold 14px  #000000
  Saldo pendiente: Inter Regular 14px  #B00000  (rojo si vencida, #000000 si pendiente)
  Días de demora:  Inter Medium 12px  badge pequeño

  → 3 estados visuales:
    Normal (0-7 días):   sin indicador especial
    Atención (8-15d):    punto amarillo ●  #E8D080 antes del nombre
    Urgente (+15 días):  punto rojo ●      #CC0000 antes del nombre

Ejemplo de filas:
  ● Maped         $62,400.00   28 días
  ● ALAIAB        $20,200.00   15 días
    Suprasafe      $85,000.00    8 días
    Kretz          $32,000.00    3 días

Botón "Ir a la sección →"  Inter Medium 13px  #000000  underline  y=fondo del widget
  (navega a Ingresos > Control de Pagos > tab "Por cobrar")
```

**Alerta de demora en Dashboard** (arriba de los KPIs, si hay facturas con más de 15 días sin pago):
```
Banner (w=1249 h=44 y=98 dentro del content area):
  bg #FFF2F2  border-bottom 1px #F0AAAA
  "2 facturas llevan más de 15 días sin cobrar. Revisar →"
  Inter Medium 13px  #B00000  x=80
  Link "Revisar →"  Inter SemiBold 13px  #B00000  underline
```

---

## ÍNDICE DE FRAMES A CREAR EN FIGMA

| Frame ID | Tarea | Nombre | Dimensiones |
|---|---|---|---|
| T09_01 | T09 | Kyra SRL — Cert. VIGENTE | 1440 × 1480 |
| T09_02 | T09 | Kyra SRL — Cert. POR VENCER | 1440 × 1480 |
| T09_03 | T09 | Kyra SRL — Cert. VENCIDO | 1440 × 1480 |
| T09_04 | T09 | Kyra SRL — Sin certificado | 1440 × 1480 |
| T09_05 | T09 | Mercury LLC — No aplica | 1440 × 1480 |
| T09_06 | T09 | Modal bloqueo facturación | 1440 × 1480 |
| T12_01 | T12 | Ingresos ERROR fila | 1440 × 1363 |
| T12_02 | T12 | Modal detalle del error | 1440 × 1363 |
| T12_03 | T12 | Notificación nav + dashboard | 1440 × 1577 |
| T13_01 | T13 | Admin Servicios catálogo | 1440 × 1363 |
| T13_02 | T13 | Modal alta servicio | 1440 × 1363 |
| T13_03 | T13 | Perfil cliente — Servicios | 1440 × 1600 |
| T13_04 | T13 | Panel historial precios | 1440 × 1600 |
| T14_01 | T14 | Control de Pagos vista | 1440 × 1480 |
| T14_02 | T14 | Modal registro de pago | 1440 × 1480 |
| T14_03 | T14 | Pago parcial expandido | 1440 × 1480 |
| T14_04 | T14 | Dashboard widget pagos | 1440 × 1577 |

**Total: 17 frames en la página "Nuevas Pantallas — T09 / T12 / T13 / T14"**

---

## NOTAS DE IMPLEMENTACIÓN

### Disposición en el canvas
Ubicar los frames en filas por tarea, con 80px de separación entre frames:
```
Fila 1 (T09): T09_01 — T09_02 — T09_03 — T09_04 — T09_05 — T09_06
Fila 2 (T12): T12_01 — T12_02 — T12_03
Fila 3 (T13): T13_01 — T13_02 — T13_03 — T13_04
Fila 4 (T14): T14_01 — T14_02 — T14_03 — T14_04
```

### Componentes reutilizables del archivo
Estos componentes ya existen en el frame COMPONENTES (page 1) y pueden importarse:
- `HEADER` (id: 14:251) — header superior de la app
- `ESTADO` (id: 11:32) — badges de estado grandes
- `ESTADO CHICO` (id: 168:1506) — badges de estado pequeños
- `contenedor 3 tabs` / `contenedor 4 tabs` — barras de tabs

### Sidebar reutilizable
El sidebar es idéntico en todas las pantallas. Crear como componente una vez y reutilizar como instancia. Variar solo el nav item activo (propiedades: activeItem="Dashboard"|"Administración"|"Ingresos"|"Egresos"|"Emails").

### Consistencia con pantallas existentes
Antes de crear cada frame, tomar screenshot de la pantalla base referenciada para verificar que el layout coincida exactamente en:
- Posición X del content (191px desde el borde izquierdo)
- Padding interno del content (80px)
- Altura y posición de las tabs de sección
- Estilo de la tabla (headers, altura de fila, alternancia de color)
