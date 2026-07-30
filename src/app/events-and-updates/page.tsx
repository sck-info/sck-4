"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Navbar from "@/components/Navbar";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useRealtime } from "@/hooks/useRealtime";
import {
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Bell,
  Filter,
  Info,
  ExternalLink,
  ChevronRight,
  Loader2,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";

type EventItem = {
  id: string;
  title: string;
  description: string;
  link: string | null;
  type: "event" | "update";
  isActive: boolean;
  eventDate: string;
  createdAt: string;
};

function EventsAndUpdatesContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Default date window: -5 days and +1 month
  const now = new Date();
  const defaultStart = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const defaultEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Retrieve parameters from URL
  const typeParam = (searchParams.get("type") as "both" | "event" | "update") || "both";
  const startParam = searchParams.get("startDate") || "";
  const endParam = searchParams.get("endDate") || "";

  // Date range states
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startParam ? new Date(startParam) : defaultStart,
    to: endParam ? new Date(endParam) : defaultEnd,
  });
  
  const [typeFilter, setTypeFilter] = useState<"both" | "event" | "update">(typeParam);

  // Sync state if URL search parameters change directly
  useEffect(() => {
    setTypeFilter(typeParam);
    setDateRange({
      from: startParam ? new Date(startParam) : defaultStart,
      to: endParam ? new Date(endParam) : defaultEnd,
    });
  }, [typeParam, startParam, endParam]);

  // Fetch events matching constraints
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const startStr = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : "";
      const endStr = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : "";
      const res = await fetch(
        `/api/events?startDate=${startStr}&endDate=${endStr}&type=${typeFilter}`
      );
      if (!res.ok) throw new Error("Failed to load events");
      const json = await res.json();
      if (json.success) {
        setEvents(json.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateRange, typeFilter]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useRealtime(["events"], loadEvents);

  // Update query params in URL
  const updateUrlParams = (newType: "both" | "event" | "update", newRange: DateRange | undefined) => {
    const params = new URLSearchParams();
    params.set("type", newType);
    if (newRange?.from) {
      params.set("startDate", format(newRange.from, "yyyy-MM-dd"));
    }
    if (newRange?.to) {
      params.set("endDate", format(newRange.to, "yyyy-MM-dd"));
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleTypeChange = (t: "both" | "event" | "update") => {
    setTypeFilter(t);
    updateUrlParams(t, dateRange);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    updateUrlParams(typeFilter, range);
  };

  const handleReset = () => {
    const params = new URLSearchParams();
    params.set("type", "both");
    params.set("startDate", format(defaultStart, "yyyy-MM-dd"));
    params.set("endDate", format(defaultEnd, "yyyy-MM-dd"));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <Navbar />
      <main
        style={{
          minHeight: "100vh",
          background: "#faf7f2", // var(--ivory)
          paddingTop: 96,
          paddingBottom: 64,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 1.5rem" }}>
          {/* Back button */}
          <div style={{ marginBottom: "1.5rem", textAlign: "left" }}>
            <a
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-[#b86a16] hover:text-[#1c1f4a] uppercase tracking-widest transition-all cursor-pointer group"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to Home
            </a>
          </div>

          {/* Header Section */}
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: "#b86a16", // var(--gold)
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Announcements &amp; Schedule
            </span>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "2.8rem",
                fontWeight: 600,
                color: "#1c1f4a", // var(--indigo)
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              Events &amp; Updates
            </h1>
            <p
              style={{
                fontSize: "15px",
                color: "#5a5e7a", // var(--text-mid)
                maxWidth: 550,
                margin: "0.75rem auto 0",
                lineHeight: 1.5,
              }}
            >
              Stay tuned with our latest updates, interactive workshops, offline meets, and spiritual sessions.
            </p>
          </div>

          {/* Filter Bar */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(28, 31, 74, 0.08)",
              borderRadius: "20px",
              padding: "1.25rem 1.5rem",
              marginBottom: "2.5rem",
              boxShadow: "0 4px 20px rgba(28, 31, 74, 0.02)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              {/* Type Filters */}
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#1c1f4a",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    marginRight: "0.5rem",
                  }}
                >
                  Show:
                </span>
                <button
                  onClick={() => handleTypeChange("both")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "100px",
                    border: "1.5px solid",
                    borderColor: typeFilter === "both" ? "#1c1f4a" : "rgba(28,31,74,0.1)",
                    background: typeFilter === "both" ? "#1c1f4a" : "transparent",
                    color: typeFilter === "both" ? "#faf7f2" : "#5a5e7a",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  All Feed
                </button>
                <button
                  onClick={() => handleTypeChange("event")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "100px",
                    border: "1.5px solid",
                    borderColor: typeFilter === "event" ? "#b86a16" : "rgba(28,31,74,0.1)",
                    background: typeFilter === "event" ? "#b86a16" : "transparent",
                    color: typeFilter === "event" ? "#faf7f2" : "#5a5e7a",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Events Only
                </button>
                <button
                  onClick={() => handleTypeChange("update")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "100px",
                    border: "1.5px solid",
                    borderColor: typeFilter === "update" ? "#1c1f4a" : "rgba(28,31,74,0.1)",
                    background: typeFilter === "update" ? "#1c1f4a" : "transparent",
                    color: typeFilter === "update" ? "#faf7f2" : "#5a5e7a",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  Updates Only
                </button>
              </div>

              {/* Date Range Picker */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#1c1f4a",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Date range:
                </span>
                <div style={{ minWidth: "220px" }}>
                  <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
                </div>
              </div>
            </div>
          </div>

          {/* Unified Feed Stream */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <Loader2
                style={{ width: "2.5rem", height: "2.5rem", color: "#b86a16", animation: "spin 1s linear infinite", margin: "0 auto" }}
              />
              <p style={{ fontSize: "13px", color: "#5a5e7a", marginTop: "1rem" }}>
                Fetching announcements...
              </p>
            </div>
          ) : events.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "5rem 2rem",
                background: "#ffffff",
                borderRadius: "24px",
                border: "1px solid rgba(28, 31, 74, 0.06)",
                boxShadow: "0 4px 20px rgba(28, 31, 74, 0.01)",
              }}
            >
              <CalendarDays style={{ width: "3.5rem", height: "3.5rem", color: "rgba(184, 106, 22, 0.4)", margin: "0 auto 1rem" }} />
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1c1f4a" }}>
                No events or updates currently in range
              </h3>
              <p style={{ fontSize: "13px", color: "#5a5e7a", marginTop: "0.5rem", maxWidth: 400, margin: "0.5rem auto 0" }}>
                We don't have any announcements scheduled between selected dates. Adjust filters to check other periods.
              </p>
              <button
                onClick={handleReset}
                style={{
                  marginTop: "1.25rem",
                  padding: "8px 18px",
                  background: "#1c1f4a",
                  color: "#faf7f2",
                  border: "none",
                  borderRadius: "12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                Reset Default Range
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {events.map((item) => {
                const isEvent = item.type === "event";
                const dateObj = new Date(item.eventDate);

                return (
                  <div
                    key={item.id}
                    style={{
                      background: "#ffffff",
                      border: "1px solid rgba(28, 31, 74, 0.08)",
                      borderLeft: `5px solid ${isEvent ? "#b86a16" : "#1c1f4a"}`,
                      borderRadius: "20px",
                      padding: "1.5rem 1.75rem",
                      boxShadow: "0 4px 20px rgba(28, 31, 74, 0.02)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                      position: "relative",
                      transition: "all 0.3s ease",
                    }}
                    className="feed-card"
                  >
                    {/* Top Row: Type tag & Date */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "4px 10px",
                          borderRadius: "100px",
                          fontSize: "10px",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.75px",
                          background: isEvent ? "rgba(184, 106, 22, 0.08)" : "rgba(28, 31, 74, 0.08)",
                          color: isEvent ? "#b86a16" : "#1c1f4a",
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: isEvent ? "#b86a16" : "#1c1f4a",
                          }}
                        />
                        {item.type}
                      </span>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#5a5e7a",
                        }}
                      >
                        <Calendar style={{ width: 14, height: 14, color: isEvent ? "#b86a16" : "#1c1f4a" }} />
                        <span>
                          {format(dateObj, "eee, MMM dd, yyyy")}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h2
                      style={{
                        fontSize: "19px",
                        fontWeight: 700,
                        color: "#1c1f4a",
                        margin: 0,
                        lineHeight: 1.3,
                      }}
                    >
                      {item.title}
                    </h2>

                    {/* Description HTML format rendering */}
                    <div
                      style={{
                        fontSize: "13.5px",
                        color: "#5a5e7a",
                        lineHeight: 1.6,
                        whiteSpace: "pre-wrap",
                      }}
                      dangerouslySetInnerHTML={{ __html: item.description }}
                    />

                    {/* Footer link row */}
                    {item.link && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          borderTop: "1px solid rgba(28, 31, 74, 0.05)",
                          paddingTop: "0.75rem",
                          marginTop: "0.25rem",
                        }}
                      >
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: isEvent ? "#b86a16" : "#1c1f4a",
                            textDecoration: "none",
                            transition: "gap 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.gap = "0.6rem";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.gap = "0.4rem";
                          }}
                        >
                          <span>Explore Details</span>
                          <ExternalLink style={{ width: 14, height: 14 }} />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function EventsAndUpdatesPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", padding: "8rem 0" }}>
        <Loader2 style={{ width: "2rem", height: "2rem", color: "#b86a16", animation: "spin 1s linear infinite" }} />
      </div>
    }>
      <EventsAndUpdatesContent />
    </Suspense>
  );
}
