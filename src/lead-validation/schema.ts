import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);

export const leadEventSchema = z
  .object({
    eventId: nonEmptyText,
    source: z.enum(["landing", "manual", "integration"]),
    firstName: nonEmptyText,
    lastName: nonEmptyText.optional(),
    email: z.string().trim().email(),
    companyName: nonEmptyText.optional(),
    companyDomain: nonEmptyText.optional(),
    jobTitle: nonEmptyText.optional(),
    serviceInterest: z.enum([
      "ai_automation",
      "crm_automation",
      "custom_integrations",
      "other",
    ]),
    timeframe: z.enum(["0_30_days", "31_90_days", "exploring", "unknown"]),
    message: nonEmptyText.optional(),
    consent: z.literal(true),
  })
  .strict();

export type LeadEvent = z.infer<typeof leadEventSchema>;
