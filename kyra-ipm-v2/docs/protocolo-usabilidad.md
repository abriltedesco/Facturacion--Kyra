# Protocolo de Test de Usabilidad — Sistema IPM Kyra
**Versión:** 1.0  
**Fecha:** Julio 2026  
**Sistema:** Sistema de Facturación Mensual — We Are Kyra  
**Responsable de sesión:** [Nombre del moderador]

---

## 1. Objetivo

Validar que el prototipo del sistema IPM (módulos Administración, Ingresos, Egresos y Emails) es operable de forma autónoma por una usuaria sin asistencia, específicamente en el flujo crítico de aprobación mensual de facturas.

**No se evalúa el código ni el diseño visual.** Se evalúa si Mai puede completar su trabajo el 1ro de cada mes sin fricción.

---

## 2. Alcance del test

### Flujo crítico (obligatorio)
Mai recibe notificación → ingresa al sistema → revisa facturas → aprueba → verifica estado → sale.

### Flujos secundarios (si el tiempo lo permite)
- Agregar un cliente nuevo en Administración
- Consultar el historial de un egreso
- Verificar que el email de envío automático está configurado correctamente

---

## 3. Perfil de participantes

### Perfil objetivo
| Criterio | Descripción |
|----------|-------------|
| Rol | Directora o gerente de agencia de marketing o servicios |
| Experiencia con herramientas digitales | Media-alta (usa Google Workspace, Slack, herramientas de gestión) |
| Experiencia con sistemas de facturación | Básica a media (conoce el concepto, no necesariamente usa software dedicado) |
| Idioma | Español (Argentina o Latinoamérica) |
| Dispositivo | Desktop o laptop (no testar en mobile — el sistema es exclusivamente desktop) |

### Cantidad de sesiones
**Mínimo:** 3 sesiones para detectar patrones.  
**Óptimo:** 5 sesiones (la mayoría de los problemas críticos se identifican en las primeras 5 personas).  
**Máximo útil:** 8 sesiones antes del primer ciclo de correcciones.

### Criterios de exclusión
- Personas que hayan visto el sistema previamente.
- Desarrolladores o diseñadores (sesgados por conocimiento técnico).
- Personas con experiencia en el sistema de facturación específico de Kyra.

---

## 4. Requerimientos técnicos (sin instalación)

El participante solo necesita:
- Computadora con navegador moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet
- El **link de acceso** al prototipo desplegado (compartir antes de la sesión)

El moderador necesita:
- Una herramienta de videollamada con opción de compartir pantalla (Zoom, Meet, Teams)
- Acceso de solo observación a la pantalla del participante (el participante comparte su pantalla)
- Esta planilla para tomar notas

### Instrucción previa al participante
Enviar por mail 24 hs antes:

> "Mañana haremos una sesión de prueba de un sistema web. Solo necesitás abrir el link que te voy a mandar en tu computadora, en el navegador que uses habitualmente. No hay nada que instalar. La sesión dura entre 45 y 60 minutos."

---

## 5. Preparación de la sesión (moderador)

### Lista de verificación antes de empezar
- [ ] El prototipo está desplegado y accesible desde el link de prueba
- [ ] Los datos de prueba en el sistema son representativos (clientes reales anonimizados o ficticios coherentes)
- [ ] El módulo de Ingresos tiene al menos 10 facturas en estado PENDIENTE visibles en la primera página
- [ ] La grabación de pantalla está habilitada (con consentimiento del participante)
- [ ] El documento de notas está abierto y listo (ver Sección 8)
- [ ] Hay un observador adicional tomando notas de comportamiento no verbal (opcional pero recomendado)

### Datos de prueba necesarios
| Módulo | Datos requeridos |
|--------|-----------------|
| Administración | ≥5 clientes con estados variados (activo/inactivo) |
| Ingresos | ≥10 facturas PENDIENTE, ≥5 APROBADA, ≥3 EMITIDA |
| Egresos | ≥8 egresos con proveedores y conceptos distintos |
| Emails | ≥15 registros en historial de envíos, config. de envío automático activa |

---

## 6. Script de moderación

*Leer en voz alta al participante. No improvisar — la consistencia entre sesiones es fundamental.*

---

### 6.1 Introducción (5 minutos)

> "Gracias por estar acá. Antes de empezar, quiero aclararte algo muy importante: **no te estamos evaluando a vos, estamos evaluando el sistema**. Esto significa que si en algún momento no encontrás algo o te cuesta hacer una tarea, esa es información valiosa para nosotros — es exactamente lo que necesitamos saber. No hay respuestas correctas o incorrectas.

> Durante la sesión, te voy a pedir que hagas algunas tareas en el sistema. Mientras las hacés, **pensá en voz alta**: contame qué estás viendo, qué esperás que pase, qué te genera dudas. Aunque te parezca obvio o poco importante, lo que pensás nos ayuda.

> Yo no voy a responderte preguntas sobre cómo usar el sistema — si preguntás algo, probablemente te devuelva la pregunta. Esto es intencional, no falta de amabilidad.

> ¿Tenés alguna pregunta antes de empezar? [Pausa] Perfecto. ¿Me podés compartir tu pantalla?"

---

### 6.2 Pregunta de calentamiento (2 minutos)

*Una vez que el participante comparte pantalla y el link está abierto:*

> "Antes de que hagamos las tareas, contame: ¿cómo organizás actualmente el proceso de facturación en tu trabajo? ¿Qué herramientas usás? ¿Qué parte del proceso te lleva más tiempo?"

*Objetivo: activar su modelo mental del dominio. No registrar como dato de usabilidad, sí como contexto.*

---

### 6.3 Tareas (35–40 minutos)

*Antes de cada tarea:*
- Entregar el enunciado de la tarea **por escrito** (copiar en el chat de la videollamada) Y leerlo en voz alta.
- Registrar la hora de inicio.
- No intervenir a menos que el participante esté completamente bloqueado por más de 3 minutos.

---

#### TAREA 1 — Orientación inicial

**Enunciado (leer y copiar en chat):**
> "Llegaste al sistema por primera vez hoy. Sin hacer nada todavía, contame: ¿qué ves? ¿Para qué creés que sirve cada sección que aparece en el menú lateral?"

| Métrica | Umbral de éxito |
|---------|----------------|
| Correctamente identifica las 4 secciones principales | Sí / No |
| Describe el propósito general del sistema correctamente | Sí / Parcial / No |
| Tiempo de orientación | < 2 minutos = fluido, > 4 minutos = problema |

**Señales de alerta:**
- No entiende la diferencia entre Ingresos y Egresos
- No puede anticipar qué hace la sección Emails
- Confusión con la sección deshabilitada (Dashboard)

**Si pregunta qué significa "Administración":**
> "¿Qué suponés que podría haber ahí?"

---

#### TAREA 2 — Revisión de facturas pendientes

**Enunciado:**
> "Es el 1ro de mes y tenés que revisar qué facturas están esperando aprobación. Andá a donde corresponda y contame qué ves."

| Métrica | Umbral de éxito |
|---------|----------------|
| Navega a Ingresos sin asistencia | Sí / No |
| Encuentra la vista de facturas PENDIENTE | < 60 seg = óptimo / < 120 seg = aceptable / > 120 seg = problema |
| Comprende la diferencia entre las sub-pestañas (Pendientes / Historial) | Sí / No |
| Lee correctamente la información de una fila (cliente, monto, estado) | Sí / Con dificultad / No |

**Señales de alerta:**
- Va primero a Emails o Administración
- No distingue los estados (PENDIENTE vs APROBADA)
- Confunde las columnas de la tabla
- No encuentra las sub-pestañas

**Si pregunta si tiene que hacer algo:**
> "¿Qué harías vos en esta situación?"

---

#### TAREA 3 — Filtrado y búsqueda

**Enunciado:**
> "Ahora te pido que encuentres solo las facturas de un cliente específico. El cliente se llama [NOMBRE DEL CLIENTE DE PRUEBA]. ¿Cómo lo harías?"

| Métrica | Umbral de éxito |
|---------|----------------|
| Usa el filtro de Cliente | Sí / No |
| Alternativa: usa búsqueda de texto | Sí / No (cuenta como éxito) |
| Comprende el resultado filtrado | Sí / No |
| Tiempo hasta resultado correcto | < 90 seg = óptimo |

**Señales de alerta:**
- Intenta buscar haciendo scroll en lugar de usar los filtros
- No encuentra el filtro de Cliente
- No comprende que la tabla se actualizó

---

#### TAREA 4 — Aprobación de facturas (flujo crítico)

**Enunciado:**
> "Bien. Ahora vas a hacer lo más importante de la sesión: aprobá todas las facturas PENDIENTE de este mes. Hacelo de la manera que te resulte más natural."

| Métrica | Umbral de éxito |
|---------|----------------|
| Intenta seleccionar múltiples filas | Sí / No |
| Encuentra el mecanismo de selección (checkbox) | < 60 seg / < 120 seg / No lo encuentra |
| Comprende que puede seleccionar todas con el checkbox de cabecera | Sí / No |
| Busca un botón de "aprobar" o "acción masiva" | Sí / No (señala qué encuentra o qué espera) |
| Frustración observable | Alta / Media / Baja / Ninguna |
| Completa la aprobación | Sí / No |

**Notas críticas para el moderador:**
Esta tarea es la más importante del protocolo. Si el participante no puede completarla en 3 minutos, registrar en detalle exactamente dónde se traba. NO intervenir antes de 3 minutos salvo que diga explícitamente "no sé qué hacer y ya me rendí".

**Si se tilda completamente (> 3 min sin progreso):**
> "¿Qué esperarías encontrar para poder hacer eso?"

*Registrar textualmente su respuesta — es la descripción de la expectativa real del usuario.*

**Señales de alerta críticas:**
- No ve los checkboxes de las filas
- No asocia "seleccionar + acción" como paradigma
- Espera un botón "Aprobar todo" en la toolbar
- Hace click en el estado del badge esperando que cambie

---

#### TAREA 5 — Verificación de estado post-aprobación

**Enunciado:**
> "Después de haber aprobado, ¿cómo sabrías que se hizo bien? ¿Cómo verificarías que el estado de esas facturas cambió?"

| Métrica | Umbral de éxito |
|---------|----------------|
| Puede describir qué indicador visual esperaría | Sí / No |
| Encuentra las facturas recién procesadas | Sí / No |
| Entiende la diferencia entre las sub-pestañas Pendientes / Historial | Sí / Ahora sí / No |
| Confía en el resultado que ve | Alta / Media / Baja |

**Señales de alerta:**
- No sabe cómo verificar — no hay feedback visual claro
- Busca una notificación o confirmación que no existe
- Confunde Pendientes con Historial

---

#### TAREA 6 — Configuración de email automático

**Enunciado:**
> "Ahora andá a la sección de Emails. Necesito que me digas: ¿el sistema está configurado para enviar automáticamente las facturas el 1ro de mes? ¿Y cómo lo verificarías?"

| Métrica | Umbral de éxito |
|---------|----------------|
| Navega a Emails sin asistencia | Sí / No |
| Encuentra la sección de Envío automático | < 60 seg / < 120 seg / No |
| Lee correctamente el estado del toggle | Sí / No |
| Comprende qué significa el toggle (activo/inactivo) | Sí / No |
| Tiempo total hasta respuesta correcta | < 90 seg = óptimo |

**Señales de alerta:**
- No distingue la sección "Envío automático" del historial de envíos
- No comprende el toggle visual
- Confunde "Plantilla activa" con "Envío automático"

---

#### TAREA 7 (opcional, si queda tiempo) — Agregar un cliente nuevo

**Enunciado:**
> "Un nuevo cliente acaba de contratar los servicios de Kyra. ¿Cómo lo darías de alta en el sistema?"

| Métrica | Umbral de éxito |
|---------|----------------|
| Va a Administración | Sí / No |
| Encuentra el botón NUEVO | < 30 seg = óptimo |
| Completa el formulario sin errores | Sí / Con dificultad / No |
| Entiende los campos obligatorios | Sí / No |

---

### 6.4 Cierre y debrief (5–8 minutos)

*Después de la última tarea, antes de cerrar:*

> "Gracias, terminamos con las tareas. Ahora te hago unas preguntas de cierre y ahí terminamos."

**Preguntas post-test (leer en orden, no saltar):**

1. > "En general, ¿cómo describirías tu experiencia usando el sistema hoy?"

2. > "¿Hubo algo que te resultara especialmente fácil o claro?"

3. > "¿Hubo algo que te generara fricción, confusión o que tuvieras que pensar de más?"

4. > "Si pudieras cambiar una sola cosa del sistema, ¿qué cambiarías?"

5. > "¿Lo usarías en tu trabajo? ¿Por qué sí o por qué no?"

6. En una escala del 1 al 5, donde 1 es "muy difícil" y 5 es "muy fácil": **¿qué tan fácil te resultó usar el sistema en general?** [Registrar número]

7. En una escala del 1 al 5, donde 1 es "muy insegura" y 5 es "muy segura": **¿qué tan segura te sentirías usando este sistema sola, sin ayuda?** [Registrar número]

*Cierre:*
> "Eso es todo. Muchas gracias — tu feedback es exactamente lo que necesitamos para mejorar el sistema antes de que salga. ¿Tenés alguna pregunta para mí sobre lo que vimos hoy?"

*Responder preguntas libremente una vez finalizada la sesión.*

---

## 7. Plantilla de registro por sesión

*Completar durante o inmediatamente después de cada sesión. Una copia por participante.*

---

```
PROTOCOLO DE USABILIDAD — REGISTRO DE SESIÓN
═══════════════════════════════════════════════════════════

Sesión N°: ___    Fecha: ___/___/____    Duración total: ___ min
Moderador: _________________________
Observador: ________________________ (si hay)

PERFIL DEL PARTICIPANTE
─────────────────────────────────────────────────────────
Código (no nombre real): P-___
Rol / cargo: _____________________________________________
Herramientas digitales que usa habitualmente: ____________
Experiencia con sistemas de facturación: □ Ninguna □ Básica □ Media □ Alta
Dispositivo: □ Laptop □ Desktop   SO: □ Windows □ Mac □ Linux
Navegador: ___________________

─────────────────────────────────────────────────────────
TAREA 1 — Orientación inicial
─────────────────────────────────────────────────────────
Tiempo: ___ seg
Identifica las 4 secciones: □ Sí  □ No
Identifica propósito general: □ Sí  □ Parcial  □ No
Confusión con Dashboard deshabilitado: □ Sí  □ No
Citas textuales relevantes:
_________________________________________________________
_________________________________________________________

─────────────────────────────────────────────────────────
TAREA 2 — Revisión de facturas pendientes
─────────────────────────────────────────────────────────
Tiempo hasta llegar a Ingresos: ___ seg
Llega sin asistencia: □ Sí  □ No  (si No, cómo llegó: _________)
Tiempo hasta encontrar PENDIENTE: ___ seg
Comprende sub-pestañas: □ Sí  □ No
Lee tabla correctamente: □ Sí  □ Con dificultad  □ No
Errores de navegación: ___________________________________
Citas textuales relevantes:
_________________________________________________________
_________________________________________________________

─────────────────────────────────────────────────────────
TAREA 3 — Filtrado y búsqueda
─────────────────────────────────────────────────────────
Tiempo total: ___ seg
Método usado: □ Filtro Cliente  □ Búsqueda de texto  □ Scroll  □ Otro
Encuentra el filtro: □ Sí  □ No
Comprende resultado: □ Sí  □ No
Errores: ________________________________________________
Citas textuales relevantes:
_________________________________________________________

─────────────────────────────────────────────────────────
TAREA 4 — Aprobación de facturas (CRÍTICA)
─────────────────────────────────────────────────────────
Tiempo hasta intentar selección: ___ seg
Encuentra checkbox de fila: □ Sí (<60s)  □ Sí (61-120s)  □ No
Usa checkbox de cabecera: □ Sí  □ No
Busca botón de acción masiva: □ Sí  □ No
¿Dónde espera encontrar el botón de aprobar?: ____________
Frustración observada: □ Alta  □ Media  □ Baja  □ Ninguna
Completa la tarea: □ Sí  □ No
Si No, punto exacto donde se bloqueó:
_________________________________________________________
Cita textual más importante:
_________________________________________________________
_________________________________________________________

─────────────────────────────────────────────────────────
TAREA 5 — Verificación de estado
─────────────────────────────────────────────────────────
Tiempo total: ___ seg
Describe indicador esperado: □ Sí  □ No
Encuentra facturas procesadas: □ Sí  □ No
Entiende Pendientes vs Historial: □ Sí  □ Ahora sí  □ No
Nivel de confianza en el resultado: □ Alta  □ Media  □ Baja
Citas:
_________________________________________________________

─────────────────────────────────────────────────────────
TAREA 6 — Email automático
─────────────────────────────────────────────────────────
Tiempo hasta Emails: ___ seg
Tiempo hasta Envío automático: ___ seg
Lee estado del toggle: □ Sí  □ No
Entiende toggle: □ Sí  □ No
Confunde con historial: □ Sí  □ No
Citas:
_________________________________________________________

─────────────────────────────────────────────────────────
TAREA 7 — Nuevo cliente (opcional)
─────────────────────────────────────────────────────────
Realizada: □ Sí  □ No (falta de tiempo)
Tiempo hasta NUEVO btn: ___ seg
Completa formulario: □ Sí  □ Con dificultad  □ No
Citas:
_________________________________________________________

─────────────────────────────────────────────────────────
DEBRIEF POST-TEST
─────────────────────────────────────────────────────────
Puntuación facilidad de uso (1–5): ___
Puntuación confianza de uso autónomo (1–5): ___

Lo que le resultó fácil:
_________________________________________________________
_________________________________________________________

Lo que le generó fricción:
_________________________________________________________
_________________________________________________________

Qué cambiaría:
_________________________________________________________

¿Lo usaría? □ Sí  □ No  ¿Por qué?:
_________________________________________________________

─────────────────────────────────────────────────────────
OBSERVACIONES DEL MODERADOR
─────────────────────────────────────────────────────────
Comportamientos notables no verbales (gestos, suspirar, hesitar):
_________________________________________________________
_________________________________________________________

Patrones o hipótesis que surgieron en esta sesión:
_________________________________________________________
_________________________________________________________

Hallazgos únicos de esta sesión (no repetidos en otras):
_________________________________________________________

Prioridad para incorporar al reporte: □ Crítica  □ Alta  □ Media  □ Baja
═══════════════════════════════════════════════════════════
```

---

## 8. Métricas de referencia por tarea

### Umbrales de tiempo

| Tarea | Excelente | Aceptable | Problemático |
|-------|-----------|-----------|--------------|
| T1 — Orientación | < 90 seg | 90–180 seg | > 180 seg |
| T2 — Encontrar Pendientes | < 60 seg | 60–120 seg | > 120 seg |
| T3 — Filtrar cliente | < 45 seg | 45–90 seg | > 90 seg |
| T4 — Aprobar facturas | < 90 seg | 90–180 seg | > 180 seg o no completa |
| T5 — Verificar estado | < 45 seg | 45–90 seg | > 90 seg |
| T6 — Email automático | < 60 seg | 60–120 seg | > 120 seg |

### Tasa de éxito

| Tarea | Criterio de éxito | Meta mínima |
|-------|-----------------|-------------|
| T1 | Describe correctamente ≥3 de 4 secciones | 80% de participantes |
| T2 | Llega a Ingresos > Pendientes sin asistencia | 80% |
| T3 | Usa filtro (no scroll) para buscar cliente | 70% |
| T4 | Selecciona y aprueba ≥1 factura correctamente | **100%** ← bloqueante |
| T5 | Verifica cambio de estado de forma autónoma | 80% |
| T6 | Lee estado de toggle y lo interpreta correctamente | 80% |

### Escala de satisfacción

| Score promedio | Interpretación |
|---------------|----------------|
| 4.5 – 5.0 | Excelente — listo para lanzamiento |
| 4.0 – 4.4 | Bueno — lanzar con iteración menor post-lanzamiento |
| 3.0 – 3.9 | Aceptable con reservas — corregir issues críticos antes |
| 1.0 – 2.9 | No apto — requiere rediseño de flujos core |

---

## 9. Análisis entre sesiones

### Después de cada sesión (15 min)

1. **Completar la planilla** de registro si quedaron campos vacíos
2. **Anotar los 3 hallazgos más importantes** de la sesión, ordenados por impacto
3. **Marcar si algún hallazgo ya se repitió** en sesiones anteriores (patrón emergente)
4. **Actualizar el mapa de patrones** (ver abajo)

### Mapa de patrones acumulado

*Llevar una lista viva que se actualiza después de cada sesión:*

```
PATRÓN: [Descripción breve]
Frecuencia: _/5 participantes
Tarea afectada: T___
Severidad: □ Bloqueante  □ Alta  □ Media  □ Baja
Hipótesis de causa: ___________________________________
```

### Después de todas las sesiones (30–60 min)

1. **Calcular métricas agregadas:** promedios de tiempo por tarea, tasas de éxito, scores de satisfacción
2. **Identificar los 5 problemas más frecuentes** (aparecen en ≥ 2 participantes)
3. **Clasificar hallazgos** por severidad y frecuencia (matriz de priorización)
4. **Redactar el reporte** con recomendaciones ordenadas por impacto

---

## 10. Criterios de "Listo para producción"

El sistema está listo para salir a producción cuando cumple **todos** los criterios críticos y **al menos 4 de 5** criterios importantes.

### Criterios críticos (todos obligatorios)

| # | Criterio | Umbral |
|---|----------|--------|
| C1 | **Aprobación de facturas (T4)** — tasa de éxito | **100%** de participantes completan la tarea |
| C2 | **Aprobación de facturas (T4)** — tiempo | Promedio ≤ 120 segundos |
| C3 | **Score de confianza de uso autónomo** | Promedio ≥ 4.0 / 5.0 |
| C4 | **Sin bloqueos críticos no contemplados** | No aparecen nuevos bloqueos en las últimas 2 sesiones |
| C5 | **Navegación principal** — todos los usuarios llegan a Ingresos sin ayuda | 100% |

### Criterios importantes (4 de 5)

| # | Criterio | Umbral |
|---|----------|--------|
| I1 | Score de facilidad de uso general | Promedio ≥ 4.0 / 5.0 |
| I2 | Verificación de estado post-aprobación (T5) | ≥ 80% de éxito |
| I3 | Comprensión de email automático (T6) | ≥ 80% de éxito |
| I4 | Filtrado de facturas (T3) | ≥ 70% usa filtros, no scroll |
| I5 | Orientación inicial (T1) | ≥ 80% identifica correctamente las secciones |

### Criterios de bloqueo (impiden el lanzamiento sin importar lo demás)

- Cualquier participante dice "no sabría cómo hacer esto solo/a" sobre el flujo de aprobación
- Más de 1 participante no completa T4 en ≤ 3 minutos con asistencia
- Score de confianza < 3.5 en promedio
- Aparece un error de sistema (bug) que bloquea una tarea en más de 1 sesión

---

## 11. Reporte de hallazgos (template)

*Completar después de todas las sesiones. Compartir con el equipo Dev antes de implementar correcciones.*

```
REPORTE DE USABILIDAD — SISTEMA IPM KYRA
═══════════════════════════════════════════════════════════

Sesiones realizadas: ___ / ___  
Fechas: ___ al ___  
Moderador: _____________________

RESULTADO GLOBAL
────────────────
Score facilidad de uso (promedio): ___ / 5.0
Score confianza autónoma (promedio): ___ / 5.0
¿Listo para producción?: □ SÍ  □ SÍ con condiciones  □ NO

Condiciones (si aplica):
_________________________________________________________

PROBLEMAS IDENTIFICADOS — ORDENADOS POR IMPACTO
─────────────────────────────────────────────────
P1 — [Título del problema]
Frecuencia: _/_ participantes  |  Tarea: T___  |  Severidad: □ Bloqueante □ Alta □ Media □ Baja
Descripción: ___________________________________________
Cita representativa: "___________________________________"
Recomendación: _________________________________________

P2 — [Título]
[repetir estructura]

[...]

HALLAZGOS POSITIVOS (preservar en iteraciones)
─────────────────────────────────────────────────
□ ___________________________________________
□ ___________________________________________

PRÓXIMOS PASOS
─────────────────────────────────────────────────
□ Corregir P1 [responsable] [fecha]
□ Corregir P2 [responsable] [fecha]
□ Re-testar flujo T4 después de correcciones
═══════════════════════════════════════════════════════════
```

---

## 12. Cronograma sugerido

| Semana | Actividad |
|--------|-----------|
| S1 — Días 1–2 | Preparar datos de prueba, confirmar deployment del prototipo |
| S1 — Días 3–5 | Recrutar participantes (al menos confirmar 3 de 5) |
| S2 — Días 1–3 | Sesiones de test (1–2 por día, máx) |
| S2 — Días 4–5 | Análisis, reporte, priorización de fixes |
| S3 | Implementar correcciones críticas y bloqueantes |
| S4 (opcional) | Re-test de los flujos corregidos (2–3 sesiones) |

---

*Protocolo diseñado para ser ejecutado por el equipo interno de Kyra sin experiencia previa en investigación de usuarios. En caso de dudas sobre el proceso de moderación, la regla de oro es: **observar más, intervenir menos**.*
