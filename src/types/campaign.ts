export type CampaignQuestionType =
  | "SHORT_ANSWER"
  | "LONG_ANSWER"
  | "DATE"
  | "NUMBER"
  | "STAR_RATING"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "URL";

export type CampaignStatus = "DRAFT" | "PUBLISHED" | "CLOSED";

export type CampaignQuestion = {
  id: string;
  campaignId?: string;
  sectionId: string | null;
  sortOrder: number;
  prompt: string;
  note?: string | null;
  questionType: CampaignQuestionType;
  isRequired: boolean;
  config: { options?: string[]; maxRating?: number } | null;
  isDeleted?: boolean;
};

export type CampaignSection = {
  id: string;
  campaignId?: string;
  sortOrder: number;
  title?: string | null;
  description?: string | null;
};

export type CampaignContact = {
  id?: string;
  name: string;
  phoneNumber?: string | null;
  availabilityStatus?: string | null;
  timings?: string | null;
};

export type Campaign = {
  id: string;
  code: string;
  title: string;
  description?: string | null;
  status: CampaignStatus;
  thankYouMessage?: string | null;
  allowMultipleSubmissions: boolean;
  createdBy?: string | null;
  createdByName?: string | null;
  responseCount?: number;
  createdAt?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
  closedAt?: string | null;
};

export type CampaignBundle = {
  campaign: Campaign;
  contacts: CampaignContact[];
  sections: CampaignSection[];
  questions: CampaignQuestion[];
};

export type CampaignResponseRow = {
  id: string;
  campaignId: string;
  respondentName?: string | null;
  respondentEmail?: string | null;
  submittedAt?: string | null;
  updatedAt?: string | null;
  answers: Record<string, unknown>;
};
