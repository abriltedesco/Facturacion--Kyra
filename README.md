# Facturación Kyra

Repositorio del sistema interno de facturación de Kyra.

## Proyecto activo

El desarrollo actual combina dos aplicaciones:

- [`kyra-ipm-v4`](kyra-ipm-v4): la app en React y Vite.
- [`arca-service`](arca-service): el backend (Express + PostgreSQL) que reemplaza a
  Supabase — auth, entidades de facturación, clientes y (más adelante) emisión ARCA.

Las demás carpetas (`kyra-ipm`, `kyra-ipm-v2`, `kyra-ipm-v3`) conservan versiones
anteriores como referencia.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `kyra-ipm-v4/` | Aplicación actual en React y Vite |
| `arca-service/` | Backend Express + PostgreSQL (auth, entidades, clientes) |
| `kyra-ipm/`, `kyra-ipm-v2/`, `kyra-ipm-v3/` | Versiones anteriores |
| `files/` | Documentación, imágenes y archivos de apoyo |

## Inicio rápido

Requiere Node.js 20 o superior, npm, y una instancia local de PostgreSQL 16
(instalación nativa o Docker — ver [`arca-service/README.md`](arca-service/README.md)).

```bash
# 1. Backend
cd arca-service
cp .env.example .env
npm install
createdb arca               # o: npm run db:up  (si usás Docker)
npm run migrate
npm run seed                # usuario de prueba: mai / KyraLocal2026
npm run dev                 # http://localhost:3001

# 2. Frontend (en otra terminal)
cd kyra-ipm-v4
npm install
npm run dev                 # http://localhost:5173
```

## Comandos

Desde `kyra-ipm-v4/`:

```bash
npm run dev       # Entorno de desarrollo
npm run test:run  # Pruebas
npm run build     # Compilación de producción
```

Desde `arca-service/`:

```bash
npm run dev    # Entorno de desarrollo (node --watch)
npm test       # Pruebas (vitest + supertest, base de datos arca_test descartable)
```

La documentación específica de cada app está en [`kyra-ipm-v4/docs`](kyra-ipm-v4/docs)
y [`arca-service/docs`](arca-service/docs).
