# Roadmap de Backend — kyra-ipm-v4

Frontend ya implementado para todos los módulos. Este checklist trackea únicamente el trabajo de **backend** (Supabase: tablas, RPCs, funciones, integraciones externas) módulo por módulo.

Marcar con `[x]` al completar. Actualizar tras cada sesión.

---

## Módulo 1 — Entidades emisoras
- [x] Tabla `billing_entities` (CRUD)
- [x] Certificado ARCA por entidad (upload + metadata)
- [x] Cuenta bancaria asignada por entidad
- [x] CUIT / EIN / identificación fiscal por entidad
- [x] Tipo de comprobante por defecto (A/B/C/LLC)

## Módulo 2 — Clientes
- [x] Tabla `clients` + catálogos (`countries`, `fiscal_conditions`, `tax_categories`)
- [x] RPCs `save_client`, `set_client_status`, `save_country`, `save_fiscal_condition`, `save_tax_category`
- [x] Asignación de entidad emisora
- [x] País y condición fiscal
- [x] Identificación fiscal (CUIT/NIT/etc.)
- [x] Impuesto adicional configurable
- [x] Email principal + emails en copia (`client_emails`)
- [x] Carpeta de Google Drive asignada (campo referencia)
- [x] Estado activo / inactivo
- [x] Notas internas
- [x] Periodicidad de actualización por IPC

## Módulo 3 — Servicios por cliente
- [ ] Tabla `services` (nombre, descripción, tipo fijo/por_hora, moneda, periodicidad, estado)
- [ ] Tarifa hora / monto base por servicio
- [ ] RPC `save_service` / `set_service_status`
- [ ] Tabla/histórico `service_price_history` (cambios de precio)
- [ ] Repositorio `serviceRepository.js` + reemplazo de `data/servicios.js`
- [ ] Conectar `ClientsContext` o nuevo `ServicesContext` al backend
- [ ] Tests (pgTAP + unitarios) del módulo

## Módulo 4 — Actualización por IPC
- [ ] Tabla `ipc_adjustments` (cliente, servicio, período desde/hasta, % aplicado, monto anterior, monto nuevo, fecha, estado)
- [ ] RPC para calcular preview de ajuste (dado % IPC y período)
- [ ] RPC para aplicar/confirmar ajuste (actualiza `services`/precio vigente)
- [ ] Persistencia de historial de actualizaciones
- [ ] Conectar `AjustesPendientes.jsx` (`guardarCambios()`) al backend real
- [ ] Tests

## Módulo 5 — Facturación mensual
- [ ] Tabla `billing_lines` (cliente, servicio, período, tipo factura, entidad, moneda, horas, importes, alertas, status)
- [ ] Generación automática de líneas desde clientes + servicios activos del mes
- [ ] Cálculo real de impuestos (reemplazar 21% hardcoded) según `tax_categories`/país
- [ ] Detección automática de servicios con IPC pendiente (ligar a Módulo 4)
- [ ] RPCs: aprobar / editar / excluir línea
- [ ] Persistencia de estados (pendiente_revision → aprobada → emitida → enviada)
- [ ] Conectar `FacturacionContext.jsx` / `FacturacionMes.jsx` al backend
- [ ] Tests

## Módulo 6 — Generación de facturas
- [ ] Integración real ARCA/WSFE (reemplazar `emisionARCA.js` simulado) con certificado por entidad
- [ ] Manejo real de CAE y vencimiento de CAE
- [ ] Persistencia de número de comprobante emitido (`invoices` o similar)
- [ ] Generación de PDF AFIP conforme (RG 1415) — mejorar `generarPDFafip.js`
- [ ] Generación de PDF LLC persistida (no solo cliente-side) — `generarPDFllc.js`
- [ ] Registro interno S/F (sin emisión externa)
- [ ] Manejo y persistencia de errores de emisión (descripción, reintentos)
- [ ] Endpoint/función de reintento de emisión
- [ ] Tests

## Módulo 7 — Google Drive
- [ ] Autenticación OAuth2 / service account con Google Drive API
- [ ] Función de guardado automático del PDF al emitir factura
- [ ] Lógica de estructura de carpetas: Administración Kyra / Año / Mes / Facturas
- [ ] Creación automática de carpeta año/mes si no existe
- [ ] Guardar referencia de archivo subido (link/id) en la factura
- [ ] Tests

## Módulo 8 — Envío de emails
- [ ] Integración SMTP real (SendGrid / AWS SES / similar) — reemplazar `envioEmailMock.js`
- [ ] Adjuntar PDF real generado (hoy es string ficticio)
- [ ] Persistir plantillas (`plantillasEmail.js` → tabla `email_templates`)
- [ ] Persistir configuración de envío (`configEnvioEmail.js` → tabla)
- [ ] Persistir historial de envíos (`historialEnvios.js` → tabla `email_history`) con fecha y estado
- [ ] RPC/endpoint de reenvío manual
- [ ] Envío automático disparado tras emisión exitosa (conectar a Módulo 6 real)
- [ ] Tests

## Módulo 9 — Control de pagos
- [ ] Tabla `payments` (factura, fecha, monto, medio de pago, banco destino, retenciones)
- [ ] Estado de pago por factura (pendiente / pagada / parcial) persistido
- [ ] Cálculo de saldo pendiente en backend
- [ ] Cálculo automático de días de demora (función/trigger)
- [ ] Ligar pagos a facturas reales emitidas (Módulo 6)
- [ ] Tests

## Módulo 10 — Compras y proveedores
- [ ] Tabla `suppliers` (CRUD proveedores)
- [ ] Tabla `purchase_invoices` (facturas de compra) con todos los campos
- [ ] Asociación opcional a cliente y servicio
- [ ] Estado de pago y origen de fondos
- [ ] Subida de comprobante a Google Drive (depende de Módulo 7)
- [ ] Conectar `Egresos.jsx` al backend real
- [ ] Tests

## Módulo 11 — Dashboard
- [ ] Vista/función agregada: resumen de facturación del mes (real, no hardcoded)
- [ ] Cálculo facturas emitidas vs pendientes de pago
- [ ] Cálculo cantidad de clientes activos y servicios activos
- [ ] Soporte de filtro por período
- [ ] Tests

## Módulo 12 — Reportes y exportación
- [ ] Función/endpoint de exportación a Excel de facturación del mes
- [ ] Filtros server-side (cliente, mes, tipo de factura, estado, entidad emisora)
- [ ] Consulta de historial de emails enviados (real, Módulo 8)
- [ ] Consulta de historial de actualizaciones IPC (real, Módulo 4)
- [ ] Tests

---

## Orden sugerido de implementación (por dependencias)
3 (Servicios) → 4 (IPC) → 5 (Facturación mensual) → 9 (Pagos) → 10 (Compras) → 6 (Emisión/ARCA) → 8 (Emails SMTP real) → 7 (Drive) → 11 (Dashboard) → 12 (Reportes)
