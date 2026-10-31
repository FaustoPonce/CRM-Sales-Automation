# Contratos operativos de los workflows

## Qualify and Route Lead

- El webhook recibe el contrato validado por el servicio Zod local antes de producir efectos
  externos.
- `event_id` funciona como clave de idempotencia. Un duplicado no crea otro contacto, tarea,
  alerta ni evento de métrica.
- El scoring es determinístico y clasifica el lead en `high`, `medium` o `low`.
- Un lead `high` crea una tarea en HubSpot. La cola `sales_retry_queue` evita duplicarla si una
  ejecución debe recuperarse.
- La alerta Gmail de prioridad alta se ejecuta después de crear la tarea. Una falla al enviar el
  correo no revierte la sincronización de HubSpot ni la métrica; queda para revisión.
- Las métricas se registran como hechos sin PII en `sales_metrics_events`.

## Follow-up Scheduler

- Corre de lunes a viernes a las 10:00, zona horaria de Argentina.
- Busca tareas altas abiertas y vencidas, y las inserta una sola vez en
  `sales_follow_up_review_queue`.
- No envía correos ni modifica tareas: la resolución es manual.

## Daily Metrics Export

- Corre cada hora en el minuto 10.
- Entre la 01:10 y las 23:10 exporta el acumulado parcial del día actual.
- A las 00:10 exporta y cierra las métricas del día anterior.
- Upserta la fila del día en Google Sheets, cuya pestaña `daily_metrics` sirve como fuente de
  Looker Studio.

## Workflows manuales de revisión

- `Review Overdue Follow-ups` muestra la cola de seguimientos vencidos.
- `Review Pending Task Recoveries` muestra tareas que requieren recuperación.
- Ambos permanecen inactivos en el export y no generan efectos externos.

## Límites de datos y secretos

Las credenciales, los IDs de owners, el destinatario Gmail, el ID real del documento de Sheets,
las URLs de túnel y las filas de Data Tables pertenecen a la instancia local de n8n. No se
versionan en este repositorio.
