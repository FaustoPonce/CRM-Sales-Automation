import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const workflowDirectory = path.resolve("workflows/exports");

const expectedFiles = new Set([
  "sales-crm-daily-metrics-export.json",
  "sales-crm-follow-up-scheduler.json",
  "sales-crm-qualify-and-route-lead.json",
  "sales-crm-review-overdue-follow-ups.json",
  "sales-crm-review-pending-task-recoveries.json",
]);

const sensitiveKeyPattern =
  /(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|private[_-]?key|encryption[_-]?key|service[_-]?key)/i;

const sensitiveValuePatterns = [
  /(?:Bearer\s+|hs_pat_|AIza|EAAG|sk-[A-Za-z0-9_-]{8,})/i,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /ngrok-free\.dev/i,
  /apps\.googleusercontent\.com/i,
];

const internalWorkflowKeys = new Set([
  "id",
  "versionId",
  "activeVersionId",
  "versionCounter",
  "createdAt",
  "updatedAt",
  "staticData",
  "meta",
  "nodeGroups",
  "shared",
  "sourceWorkflowId",
  "tags",
  "versionMetadata",
]);

async function findJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(directory, entry.name));
}

function assertSafe(value, location = "$") {
  if (typeof value === "string") {
    if (sensitiveValuePatterns.some((pattern) => pattern.test(value))) {
      throw new Error(`${location} contiene un valor sensible o específico de una instancia.`);
    }

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafe(item, `${location}[${index}]`));
    return;
  }

  if (value === null || typeof value !== "object") {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    const nestedLocation = `${location}.${key}`;

    if (key === "credentials" && Object.keys(nestedValue ?? {}).length > 0) {
      throw new Error(`${nestedLocation} no puede contener credenciales en un export.`);
    }

    if (
      sensitiveKeyPattern.test(key) &&
      nestedValue !== "" &&
      nestedValue !== null &&
      nestedValue !== undefined
    ) {
      throw new Error(`${nestedLocation} parece contener un secreto.`);
    }

    assertSafe(nestedValue, nestedLocation);
  }
}

function assertWorkflowShape(workflow, filePath) {
  if (workflow.active !== false) {
    throw new Error(`${filePath} debe declarar \"active\": false.`);
  }

  for (const key of internalWorkflowKeys) {
    if (Object.hasOwn(workflow, key)) {
      throw new Error(`${filePath} no puede contener el metadato interno ${key}.`);
    }
  }

  if (Object.keys(workflow.pinData ?? {}).length > 0) {
    throw new Error(`${filePath} no puede contener pin data.`);
  }

  for (const node of workflow.nodes ?? []) {
    if (Object.hasOwn(node, "id") || Object.hasOwn(node, "webhookId")) {
      throw new Error(`${filePath} contiene un ID interno de nodo.`);
    }

    if (node.type === "n8n-nodes-base.googleSheets") {
      const documentId = node.parameters?.documentId?.value;

      if (documentId !== "YOUR_GOOGLE_SHEETS_DOCUMENT_ID") {
        throw new Error(`${filePath} debe usar el placeholder de Google Sheets.`);
      }
    }
  }
}

async function checkWorkflow(filePath) {
  const content = await readFile(filePath, "utf8");
  const workflow = JSON.parse(content);

  assertWorkflowShape(workflow, filePath);
  assertSafe(workflow);
}

try {
  const files = await findJsonFiles(workflowDirectory);
  const actualFiles = new Set(files.map((filePath) => path.basename(filePath)));

  if (
    actualFiles.size !== expectedFiles.size ||
    [...expectedFiles].some((fileName) => !actualFiles.has(fileName))
  ) {
    throw new Error("Los exports versionados no coinciden con los cinco workflows documentados.");
  }

  for (const filePath of files) {
    await checkWorkflow(filePath);
  }

  console.log(`Exports verificados: ${files.length}.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
