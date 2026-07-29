"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/hooks/useRealtime";
import { Calendar, Clock, MapPin, Check, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type Question = {
  id: string;
  fieldLabel: string;
  fieldType: string;
  options: any; // array of strings
  allowOther: boolean;
  isRequired: boolean;
  sortOrder: number;
};

type SubCategory = {
  id: string;
  name: string;
  description: string | null;
  requiresBooking: boolean;
  categoryId: string;
  paymentQrId: string | null;
};

type PaymentQr = {
  id: string;
  name: string;
  qrImageUrl: string;
} | null;

type Slot = {
  id: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  status: string;
  locations: { id: string; name: string; type: string; url: string }[];
};

export default function BookingClient({
  subCategory,
  paymentQr,
  initialQuestions,
}: {
  subCategory: SubCategory;
  paymentQr: PaymentQr;
  initialQuestions: Question[];
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // 1. Login Redirect Guard
  useEffect(() => {
    if (status === "unauthenticated") {
      const callbackUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?callbackUrl=${callbackUrl}`);
    }
  }, [status, router]);

  // States
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<"online" | "offline" | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");

  // Form states
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  const [otherResponses, setOtherResponses] = useState<Record<string, string>>({});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Calendar month/year navigation state
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Load available slots
  const loadSlots = async () => {
    try {
      const res = await fetch(`/api/offerings/slots?subCategoryId=${subCategory.id}`);
      const json = await res.json();
      if (json.success) {
        setSlots(json.data);
      }
    } catch (err) {
      console.error("Failed to load slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Reload schema changes dynamically
  const reloadQuestions = async () => {
    try {
      const res = await fetch(`/api/sub-categories/${subCategory.id}/questions`);
      const json = await res.json();
      if (json.success && json.data) {
        setQuestions(json.data);
      }
    } catch (err) {
      console.error("Failed to refresh questions:", err);
    }
  };

  useEffect(() => {
    loadSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time Update listeners
  useRealtime(["offering_slots"], loadSlots);
  useRealtime(["sub_category_questions", "form_questions"], reloadQuestions);

  // Month navigation calculations
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const prevMonth = () => {
    const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();
    if (isCurrentMonth) return; // Disable backward navigation

    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  // Calculate calendar grid days
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper: check if a date has slots available
  const getSlotsForDate = (dateStr: string) => {
    return slots.filter((slot) => slot.slotDate === dateStr);
  };

  const handleDayClick = (day: number) => {
    // Format: YYYY-MM-DD
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dateSlots = getSlotsForDate(dateStr);
    if (dateSlots.length > 0) {
      setSelectedDate(dateStr);
      setSelectedSlot(null);
      setSelectedFormat(null);
      setSelectedLocationId("");
    }
  };

  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot);
    // Reset locations choice
    setSelectedFormat(null);
    setSelectedLocationId("");
    if (slot.locations.length > 0) {
      const firstLoc = slot.locations[0];
      setSelectedFormat(firstLoc.type as any);
      setSelectedLocationId(firstLoc.id);
    }
  };

  const handleInputChange = (questionId: string, val: any) => {
    setFormResponses((prev) => ({
      ...prev,
      [questionId]: val,
    }));
  };

  const handleOtherTextChange = (questionId: string, val: string) => {
    setOtherResponses((prev) => ({
      ...prev,
      [questionId]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validation
    if (subCategory.requiresBooking && !selectedSlot) {
      setErrorMsg("Please select an available timing slot.");
      return;
    }

    // Question validation
    for (const q of questions) {
      if (q.isRequired && !formResponses[q.id]) {
        setErrorMsg(`Please answer the required question: "${q.fieldLabel}"`);
        return;
      }
    }

    // Payment receipt validation
    if (paymentQr && !receiptFile) {
      setErrorMsg("Please upload your transaction screenshot receipt to complete registration.");
      return;
    }

    setSubmitting(true);

    try {
      // Map response to handle "Other" custom option text values
      const mappedResponses = { ...formResponses };
      for (const qId of Object.keys(mappedResponses)) {
        const val = mappedResponses[qId];
        if (otherResponses[qId] && (val === "Other" || (Array.isArray(val) && val.includes("Other")))) {
          mappedResponses[qId] = {
            selected: val,
            customValue: otherResponses[qId],
          };
        }
      }

      // Build FormData payload to support file upload
      const formData = new FormData();
      formData.append("subCategoryId", subCategory.id);
      if (selectedSlot?.id) formData.append("slotId", selectedSlot.id);
      if (selectedFormat) formData.append("selectedFormat", selectedFormat);
      if (selectedLocationId) formData.append("selectedLocationId", selectedLocationId);
      formData.append("formResponses", JSON.stringify(mappedResponses));
      if (receiptFile) {
        formData.append("receiptFile", receiptFile);
      }

      const res = await fetch("/api/bookings/submit", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        router.push(`/bookings/thank-you?bookingId=${json.data.id}`);
      } else {
        setErrorMsg(json.error || "Failed to submit booking request.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh" }}>
        <Loader2 className="animate-spin" size={40} style={{ color: "var(--indigo)" }} />
        <p style={{ marginTop: 16, color: "var(--text-mid)", fontFamily: "'DM Sans', sans-serif" }}>Verifying your session...</p>
      </div>
    );
  }

  // Pre-fill defaults
  const userDetails = session?.user as any;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1.5rem", fontFamily: "'DM Sans', sans-serif" }}>
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(32px, 4vw, 48px)",
          color: "var(--indigo)",
          fontWeight: 400,
          lineHeight: 1.1,
          marginBottom: 10,
        }}
      >
        Book: {subCategory.name}
      </h2>
      <p style={{ color: "var(--text-mid)", fontWeight: 300, fontSize: 15, marginBottom: "2rem" }}>
        Please complete the reservation slots &amp; details below.
      </p>

      {/* Grid containing Calendar & Details */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32, alignItems: "start" }}>
        {/* LEFT COLUMN: Calendar Picker (if slot reservation required) */}
        {subCategory.requiresBooking ? (
          <div style={{ background: "white", padding: 24, borderRadius: 20, border: "1px solid rgba(28,31,74,0.06)", boxShadow: "0 4px 20px rgba(28,31,74,0.03)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--indigo)", margin: "0 0 16px 0", fontWeight: 500 }}>
              1. Select Date &amp; Timing
            </h3>

            {loadingSlots ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <Loader2 className="animate-spin" size={24} style={{ color: "var(--gold)" }} />
              </div>
            ) : (
              <div>
                {/* Month Navigation Banner */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <button
                    onClick={prevMonth}
                    disabled={currentMonth === today.getMonth() && currentYear === today.getFullYear()}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--indigo)",
                      cursor: "pointer",
                      opacity: currentMonth === today.getMonth() && currentYear === today.getFullYear() ? 0.3 : 1,
                    }}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span style={{ fontWeight: 600, color: "var(--indigo)", fontSize: 16 }}>
                    {monthNames[currentMonth]} {currentYear}
                  </span>
                  <button onClick={nextMonth} style={{ background: "none", border: "none", color: "var(--indigo)", cursor: "pointer" }}>
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Week Day Labels */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontWeight: 600, color: "var(--gold)", fontSize: 12, marginBottom: 8 }}>
                  <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
                </div>

                {/* Calendar Days Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
                  {/* Empty cells leading up to 1st of month */}
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}

                  {/* Days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const dateSlots = getSlotsForDate(dateStr);
                    const isAvailable = dateSlots.length > 0;
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={`day-${day}`}
                        onClick={() => handleDayClick(day)}
                        disabled={!isAvailable}
                        style={{
                          aspectRatio: "1/1",
                          borderRadius: "50%",
                          border: isSelected ? "2px solid var(--gold)" : "none",
                          background: isSelected
                            ? "rgba(232,150,46,0.12)"
                            : isAvailable
                            ? "rgba(232,150,46,0.05)"
                            : "transparent",
                          color: isAvailable ? "var(--indigo)" : "#bbb",
                          fontWeight: isAvailable ? 600 : 300,
                          cursor: isAvailable ? "pointer" : "default",
                          transition: "all 0.2s",
                          fontSize: 13,
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                {/* Time Slot display */}
                {selectedDate && (
                  <div style={{ marginTop: 24, borderTop: "1px solid rgba(28,31,74,0.06)", paddingTop: 16 }}>
                    <h4 style={{ fontSize: 14, color: "var(--indigo)", fontWeight: 600, marginBottom: 12 }}>
                      Available Timings on {selectedDate}:
                    </h4>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {getSlotsForDate(selectedDate).map((slot) => {
                        const isSlotSelected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => handleSlotClick(slot)}
                            style={{
                              padding: "12px 16px",
                              borderRadius: 10,
                              border: isSlotSelected ? "2px solid var(--gold)" : "1px solid rgba(28,31,74,0.1)",
                              background: isSlotSelected ? "rgba(232,150,46,0.05)" : "transparent",
                              textAlign: "left",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 500, color: "var(--indigo)" }}>
                              <Clock size={16} style={{ color: "var(--gold)" }} />
                              {slot.startTime} - {slot.endTime}
                            </span>
                            {isSlotSelected && <Check size={16} style={{ color: "var(--gold)" }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ background: "white", padding: 24, borderRadius: 20, border: "1px solid rgba(28,31,74,0.06)", boxShadow: "0 4px 20px rgba(28,31,74,0.03)" }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--indigo)", margin: "0 0 16px 0", fontWeight: 500 }}>
              Direct Submission
            </h3>
            <p style={{ color: "var(--text-mid)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              This session does not require booking scheduled slots. Please complete the registration form below, and we will contact you directly to confirm.
            </p>
          </div>
        )}

        {/* RIGHT COLUMN: Questionnaire Form & Details */}
        <form
          onSubmit={handleSubmit}
          style={{ background: "white", padding: 28, borderRadius: 20, border: "1px solid rgba(28,31,74,0.06)", boxShadow: "0 4px 20px rgba(28,31,74,0.03)" }}
        >
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "var(--indigo)", margin: "0 0 20px 0", fontWeight: 500 }}>
            {subCategory.requiresBooking ? "2. Complete Questionnaire" : "1. Complete Questionnaire"}
          </h3>

          {/* Prefilled user credentials */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24, borderBottom: "1px solid rgba(28,31,74,0.06)", paddingBottom: 20 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mid)", textTransform: "uppercase", letterSpacing: 0.5 }}>Name</label>
              <div style={{ padding: "10px 12px", border: "1px solid rgba(28,31,74,0.08)", background: "#fafafa", borderRadius: 8, color: "var(--text-mid)", fontSize: 14, marginTop: 4 }}>
                {userDetails?.name}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mid)", textTransform: "uppercase", letterSpacing: 0.5 }}>Email</label>
              <div style={{ padding: "10px 12px", border: "1px solid rgba(28,31,74,0.08)", background: "#fafafa", borderRadius: 8, color: "var(--text-mid)", fontSize: 14, marginTop: 4 }}>
                {userDetails?.email}
              </div>
            </div>
            {/* If user phone exists */}
            {userDetails?.phone && (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mid)", textTransform: "uppercase", letterSpacing: 0.5 }}>Phone Number</label>
                <div style={{ padding: "10px 12px", border: "1px solid rgba(28,31,74,0.08)", background: "#fafafa", borderRadius: 8, color: "var(--text-mid)", fontSize: 14, marginTop: 4 }}>
                  {userDetails.phoneCode} {userDetails.phone}
                </div>
              </div>
            )}
          </div>

          {/* Configured Slot Format Options */}
          {selectedSlot && selectedSlot.locations.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mid)", textTransform: "uppercase", letterSpacing: 0.5 }}>Select Format Type</label>
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                {selectedSlot.locations.map((loc) => {
                  const isLocSelected = selectedLocationId === loc.id;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => {
                        setSelectedLocationId(loc.id);
                        setSelectedFormat(loc.type as any);
                      }}
                      style={{
                        flex: 1,
                        padding: "12px",
                        borderRadius: 10,
                        border: isLocSelected ? "2px solid var(--gold)" : "1px solid rgba(28,31,74,0.1)",
                        background: isLocSelected ? "rgba(232,150,46,0.05)" : "transparent",
                        cursor: "pointer",
                        fontWeight: 600,
                        fontSize: 13,
                        color: "var(--indigo)",
                        textTransform: "capitalize",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      {loc.type === "online" ? <Clock size={16} /> : <MapPin size={16} />}
                      {loc.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dynamic Form questions rendering */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {questions.map((q) => {
              const opts = Array.isArray(q.options) ? (q.options as string[]) : [];
              const val = formResponses[q.id] || "";

              return (
                <div key={q.id}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: "var(--indigo)", display: "block", marginBottom: 6 }}>
                    {q.fieldLabel} {q.isRequired && <span style={{ color: "var(--gold)" }}>*</span>}
                  </label>

                  {/* RENDER FIELD INPUT TYPES */}
                  {q.fieldType === "short_answer" && (
                    <input
                      type="text"
                      required={q.isRequired}
                      value={val}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(28,31,74,0.15)", borderRadius: 8, outline: "none", fontSize: 14 }}
                    />
                  )}

                  {q.fieldType === "long_answer" && (
                    <textarea
                      required={q.isRequired}
                      rows={4}
                      value={val}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(28,31,74,0.15)", borderRadius: 8, outline: "none", fontSize: 14, resize: "vertical" }}
                    />
                  )}

                  {q.fieldType === "number" && (
                    <input
                      type="number"
                      required={q.isRequired}
                      value={val}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(28,31,74,0.15)", borderRadius: 8, outline: "none", fontSize: 14 }}
                    />
                  )}

                  {q.fieldType === "url" && (
                    <input
                      type="url"
                      required={q.isRequired}
                      value={val}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(28,31,74,0.15)", borderRadius: 8, outline: "none", fontSize: 14 }}
                    />
                  )}

                  {q.fieldType === "date" && (
                    <input
                      type="date"
                      required={q.isRequired}
                      value={val}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(28,31,74,0.15)", borderRadius: 8, outline: "none", fontSize: 14 }}
                    />
                  )}

                  {q.fieldType === "time" && (
                    <input
                      type="time"
                      required={q.isRequired}
                      value={val}
                      onChange={(e) => handleInputChange(q.id, e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(28,31,74,0.15)", borderRadius: 8, outline: "none", fontSize: 14 }}
                    />
                  )}

                  {q.fieldType === "star_rating" && (
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = Number(val) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleInputChange(q.id, star)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: 24,
                              color: active ? "var(--gold)" : "#ddd",
                              padding: 0,
                            }}
                          >
                            ★
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {q.fieldType === "single_select" && (
                    <div>
                      <select
                        required={q.isRequired}
                        value={val}
                        onChange={(e) => handleInputChange(q.id, e.target.value)}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid rgba(28,31,74,0.15)", borderRadius: 8, background: "white", outline: "none", fontSize: 14 }}
                      >
                        <option value="">Select option...</option>
                        {opts.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                        {q.allowOther && <option value="Other">Other</option>}
                      </select>

                      {/* Conditional Short Answer field if 'Other' chosen */}
                      {q.allowOther && val === "Other" && (
                        <input
                          type="text"
                          required={q.isRequired}
                          placeholder="Please specify..."
                          value={otherResponses[q.id] || ""}
                          onChange={(e) => handleOtherTextChange(q.id, e.target.value)}
                          style={{ width: "100%", marginTop: 8, padding: "10px 12px", border: "1px solid rgba(28,31,74,0.15)", borderRadius: 8, outline: "none", fontSize: 14 }}
                        />
                      )}
                    </div>
                  )}

                  {q.fieldType === "multi_select" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                      {opts.map((opt) => {
                        const list: string[] = Array.isArray(val) ? val : [];
                        const checked = list.includes(opt);
                        return (
                          <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-dark)", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                let newList = [...list];
                                if (e.target.checked) {
                                  newList.push(opt);
                                } else {
                                  newList = newList.filter((item) => item !== opt);
                                }
                                handleInputChange(q.id, newList);
                              }}
                              style={{ width: 16, height: 16, cursor: "pointer" }}
                            />
                            {opt}
                          </label>
                        );
                      })}
                      {q.allowOther && (
                        <div>
                          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-dark)", cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={(Array.isArray(val) ? val : []).includes("Other")}
                              onChange={(e) => {
                                const list = Array.isArray(val) ? val : [];
                                let newList = [...list];
                                if (e.target.checked) {
                                  newList.push("Other");
                                } else {
                                  newList = newList.filter((item) => item !== "Other");
                                }
                                handleInputChange(q.id, newList);
                              }}
                              style={{ width: 16, height: 16, cursor: "pointer" }}
                            />
                            Other
                          </label>

                          {/* Conditional specify input */}
                          {(Array.isArray(val) ? val : []).includes("Other") && (
                            <input
                              type="text"
                              required={q.isRequired}
                              placeholder="Please specify..."
                              value={otherResponses[q.id] || ""}
                              onChange={(e) => handleOtherTextChange(q.id, e.target.value)}
                              style={{ width: "100%", marginTop: 8, padding: "10px 12px", border: "1px solid rgba(28,31,74,0.15)", borderRadius: 8, outline: "none", fontSize: 14 }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Payment QR displays if configured */}
          {paymentQr && (
            <div style={{ marginTop: 28, background: "rgba(232,150,46,0.03)", border: "1px dashed rgba(232,150,46,0.25)", borderRadius: 14, padding: 20, textAlign: "center" }}>
              <h4 style={{ fontSize: 14, color: "var(--indigo)", fontWeight: 600, marginBottom: 8 }}>
                3. Scan QR Code &amp; Pay
              </h4>
              <p style={{ fontSize: 12, color: "var(--text-mid)", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                Scan the QR code below via UPI or your banking application to complete the session fee payment.
              </p>
              {/* QR Image */}
              <img
                src={paymentQr.qrImageUrl}
                alt={paymentQr.name}
                style={{ width: 180, height: 180, objectFit: "contain", borderRadius: 10, border: "1px solid #ddd", background: "white", display: "block", margin: "0 auto 12px" }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gold)", display: "block", marginBottom: 20 }}>{paymentQr.name}</span>

              {/* Upload Screenshot File Field */}
              <div style={{ textAlign: "left", borderTop: "1px solid rgba(232,150,46,0.15)", paddingTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: "var(--indigo)", display: "block", marginBottom: 6 }}>
                  Upload Payment Screenshot Receipt <span style={{ color: "var(--gold)" }}>*</span>
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setReceiptFile(file);
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setReceiptPreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    } else {
                      setReceiptPreview(null);
                    }
                  }}
                  style={{
                    width: "100%",
                    fontSize: 13,
                    color: "var(--text-mid)",
                    background: "white",
                    padding: "8px 12px",
                    border: "1px solid rgba(28,31,74,0.15)",
                    borderRadius: 8,
                    outline: "none",
                  }}
                />
                {receiptPreview && (
                  <div style={{ marginTop: 12, textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: "var(--text-mid)", marginBottom: 6 }}>Screenshot Preview:</p>
                    <img
                      src={receiptPreview}
                      alt="Receipt Preview"
                      style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8, border: "1px dashed rgba(28,31,74,0.2)" }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {errorMsg && (
            <div style={{ marginTop: 20, background: "#fff5f5", border: "1px solid #ffd8d8", color: "#e03e3e", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}>
              {errorMsg}
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 28,
              width: "100%",
              background: "var(--indigo)",
              color: "white",
              padding: "12px 24px",
              borderRadius: 100,
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting ? "default" : "pointer",
              transition: "background 0.2s",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(28,31,74,0.1)",
            }}
            onMouseEnter={(e) => {
              if (!submitting) (e.currentTarget as HTMLElement).style.background = "var(--gold)";
            }}
            onMouseLeave={(e) => {
              if (!submitting) (e.currentTarget as HTMLElement).style.background = "var(--indigo)";
            }}
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={16} /> Submitting Reservation...
              </>
            ) : (
              "Submit Registration"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
