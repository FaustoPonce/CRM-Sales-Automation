# Workflows de n8n

Los archivos de `exports/` son copias portables y saneadas de los workflows de la carpeta
local `CRM Sales Automation`. Están inactivos a propósito: importar un JSON no debe activar un
webhook, un scheduler ni un envío de correo.

## Orden de importación

1. Crear las Data Tables y las credenciales en n8n.
2. Importar los cinco JSON de `exports/`.
3. Reasociar las credenciales manuales a los nodos que las requieren.
4. Configurar los IDs locales de owners, el destinatario de alertas y el documento de Google
   Sheets fuera del export.
5. Probar los workflows como borradores y activar solo los que correspondan a la instancia.

## Data Tables locales

| Tabla | Uso |
| --- | --- |
| `sales_crm_owner_routing` | Resuelve owners de HubSpot por rol; guarda IDs locales. |
| `processed_lead_events` | Idempotencia de los eventos de entrada. |
| `sales_retry_queue` | Recuperación manual de tareas de HubSpot no confirmadas. |
| `sales_follow_up_review_queue` | Seguimientos altos vencidos para revisión manual. |
| `sales_metrics_events` | Hechos agregados que alimentan las métricas. |
| `sales_alert_config` | Configuración local del destinatario y estado de las alertas Gmail. |

Ninguna fila de estas tablas se exporta al repositorio.

## Exports incluidos

- `sales-crm-qualify-and-route-lead.json`
- `sales-crm-follow-up-scheduler.json`
- `sales-crm-daily-metrics-export.json`
- `sales-crm-review-overdue-follow-ups.json`
- `sales-crm-review-pending-task-recoveries.json`

Los exports no incluyen credenciales, datos de ejecución, pin data, IDs internos, destinatarios
ni identificadores reales del documento de Sheets.
