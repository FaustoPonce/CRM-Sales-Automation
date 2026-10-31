# CRM Sales Automation

Demo local de automatización comercial B2B. n8n recibe un lead, lo valida, evita
duplicados, lo enriquece, calcula una prioridad determinística, lo sincroniza con HubSpot y
registra métricas para Google Sheets y Looker Studio.

HubSpot es el CRM de este proyecto; este repositorio no incluye una aplicación CRM propia.

## Workflows

Los cinco workflows viven en la carpeta `CRM Sales Automation` de la instancia local de n8n.
Sus exports saneados están versionados en [`workflows/exports/`](workflows/exports/):

- `Sales CRM — Qualify and Route Lead`: webhook principal, validación Zod, deduplicación,
  enrichment, scoring, HubSpot, tarea para prioridad alta, alerta Gmail y métrica por evento.
- `Sales CRM — Follow-up Scheduler`: de lunes a viernes a las 10:00 de Argentina, identifica
  tareas altas vencidas y las deja en una cola de revisión manual.
- `Sales CRM — Daily Metrics Export`: cada hora en el minuto 10, consolida las métricas en
  Google Sheets; la corrida de las 00:10 cierra el día anterior.
- `Sales CRM — Review Overdue Follow-ups`: revisión manual de seguimientos vencidos.
- `Sales CRM — Review Pending Task Recoveries`: revisión manual de tareas que necesitan
  recuperación.

Los JSON de este repositorio están inactivos, no contienen credenciales, IDs internos,
destinatarios, URLs de túnel ni datos reales. Para importar uno, hay que volver a asociar las
credenciales y la configuración local de n8n.

## Desarrollo local

Requisitos: Node 22 y la instancia compartida de n8n disponible en `http://127.0.0.1:5678`.
La instancia, sus credenciales y el volumen `n8n_data` viven fuera de este repo.

```powershell
npm run check
```

No hay Compose de n8n ni Qdrant para este proyecto. Qdrant pertenece a AI Receptionist y no
forma parte de este alcance. El único servicio propio es el validador Zod local:

```powershell
docker compose up --build -d lead-validator
```

n8n debe llamarlo por `http://host.docker.internal:8787`. El puerto se publica solo en
`127.0.0.1`, por lo que no queda expuesto a la red.

## Configuración local de n8n

Después de importar los exports, recrear solamente en la instancia local:

1. Las credenciales de HubSpot, Abstract Company Enrichment, Gmail y Google Sheets.
2. Las Data Tables `sales_crm_owner_routing`, `processed_lead_events`, `sales_retry_queue`,
   `sales_follow_up_review_queue`, `sales_metrics_events` y `sales_alert_config`.
3. Los IDs reales de owners en `sales_crm_owner_routing` y el destinatario de alertas en
   `sales_alert_config`.
4. El ID del documento de Google Sheets en el nodo correspondiente: el export usa el
   placeholder `YOUR_GOOGLE_SHEETS_DOCUMENT_ID`.
5. La variable del contenedor compartido `LEAD_VALIDATOR_URL=http://host.docker.internal:8787`.

No copiar secretos, IDs de owners, destinatarios ni URLs de túnel a `.env.example`, fixtures,
exports o documentación. `.env` está ignorado por Git y solo sirve para desarrollo local del
validador.

## Verificación antes de versionar

`npm run check` ejecuta typecheck, lint, build, tests y revisa los exports: exige los cinco
archivos esperados, que estén inactivos y libres de credenciales, secretos, IDs internos, pin
data y datos específicos de una instancia.
