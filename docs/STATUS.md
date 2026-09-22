# Estado de implementación

## Disponible en la publicación privada

Catálogo demostrativo, filtros por categoría/precio/estado/licencia/herramienta/valoración, búsqueda y orden, fichas, modal previo a la adquisición, publicación por pasos, páginas de acceso, biblioteca, saldo y textos legales de revisión. Tema oscuro/claro y movimiento reducido. No se simulan ventas ni usuarios autenticados. Los datos de muestra están claramente identificados.

## Backend escrito, pendiente de pruebas contra servicios externos

Autenticación con Argon2id, seed CREADOR, verificación de email, TOTP y recuperación, roles, proyectos/borradores/publicación, comentarios y valoraciones, PayPal/webhooks, ledger, retenciones, reembolsos/deudas, retiros, revisión de identidad/cuentas, archivos privados/multipart/escaneo/purga, cola outbox, emails, API administrativa y exportación CSV/XLSX. Las tablas y restricciones se probaron con PostgreSQL embebido (PGlite), no con un servidor PostgreSQL multiproceso.

## Pendientes materiales para completar el alcance comercial

- Desplegar y conectar la API, PostgreSQL y Redis externos; configurar SMTP, buckets/KMS y PayPal sandbox. Probar todo el recorrido con dos cuentas de prueba y un vendedor.
- Conciliación automática importando y cruzando extractos reales PayPal/banco, reportes contables mensuales completos. Actualmente existen esquema, libro y exportaciones CSV/XLSX.
- Completar variantes avanzadas de administración (cola independiente de copyright con resolución, composición detallada de colecciones, filtros/historial de usuario, gestión completa de plantillas legales y correo en UI, gráficos/periodos por moneda).
- Verificar con S3 real la reanudación multipart (al volver a seleccionar el mismo archivo), reemplazo/reordenamiento de imágenes y galerías/video. Editor con formato, edición de borradores y controles de archivos ya están conectados; falta la prueba integrada con almacenamiento.
- Cierre de flujo de disputa resuelta contra vendedor, tasas extraordinarias, conciliación y suspensión/descongelamiento automático consistente cuando hay varias disputas.
- Pruebas de carrera multiconexión, cargas grandes, escaneo de archivos comprimidos, purga de todas las versiones/réplicas, backups y restauración, exportación externa de auditoría a almacenamiento inmutable.
- Configurar y verificar actualización de firmas ClamAV, políticas de IAM y lifecycle, observabilidad y revisión de privilegios.
- Completar identidad del responsable, proveedores/países de tratamiento, validación de plazos y revisión jurídica de los términos argentinos. Aprobar con PayPal la operativa centralizada de marketplace.

No habilitar producción financiera mientras existan estos pendientes. La publicación actual permite revisar el producto y continuar su implementación; no es una entrega final de todos los requisitos.
