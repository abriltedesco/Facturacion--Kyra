# Módulo de clientes

## Alcance

El módulo administra los clientes facturables con:

- CRUD completo con estado activo, inactivo o archivado (sin borrado físico);
- asignación de una entidad emisora (define el tipo de comprobante que se emite);
- país y condición fiscal, cargados desde catálogos propios (la condición fiscal depende del país elegido);
- identificación fiscal libre, con validación estricta de CUIT (dígito verificador) sólo para clientes de Argentina;
- categoría de impuesto adicional configurable (catálogo de nombre + porcentaje, ej. "Colombia 12.5%"), asignable opcionalmente a cada cliente;
- email principal y emails en copia (tabla relacionada);
- periodicidad de actualización por IPC (mensual, trimestral, semestral o anual), sólo si el ajuste está activo;
- carpeta de Google Drive como campo de texto (placeholder, ver límites más abajo);
- notas internas.

Los catálogos de países, condiciones fiscales y categorías de impuesto se administran desde `Administración > Clientes > Catálogos`.

## Uso desde la interfaz

1. Iniciar sesión y abrir `Administración > Clientes`.
2. Usar `Catálogos` para cargar países, condiciones fiscales (por país) y categorías de impuesto adicional antes de crear clientes.
3. Usar `Nuevo cliente` (o el atajo del menú `NUEVO`) para registrar los datos del cliente. La entidad emisora determina el tipo de comprobante que se muestra en la tabla.
4. Abrir el menú de una fila para editar, activar, desactivar o archivar. Un cliente archivado conserva su historial y se restaura como inactivo.
5. El detalle de cada cliente (`Datos generales`) muestra la información fiscal, de contacto y de IPC persistida en Supabase.

## Arquitectura

- `PostgreSQL`: tablas `countries`, `fiscal_conditions`, `tax_categories`, `clients` y `client_emails`.
- `React`: `ClientsProvider` mantiene el catálogo de clientes y los catálogos auxiliares compartidos entre `Administración` y `ClienteDetalle`.

Las tablas sólo conceden lectura a `authenticated`. Las mutaciones pasan por funciones SQL `security definer` (`save_client`, `set_client_status`, `save_country`, `save_fiscal_condition`, `save_tax_category`) que validan sesión y concurrencia optimista (para clientes). No se concede `DELETE` físico sobre `clients`; los catálogos se desactivan (`active = false`) en vez de eliminarse.

La condición fiscal está vinculada al país mediante una clave foránea compuesta (`fiscal_condition_id`, `country_id`), lo que impide asignar una condición de un país distinto al seleccionado.

## Desarrollo local

Mismos requisitos que el módulo de entidades (Node.js + Docker Desktop para Supabase local). El seed local (`supabase/seed.sql`) carga:

- catálogos de ejemplo: Argentina, Colombia y Costa Rica, con sus condiciones fiscales típicas;
- dos categorías de impuesto adicional de ejemplo (Colombia 12.5%, Costa Rica 0%);
- los doce clientes que antes vivían en `src/data/clientes.js`, ahora como filas reales enlazadas a las entidades emisoras del seed (`billing_entities` ids 1-3).

## Validación

```powershell
npm run test:run
npm run build
npm run supabase:test
```

`supabase:test` ejecuta `supabase/tests/clients_module.test.sql` (pgTAP) y requiere Docker/Supabase local. La suite verifica RLS, ausencia de borrado físico, validación de CUIT para Argentina, la FK compuesta condición↔país, control de versiones y el guardado atómico de emails en copia.

## Límites actuales

- La carpeta de Google Drive es sólo un campo de texto (`driveFolderRef`); no hay integración real con la API de Google Drive (no hay credenciales de Google Cloud configuradas todavía).
- Los servicios y tarifas por cliente no forman parte de este módulo; siguen siendo estado frontend de demostración en `ClienteDetalle`.
- Las páginas `Emisión`, `Facturación mensual`, `Emails` y `Ajustes pendientes` todavía leen el mock `src/data/clientes.js` y no reflejan los clientes reales de este módulo. Migrar esas páginas al backend queda fuera de este alcance.
