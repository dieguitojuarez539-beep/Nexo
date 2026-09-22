# Despliegue en Railway

Empezar por [docs/RAILWAY.md](docs/RAILWAY.md). Configurar dos servicios con raíz `/backend`; el frontend existente permanece en Sites.

# Nexo · Marketplace de proyectos digitales

Implementación inicial del marketplace solicitado. La publicación de Sites sirve el frontend en **vista previa privada** hasta conectar una API real. No acepta registros, pagos, documentos ni archivos en esa modalidad. Los productos de ejemplo y las imágenes no representan ventas ni archivos reales. El nombre Nexo es provisional.

## Estado y límites de esta entrega

- Frontend React con rutas compatibles con Next.js, servido en Cloudflare Workers mediante Vinext. Catálogo, filtros, detalle, aceptación de eliminación antes de comprar, publicación por pasos, login/TOTP, biblioteca, billetera y panel del CREADOR.
- Backend Node/NestJS con módulos REST, PostgreSQL, Redis/BullMQ, integración PayPal, almacenamiento S3 privado, subida multipart, escaneo aislado y trabajos de eliminación.
- Migración SQL y seed idempotente; pruebas del esquema PostgreSQL mediante PGlite y de invariantes de dinero/seguridad. Se usa SQL parametrizado directamente en esta versión para expresar transacciones y restricciones; Prisma no es una dependencia de la entrega.
- El servidor no se despliega dentro del Worker del frontend. Requiere un servicio de contenedores/VM externo con PostgreSQL, Redis, S3, SMTP y antivirus configurados. No hay credenciales reales en el repositorio.
- **No es una plataforma lista para operar dinero real.** Faltan la configuración real y pruebas integrales de PayPal sandbox, concurrencia sobre PostgreSQL de servidor, correo, escaneo/subidas de 500 MB, purga en S3, backups/restauración y la revisión legal del operador. La conciliación automática contra extractos PayPal/banco y algunos flujos avanzados del panel requieren completar su implementación. Ver `docs/STATUS.md`.

## Estructura

- `app/`, `components/`, `lib/`: frontend y proxy del mismo origen.
- `backend/src/`: identidad, catálogo, pagos, saldos, almacenamiento, administración y workers.
- `backend/migrations/001_initial.sql`: tablas, índices, triggers y restricciones.
- `backend/test/`: pruebas de dominio y PostgreSQL embebido.
- `compose.yaml`: entorno local de servicios, sin exposición pública de PostgreSQL/Redis.
- `docs/`: arquitectura, contrato REST, operación y estado verificable.

## Instalación

Requisitos: Node.js 22+, Docker Compose para servicios, una cuenta PayPal sandbox empresarial y buckets privados S3. No usar datos personales reales en pruebas.

1. Copiar `backend/.env.example` a `backend/.env` y `.env.example` a `.env`. Completar los valores localmente, nunca en mensajes, logs o Git.
2. Definir `POSTGRES_PASSWORD` en `.env` y el mismo valor dentro de `DATABASE_URL` en `backend/.env`. Las variables no se sustituyen automáticamente dentro de otras variables.
3. Definir `ADMIN_EMAIL=Dieguitojuarez539@gmail.com` y `ADMIN_PASSWORD` de al menos 12 caracteres en `backend/.env`. El seed crea solo una cuenta CREADOR. No la modifica al reiniciar. Un conflicto de email aborta en vez de promover una cuenta existente.
4. Generar claves aleatorias distintas: `DATA_ENCRYPTION_KEY` (32 bytes en base64), `DOWNLOAD_SIGNING_KEY` y `API_PROXY_SECRET`. Para generar una clave: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`. Guardarlas en el gestor de secretos; no incluirlas en capturas.
5. Configurar almacenamiento, correo y PayPal. Arrancar los servicios con `docker compose up --build`. El servicio API migra y ejecuta el seed antes de atender.
6. Actualizar la base de firmas de ClamAV con `freshclam` mediante un servicio de actualización del volumen compartido. Sin antivirus funcional, los archivos quedan en cuarentena y no se publican. El contenedor necesita acceso saliente a las actualizaciones oficiales.
7. Instalar el frontend con la versión de pnpm declarada en `package.json`, conservar `pnpm-lock.yaml` y ejecutar el script `dev`. La instalación de backend usa `npm ci --prefix backend` con su lockfile separado.
8. Configurar el proxy del frontend con `API_ORIGIN` y `API_PROXY_SECRET`. En Sites, son variables de entorno del runtime. `API_ORIGIN` debe ser HTTPS. `APP_ORIGIN` del backend debe coincidir exactamente con el origen público del frontend; el proxy conserva ese origen para CSRF.
9. Verificar el email del CREADOR, volver a ingresar y configurar TOTP. Guardar los diez códigos de recuperación fuera de la plataforma. Restablecer contraseña no deshabilita TOTP.
10. Completar identidad del operador, textos legales y calendario de retiros. `legalReady` comienza en `false`: no se aceptan registros, compras ni subidas antes de configurarlo.

## PayPal

`PAYPAL_MODE=sandbox` inicialmente. Configurar `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MERCHANT_ID`, `PAYPAL_WEBHOOK_ID`. Registrar el webhook **directamente en la API externa**: `/v1/payments/paypal/webhook`. El sitio privado de vista previa no sirve como receptor público de PayPal.

Suscribir `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.REFUNDED`, `PAYMENT.CAPTURE.REVERSED`, `CUSTOMER.DISPUTE.CREATED`, `CUSTOMER.DISPUTE.UPDATED`, `CUSTOMER.DISPUTE.RESOLVED`. No habilitar ventas reales sin probar todos los estados. Validar con PayPal que la cuenta y el modelo comercial permiten cobrar las ventas de terceros en la cuenta central.

El redirect solo solicita captura. **Únicamente el webhook verificado acredita la venta y habilita el acceso.** El worker consulta la captura y orden reales, comprueba receptor, moneda, importe e identificadores y procesa idempotentemente. Los eventos se conservan para reprocesar errores.

Solo USD está habilitado. ARS existe en contabilidad pero no se convierte ni cobra con PayPal. Las comisiones iniciales son datos editables del seed; las órdenes guardan su propia copia histórica. Los costos del procesador los absorbe la plataforma.

## Archivos y eliminación

Cada subida va a un bucket privado y permanece inaccesible hasta superar validación real y ClamAV. Configurar CORS para PUT desde el origen de la app, y exponer `ETag`. No permitir lectura pública. Las imágenes/videos de referencia se sirven por una ruta controlada del backend; el ZIP/RAR requiere sesión, permiso y firma vinculada a esa sesión.

`S3_CONTENT_BUCKET`, `S3_PRIVATE_BUCKET`, `S3_BACKUP_BUCKET` y `S3_BACKUP_CONTENT_BUCKET` deben ser distintos. Activar cifrado, bloqueo de acceso público y versionado. El bucket de contenido y su respaldo **no deben tener Object Lock ni replicaciones fuera de la política de purga**. Las réplicas adicionales requieren incorporarse explícitamente al proceso de eliminación. El bucket de auditoría debe tener una política separada y no contener archivos de vendedores.

Despublicar oculta el proyecto. Eliminar bloquea descargas inmediatamente y encola la purga de originales, versiones y respaldo de contenido. La biblioteca conserva el registro de compra con “Proyecto eliminado”, sin botón de descarga. No se promete acceso permanente. No se eliminan copias ya descargadas legítimamente por compradores. El historial financiero se conserva separado.

Las URLs firmadas duran dos minutos y requieren la misma sesión que las generó. La descarga administrativa exige CREADOR y finalidad permitida, registra auditoría y no crea eventos de descarga ni emails al vendedor. No permite recuperar archivos ya purgados.

## Retiros

Verificación de identidad manual, comprobación separada de titularidad y moneda bancaria. Un CUIL ingresado no prueba titularidad. Una cuenta nueva queda pendiente de revisión antes de reservar un retiro. Al aprobar un retiro, se exige estado En proceso, número de operación y comprobante limpio.

El monto se mueve de disponible a reservado en una transacción con bloqueo de fila. Rechazar devuelve el saldo. Pagar consume el reservado e incrementa el histórico. Un contracargo posterior al pago registra deuda y bloquea nuevos retiros; no se vuelve negativo el saldo disponible.

Las 24 horas hábiles son horas del calendario operativo configurado (por defecto lunes a viernes, 9 a 17, Argentina), no 24 horas corridas ni “el día siguiente”. Publicar la definición exacta y feriados antes de operar. El mínimo inicial de retiro USD 10 es una decisión provisional editable.

## Pruebas

`npm test --prefix backend` ejecuta validaciones de comisiones, TOTP/replay, cifrado autenticado, CUIL, calendario, rol único, inmutabilidad contable, balance de asientos, no negatividad y reembolso idempotente después de retirar.

`node node_modules/typescript/bin/tsc --noEmit` comprueba el frontend. Las pruebas locales no sustituyen sandbox PayPal ni una prueba multi-conexión PostgreSQL real. Nunca declarar cobros reales verificados a partir de esta vista previa.

## Seguridad operativa

Mantener migraciones/seed bajo una identidad de base de datos separada y privilegiada; el runtime no debe ser propietario ni superusuario. Restringir UPDATE/DELETE de auditoría y ledger a nivel de permisos además de los triggers. Las restauraciones son offline a una base aislada. Configurar backups diarios, alertas de fallos de cola y revisión de eventos PayPal no procesados.

La cuenta CREADOR no puede asignarse desde el panel. No hay una contraseña de ejemplo, usuario administrativo público, bypass por email ni modo de sesión administrativa en el navegador.
