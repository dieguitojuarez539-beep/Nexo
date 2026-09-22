# Desplegar Nexo desde GitHub en Railway

Este repositorio contiene el frontend, la API, las migraciones, el worker y documentación. El frontend actual usa Sites/Cloudflare y permanece en su publicación existente; **no desplegar la raíz automáticamente como aplicación Node en Railway**.

## Servicios

Crear PostgreSQL y Redis en el proyecto Railway. Crear dos servicios desde este mismo repositorio:

| Ajuste | API | Worker |
|---|---|---|
| Root Directory | /backend | /backend |
| Archivo de configuración (ruta desde raíz del repositorio) | /backend/railway.api.json | /backend/railway.worker.json |
| Inicio | node src/main.mjs | node src/worker.mjs |
| Pre-deploy | node src/migrate.mjs && node src/seed.mjs | Ninguno |
| Dominio público | Generar HTTPS | No requiere |

Desplegar primero la API para crear el esquema. El worker procesa pagos confirmados, correo, análisis de archivos y backups: no es opcional. No configurar un healthcheck HTTP público para el worker. La API actual protege /v1/health con API_PROXY_SECRET; no configurarlo como healthcheck de Railway sin soporte para ese encabezado.

## Variables privadas

Usar backend/.env.example como inventario; ingresar valores en Railway, no modificar ni subir .env. DATABASE_URL y REDIS_URL deben referenciar los servicios creados. PORT lo suministra Railway. NODE_ENV=production. APP_ORIGIN debe ser el origen HTTPS exacto del frontend.

ADMIN_EMAIL=Dieguitojuarez539@gmail.com. Elegir ADMIN_PASSWORD en las variables privadas. El seed crea el CREADOR de forma idempotente; no restablece una contraseña existente. Configurar SMTP para verificar email y luego TOTP en el primer acceso.

Generar claves independientes para DATA_ENCRYPTION_KEY, DOWNLOAD_SIGNING_KEY y API_PROXY_SECRET según README. API_PROXY_SECRET debe coincidir con el secreto del proxy del frontend. Conservar la clave de cifrado de forma segura: cambiarla sin migrar datos impide descifrarlos.

Configurar almacenamiento S3 privado, sus credenciales, buckets de contenido, identidad y backups, CORS y cifrado según README. No usar disco efímero de Railway para archivos de usuarios. El worker necesita firmas actualizadas de ClamAV y permisos de escritura en su directorio de firmas; preparar ese servicio antes de habilitar subidas.

## PayPal

PAYPAL_MODE=live únicamente para la aplicación real. Cargar PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MERCHANT_ID y PAYPAL_WEBHOOK_ID correspondientes a esa misma aplicación. Usar un secreto nuevo si el anterior se compartió por chat. No hay credenciales reales incluidas en el repositorio.

Crear el webhook de la aplicación PayPal apuntando al dominio público de la API seguido de /v1/payments/paypal/webhook (no al frontend privado). Los eventos necesarios se documentan en README. La redirección del navegador no acredita saldo ni habilita descargas: el worker procesa la confirmación verificada.

## Conectar frontend

Una vez desplegada la API, configurar en el frontend API_ORIGIN con el origen HTTPS de la API (sin /v1) y API_PROXY_SECRET con el mismo valor del backend. Volver a publicar el frontend para aplicar las variables. El frontend seguirá en modo demostración mientras no se conecte.

## Antes de abrir ventas

Revisar docs/STATUS.md: subir el repositorio no significa que el alcance comercial esté terminado. Probar primero con credenciales sandbox separadas compra, webhook repetido, descarga autorizada, devolución, retención, retiro y eliminación. Completar los datos legales y revisar los pendientes administrativos y de seguridad antes de habilitar legalReady. No se realizaron pruebas reales de despliegue Railway ni de pagos desde este entorno.
