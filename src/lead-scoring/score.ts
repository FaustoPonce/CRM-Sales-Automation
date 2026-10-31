import { z } from "zod";

import {
  abstractCompanyEnrichmentResponseSchema,
  type AbstractCompanyEnrichment,
} from "../lead-validation/abstract.js";
import { leadEventSchema, type LeadEvent } from "../lead-validation/schema.js";

const scoreRequestSchema = z
  .object({
    lead: leadEventSchema,
    company: abstractCompanyEnrichmentResponseSchema.optional(),
  })
  .strict();

export type LeadPriority = "high" | "medium" | "low";

export type LeadScore = {
  score: number;
  priority: LeadPriority;
};

export type LeadScoreRequest = z.infer<typeof scoreRequestSchema>;

const timeframePoints = {
  "0_30_days": 40,
  "31_90_days": 25,
  exploring: 10,
  unknown: 0,
} as const;

function priorityFor(score: number): LeadPriority {
  if (score >= 70) {
    return "high";
  }

  if (score >= 40) {
    return "medium";
  }

  return "low";
}

export function calculateLeadScore(
  lead: LeadEvent,
  company?: AbstractCompanyEnrichment,
): LeadScore {
  const score =
    timeframePoints[lead.timeframe] +
    (lead.serviceInterest === "other" ? 0 : 15) +
    (lead.jobTitle === undefined ? 0 : 10) +
    (lead.message === undefined ? 0 : 10) +
    (lead.companyDomain === undefined ? 0 : 10) +
    (company?.industry === undefined || company.industry === null ? 0 : 5) +
    (company?.employee_count === undefined || company.employee_count === null ? 0 : 10);

  return { score, priority: priorityFor(score) };
}

export type LeadScoreValidationResult =
  | {
      valid: true;
      data: LeadScore;
    }
  | {
      valid: false;
      error: {
        code: "INVALID_LEAD_SCORE_REQUEST";
        message: string;
      };
    };

export function scoreLeadRequest(input: unknown): LeadScoreValidationResult {
  const parsed = scoreRequestSchema.safeParse(input);

  if (!parsed.success) {
    return {
      valid: false,
      error: {
        code: "INVALID_LEAD_SCORE_REQUEST",
        message: "Los datos del lead no permiten calcular el score.",
      },
    };
  }

  return {
    valid: true,
    data: calculateLeadScore(parsed.data.lead, parsed.data.company),
  };
}
