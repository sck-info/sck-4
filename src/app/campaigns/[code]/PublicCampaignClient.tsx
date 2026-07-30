"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useRealtime } from "@/hooks/useRealtime";
import type { CampaignBundle, CampaignQuestion } from "@/types/campaign";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Star, Phone, Clock, UserRound, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { validatePromptAnswer } from "@/lib/campaign-answer-validation";

type Props = {
  code: string;
  initialBundle: CampaignBundle | null;
  initialMessage: string;
};

const emptyAnswer = (question: CampaignQuestion) =>
  question.questionType === "MULTI_SELECT" ? [] : "";

function optionsFor(question: CampaignQuestion) {
  return Array.isArray(question.config?.options) ? question.config.options : [];
}

function isOtherOption(option: string) {
  return option.trim().toLowerCase() === "other";
}

function otherOptionFor(question: CampaignQuestion) {
  return optionsFor(question).find(isOtherOption);
}

function isOtherAnswer(option: string | undefined, value: string) {
  return Boolean(option) && (value === option || value.startsWith(`${option}: `));
}

function otherAnswerText(option: string | undefined, value: unknown) {
  if (!option || typeof value !== "string" || !value.startsWith(`${option}: `)) return "";
  return value.slice(option.length + 2);
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateAnswer(question: CampaignQuestion, value: unknown) {
  const isEmpty =
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  if (isEmpty) {
    return question.isRequired ? "This question is required." : null;
  }

  if (question.questionType === "URL") {
    return typeof value === "string" && isValidUrl(value.trim())
      ? null
      : "Enter a valid URL starting with http:// or https://.";
  }

  if (question.questionType === "SHORT_ANSWER" && typeof value === "string") {
    return validatePromptAnswer(question, value);
  }

  if (question.questionType === "SINGLE_SELECT") {
    const otherOption = otherOptionFor(question);
    if (
      typeof value === "string" &&
      isOtherAnswer(otherOption, value) &&
      !otherAnswerText(otherOption, value).trim()
    ) {
      return "Please specify Other.";
    }
  }

  if (question.questionType === "MULTI_SELECT") {
    const otherOption = otherOptionFor(question);
    const selectedValues = Array.isArray(value) ? value : [];
    const selectedOther = selectedValues.find(
      (item) => typeof item === "string" && isOtherAnswer(otherOption, item),
    );
    if (
      typeof selectedOther === "string" &&
      !otherAnswerText(otherOption, selectedOther).trim()
    ) {
      return "Please specify Other.";
    }
  }

  return null;
}

export function PublicCampaignClient({ code, initialBundle, initialMessage }: Props) {
  const router = useRouter();
  const [bundle, setBundle] = useState<CampaignBundle | null>(initialBundle);
  const [message, setMessage] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draftHydrated, setDraftHydrated] = useState(false);

  const storageKey = `campaign:${code}:public`;

  const loadCampaign = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/code/${code}`);
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(data.message || "This campaign is unavailable.");
        setBundle(null);
        return;
      }
      setBundle(data);
      setMessage("");
    } catch {
      setBundle(null);
      setMessage("Unable to load this campaign. Please try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    loadCampaign({ silent: true });
  }, [loadCampaign]);

  // Realtime updates
  useRealtime(["campaigns"], (payload) => {
    if (payload.eventType === "DELETE") {
      const oldRow = payload.old as any;
      const isCurrent = oldRow && (oldRow.code === code || oldRow.id === bundle?.campaign.id);
      if (isCurrent) {
        setBundle(null);
        setMessage("This campaign has been deleted.");
      }
      return;
    }

    const nextRow = payload.new as any;
    if (!nextRow || !nextRow.id) return;
    const isCurrent = nextRow.code === code || nextRow.id === bundle?.campaign.id;
    if (!isCurrent) return;

    if (nextRow.status !== "PUBLISHED") {
      setBundle(null);
      setMessage("This campaign is no longer accepting responses.");
      return;
    }

    loadCampaign({ silent: true });
  });

  // Draft answers hydration from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      try {
        setAnswers(JSON.parse(saved));
      } catch {
        sessionStorage.removeItem(storageKey);
      }
    }
    setDraftHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!draftHydrated) return;
    sessionStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, draftHydrated, storageKey]);

  const setAnswer = (questionId: string, value: unknown) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const visibleQuestions = useMemo(
    () => (bundle?.questions || []).filter((q) => !q.isDeleted),
    [bundle?.questions]
  );

  const sections = useMemo(() => {
    const rawSections = bundle?.sections || [];
    if (rawSections.length === 0) {
      return [{ id: "default", title: "Default Section", description: "", questions: visibleQuestions }];
    }
    return rawSections.map((sec) => ({
      ...sec,
      questions: visibleQuestions.filter((q) => q.sectionId === sec.id),
    }));
  }, [bundle?.sections, visibleQuestions]);

  const activeSection = sections[sectionIndex] || sections[0];
  const activeQuestions = activeSection?.questions || [];

  const activeErrors = useMemo(
    () =>
      Object.fromEntries(
        activeQuestions
          .map((q) => [q.id, validateAnswer(q, answers[q.id] ?? emptyAnswer(q))] as const)
          .filter(([, msg]) => Boolean(msg))
      ) as Record<string, string>,
    [activeQuestions, answers]
  );

  const allErrors = useMemo(
    () =>
      Object.fromEntries(
        visibleQuestions
          .map((q) => [q.id, validateAnswer(q, answers[q.id] ?? emptyAnswer(q))] as const)
          .filter(([, msg]) => Boolean(msg))
      ) as Record<string, string>,
    [answers, visibleQuestions]
  );

  const isLastSection = sectionIndex >= sections.length - 1;

  const goNext = () => {
    setAttempted(true);
    if (Object.keys(activeErrors).length > 0) {
      toast.error("Please fill in all required answers correctly.");
      return;
    }
    setAttempted(false);
    setSectionIndex((curr) => Math.min(curr + 1, sections.length - 1));
  };

  const goBack = () => {
    setAttempted(false);
    setSectionIndex((curr) => Math.max(0, curr - 1));
  };

  const submit = async () => {
    setAttempted(true);
    if (Object.keys(activeErrors).length > 0) {
      toast.error("Please fill in all required answers correctly.");
      return;
    }
    if (Object.keys(allErrors).length > 0) {
      const firstErrorSec = sections.findIndex((sec) =>
        sec.questions.some((q) => allErrors[q.id])
      );
      if (firstErrorSec >= 0) {
        setSectionIndex(firstErrorSec);
      }
      toast.error("Please complete preceding sections.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/campaigns/code/${code}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.message || "Failed to submit response.");
        return;
      }

      sessionStorage.removeItem(storageKey);
      toast.success("Response submitted successfully!");
      router.push(`/campaigns/${code}/thank-you`);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] text-sm text-[#5a5e7a]">
        <div className="flex flex-col items-center gap-2">
          <span className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] px-4">
        <div className="w-full max-w-md bg-white border border-[#e8dcc4] p-8 text-center rounded-3xl shadow-lg">
          <div className="flex justify-center mb-6">
            <span className="font-display font-bold text-lg tracking-wider text-[#1c1f4a]">
              Sharath Kancherla
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#1c1f4a]">Campaign Unavailable</h1>
          <p className="mt-3 text-xs text-[#5a5e7a] leading-relaxed">{message || "This form is no longer accepting responses."}</p>
          <Button asChild className="mt-6 w-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl text-xs h-10 font-bold">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  const renderQuestion = (q: CampaignQuestion) => {
    const value = answers[q.id] ?? emptyAnswer(q);
    const validationMessage = validateAnswer(q, value);
    const showError = attempted && Boolean(validationMessage);

    return (
      <div
        key={q.id}
        className={`rounded-2xl border p-5 bg-[#faf7f2]/10 transition-all ${
          showError ? "border-red-300 bg-red-50/10" : "border-[#e8dcc4]/50 hover:border-[#e8dcc4]"
        }`}
      >
        <Label className="text-xs font-bold text-[#1c1f4a] flex items-center gap-1 flex-wrap">
          {q.prompt}
          {q.isRequired && <span className="text-red-500">*</span>}
        </Label>
        {q.note && (
          <p className="mt-1 text-[11px] text-[#5a5e7a] font-semibold italic">
            {q.note}
          </p>
        )}

        <div className="mt-3">
          {q.questionType === "SHORT_ANSWER" && (
            <Input
              value={String(value ?? "")}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="Your answer"
              className="bg-white border-[#e8dcc4] text-xs h-10 rounded-xl"
            />
          )}

          {q.questionType === "LONG_ANSWER" && (
            <textarea
              value={String(value ?? "")}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="Your answer"
              rows={4}
              className="w-full p-3 bg-white border border-[#e8dcc4] text-xs rounded-xl outline-none focus-visible:ring-1 focus-visible:ring-[#b86a16]"
            />
          )}

          {q.questionType === "DATE" && (
            <div className="w-full relative [&>button]:w-full [&>button]:h-10 [&>button]:rounded-xl [&>button]:border-[#e8dcc4] [&>button]:justify-start">
              <DatePicker
                value={value ? new Date(String(value)) : undefined}
                onChange={(date) => {
                  if (!date) {
                    setAnswer(q.id, "");
                  } else {
                    const yyyy = date.getFullYear();
                    const mm = String(date.getMonth() + 1).padStart(2, "0");
                    const dd = String(date.getDate()).padStart(2, "0");
                    setAnswer(q.id, `${yyyy}-${mm}-${dd}`);
                  }
                }}
                placeholder="Pick a date"
              />
            </div>
          )}

          {q.questionType === "NUMBER" && (
            <Input
              type="text"
              value={String(value ?? "")}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="Enter a number"
              className="bg-white border-[#e8dcc4] text-xs h-10 rounded-xl"
            />
          )}

          {q.questionType === "URL" && (
            <Input
              type="url"
              value={String(value ?? "")}
              onChange={(e) => setAnswer(q.id, e.target.value)}
              placeholder="https://example.com"
              className="bg-white border-[#e8dcc4] text-xs h-10 rounded-xl"
            />
          )}

          {q.questionType === "STAR_RATING" && (
            <div className="flex gap-1.5">
              {Array.from({ length: q.config?.maxRating ?? 5 }).map((_, idx) => {
                const starVal = idx + 1;
                const isSelected = Number(value) >= starVal;
                return (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => setAnswer(q.id, starVal)}
                    className={`p-1.5 rounded-full border transition-all ${
                      isSelected
                        ? "border-[#b86a16] bg-[#b86a16]/10 text-[#b86a16]"
                        : "border-[#e8dcc4] hover:border-[#b86a16]/50 text-gray-300"
                    }`}
                  >
                    <Star className={`w-5 h-5 ${isSelected ? "fill-current" : ""}`} />
                  </button>
                );
              })}
            </div>
          )}

          {q.questionType === "SINGLE_SELECT" && (
            (() => {
              const otherOpt = otherOptionFor(q);
              const selectedVal = String(value ?? "");

              return (
                <div className="flex flex-col gap-2.5">
                  {optionsFor(q).map((option, idx) => {
                    const id = `${q.id}-single-${idx}`;
                    const isChecked = selectedVal === option || (isOtherAnswer(otherOpt, selectedVal) && option === otherOpt);
                    return (
                      <div key={`${option}-${idx}`} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={q.id}
                          id={id}
                          checked={isChecked}
                          onChange={() => setAnswer(q.id, option)}
                          className="w-3.5 h-3.5 border-[#e8dcc4] text-[#1c1f4a] focus:ring-[#b86a16] cursor-pointer"
                        />
                        <Label htmlFor={id} className="text-xs font-medium text-[#1c1f4a] cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    );
                  })}
                  {otherOpt && isOtherAnswer(otherOpt, selectedVal) && (
                    <Input
                      value={otherAnswerText(otherOpt, value)}
                      onChange={(e) => setAnswer(q.id, `${otherOpt}: ${e.target.value}`)}
                      placeholder="Please specify"
                      className="mt-1 text-xs h-9 rounded-xl border-[#e8dcc4] bg-white"
                    />
                  )}
                </div>
              );
            })()
          )}

          {q.questionType === "MULTI_SELECT" && (
            <div className="space-y-2">
              {optionsFor(q).map((option, idx) => {
                const selectedList = Array.isArray(value) ? value : [];
                const isChecked = selectedList.some(
                  (item) => item === option || (typeof item === "string" && isOtherAnswer(option, item))
                );
                const id = `${q.id}-multi-${idx}`;

                return (
                  <div key={`${option}-${idx}`} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          setAnswer(
                            q.id,
                            checked
                              ? [...selectedList, option]
                              : selectedList.filter(
                                  (item) =>
                                    item !== option &&
                                    !(typeof item === "string" && isOtherAnswer(option, item))
                                )
                          );
                        }}
                      />
                      <Label htmlFor={id} className="text-xs font-medium text-[#1c1f4a] cursor-pointer">
                        {option}
                      </Label>
                    </div>
                    {isOtherOption(option) && isChecked && (
                      <Input
                        value={otherAnswerText(
                          option,
                          selectedList.find((item) => typeof item === "string" && isOtherAnswer(option, item))
                        )}
                        onChange={(e) =>
                          setAnswer(
                            q.id,
                            selectedList.map((item) =>
                              typeof item === "string" && isOtherAnswer(option, item)
                                ? `${option}: ${e.target.value}`
                                : item
                            )
                          )
                        }
                        placeholder="Please specify"
                        className="mt-1 text-xs h-9 rounded-xl border-[#e8dcc4] bg-white max-w-sm"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showError && (
          <p className="mt-2 text-xs font-semibold text-red-500">{validationMessage}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#faf7f2] py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Branding header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#e8dcc4]/60">
          <span className="font-display font-bold text-base tracking-wider text-[#1c1f4a]">
            Sharath Kancherla
          </span>
          <span className="text-[10px] font-bold tracking-widest text-[#b86a16] uppercase bg-[#b86a16]/10 px-3 py-1 rounded-full">
            Campaign Form
          </span>
        </div>

        {/* Campaign Info Card */}
        <section className="bg-white border border-[#e8dcc4] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <h1 className="text-2xl sm:text-3xl font-light font-display text-[#1c1f4a] leading-tight">
            {bundle.campaign.title}
          </h1>
          {bundle.campaign.description && (
            <div
              className="text-xs sm:text-sm text-[#5a5e7a] leading-relaxed prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: bundle.campaign.description }}
            />
          )}
        </section>

        {/* Form Wizard active section */}
        {activeSection && (
          <section className="bg-white border border-[#e8dcc4] rounded-3xl p-6 shadow-sm space-y-5">
            {sections.length > 1 && (
              <div className="flex items-center justify-between pb-3 border-b border-[#faf7f2]">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#b86a16]">
                    Section {sectionIndex + 1} of {sections.length}
                  </span>
                  <h2 className="text-base font-bold text-[#1c1f4a] mt-1">
                    {activeSection.title || `Section ${sectionIndex + 1}`}
                  </h2>
                  {activeSection.description && (
                    <div
                      className="text-xs text-[#5a5e7a] mt-1.5 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: activeSection.description }}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {activeQuestions.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#5a5e7a] italic">
                  No questions in this section. Click Next to continue.
                </div>
              ) : (
                activeQuestions.map(renderQuestion)
              )}
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-[#faf7f2] gap-3">
              {sectionIndex > 0 ? (
                <Button
                  type="button"
                  onClick={goBack}
                  variant="outline"
                  className="border-[#e8dcc4] text-[#1c1f4a] rounded-xl hover:bg-[#faf7f2]/50 text-xs font-semibold px-4 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                </Button>
              ) : (
                <span />
              )}

              {isLastSection ? (
                <Button
                  type="button"
                  disabled={submitting}
                  onClick={submit}
                  className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl text-xs font-semibold px-5 cursor-pointer h-9 shadow-sm"
                >
                  {submitting ? "Submitting..." : "Submit Form"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={goNext}
                  className="bg-[#b86a16] hover:bg-[#b86a16]/90 text-white rounded-xl text-xs font-semibold px-5 cursor-pointer h-9 shadow-sm"
                >
                  Next <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              )}
            </div>
          </section>
        )}

        {/* Contacts details list */}
        {bundle.contacts.length > 0 && (
          <section className="bg-white border border-[#e8dcc4] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wider">
              Need help with this form?
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {bundle.contacts.map((contact, idx) => (
                <div key={idx} className="border border-[#e8dcc4]/50 bg-[#faf7f2]/20 p-4 rounded-2xl space-y-1.5">
                  <div className="text-xs font-bold text-[#1c1f4a] flex items-center gap-1.5">
                    <UserRound className="w-3.5 h-3.5 text-[#b86a16]" /> {contact.name}
                  </div>
                  {contact.phoneNumber && (
                    <div className="text-xs text-[#5a5e7a] flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#5a5e7a]" /> {contact.phoneNumber}
                    </div>
                  )}
                  {(contact.availabilityStatus || contact.timings) && (
                    <div className="text-[10px] text-[#5a5e7a] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#5a5e7a]" />
                      {[contact.availabilityStatus, contact.timings].filter(Boolean).join(" - ")}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="text-center text-[10px] text-[#5a5e7a]/80 space-y-1.5 pt-4">
          <p>Never submit passwords, pins, or sensitive credit card details through this form.</p>
          <p>© {new Date().getFullYear()} Sharath Kancherla. All Rights Reserved.</p>
        </footer>
      </div>
    </div>
  );
}
