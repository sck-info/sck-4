const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const namePattern = /^[A-Za-z\s.'-]+$/;

export type CampaignPromptValidationKind = "name" | "email" | "phone";

export function campaignPromptValidationKind(question: {
  prompt: string;
  questionType: string;
}): CampaignPromptValidationKind | null {
  if (question.questionType !== "SHORT_ANSWER") return null;

  switch (question.prompt.trim().toLowerCase()) {
    case "name":
      return "name";
    case "email":
      return "email";
    case "mobile":
    case "mobile number":
    case "phone":
    case "phone number":
      return "phone";
    default:
      return null;
  }
}

export function validatePromptAnswer(
  question: { prompt: string; questionType: string },
  value: string,
) {
  const kind = campaignPromptValidationKind(question);
  if (!kind) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (kind === "name") {
    const meaningfulLength = trimmed.replace(/[\s.'-]/g, "").length;
    return meaningfulLength >= 2 && namePattern.test(trimmed)
      ? null
      : "Enter a valid name.";
  }

  if (kind === "email") {
    return emailPattern.test(trimmed) ? null : "Enter a valid email address.";
  }

  const digits = trimmed.replace(/[\s()-]/g, "").replace(/^\+/, "");
  return /^\d{7,15}$/.test(digits) ? null : "Enter a valid phone number.";
}
