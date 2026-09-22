# Subir Nexo a GitHub

1. Descargar y descomprimir Nexo-completo.zip.
2. Abrir el repositorio Nexo en GitHub.
3. Usar Add file → Upload files. Subir el CONTENIDO de la carpeta descomprimida, conservando sus carpetas. README.md, backend, app y package.json deben quedar directamente en la raíz del repositorio, no dentro de otra carpeta Nexo.
4. No subir este ZIP cerrado: Railway necesita los archivos extraídos.
5. Confirmar con Commit changes. Si la interfaz limita la cantidad de archivos, subir por carpetas en varias tandas o usar GitHub Desktop desde una computadora. Asegurarse de incluir .gitignore, backend/.dockerignore y ambos .env.example; nunca subir .env reales.
6. Seguir docs/RAILWAY.md para crear API y worker, PostgreSQL y Redis. No desplegar la raíz del repositorio directamente en Railway: el frontend actual está preparado para Sites/Cloudflare y la API/worker usan /backend.

Este paquete contiene todo el código fuente actual, imágenes, migraciones, pruebas y documentación. No incluye dependencias descargadas, secretos, datos de usuarios ni una base de datos real. Las dependencias se instalan con los archivos de versiones incluidos.

El frontend existente debe conectarse a la URL de la API y volver a publicarse con API_ORIGIN y API_PROXY_SECRET. Subir los archivos no activa por sí solo pagos, correos ni almacenamiento. Consultar docs/STATUS.md para el alcance implementado y los pendientes antes de operar con dinero real.
