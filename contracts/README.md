# Contracts

Los contratos son la fuente de verdad entre nodos y proveedores. El webhook de leads se
definirá con Zod en Fase 2 y se validará antes de leer Data Tables, llamar a Abstract o
escribir en HubSpot.

La respuesta de Company Enrichment de Abstract también se valida antes de que el workflow use
datos de enriquecimiento. No duplicar tipos a mano ni reemplazar la validación runtime con tipos de
TypeScript.
