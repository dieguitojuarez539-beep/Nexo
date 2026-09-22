# API REST v1

Origen de navegador: `/api/v1`; backend: `/v1`. La sesión es una cookie `nexo_session` HttpOnly/SameSite=Lax; Secure en producción. Cada POST/PATCH/PUT/DELETE requiere `X-Nexo-Request: 1` y `Origin` exactamente igual a `APP_ORIGIN`, excepto el webhook firmado de PayPal. El proxy aporta `API_PROXY_SECRET`; no se envía al navegador.

Errores JSON: `{ "message": "texto en español", "fields": [...] }`. Estados: 400 validación, 401 no autenticado, 403 permisos/estado de verificación, 404 inexistente, 409 conflicto/idempotencia, 410 eliminado, 413 límite de archivo, 429 rate limit, 503 configuración/mantenimiento. Las rutas mutantes validan con Zod y consultas parametrizadas.

`GET /openapi.json` enumera rutas y respuestas OpenAPI. Este documento complementa sus cuerpos y condiciones. Es documentación inicial; los esquemas detallados todavía deben incorporarse al documento OpenAPI generado.

| Operación | Datos / resultado | Permiso |
|---|---|---|
| GET /config | Límites, comisiones, monedas, legalReady | Público |
| GET /categories | Categorías jerárquicas activas | Público |
| POST /auth/register | email, password, name, acceptedTerms=true | Público; legalReady |
| POST /auth/login | email, password → FULL, totp o totp_setup | Público |
| GET /auth/me | usuario de sesión completa o null | Sesión opcional |
| POST /auth/verify-email | token de un solo uso | Público |
| POST /auth/forgot-password | email; respuesta genérica | Público |
| POST /auth/reset-password | token, password; revoca sesiones | Token válido |
| POST /auth/totp/setup | Clave y URI de enrolamiento | Sesión TOTP_SETUP |
| POST /auth/totp/confirm | code → códigos recuperación de un solo uso | Sesión TOTP_SETUP |
| POST /auth/totp/verify | TOTP o recuperación; rota sesión | Sesión TOTP |
| POST /auth/logout | Revoca sesión actual | Sesión opcional |
| GET /projects | q, limit≤100, offset → catálogo publicado | Público |
| GET /projects/:id | Ficha, galería, video y datos | Público |
| GET /sellers/:id | Perfil y publicaciones | Público |
| POST /seller/register | Habilita perfil vendedor | Usuario verificado |
| POST /seller/projects | Datos del proyecto → borrador | Vendedor |
| PATCH /seller/projects/:id | Datos; requiere despublicar antes | Propietario o CREADOR |
| POST /seller/projects/:id/publish | Valida metadatos y archivos CLEAN | Propietario o CREADOR |
| POST /seller/projects/:id/unpublish | Oculta; conserva archivos | Propietario o CREADOR |
| DELETE /seller/projects/:id | confirmation=ELIMINAR; encola purga | Propietario o CREADOR |
| POST /uploads/init | projectId?, purpose, name, size, mime | Usuario verificado y permiso de recurso |
| POST /uploads/:id/part | part → PUT temporal | Dueño de subida |
| POST /uploads/:id/complete | parts[{PartNumber,ETag}] → QUARANTINE | Dueño |
| GET /uploads/:id | Estado de escaneo | Dueño |
| GET /media/:id | Imagen/video de referencia publicado | Público |
| POST /seller/quote | price en centavos, currency=USD | Usuario |
| POST /orders/quote | projectId, coupon? → desglose | Público |
| POST /orders | projectId, coupon?, acceptedDeletion=true, legalVersion | Usuario verificado |
| POST /payments/paypal/capture | orderId externo; solicita captura | Comprador de la orden |
| POST /payments/paypal/webhook | Evento + cabeceras PayPal; verifica firma | PayPal |
| GET /library | Adquisiciones y condición eliminado/revocado | Usuario |
| POST /library/:id/download | Genera enlace ligado a sesión | Titular del acceso |
| GET /download/:token | Stream privado; vuelve a validar permiso | Misma sesión |
| POST /admin/projects/:id/download | purpose de lista permitida | CREADOR |
| GET /wallet | currency=USD/ARS; saldos, ventas y retiros | Vendedor |
| POST /identity-verifications | fullName, taxId, frontId, backId, selfieId | Vendedor |
| POST /withdrawals | currency, amount, account, holder, taxId, saveAccount, idempotencyKey | Vendedor verificado |
| POST /admin/withdrawals/:id/take | PENDING → PROCESSING | CREADOR |
| POST /admin/withdrawals/:id/reject | reason; devuelve reserva | CREADOR |
| POST /admin/withdrawals/:id/paid | operationNumber, receiptId; reserva → pagado | CREADOR |
| GET/POST /projects/:id/comments | body, parentId?; máximo un nivel | Leer público / escribir usuario |
| PUT /projects/:id/rating | rating 1..5 | Comprador o descargador válido |
| POST /comments/:id/highlight | highlighted | Vendedor del proyecto |
| POST /reports | projectId o commentId, reason | Usuario |
| POST /copyright-claims | name, email, projectUrl, originalUrl, description, declaration=true | Público |
| POST /privacy-requests | kind ACCESS/CORRECT/DELETE | Usuario |
| GET /admin/* | Dashboard, retiros, transacciones, usuarios, verificaciones, proyectos, reportes, estadísticas, audit y demás listas | CREADOR |
| PATCH /admin/settings | Valores tipados; legalReady requiere identidad del operador | CREADOR |
| PATCH /admin/users/:id | status/role/frozen/verified/commissionOverride y reason | CREADOR; nunca puede asignar CREADOR |
| POST /admin/verifications/:id/review | approve, reason | CREADOR |
| POST /admin/bank-accounts/:id/review | approve, reason, ownershipChecked, currencyChecked | CREADOR |
| POST /admin/projects/:id/action | APPROVE/HIDE/FEATURE/UNFEATURE, reason | CREADOR |
| POST /admin/reports/:id/resolve | hide, reason | CREADOR |
| POST /admin/refunds | orderId, amount, reason → encola reembolso | CREADOR |
| POST/PATCH /admin/coupons, banners, categories, collections, announcements | Campos de entidad; validados | CREADOR |
| POST /admin/campaigns | subject, body, audience; crea borrador | CREADOR |
| POST /admin/campaigns/:id/send | Encola solo destinatarios suscritos | CREADOR |
| GET /admin/transactions/export, /admin/withdrawals/export | CSV; neutraliza fórmulas | CREADOR |

## Proyecto

Campos: `title`, `short` (≤160), `description`, `category`, `subcategory`, `status`, `reference`, `tool`, `formats[]`, `version`, `changelog`, `requirements`, `compatibility`, `license`, `customLicense`, `tags[]`, `price` (centavos), `currency` (USD), `demo`, `repository`, `installation`, `videoUrl`. Borradores admiten información incompleta; publicar valida los obligatorios y requiere archivo principal + portada limpios.

## Dinero e idempotencia

Importes en centavos enteros. La moneda nunca se infiere. Se guarda la cotización de la orden y sus textos de licencia. El umbral de comisión usa el cobro después del descuento. La orden remota usa idempotencia estable; el acceso y ledger se crean solamente por webhook verificado. `event_key` del ledger y `provider_id` de capturas/reembolsos impiden duplicados.

El retiro reserva fondos con `SELECT ... FOR UPDATE`; cada movimiento balancea por moneda. Repetir una solicitud con la misma clave devuelve su ID únicamente si coincide usuario, importe y moneda. Las correcciones contables se agregan; no se editan movimientos. Las disputas pueden bloquear liberaciones y retiros.

## Eliminación y descarga administrativa

Un DELETE cambia primero a DELETING, crea tombstone y encola purga. Se eliminan versiones de S3 y respaldo configurado. DELETING y DELETED deniegan nuevas descargas. Un restore debe reaplicar tombstones actuales antes de admitir tráfico.

La ruta administrativa genera un token que requiere una sesión CREADOR vigente. Registra propósito/acción/IP; no inserta download_events, no vende y no notifica al vendedor. Los archivos purgados no son accesibles a ningún rol.
