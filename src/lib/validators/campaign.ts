import { z } from "zod";

export const campaignStatuses = ["DRAFT", "PUBLISHED", "CLOSED"] as const;
export const campaignQuestionTypes = [
  "SHORT_ANSWER",
  "LONG_ANSWER",
  "DATE",
  "NUMBER",
  "STAR_RATING",
  "SINGLE_SELECT",
  "MULTI_SELECT",
  "URL",
] as const;

export const campaignContactSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Contact name is required").max(120),
  phoneNumber: z.string().trim().max(40).optional().nullable(),
  availabilityStatus: z.string().trim().max(120).optional().nullable(),
  timings: z.string().trim().max(160).optional().nullable(),
});

export const campaignQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional().nullable(),
  prompt: z.string().trim().min(1, "Question prompt is required"),
  note: z.string().trim().optional().nullable(),
  questionType: z.enum(campaignQuestionTypes),
  isRequired: z.boolean().default(false),
  options: z.array(z.string().trim().min(1)).optional().default([]),
  maxRating: z.number().int().min(1).max(10).optional().default(5),
}).superRefine((question, ctx) => {
  if (
    question.questionType !== "SINGLE_SELECT" &&
    question.questionType !== "MULTI_SELECT"
  ) {
    return;
  }

  const normalizedOptions = question.options.map((option) =>
    option.trim().toLowerCase(),
  );
  const uniqueOptions = new Set(normalizedOptions);

  if (question.options.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Add at least one option",
      path: ["options"],
    });
  }

  if (uniqueOptions.size !== normalizedOptions.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Options must be unique",
      path: ["options"],
    });
  }
});

export const campaignSectionSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().optional().nullable(),
  questions: z.array(campaignQuestionSchema).default([]),
}).refine(
  (section) => section.questions.length > 0 || Boolean(section.description?.trim()),
  { message: "Section description is required when there are no questions", path: ["description"] },
);

export const campaignUpsertSchema = z.object({
  title: z.string().trim().min(2, "Campaign heading is required").max(200),
  description: z.string().trim().optional().nullable(),
  thankYouMessage: z
    .string()
    .trim()
    .max(1000, "Thank-you message is too long")
    .optional()
    .nullable(),
  allowMultipleSubmissions: z.boolean().default(false),
  contacts: z.array(campaignContactSchema).default([]),
  sections: z.array(campaignSectionSchema).min(1, "Add at least one section"),
});

export const campaignSubmitSchema = z.object({
  respondentName: z.string().trim().max(120).optional().nullable(),
  respondentEmail: z.string().trim().email("Enter a valid email").max(150).optional().nullable().or(z.literal("")),
  answers: z.record(z.string().uuid(), z.unknown()),
});

export const campaignResponseUpdateSchema = z.object({
  respondentName: z.string().trim().max(120).optional().nullable(),
  respondentEmail: z.string().trim().email("Enter a valid email").max(150).optional().nullable().or(z.literal("")),
  answers: z.record(z.string().uuid(), z.unknown()),
});

export type CampaignUpsertInput = z.infer<typeof campaignUpsertSchema>;
export type CampaignSubmitInput = z.infer<typeof campaignSubmitSchema>;
