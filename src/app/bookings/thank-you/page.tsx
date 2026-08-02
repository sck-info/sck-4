"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, Calendar, Clock, Home, ListTodo, Share2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import { formatDate, formatTimeRange } from "@/lib/format";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId");

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleShare = async () => {
    const subId = booking?.subCategory?.id || booking?.subCategoryId;
    if (!subId) {
      toast.error("Unable to generate sharing link.");
      return;
    }
    const shareUrl = `${window.location.origin}/offerings/${subId}/book`;
    const shareText = `Register for the same ${booking?.subCategory?.name || "offering"} session here!`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Session Registration",
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Registration link copied to clipboard!");
      } catch (err) {
        console.error("Error copying link:", err);
      }
    }
  };

  useEffect(() => {
    if (!bookingId) {
      router.push("/offerings");
      return;
    }

    const fetchBooking = async () => {
      try {
        const detailRes = await fetch(
          `/api/bookings/detail?bookingId=${bookingId}`,
        );
        const json = await detailRes.json();
        if (json.success) {
          setBooking(json.data);
        }
      } catch (err) {
        console.error("Error loading thank you details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, router]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <Loader2
          className="animate-spin"
          size={36}
          style={{ color: "var(--indigo)" }}
        />
        <p style={{ marginTop: 12, color: "var(--text-mid)", fontSize: 14 }}>
          Retrieving your booking receipt...
        </p>
      </div>
    );
  }

  const subCategoryName = booking?.subCategory?.name || "Offering Session";
  const hasSlot = !!booking?.slot;
  const slotDate = booking?.slot?.slotDate;
  const startTime = booking?.slot?.startTime;
  const endTime = booking?.slot?.endTime;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 760,
        margin: "0 auto",
        padding: "4rem 2rem 5rem",
        textAlign: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Animated Success Checkmark */}
      <div className="checkmark-wrapper">
        <svg
          className="checkmark"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 52 52"
        >
          <circle
            className="checkmark__circle"
            cx="26"
            cy="26"
            r="25"
            fill="none"
          />
          <path
            className="checkmark__check"
            fill="none"
            d="M14.1 27.2l7.1 7.2 16.7-16.8"
          />
        </svg>
      </div>

      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(32px, 5vw, 44px)",
          color: "var(--indigo)",
          fontWeight: 500,
          lineHeight: 1.1,
          marginTop: 20,
          marginBottom: 16,
        }}
      >
        Registration Received!
      </h2>

      <p
        style={{
          color: "var(--text-mid)",
          fontSize: 16,
          lineHeight: 1.6,
          fontWeight: 300,
          marginBottom: 28,
          maxWidth: 500,
          margin: "0 auto 28px",
        }}
      >
        Thank you for submitting your questionnaire. Your booking request for{" "}
        <strong style={{ color: "var(--indigo)", fontWeight: 600 }}>
          {subCategoryName}
        </strong>{" "}
        has been successfully received.
      </p>

      {/* Conditional message block */}
      {hasSlot ? (
        <div
          style={{
            background: "white",
            padding: 24,
            borderRadius: 16,
            border: "1px solid rgba(28,31,74,0.06)",
            boxShadow: "0 4px 20px rgba(28,31,74,0.02)",
            textAlign: "left",
            marginBottom: 32,
          }}
        >
          <h4
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--indigo)",
              margin: "0 0 16px 0",
              borderBottom: "1px solid rgba(28,31,74,0.06)",
              paddingBottom: 10,
            }}
          >
            Scheduled Slot Details
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                color: "var(--text-mid)",
              }}
            >
              <Calendar size={18} style={{ color: "var(--gold)" }} />
              <span>
                Date: <strong>{formatDate(slotDate)}</strong>
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                color: "var(--text-mid)",
              }}
            >
              <Clock size={18} style={{ color: "var(--gold)" }} />
              <span>
                Time: <strong>{formatTimeRange(startTime, endTime)}</strong>
              </span>
            </div>
          </div>
          <p
            style={{
              fontSize: 13,
              color: "var(--gold)",
              lineHeight: 1.5,
              margin: "16px 0 0 0",
              fontWeight: 500,
            }}
          >
            Status: Pending Confirmation. We will review and update you via
            WhatsApp/Email within 12-24 hours.
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "white",
            padding: 24,
            borderRadius: 16,
            border: "1px solid rgba(28,31,74,0.06)",
            boxShadow: "0 4px 20px rgba(28,31,74,0.02)",
            textAlign: "left",
            marginBottom: 32,
          }}
        >
          <h4
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--indigo)",
              margin: "0 0 10px 0",
            }}
          >
            General Form Submission Received
          </h4>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-mid)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            No specific slot timing was selected for this session. Our
            coordination team will review your form inputs and reach out to you
            within 12-24 hours to schedule a session date.
          </p>
        </div>
      )}

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          gap: 16,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: "1.5px solid var(--indigo)",
            color: "var(--indigo)",
            padding: "10px 20px",
            borderRadius: 100,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(28,31,74,0.03)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <Home size={16} />
          Go Home
        </a>

        <button
          onClick={handleShare}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: "1.5px solid var(--gold)",
            color: "var(--gold)",
            background: "transparent",
            padding: "10px 20px",
            borderRadius: 100,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              "rgba(184,106,22,0.03)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <Share2 size={16} />
          Share Session Link
        </button>

        <a
          href="/dashboard"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "var(--indigo)",
            color: "white",
            padding: "10px 20px",
            borderRadius: 100,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--gold)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--indigo)";
          }}
        >
          <ListTodo size={16} />
          My Bookings
        </a>
      </div>

      {/* CSS TICK ANIMATION */}
      <style>{`
        .checkmark-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 20px;
        }
        .checkmark {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: block;
          stroke-width: 2;
          stroke: #4bb543;
          stroke-miterlimit: 10;
          box-shadow: inset 0px 0px 0px #4bb543;
          animation: fill .4s ease-in-out .4s forwards, scale .3s ease-in-out 0s unique;
        }
        .checkmark__circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          stroke-width: 2;
          stroke: #4bb543;
          fill: none;
          animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
        }
        .checkmark__check {
          transform-origin: 50% 50%;
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.6s forwards;
        }
        @keyframes stroke {
          100% {
            stroke-dashoffset: 0;
          }
        }
        @keyframes fill {
          100% {
            box-shadow: inset 0px 0px 0px 40px rgba(75, 181, 67, 0.05);
          }
        }
      `}</style>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <>
      <Navbar />
      <main
        style={{
          minHeight: "100vh",
          background: "var(--ivory)",
          paddingTop: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Suspense
          fallback={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Loader2
                className="animate-spin"
                size={36}
                style={{ color: "var(--indigo)" }}
              />
            </div>
          }
        >
          <ThankYouContent />
        </Suspense>
      </main>
    </>
  );
}
