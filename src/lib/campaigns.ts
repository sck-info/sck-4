import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  campaignAnswers,
  campaignContacts,
  campaignQuestions,
  campaignResponses,
  campaigns,
  campaignSections,
} from "@/db/schema";
import { validatePromptAnswer } from "@/lib/campaign-answer-validation";
import type { CampaignUpsertInput } from "@/lib/validators/campaign";

const campaignCodeAlphabet =
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const makeCode = () =>
  Array.from({ length: 8 }, () =>
    campaignCodeAlphabet.charAt(
      Math.floor(Math.random() * campaignCodeAlphabet.length),
    ),
  ).join("");

export async function generateCampaignCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = makeCode();
    const existing = await db
      .select({ id: campaigns.id })
      .from(campaigns)
      .where(eq(campaigns.code, code))
      .limit(1);
    if (!existing.length) return code;
  }
  return `${makeCode()}${Math.floor(Math.random() * 9)}`.slice(0, 8);
}

export function sanitizeCampaignHtml(value?: string | null) {
  if (!value) return null;
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .trim();
}

export function questionConfig(input: {
  questionType: string;
  options?: string[];
  maxRating?: number;
}) {
  if (
    input.questionType === "SINGLE_SELECT" ||
    input.questionType === "MULTI_SELECT"
  ) {
    const options = Array.from(
      new Set((input.options ?? []).map((option) => option.trim()).filter(Boolean)),
    );
    return { options };
  }

  if (input.questionType === "STAR_RATING") {
    return { maxRating: input.maxRating ?? 5 };
  }

  return {};
}

export function normalizeAnswerValue(question: {
  prompt: string;
  questionType: string;
  isRequired: boolean;
  config: unknown;
}, value: unknown) {
  const fail = (message: string) => ({ ok: false as const, message });
  const pass = (nextValue: unknown) => ({ ok: true as const, value: nextValue });
  const isEmpty =
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  if (isEmpty) {
    return question.isRequired ? fail("This question is required") : pass(null);
  }

  const config = (question.config ?? {}) as { options?: string[]; maxRating?: number };
  const options = Array.isArray(config.options) ? config.options : [];
  const otherOption = options.find((option) => option.trim().toLowerCase() === "other");
  const isOtherAnswer = (item: string) => {
    if (!otherOption) return false;
    return item.startsWith(`${otherOption}: `) && item.slice(otherOption.length + 2).trim().length > 0;
  };
  const isValidUrl = (input: string) => {
    try {
      const parsed = new URL(input);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  switch (question.questionType) {
    case "SHORT_ANSWER":
      if (typeof value !== "string") return fail("Enter text");
      const promptError = validatePromptAnswer(question, value);
      return promptError ? fail(promptError) : pass(value.trim());
    case "LONG_ANSWER":
      return typeof value === "string" ? pass(value.trim()) : fail("Enter text");
    case "DATE":
      return typeof value === "string" && !Number.isNaN(Date.parse(value))
        ? pass(value)
        : fail("Enter a valid date");
    case "NUMBER": {
      const numberValue = Number(value);
      return Number.isFinite(numberValue) ? pass(numberValue) : fail("Enter a number");
    }
    case "URL":
      return typeof value === "string" && isValidUrl(value)
        ? pass(value.trim())
        : fail("Enter a valid URL starting with http:// or https://");
    case "STAR_RATING": {
      const rating = Number(value);
      const maxRating = config.maxRating ?? 5;
      return Number.isInteger(rating) && rating >= 1 && rating <= maxRating
        ? pass(rating)
        : fail("Select a rating");
    }
    case "SINGLE_SELECT":
      return typeof value === "string" && (options.includes(value) || isOtherAnswer(value))
        ? pass(value)
        : fail("Select an option");
    case "MULTI_SELECT":
      return Array.isArray(value) &&
        value.every(
          (item) =>
            typeof item === "string" &&
            (options.includes(item) || isOtherAnswer(item)),
        )
        ? pass(value)
        : fail("Select valid options");
    default:
      return fail("Unsupported question type");
  }
}

export async function getCampaignBundle(campaignId: string) {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);

  if (!campaign) return null;

  const [contacts, sections, questions] = await Promise.all([
    db
      .select()
      .from(campaignContacts)
      .where(eq(campaignContacts.campaignId, campaignId))
      .orderBy(asc(campaignContacts.sortOrder)),
    db
      .select()
      .from(campaignSections)
      .where(eq(campaignSections.campaignId, campaignId))
      .orderBy(asc(campaignSections.sortOrder)),
    db
      .select()
      .from(campaignQuestions)
      .where(eq(campaignQuestions.campaignId, campaignId))
      .orderBy(asc(campaignQuestions.sortOrder)),
  ]);

  return { campaign, contacts, sections, questions };
}

export async function replaceCampaignStructure(
  campaignId: string,
  data: CampaignUpsertInput,
  database: any = db,
) {
  const existingResponses = await database
    .select({ id: campaignResponses.id })
    .from(campaignResponses)
    .where(eq(campaignResponses.campaignId, campaignId))
    .limit(1);
  const hasResponses = existingResponses.length > 0;

  await database.delete(campaignContacts).where(eq(campaignContacts.campaignId, campaignId));
  await database.delete(campaignSections).where(eq(campaignSections.campaignId, campaignId));

  if (!hasResponses) {
    await database.delete(campaignQuestions).where(eq(campaignQuestions.campaignId, campaignId));
  } else {
    await database
      .update(campaignQuestions)
      .set({ isDeleted: true })
      .where(eq(campaignQuestions.campaignId, campaignId));
  }

  if (data.contacts.length) {
    await database.insert(campaignContacts).values(
      data.contacts.map((contact, index) => ({
        campaignId,
        sortOrder: index,
        name: contact.name,
        phoneNumber: contact.phoneNumber || null,
        availabilityStatus: contact.availabilityStatus || null,
        timings: contact.timings || null,
      })),
    );
  }

  const sectionIdMap = new Map<string, string>();

  for (let sectionIndex = 0; sectionIndex < data.sections.length; sectionIndex += 1) {
    const section = data.sections[sectionIndex];
    const [insertedSection] = await database
      .insert(campaignSections)
      .values({
        campaignId,
        sortOrder: sectionIndex,
        title: section.title || `Section ${sectionIndex + 1}`,
        description: sanitizeCampaignHtml(section.description),
      })
      .returning();

    if (section.id) sectionIdMap.set(section.id, insertedSection.id);

    for (let questionIndex = 0; questionIndex < section.questions.length; questionIndex += 1) {
      const question = section.questions[questionIndex];
      const baseValues = {
        campaignId,
        sectionId: insertedSection.id,
        sortOrder: questionIndex,
        prompt: question.prompt,
        note: question.note || null,
        questionType: question.questionType,
        isRequired: question.isRequired,
        config: questionConfig(question),
        isDeleted: false,
      };

      if (hasResponses && question.id) {
        const [existingQuestion] = await database
          .select({ id: campaignQuestions.id, questionType: campaignQuestions.questionType })
          .from(campaignQuestions)
          .where(
            and(
              eq(campaignQuestions.id, question.id),
              eq(campaignQuestions.campaignId, campaignId),
            ),
          )
          .limit(1);

        if (existingQuestion && existingQuestion.questionType === question.questionType) {
          await database.update(campaignQuestions).set(baseValues).where(eq(campaignQuestions.id, question.id));
          continue;
        }
      }

      await database.insert(campaignQuestions).values(baseValues);
    }
  }
}

export async function questionsForValidation(campaignId: string) {
  return db
    .select()
    .from(campaignQuestions)
    .where(and(eq(campaignQuestions.campaignId, campaignId), eq(campaignQuestions.isDeleted, false)))
    .orderBy(asc(campaignQuestions.sortOrder));
}

export async function replaceResponseAnswers(
  responseId: string,
  questionIds: string[],
  answers: Record<string, unknown>,
) {
  if (questionIds.length) {
    await db
      .delete(campaignAnswers)
      .where(
        and(
          eq(campaignAnswers.responseId, responseId),
          inArray(campaignAnswers.questionId, questionIds),
        ),
      );
  }

  const values = questionIds.map((questionId) => ({
    responseId,
    questionId,
    value: answers[questionId] ?? null,
  }));

  if (values.length) await db.insert(campaignAnswers).values(values);
}
