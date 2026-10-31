# CRM Sales Automation

Convenciones y decisiones: leer `AGENTS.md` de
`OBJETIVOS/Developer-Brain/Developer-Brain/` y seguir su tabla de ruteo. Lo de acá abajo
es solo lo propio de este repo.

## Producto

Demo de portfolio de una automatización comercial B2B. n8n recibe un lead, lo valida y
deduplica, lo enriquece, calcula un score determinístico, sincroniza HubSpot, crea follow-ups
de prueba, envía una alerta Gmail para prioridad alta y exporta métricas a Google Sheets para
Looker Studio. No usa IA, embeddings ni Qdrant.

## Instancia compartida

- n8n corre fuera de este repo, en el contenedor compartido `n8n`, con estado en el volumen
  `n8n_data` y acceso local por `127.0.0.1:5678`.
- No crear otro contenedor de n8n, Compose, Qdrant ni volumen para este proyecto. No cambiar
  la imagen, las variables existentes, el volumen ni la configuración de los proyectos existentes.
  La única variable propia autorizada en el contenedor compartido es
  `LEAD_VALIDATOR_URL=http://host.docker.internal:8787`: permite que n8n llame al validador
  Zod local. Agregarla requiere confirmación, preservar toda la configuración existente,
  reiniciar n8n y conservar el contenedor previo como rollback.
- En n8n, todos los workflows de este repo deben vivir en la carpeta `CRM Sales Automation`
  del espacio Personal. No crear nuevos workflows en la raíz.
- Qdrant pertenece a AI Receptionist y no forma parte de esta automatización.
- El validador Zod es el único contenedor de este repo: escucha solo en `127.0.0.1:8787`.
  n8n lo alcanza por `host.docker.internal`; no se publica en Internet ni comparte red o
  volumen con AI Receptionist.
- Si el MCP de n8n está disponible, usarlo para crear, editar e inspeccionar workflows y
  Data Tables. Las credenciales se crean manualmente en n8n y nunca se exponen al MCP.

## Seguridad y fases

- Construir workflows siempre como borradores inactivos. No publicar, activar triggers,
  ejecutar workflows ni producir efectos externos sin confirmación explícita para la fase.
- HubSpot usa una Service Key manual; Apollo, Gmail y Google Sheets usan credenciales manuales.
  No guardar tokens, client secrets, IDs reales de owners, destinatarios ni URLs de túnel en
  archivos, nodos, exports o fixtures. Los IDs de owners viven solo en la Data Table local
  `sales_crm_owner_routing`.
- Los exports en `workflows/exports/` deben permanecer inactivos, sin credenciales, IDs internos,
  pin data, ejecuciones ni datos reales. `npm run check` los valida antes de versionarlos.
- El contrato del webhook se implementa con Zod antes de cualquier efecto externo. El workflow
  llama al validador local y corta con su error estructurado si la respuesta no es válida.

## Estructura y comandos

- `workflows/exports/` — exports saneados de workflows de n8n.
- `workflows/private/` — copias de trabajo locales excluidas de Git.
- `contracts/` — contratos versionados de entradas y salidas.
- `fixtures/` — datos de prueba seguros, nunca datos de personas o empresas reales.
- `docs/` — decisiones operativas y guías de importación.
- `src/lead-validation/` — contrato Zod y adaptador HTTP del validador local.
- `npm run check` — ejecuta typecheck, lint, build, tests y valida los exports.

## Estado actual

Los cinco workflows existentes son `Sales CRM — Qualify and Route Lead`,
`Sales CRM — Follow-up Scheduler`, `Sales CRM — Daily Metrics Export`,
`Sales CRM — Review Overdue Follow-ups` y `Sales CRM — Review Pending Task Recoveries`.

Sus Data Tables locales son `sales_crm_owner_routing`, `processed_lead_events`,
`sales_retry_queue`, `sales_follow_up_review_queue`, `sales_metrics_events` y
`sales_alert_config`. No agregar sus filas al repositorio.

No existe un deploy web: la demo se ejecuta localmente sobre la instancia compartida de n8n.
Cloudflare Tunnel solo se considera si la demo requiere un webhook externo.
