Módulo 1 — Entidades emisoras
Administrar las 3 entidades desde las que Kyra factura.
CRUD de entidades (Kyra SRL, Monotributo personal, Mercury LLC)
Certificado ARCA por entidad (certificado digital para pedir a ARCA - SRL y Monotributo Mai)
Cuenta bancaria asignada por entidad
CUIT / EIN / identificación fiscal por entidad
Tipo de comprobante por defecto (A, B - Exento en IVA, sólo para Kyra- , C, LLC)

Módulo 2 — Clientes
CRUD de clientes
Asignación de entidad emisora (define qué tipo de factura se emite)
País y condición fiscal
Identificación fiscal (CUIT argentino, NIT colombiano, etc.)
Impuesto adicional configurable (ej: 12.5% Colombia, 0% Costa Rica)
Email principal + emails en copia
Carpeta de Google Drive asignada
Estado activo / inactivo
Notas internas
Periodicidad de actualización por IPC 

Módulo 3 — Servicios por cliente
Cada cliente puede tener uno o más servicios con su lógica propia.
Nombre y descripción del servicio
Tipo: fijo o por hora
Fijo: monto base
Por hora: tarifa hora (propia por cliente)
Moneda
Periodicidad de facturación (mensual, bimestral, trimestral…)
Estado: activo / pausado / finalizado
Historial de cambios de precio (?)

Módulo 4 — Actualización por IPC
Pantalla de "calculadora de actualización"
Selección de período (desde / hasta)
Ingreso manual del % acumulado de IPC
Vista previa de qué clientes se actualizan y cuáles serían sus nuevos montos
Confirmación y aplicación
Historial de actualizaciones con monto anterior, % aplicado, monto nuevo, fecha 

Módulo 5 — Facturación mensual (pantalla central)
La pantalla más importante del sistema.
Vista de todos los clientes y sus servicios a facturar en el mes en curso
Indicación de cuáles necesitan actualización de IPC antes de facturar
Para servicios por hora: campo para ingresar cantidad de horas antes de generar
Pre-liquidación visual: tabla con cliente, servicio, período trabajado, importe neto, impuesto, total, tipo de factura
Acciones por fila: aprobar, editar, excluir
Botón para proceder con las aprobadas
Estado de cada factura: pendiente revisión → aprobada → emitida → enviada

Módulo 6 — Generación de facturas
Factura A, B y C → emisión automática vía ARCA (WSFE) con los certificados de cada entidad
LLC → generación de PDF con template propio
S/F → registro interno solamente, sin emisión
Guardado de número de comprobante
Manejo de errores de emisión con descripción del error
Posibilidad de reintentar si falla

Módulo 7 — Google Drive
Guardado automático del PDF en Drive al emitir
Estructura de carpetas: Administración Kyra  / Año / Mes / Facturas
Creación automática de carpeta del año y mes en caso de no existir

Módulo 8 — Envío de emails
Envío automático después de emitir la factura
Template con texto configurable 
Adjunta el PDF
Envío a email principal + CCs del cliente
Registro de fecha de envío y estado (enviado / error)
Opción de reenvío manual desde cualquier factura

Módulo 9 — Control de pagos
Estado de pago por factura: pendiente / pagada / parcial 
Carga de fecha de pago, medio de pago (transferencia, efectivo, cheque), banco de destino
Retenciones y saldo pendiente
Días de demora calculados automáticamente

Módulo 10 — Compras y proveedores
CRUD de proveedores
Registro de facturas de compra con todos sus campos
Asociación opcional a cliente y servicio
Estado de pago y origen de fondos
Adjunto del comprobante cargado en Drive

Módulo 11 — Dashboard
Resumen de facturación del mes
Facturas emitidas vs pendientes de pago
Cantidad de clientes activos y servicios activos

Módulo 12 — Reportes y exportación
Exportar facturación del mes a Excel
Filtros por cliente, mes, tipo de factura, estado, entidad emisora
Historial de emails enviados
Historial de actualizaciones IPC