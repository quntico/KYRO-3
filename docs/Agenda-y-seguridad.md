# KYRO 6.1 — Agenda y seguridad

## Datos preservados

Respaldo privado en `kyro_private.crm_backup_20261109`: 224 leads, 3 ventas, 12 tareas y 11 marcas de contacto. No se hicieron borrados, conversiones ni actualizaciones comerciales. Las pruebas SQL de programación se ejecutaron dentro de una transacción revertida.

## Entrega

- `/agenda`: día, semana, mes, vencidos, pendientes y completadas; búsqueda, nuevas actividades, edición y estado persistente.
- Acceso visible desde el encabezado, menú lateral y navegación móvil.
- Cada prospecto admite múltiples tareas; programar desde la ficha guarda tarea y próxima acción en una transacción.
- Zona horaria: America/Mexico_City, independientemente del equipo.
- Sesión real persistente; acceso por contraseña existente o enlace solicitado por el usuario. La cuenta propietaria conserva su cartera.
- Resumen YARVIS separado del historial de conversaciones. No envía mensajes ni altera estados comerciales.
- API de IA autenticada con cuota de 60 solicitudes diarias por usuario. Claves exclusivamente en servidor.
- Las fichas se renderizan en grupos de 24; búsqueda, filtros y totales abarcan la cartera completa.

## Google Calendar: activación requerida

La conexión del asistente en ChatGPT no proporciona credenciales OAuth reutilizables por KYRO.

Configurar en Google Cloud un cliente OAuth web con Calendar API habilitada. URI de redirección de producción:
`https://www.kyro.com.mx/agenda`

Configurar en Vercel, sin prefijo VITE:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` (secreto)
- `CALENDAR_TOKEN_KEY` (secreto: 32 bytes aleatorios codificados en base64)
- `KYRO_APP_ORIGIN=https://www.kyro.com.mx` (opcional; valor predeterminado)
- `OPENAI_API_KEY` para la IA generativa; `OPENAI_MODEL` opcional.

Redesplegar y entrar en Agenda → Google Calendar → Conectar Google. Autorizar la misma cuenta que usa KYRO y elegir el calendario Work. No se requiere compartir contraseñas con el asistente.

La conexión usa OAuth con PKCE y validación de estado en el navegador. Los tokens se cifran con AES-256-GCM. Permisos: identidad de Google, lectura de lista de calendarios y eventos de calendarios propios. El servidor limita la sincronización al calendario elegido y a tareas del usuario autenticado. No envía invitaciones.

Sincronización manual y cada cinco minutos mientras KYRO está abierto si el usuario activa esa preferencia. El cierre de KYRO no impide los recordatorios que Google ya tenga programados; no se ha implementado un cron ni webhook de sincronización con KYRO cerrado.

Los IDs de eventos son deterministas para prevenir duplicados. Las actualizaciones usan ETag. Los cambios simultáneos y eliminaciones remotas se conservan como conflictos, sin sobrescribir ni borrar registros comerciales. Una integración activa requiere validar OAuth y un evento de prueba autorizado antes de considerarla verificada extremo a extremo.

Mientras se configura OAuth, el icono de cada tarea abre un borrador en Google Calendar que el usuario puede guardar manualmente. Ese borrador no equivale a sincronización.

## Validación

- `npm test`: pruebas de fechas CDMX, filtros de agenda, propiedad de registros, autenticación API y regresiones de contactos, cartera y ventas.
- `npm run build`: compilación de producción.
- `tools/agenda-browser-check.mjs`: prueba visual/funcional aislada con datos simulados y todas las solicitudes Supabase interceptadas. Requiere Playwright y Chromium instalados.

## Despliegue

Aplicar migraciones aditivas de `tools/secure-agenda.sql` y `tools/calendar-sync.sql` antes de publicar la aplicación. `tools/secure-access.sql` cierra el acceso anónimo cuando la aplicación autenticada está lista. No restaurar el antiguo acceso público como método de reversión.

Las migraciones ya aplicadas están registradas en Supabase. No volver a ejecutar íntegramente los scripts como si fueran idempotentes: algunas políticas y triggers se crean una sola vez.

## Límites de esta entrega

No se inventaron datos faltantes ni se enriquecieron contactos automáticamente. La integración OAuth y la IA necesitan las configuraciones indicadas. No se pudieron recuperar los archivos de Edge Functions heredadas mediante el conector (dos errores internos); esas funciones requieren una revisión independiente antes de considerarlas auditadas completamente.
