"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRealtime } from "@/hooks/useRealtime";
import {
  Calendar,
  Clock,
  Loader2,
  Eye,
  MessageSquare,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatDate, formatTimeRange } from "@/lib/format";

function SeekerBookingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const tabFilter = (searchParams.get("tab") || "all") as
    | "all"
    | "active"
    | "past";
  const page = Number(searchParams.get("page") || "1");

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [firstLoad, setFirstLoad] = useState(true);
  const [sortedQuestions, setSortedQuestions] = useState<any[]>([]);

  const [viewResponsesBooking, setViewResponsesBooking] = useState<any | null>(
    null,
  );
  const [allQuestions, setAllQuestions] = useState<Record<string, string>>({});
  const [cancelBooking, setCancelBooking] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [feedbackBooking, setFeedbackBooking] = useState<any | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!viewResponsesBooking) {
      setSortedQuestions([]);
      return;
    }
    const fetchSortedQuestions = async () => {
      try {
        const subId =
          viewResponsesBooking.subCategoryId ||
          viewResponsesBooking.subCategory?.id;
        if (!subId) return;
        const res = await fetch(`/api/sub-categories/${subId}/questions`);
        if (res.ok) {
          const json = await res.json();
          setSortedQuestions(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load sorted questions:", err);
      }
    };
    fetchSortedQuestions();
  }, [viewResponsesBooking]);

  const handleTabChange = (newTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", newTab);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  const fetchBookings = useCallback(
    async (isSilent = false) => {
      if (!isSilent) {
        setLoading(true);
      }
      try {
        const groupParam =
          tabFilter !== "all" ? `&statusGroup=${tabFilter}` : "";
        const res = await fetch(
          `/api/bookings?page=${page}&limit=5${groupParam}`,
        );
        if (!res.ok) throw new Error("Failed to load bookings");
        const json = await res.json();

        setBookings(json.data || []);
        setTotalPages(json.pagination?.totalPages || 1);
      } catch (err) {
        console.error(err);
        toast.error("Error loading your bookings.");
      } finally {
        setLoading(false);
        setFirstLoad(false);
      }
    },
    [page, tabFilter],
  );

  useEffect(() => {
    fetchBookings(firstLoad);
  }, [fetchBookings, firstLoad]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch("/api/questions?limit=500");
        if (res.ok) {
          const json = await res.json();
          const qMap: Record<string, string> = {};
          (json.data || []).forEach((q: any) => {
            qMap[q.id] = q.fieldLabel;
          });
          setAllQuestions(qMap);
        }
      } catch (err) {
        console.error("Failed to load questions:", err);
      }
    };
    fetchQuestions();
  }, []);

  useRealtime(["bookings", "feedbacks"], () => fetchBookings(true));

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelBooking) return;
    if (!cancelReason.trim()) {
      toast.error("Please supply a reason for your cancellation request.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: cancelBooking.id,
          reason: cancelReason,
        }),
      });

      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error || "Failed to submit cancellation request");

      toast.success("Cancellation request submitted successfully.");
      setCancelBooking(null);
      setCancelReason("");
      fetchBookings(true);
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackBooking) return;
    if (!feedbackText.trim()) {
      toast.error("Please enter a short review.");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: feedbackBooking.id,
          rating: feedbackRating,
          rawFeedback: feedbackText,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit feedback.");

      toast.success("Thank you for sharing your feedback!");
      setFeedbackBooking(null);
      setFeedbackText("");
      setFeedbackRating(5);
      fetchBookings(true);
    } catch (err: any) {
      toast.error(err.message || "Feedback submission failed.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-2">
      <div className="bg-white border border-[#e8dcc4]/60 rounded-3xl p-6 md:p-8 space-y-2 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#b86a16]/10 text-[#b86a16]">
          <Sparkles className="w-3 h-3" /> Seeker Console
        </div>
        <h1 className="text-3xl font-extrabold text-[#1c1f4a] font-display">
          My Booked Sessions
        </h1>
        <p className="text-xs text-[#5a5e7a] leading-relaxed max-w-lg font-sans">
          Browse through all active and past sessions. You can inspect
          questionnaire answers, request cancellations, or submit feedback for
          completed slots below.
        </p>
      </div>

      <div className="flex gap-2 border-b border-[#e8dcc4] pb-px overflow-x-auto selection:bg-transparent select-none">
        {(["all", "active", "past"] as const).map((tab) => {
          const isSel = tabFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-3 px-5 text-xs font-bold border-b-2 tracking-wide transition-all cursor-pointer whitespace-nowrap capitalize ${
                isSel
                  ? "border-[#b86a16] text-[#b86a16] font-extrabold"
                  : "border-transparent text-[#5a5e7a] hover:text-[#1c1f4a] hover:border-[#e8dcc4]"
              }`}
            >
              {tab === "all"
                ? "✦ All Bookings"
                : tab === "active"
                  ? "◉ Active Sessions"
                  : "✔ Past Sessions"}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white/40 border border-dashed border-[#e8dcc4] rounded-3xl">
          <Loader2 className="animate-spin text-[#b86a16] mb-3" size={28} />
          <p className="text-xs text-[#5a5e7a]">
            Synchronizing bookings queue...
          </p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-16 rounded-[2rem] text-center max-w-2xl mx-auto space-y-4">
          <p className="text-sm text-[#5a5e7a] font-medium leading-relaxed">
            No sessions discovered in this filter. Explore our sessions page to
            register for a timing slot.
          </p>
          <Button
            onClick={() => router.push("/offerings")}
            className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full h-9 px-6 text-xs font-semibold"
          >
            Browse Offerings
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const hasFeedback =
              booking.feedback !== null && booking.feedback !== undefined;
            const statusTheme =
              booking.status === "confirmed"
                ? { bg: "bg-[#6b8f71]/10 text-[#6b8f71]", label: "Confirmed" }
                : booking.status === "pending"
                  ? {
                      bg: "bg-[#b86a16]/10 text-[#b86a16]",
                      label: "Pending Review",
                    }
                  : booking.status === "cancellation_pending"
                    ? {
                        bg: "bg-red-50 text-red-600 border border-red-200/50",
                        label: "Cancellation Request Pending",
                      }
                    : booking.status === "cancelled"
                      ? { bg: "bg-gray-100 text-gray-400", label: "Cancelled" }
                      : { bg: "bg-blue-50 text-blue-600", label: "Completed" };

            return (
              <div
                key={booking.id}
                className="bg-white border border-[#e8dcc4]/60 rounded-3xl p-5 md:p-6 shadow-sm space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#faf7f2] pb-4">
                  <div className="space-y-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide ${statusTheme.bg}`}
                    >
                      {statusTheme.label}
                    </span>
                    <h3 className="text-lg font-bold text-[#1c1f4a] font-display">
                      {booking.subCategory.name}
                    </h3>
                  </div>

                  {booking.slot ? (
                    <div className="text-xs text-[#5a5e7a] font-medium space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Calendar className="w-3.5 h-3.5 text-[#b86a16]" />
                        {formatDate(booking.slot.slotDate)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#b86a16]" />
                        {formatTimeRange(
                          booking.slot.startTime,
                          booking.slot.endTime,
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#5a5e7a] italic">
                      Direct Submission &ndash; Date to be coordinated
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#5a5e7a]">
                  <div className="space-y-1.5">
                    <div className="font-bold text-[#1c1f4a]">
                      Format specifics:
                    </div>
                    <div className="capitalize">
                      {booking.selectedFormat || "To be Scheduled"}
                    </div>
                    {booking.paymentReceiptUrl && (
                      <div className="pt-1.5">
                        <a
                          href={booking.paymentReceiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#b86a16] font-bold hover:underline inline-flex items-center gap-1"
                        >
                          View Sent Receipt Screenshot
                        </a>
                      </div>
                    )}
                  </div>

                  {booking.adminCancellationReason && (
                    <div className="bg-red-50/50 border border-red-100 p-3 rounded-xl">
                      <span className="font-bold text-red-700 block mb-0.5">
                        Cancellation Reason:
                      </span>
                      <span className="text-red-600">
                        {booking.adminCancellationReason}
                      </span>
                    </div>
                  )}

                  {booking.userCancellationReason &&
                    booking.status === "cancellation_pending" && (
                      <div className="bg-orange-50/30 border border-orange-100 p-3 rounded-xl">
                        <span className="font-bold text-orange-700 block mb-0.5">
                          Your Cancellation Reason:
                        </span>
                        <span className="text-[#5a5e7a]">
                          {booking.userCancellationReason}
                        </span>
                      </div>
                    )}
                </div>

                {booking.status === "completed" && hasFeedback && (
                  <div className="bg-[#faf7f2] border border-[#e8dcc4]/50 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase font-bold text-[#b86a16] tracking-wider">
                        Your Submitted Feedback
                      </div>
                      <div className="flex gap-0.5 text-xs text-[#b86a16]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < (booking.feedback?.rating || 0)
                                ? "fill-[#b86a16]"
                                : "opacity-30"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-[#5a5e7a] leading-relaxed italic">
                      &ldquo;{booking.feedback?.rawFeedback}&rdquo;
                    </p>
                    {booking.feedback?.enhancedFeedback && (
                      <div className="pt-3 border-t border-dashed border-[#e8dcc4]/60 space-y-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-extrabold text-teal-700 tracking-wider">
                          Featured on the landing page for improved readability
                          :{" "}
                        </span>
                        <p className="text-xs text-teal-800 leading-relaxed font-medium italic bg-teal-50/40 p-2.5 rounded-xl border border-teal-100/50">
                          &ldquo;{booking.feedback.enhancedFeedback}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2.5 pt-2">
                  <Button
                    onClick={() => setViewResponsesBooking(booking)}
                    className="bg-transparent hover:bg-[#1c1f4a]/5 text-[#1c1f4a] border border-[#1c1f4a]/15 rounded-full h-8 px-4 text-[11px] font-bold cursor-pointer flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Form Responses
                  </Button>

                  {(booking.status === "pending" ||
                    booking.status === "confirmed") && (
                    <Button
                      onClick={() => setCancelBooking(booking)}
                      className="bg-transparent hover:bg-red-50 text-red-600 border border-red-100 rounded-full h-8 px-4 text-[11px] font-bold cursor-pointer"
                    >
                      Request Cancel
                    </Button>
                  )}

                  {booking.status === "completed" && !hasFeedback && (
                    <Button
                      onClick={() => setFeedbackBooking(booking)}
                      className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full h-8 px-4 text-[11px] font-bold cursor-pointer flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Submit Review
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
                className="p-2 border border-[#e8dcc4] rounded-full disabled:opacity-30 hover:bg-[#1c1f4a]/5 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 text-[#1c1f4a]" />
              </button>
              <span className="text-xs text-[#5a5e7a] font-bold">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="p-2 border border-[#e8dcc4] rounded-full disabled:opacity-30 hover:bg-[#1c1f4a]/5 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 text-[#1c1f4a]" />
              </button>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={viewResponsesBooking !== null}
        onOpenChange={(open) => !open && setViewResponsesBooking(null)}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold font-display">
              Submitted Questionnaire Responses
            </DialogTitle>
          </DialogHeader>

          {viewResponsesBooking && (
            <div className="space-y-4 mt-4 max-h-[350px] overflow-y-auto pr-1">
              {Object.keys(viewResponsesBooking.formResponses || {}).length ===
              0 ? (
                <p className="text-xs text-[#5a5e7a] italic text-center py-4">
                  No questionnaire responses recorded.
                </p>
              ) : sortedQuestions.length > 0 ? (
                sortedQuestions.map((q) => {
                  const ans = viewResponsesBooking.formResponses[q.id];

                  let displayAns = "";
                  let customVal = "";

                  if (ans !== undefined) {
                    if (ans && typeof ans === "object") {
                      const obj = ans as any;
                      if (Array.isArray(obj.selected)) {
                        displayAns = obj.selected.join(", ");
                      } else {
                        displayAns = String(obj.selected || "");
                      }
                      customVal = obj.customValue || "";
                    } else if (Array.isArray(ans)) {
                      displayAns = ans.join(", ");
                    } else {
                      displayAns = String(ans || "");
                    }
                  }

                  return (
                    <div
                      key={q.id}
                      className="border-b border-[#e8dcc4]/30 pb-3 last:border-0 last:pb-0"
                    >
                      <Label className="text-xs font-bold text-[#1c1f4a] block mb-1">
                        {q.fieldLabel}:
                      </Label>
                      <div className="text-xs text-[#5a5e7a] leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        {displayAns || (
                          <span className="text-gray-300 italic">
                            No response
                          </span>
                        )}
                        {customVal && (
                          <div className="mt-1.5 pt-1.5 border-t border-dashed border-gray-200">
                            <span className="font-bold text-[#b86a16] block text-[9px] uppercase tracking-wider mb-0.5">
                              Custom Value:
                            </span>
                            <span className="text-[#1c1f4a]">{customVal}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                Object.entries(viewResponsesBooking.formResponses).map(
                  ([qId, ans]) => {
                    let displayAns = "";
                    let customVal = "";

                    if (ans && typeof ans === "object") {
                      const obj = ans as any;
                      if (Array.isArray(obj.selected)) {
                        displayAns = obj.selected.join(", ");
                      } else {
                        displayAns = String(obj.selected || "");
                      }
                      customVal = obj.customValue || "";
                    } else if (Array.isArray(ans)) {
                      displayAns = ans.join(", ");
                    } else {
                      displayAns = String(ans || "");
                    }

                    return (
                      <div
                        key={qId}
                        className="border-b border-[#e8dcc4]/30 pb-3 last:border-0 last:pb-0"
                      >
                        <Label className="text-xs font-bold text-[#1c1f4a] block mb-1">
                          {allQuestions[qId] ||
                            `Question (${qId.substring(0, 8)})`}
                          :
                        </Label>
                        <div className="text-xs text-[#5a5e7a] leading-relaxed bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          {displayAns || (
                            <span className="text-gray-300 italic">
                              No response
                            </span>
                          )}
                          {customVal && (
                            <div className="mt-1.5 pt-1.5 border-t border-dashed border-gray-200">
                              <span className="font-bold text-[#b86a16] block text-[9px] uppercase tracking-wider mb-0.5">
                                Custom Value:
                              </span>
                              <span className="text-[#1c1f4a]">
                                {customVal}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  },
                )
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={cancelBooking !== null}
        onOpenChange={(open) => !open && setCancelBooking(null)}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader className="bg-red-600 text-white -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold font-display">
              Confirm Cancellation Request
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCancelSubmit} className="space-y-4 mt-2">
            <p className="text-xs text-[#5a5e7a] leading-relaxed">
              Are you sure you want to request cancellation for this timing
              slot? The team will review and confirm your cancellation details.
            </p>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a]">
                Reason for Cancellation <span className="text-red-500">*</span>
              </Label>
              <textarea
                required
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please state why you need to reschedule or cancel..."
                className="w-full text-xs text-[#5a5e7a] border border-[#e8dcc4] rounded-xl p-3 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCancelBooking(null)}
                className="rounded-full h-9 px-4 text-xs font-semibold cursor-pointer"
              >
                Go Back
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-700 text-white rounded-full h-9 px-4 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}{" "}
                Submit Request
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={feedbackBooking !== null}
        onOpenChange={(open) => !open && setFeedbackBooking(null)}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold font-display">
              Submit Session Feedback
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFeedbackSubmit} className="space-y-4 mt-2">
            <p className="text-xs text-[#5a5e7a] leading-relaxed">
              We would love to know about your session experience. Please rate
              and review your session with Sharath Kancherla.
            </p>

            <div className="space-y-1.5 text-center py-2 bg-[#faf7f2]/60 rounded-2xl border border-[#e8dcc4]/30">
              <Label className="text-xs font-bold text-[#1c1f4a] block">
                Your Rating
              </Label>
              <div className="flex justify-center gap-2 mt-1">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = feedbackRating >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="text-2xl cursor-pointer hover:scale-110 transition-transform p-0.5"
                    >
                      <Star
                        className={`w-7 h-7 ${active ? "text-[#b86a16] fill-[#b86a16]" : "text-gray-300"}`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a]">
                Feedback Comments <span className="text-red-500">*</span>
              </Label>
              <textarea
                required
                rows={4}
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share details of your experience, learning, or overall review..."
                className="w-full text-xs text-[#5a5e7a] border border-[#e8dcc4] rounded-xl p-3 outline-none"
              />
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFeedbackBooking(null)}
                className="rounded-full h-9 px-4 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={actionLoading}
                className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full h-9 px-4 text-xs font-semibold cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}{" "}
                Submit Feedback
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SeekerBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium font-sans">
            Loading bookings tracker...
          </p>
        </div>
      }
    >
      <SeekerBookingsContent />
    </Suspense>
  );
}
