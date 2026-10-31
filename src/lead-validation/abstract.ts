import { z } from "zod";

const optionalText = z.string().trim().min(1).nullable().optional();
const optionalNonNegativeInteger = z.number().int().nonnegative().nullable().optional();

export const abstractCompanyEnrichmentResponseSchema = z
  .object({
    domain: z.string().trim().min(1),
    company_name: optionalText,
    industry: optionalText,
    employee_count: optionalNonNegativeInteger,
    year_founded: optionalNonNegativeInteger,
    city: optionalText,
    country: optionalText,
    linkedin_url: optionalText,
  })
  .passthrough();

export type AbstractCompanyEnrichment = z.infer<
  typeof abstractCompanyEnrichmentResponseSchema
>;

export type AbstractValidationResult =
  | {
      valid: true;
      data: AbstractCompanyEnrichment;
    }
  | {
      valid: false;
      error: {
        code: "INVALID_ABSTRACT_RESPONSE";
        message: string;
      };
    };

export function validateAbstractCompanyEnrichmentResponse(
  input: unknown,
): AbstractValidationResult {
  const parsed = abstractCompanyEnrichmentResponseSchema.safeParse(input);

  if (parsed.success) {
    return {
      valid: true,
      data: parsed.data,
    };
  }

  return {
    valid: false,
    error: {
      code: "INVALID_ABSTRACT_RESPONSE",
      message: "La respuesta de Abstract no cumple el contrato esperado.",
    },
  };
}
