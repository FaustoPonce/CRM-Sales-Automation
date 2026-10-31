import type { z } from "zod";

import { leadEventSchema, type LeadEvent } from "./schema.js";

type ValidationDetail = {
  field: string;
  message: string;
};

export type LeadValidationResult =
  | {
      valid: true;
      data: LeadEvent;
    }
  | {
      valid: false;
      error: {
        code: "INVALID_LEAD_EVENT";
        message: string;
        details: ValidationDetail[];
      };
    };

function toValidationDetails(issues: z.core.$ZodIssue[]): ValidationDetail[] {
  return issues.map((issue) => ({
    field: issue.path.map(String).join(".") || "body",
    message: issue.message,
  }));
}

export function validateLeadEvent(input: unknown): LeadValidationResult {
  const parsed = leadEventSchema.safeParse(input);

  if (parsed.success) {
    return {
      valid: true,
      data: parsed.data,
    };
  }

  return {
    valid: false,
    error: {
      code: "INVALID_LEAD_EVENT",
      message: "El evento de lead no cumple el contrato.",
      details: toValidationDetails(parsed.error.issues),
    },
  };
}
