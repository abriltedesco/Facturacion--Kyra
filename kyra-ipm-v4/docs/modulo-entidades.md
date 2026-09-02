# Módulo de entidades emisoras

## Alcance

El módulo administra entidades SRL, monotributistas y LLC con:

- autenticación interna por usuario y clave;
- datos fiscales y configuración de comprobantes;
- una o más cuentas bancarias locales o internacionales;
- activación y desactivación sin borrado físico;
- certificados ARCA privados, historial, renovación y revocación;
- numeración y PDFs derivados de la entidad persistida;
- advertencias no bloqueantes antes de emitir.

La integración real con los servicios de ARCA no forma parte de esta versión. La emisión actual continúa usando el simulador del frontend.

## Arquitectura

- `Supabase Auth`: sesión y credenciales. El usuario visible se convierte internamente en `<usuario>@<VITE_AUTH_EMAIL_DOMAIN>`.
- `PostgreSQL`: entidades, cuentas, perfiles y metadatos de documentos.
- `Storage`: bucket privado `arca-documents`.
- `Edge Function`: valida tipo, tamaño y firma PDF antes de registrar una carga.
- `React`: `AuthProvider` resuelve la sesión y `EntitiesProvider` mantiene un único catálogo compartido.

Las tablas sólo conceden lectura a `authenticated`. Las mutaciones pasan por funciones SQL `security definer` que validan sesión, reglas fiscales y concurrencia optimista. No se concede `DELETE` sobre las tablas del módulo.

## Desarrollo local

Requisitos:

- Node.js compatible con Vite 5 y Vitest 4;
- Docker Desktop en ejecución para Supabase local.

Desde `kyra-ipm-v4`:

```powershell
Copy-Item .env.example .env.local
npm install
npm run supabase:start
```

Copiar la publishable key que imprime Supabase en `VITE_SUPABASE_PUBLISHABLE_KEY` dentro de `.env.local`. Después:

```powershell
npm run supabase:reset
npm run supabase:functions
npm run dev
```

El seed local crea el usuario de desarrollo:

- usuario: `mai`
- clave: `KyraLocal2026`

Estos datos son ficticios y no deben reutilizarse en un entorno remoto.

## Validación

```powershell
npm run test:run
npm run build
npm run supabase:test
```

`supabase:test` ejecuta pgTAP y requiere Docker/Supabase local. La suite verifica RLS, ausencia de borrado físico, guardado atómico, control de versiones y privacidad del bucket.

## Despliegue en Supabase

Vincular primero el proyecto y revisar la migración antes de aplicarla:

```powershell
npx supabase link --project-ref <project-ref>
npx supabase db push
npx supabase functions deploy upload-arca-document
npx supabase secrets set ALLOWED_ORIGIN=https://ipm.example.com
```

Configurar en el hosting del frontend:

```text
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
VITE_AUTH_EMAIL_DOMAIN=kyra.internal
```

No exponer `SUPABASE_SERVICE_ROLE_KEY` ni otros secretos en variables `VITE_*`. Supabase inyecta las credenciales de servidor en la Edge Function.

Los usuarios remotos se crean desde Supabase Auth con email interno y metadata:

```json
{
  "username": "usuario",
  "display_name": "Nombre visible"
}
```

Como `enable_signup` está desactivado, no existe registro público desde la aplicación.

## Operación de documentos

- Sólo se aceptan PDFs de hasta 10 MB.
- La Edge Function verifica MIME, extensión y cabecera `%PDF-`.
- Cada renovación reemplaza el documento actual sin borrar el historial.
- Abrir o descargar genera una URL firmada por 60 segundos.
- Revocar conserva metadata y archivo para auditoría.

## Límites actuales

- Las líneas de facturación, clientes y servicios todavía son estado frontend de demostración.
- Los contadores de comprobantes se mantienen en memoria; el backend deberá asignar la numeración en una fase posterior para evitar colisiones multiusuario.
- La emisión ARCA es simulada y no debe considerarse una autorización fiscal real.
- Las advertencias fiscales son deliberadamente informativas y no bloquean la emisión.