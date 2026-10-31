import assert from "node:assert/strict";
import test from "node:test";

import { validateAbstractCompanyEnrichmentResponse } from "./abstract.js";
import { scoreLeadRequest } from "../lead-scoring/score.js";
import { validateLeadEvent } from "./validate.js";

const safeLead = {
  eventId: "evt-safe-001",
  source: "manual",
  firstName: "Demo",
  email: "lead@example.test",
  serviceInterest: "crm_automation",
  timeframe: "31_90_days",
  consent: true,
};

test("acepta un lead que cumple el contrato", () => {
  const result = validateLeadEvent(safeLead);

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.data.email, "lead@example.test");
  }
});

test("rechaza un lead sin consentimiento", () => {
  const result = validateLeadEvent({ ...safeLead, consent: false });

  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.error.code, "INVALID_LEAD_EVENT");
    assert.ok(result.error.details.some((detail) => detail.field === "consent"));
  }
});

test("rechaza campos no declarados", () => {
  const result = validateLeadEvent({ ...safeLead, unexpected: "value" });

  assert.equal(result.valid, false);
});

test("acepta una respuesta de Abstract con datos parciales", () => {
  const result = validateAbstractCompanyEnrichmentResponse({
    domain: "example.com",
    company_name: "Example",
    employee_count: 42,
    industry: null,
    linkedin_url: "linkedin.com/company/example",
  });

  assert.equal(result.valid, true);
});

test("rechaza una respuesta de Abstract sin dominio", () => {
  const result = validateAbstractCompanyEnrichmentResponse({ company_name: "Example" });

  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.error.code, "INVALID_ABSTRACT_RESPONSE");
  }
});

test("calcula un score determinístico con intención y enriquecimiento", () => {
  const result = scoreLeadRequest({
    lead: {
      ...safeLead,
      companyDomain: "example.test",
      jobTitle: "Founder",
      message: "Quiero automatizar el CRM este mes.",
      timeframe: "0_30_days",
    },
    company: {
      domain: "example.test",
      industry: "Software",
      employee_count: 42,
    },
  });

  assert.deepEqual(result, {
    valid: true,
    data: { score: 100, priority: "high" },
  });
});

test("no inventa puntos cuando faltan datos opcionales", () => {
  const result = scoreLeadRequest({ lead: safeLead });

  assert.deepEqual(result, {
    valid: true,
    data: { score: 40, priority: "medium" },
  });
});

test("rechaza una solicitud de score con datos no validados", () => {
  const result = scoreLeadRequest({ lead: { ...safeLead, consent: false } });

  assert.equal(result.valid, false);
  if (!result.valid) {
    assert.equal(result.error.code, "INVALID_LEAD_SCORE_REQUEST");
  }
});
