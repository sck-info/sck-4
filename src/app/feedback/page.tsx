"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Star, Loader2, CheckCircle2, ArrowLeft, Calendar, Clock, AlertTriangle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatDate, formatTimeRange } from "@/lib/format";

function FeedbackSubmissionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [unauthorizedMsg, setUnauthorizedMsg] = useState<string | null>(null);

  // Authentication guard
  useEffect(() => {
    if (status === "unauthenticated") {
      const callbackUrl = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/login?callbackUrl=${callbackUrl}`);
    }
  }, [status, router]);

  // Load booking details
  useEffect(() => {
    if (status !== "authenticated" || !bookingId) return;

    const loadBookingDetail = async () => {
      try {
        const res = await fetch(`/api/bookings/detail?bookingId=${bookingId}`);
        if (!res.ok) {
          const json = await res.json();
          if (res.status === 403 || json.error === "This booking is not for you") {
            setUnauthorizedMsg(json.error || "This booking is not for you");
            return;
          }
          throw new Error("Failed to load booking details.");
        }
        const json = await res.json();
        if (json.success && json.data) {
          setBooking(json.data);
          if (json.data.feedback) {
            setSuccess(true);
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };

    loadBookingDetail();
  }, [bookingId, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId) return;
    if (!comments.trim()) {
      toast.error("Please enter a short review comment.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, rating, rawFeedback: comments }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit feedback.");

      toast.success("Feedback submitted successfully!");
      setSuccess(true);
      if (booking) {
        setBooking({
          ...booking,
          feedback: {
            rating,
            rawFeedback: comments,
          },
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Feedback submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf7f2] pt-20">
          <Loader2 className="w-10 h-10 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium font-sans">Verifying booking session...</p>
        </div>
      </>
    );
  }

  if (unauthorizedMsg) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf7f2] px-4 pt-20">
          <div className="max-w-md w-full bg-white border border-[#e8dcc4] rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <AlertTriangle className="w-12 h-12 text-[#c4796a] mx-auto" />
            <h2 className="text-xl font-bold text-[#1c1f4a] font-display">Access Denied</h2>
            <p className="text-xs text-[#5a5e7a] leading-relaxed">
              This booking is not for you. You can only submit feedback for sessions that you have personally booked.
            </p>
            <Button
              onClick={() => router.push("/dashboard/my-bookings")}
              className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full px-6 text-xs font-semibold cursor-pointer"
            >
              Go to My Bookings
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (!bookingId || !booking) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf7f2] px-4 pt-20">
          <div className="max-w-md w-full bg-white border border-[#e8dcc4] rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <AlertTriangle className="w-12 h-12 text-[#c4796a] mx-auto" />
            <h2 className="text-xl font-bold text-[#1c1f4a] font-display">Booking Not Found</h2>
            <p className="text-xs text-[#5a5e7a] leading-relaxed">
              We couldn't resolve the booking reference details. Please verify your notification link or check your booked slots.
            </p>
            <Button
              onClick={() => router.push("/dashboard/my-bookings")}
              className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full px-6 text-xs font-semibold cursor-pointer"
            >
              Go to My Bookings
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (booking.status !== "completed") {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf7f2] px-4 pt-20">
          <div className="max-w-md w-full bg-white border border-[#e8dcc4] rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <AlertTriangle className="w-12 h-12 text-[#b86a16] mx-auto" />
            <h2 className="text-xl font-bold text-[#1c1f4a] font-display">Session Not Completed</h2>
            <p className="text-xs text-[#5a5e7a] leading-relaxed">
              Feedback can only be compiled for completed sessions. Your current booking status is:{" "}
              <span className="font-bold text-[#b86a16] uppercase">{booking.status.replace("_", " ")}</span>.
            </p>
            <Button
              onClick={() => router.push("/dashboard/my-bookings")}
              className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full px-6 text-xs font-semibold cursor-pointer"
            >
              Go to My Bookings
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#faf7f2] flex flex-col items-center justify-center px-4 py-24">
        {success ? (
          /* SUCCESS STATE: Feedback already submitted */
          <div className="max-w-md w-full bg-white border border-[#e8dcc4] rounded-[2rem] p-8 md:p-10 text-center space-y-6 shadow-md transition-all">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-[#1c1f4a] font-display">Feedback Already Submitted</h2>
              <p className="text-xs text-[#5a5e7a] leading-relaxed max-w-xs mx-auto">
                Thank you! Your feedback for this session has already been recorded and sent to Sharath Kancherla's team.
              </p>
            </div>

            <div className="bg-[#faf7f2]/60 border border-[#e8dcc4]/40 p-5 rounded-2xl space-y-2.5 text-left">
              <div className="flex items-center justify-between border-b border-[#faf7f2] pb-2">
                <span className="text-[10px] uppercase font-bold text-[#b86a16] tracking-wider">Your Rating</span>
                <div className="flex gap-0.5 text-xs text-[#b86a16]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (booking.feedback?.rating || rating) ? "fill-[#b86a16]" : "opacity-30"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#b86a16] tracking-wider block">Your Comment</span>
                <p className="text-xs text-[#5a5e7a] leading-relaxed italic">
                  &ldquo;{booking.feedback?.rawFeedback || comments}&rdquo;
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => router.push("/dashboard/my-bookings")}
                className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full w-full h-11 text-xs font-semibold cursor-pointer shadow-sm"
              >
                Return to Bookings
              </Button>
            </div>
          </div>
        ) : (
          /* FORM STATE: Submit feedback form */
          <div className="max-w-lg w-full bg-white border border-[#e8dcc4] rounded-[2rem] p-6 md:p-8 space-y-6 shadow-md">
            <div>
              <div className="inline-flex items-center gap-1 text-[10px] uppercase font-extrabold text-[#b86a16] tracking-wider bg-[#b86a16]/10 px-2.5 py-0.5 rounded-full mb-2">
                Share Experience
              </div>
              <h2 className="text-2xl font-extrabold text-[#1c1f4a] font-display">Session Feedback Form</h2>
              <p className="text-xs text-[#5a5e7a] leading-relaxed mt-1">
                We'd love to hear your experience regarding your recent session. Your feedback helps us shape future programmes.
              </p>
            </div>

            {/* Session Card details */}
            <div className="bg-[#faf7f2] border border-[#e8dcc4] p-4.5 rounded-2xl space-y-2">
              <h3 className="text-sm font-bold text-[#1c1f4a]">{booking.subCategory.name}</h3>
              {booking.slot ? (
                <div className="text-xs text-[#5a5e7a] flex flex-wrap gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#b86a16]" />
                    {formatDate(booking.slot.slotDate)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#b86a16]" />
                    {formatTimeRange(booking.slot.startTime, booking.slot.endTime)}
                  </div>
                </div>
              ) : (
                <span className="text-[11px] text-[#5a5e7a] italic">Date Coordinated Manually</span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Rating Star selection */}
              <div className="space-y-2 text-center py-4 bg-[#faf7f2]/40 rounded-2xl border border-[#e8dcc4]/20">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wider block">Your Session Rating</Label>
                <div className="flex justify-center gap-2.5 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = rating >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-2xl cursor-pointer hover:scale-110 transition-transform p-0.5"
                      >
                        <Star className={`w-8 h-8 ${active ? "text-[#b86a16] fill-[#b86a16]" : "text-gray-300"}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment text input */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Detailed Review comments <span className="text-red-500">*</span></Label>
                <textarea
                  required
                  rows={5}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Share details of your experience, learning, or overall session review..."
                  className="w-full text-xs text-[#5a5e7a] border border-[#e8dcc4] rounded-2xl p-4 outline-none focus-visible:ring-1 focus-visible:ring-[#b86a16] bg-[#faf7f2]/20"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/my-bookings")}
                  className="rounded-full flex-1 h-11 text-xs font-semibold border border-[#e8dcc4] text-[#5a5e7a]"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full flex-[2] h-11 text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Submit Feedback
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}

export default function FeedbackSubmissionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf7f2] pt-20">
          <Loader2 className="w-10 h-10 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium font-sans">Loading feedback page...</p>
        </div>
      }
    >
      <FeedbackSubmissionContent />
    </Suspense>
  );
}
