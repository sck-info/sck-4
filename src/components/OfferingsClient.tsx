"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";

type SubCategory = {
  id: string;
  name: string;
  description: string | null;
  topTags: any; // array of strings
  tags: any; // array of strings
  requiresBooking: boolean;
  sortOrder: number;
  isActive: boolean;
};

type Category = {
  id: string;
  name: string;
  description: string | null;
  sanskritText: string | null;
  sanskritMeaning: string | null;
  sortOrder: number;
  isActive: boolean;
  subCategories: SubCategory[];
};

const CATEGORY_STYLES: Record<
  string,
  { color: string; lightColor: string; icon: string; hash: string }
> = {
  "Alternative Therapies": {
    color: "#6B8F71",
    lightColor: "#EAF2EB",
    icon: "✦",
    hash: "therapy",
  },
  "Jyothishya Consultations": {
    color: "#C4796A",
    lightColor: "#FAF0EE",
    icon: "◈",
    hash: "consultations",
  },
  "Music Classes": {
    color: "#4A6FA5",
    lightColor: "#EDF2FA",
    icon: "♪",
    hash: "classes",
  },
  "Mind & Body Workshops": {
    color: "#C9873A",
    lightColor: "#FDF4E8",
    icon: "◉",
    hash: "workshops",
  },
  Satsangs: {
    color: "#7A5E9A",
    lightColor: "#F5F0FA",
    icon: "♫",
    hash: "satsangs",
  },
};

const getCategoryStyle = (name: string) => {
  return (
    CATEGORY_STYLES[name] || {
      color: "#b86a16",
      lightColor: "rgba(232,150,46,0.08)",
      icon: "✦",
      hash: name.toLowerCase().replace(/\s+/g, "-"),
    }
  );
};

export default function OfferingsClient({
  initialData,
}: {
  initialData: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialData);
  const [activeTab, setActiveTab] = useState(0);

  // Sync Hash on load/change
  useEffect(() => {
    const updateFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (!hash) return;
      const index = categories.findIndex((c) => {
        const style = getCategoryStyle(c.name);
        return (
          style.hash === hash ||
          c.id === hash ||
          c.name === decodeURIComponent(hash)
        );
      });
      if (index !== -1) {
        setActiveTab(index);
      }
    };
    updateFromHash();
    window.addEventListener("hashchange", updateFromHash);
    return () => window.removeEventListener("hashchange", updateFromHash);
  }, [categories]);

  // Real-time Database Updates Subscription
  const refreshOfferings = async () => {
    try {
      const res = await fetch("/api/offerings");
      const json = await res.json();
      if (json.success && json.data) {
        setCategories(json.data);
      }
    } catch (err) {
      console.error("Failed to refresh offerings dynamically:", err);
    }
  };

  useRealtime(
    ["offering_categories", "offering_sub_categories"],
    refreshOfferings,
  );

  const activeCategory = categories[activeTab] || categories[0];
  if (!activeCategory) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          padding: "5rem",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <p style={{ color: "var(--text-mid)" }}>
          No offerings are announced currently. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <section style={{ padding: "clamp(3rem, 6vw, 6rem) 2rem" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Scheduled Note Header */}
        <div style={{ marginBottom: "clamp(2rem, 4vw, 3rem)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: "1rem",
            }}
          >
            <div style={{ width: 32, height: 1, background: "var(--gold)" }} />
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 12,
                color: "var(--gold)",
                letterSpacing: 2,
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              Our Offerings
            </span>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(36px, 5vw, 56px)",
                fontWeight: 400,
                color: "var(--indigo)",
                lineHeight: 1.05,
              }}
            >
              Sessions &amp;
              <br />
              <span style={{ fontStyle: "italic", color: "var(--gold)" }}>
                Programmes
              </span>
            </h2>
            {/* Scheduling Note Card */}
            <div
              style={{
                background: "rgba(232,150,46,0.05)",
                border: "1px solid rgba(232,150,46,0.18)",
                borderLeft: "3px solid var(--gold)",
                borderRadius: 14,
                padding: "1rem 1.2rem",
                maxWidth: 350,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  letterSpacing: 1.6,
                  textTransform: "uppercase",
                  color: "var(--gold)",
                  fontWeight: 600,
                  marginBottom: "0.45rem",
                }}
              >
                Scheduling Note
              </div>

              <h4
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 22,
                  color: "var(--indigo)",
                  fontWeight: 500,
                  margin: "0 0 0.45rem",
                  lineHeight: 1.1,
                }}
              >
                Payment & Coordination
              </h4>

              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "var(--text-mid)",
                  lineHeight: 1.6,
                  margin: 0,
                  fontWeight: 300,
                }}
              >
                Pricing is available in each registration form. After payment,
                our team will contact you within{" "}
                <span style={{ color: "var(--gold)", fontWeight: 600 }}>
                  12-24 hours
                </span>{" "}
                to confirm and schedule your session.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: "2.5rem",
            flexWrap: "wrap",
          }}
        >
          {categories.map((c, i) => {
            const style = getCategoryStyle(c.name);
            return (
              <button
                key={c.id}
                onClick={() => {
                  setActiveTab(i);
                  window.history.replaceState(null, "", `#${style.hash}`);
                }}
                style={{
                  padding: "10px 24px",
                  borderRadius: 100,
                  border:
                    activeTab === i
                      ? `1.5px solid ${style.color}`
                      : "1.5px solid rgba(28,31,74,0.12)",
                  background:
                    activeTab === i ? style.lightColor : "transparent",
                  color: activeTab === i ? style.color : "var(--text-mid)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: activeTab === i ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>{style.icon}</span>
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Selected Category Panels */}
        {activeCategory &&
          (() => {
            const activeStyle = getCategoryStyle(activeCategory.name);
            return (
              <div
                id={activeStyle.hash}
                style={{
                  background: "white",
                  borderRadius: 24,
                  overflow: "hidden",
                  border: "1px solid rgba(28,31,74,0.06)",
                  boxShadow: "0 4px 40px rgba(28,31,74,0.05)",
                  scrollMarginTop: "100px",
                }}
              >
                {/* Header Banner */}
                <div
                  style={{
                    background: activeStyle.color,
                    padding: "clamp(2rem, 4vw, 2.5rem) clamp(2rem, 4vw, 3rem)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 24,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 11,
                        color: "rgba(255,255,255,0.7)",
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      {activeCategory.subCategories.length} offering
                      {activeCategory.subCategories.length > 1 ? "s" : ""}{" "}
                      available
                    </div>
                    <h3
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "clamp(28px, 4vw, 40px)",
                        fontWeight: 400,
                        color: "white",
                        lineHeight: 1.1,
                        marginBottom: 12,
                      }}
                    >
                      {activeStyle.icon} {activeCategory.name}
                    </h3>
                    {activeCategory.description && (
                      <p
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 15,
                          color: "rgba(255,255,255,0.75)",
                          maxWidth: 600,
                          lineHeight: 1.7,
                          fontWeight: 300,
                          margin: 0,
                        }}
                      >
                        {activeCategory.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Sanskrit Text & Meaning Quote Block */}
                {activeCategory.sanskritText && (
                  <div
                    style={{
                      padding: "1.2rem 2rem",
                      background: activeStyle.lightColor,
                      borderBottom: `1px solid ${activeStyle.color}25`,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        marginBottom: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          width: 45,
                          height: 1,
                          background: `${activeStyle.color}35`,
                        }}
                      />
                      <span style={{ color: activeStyle.color, fontSize: 12 }}>
                        ✦
                      </span>
                      <div
                        style={{
                          width: 45,
                          height: 1,
                          background: `${activeStyle.color}35`,
                        }}
                      />
                    </div>

                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', serif",
                        fontSize: "clamp(18px, 2vw, 22px)",
                        color: activeStyle.color,
                        fontWeight: 500,
                        lineHeight: 1.7,
                        margin: "0 0 0.35rem 0",
                      }}
                    >
                      {activeCategory.sanskritText}
                    </p>

                    {activeCategory.sanskritMeaning && (
                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: "clamp(13px, 1.3vw, 15px)",
                          color: "var(--text-mid)",
                          fontStyle: "italic",
                          lineHeight: 1.5,
                          maxWidth: 760,
                          margin: "0 auto",
                        }}
                      >
                        {activeCategory.sanskritMeaning}
                      </p>
                    )}
                  </div>
                )}

                {/* Sub-Category Offerings List Grid */}
                <div
                  className="offerings-grid"
                  style={{
                    display: "grid",
                    gap: 1,
                    background: "rgba(28,31,74,0.06)",
                  }}
                >
                  {activeCategory.subCategories.map((sub) => {
                    const tagsArray: string[] = Array.isArray(sub.tags)
                      ? sub.tags
                      : [];
                    const topTagsArray: string[] = Array.isArray(sub.topTags)
                      ? sub.topTags
                      : [];

                    return (
                      <div
                        key={sub.id}
                        style={{
                          background: "white",
                          padding: "clamp(1.5rem, 3vw, 2rem)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: 20,
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            activeStyle.lightColor;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background =
                            "white";
                        }}
                      >
                        <div>
                          {/* Tags Badge list */}
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 6,
                              marginBottom: 12,
                            }}
                          >
                            {topTagsArray.map((tag) => (
                              <span
                                key={tag}
                                style={{
                                  fontFamily: "'DM Sans', sans-serif",
                                  fontSize: 10,
                                  color: "white",
                                  background: activeStyle.color,
                                  padding: "3px 8px",
                                  borderRadius: 4,
                                  fontWeight: 600,
                                  textTransform: "uppercase",
                                  letterSpacing: 0.5,
                                }}
                              >
                                {tag}
                              </span>
                            ))}

                            <span
                              style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: 10,
                                color: "var(--indigo)",
                                background: "rgba(28,31,74,0.06)",
                                padding: "3px 8px",
                                borderRadius: 4,
                                fontWeight: 500,
                              }}
                            >
                              {sub.requiresBooking
                                ? "Slot Booking Required"
                                : "Direct Form Submission"}
                            </span>
                          </div>

                          <h4
                            style={{
                              fontFamily: "'Cormorant Garamond', serif",
                              fontSize: "clamp(22px, 2.5vw, 26px)",
                              fontWeight: 500,
                              color: "var(--indigo)",
                              margin: "0 0 10px 0",
                              lineHeight: 1.2,
                            }}
                          >
                            {sub.name}
                          </h4>

                          {sub.description && (
                            <p
                              style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: 14,
                                color: "var(--text-mid)",
                                lineHeight: 1.6,
                                fontWeight: 300,
                                margin: 0,
                              }}
                            >
                              {sub.description}
                            </p>
                          )}
                        </div>

                        {/* Highlights benefits pill list */}
                        <div>
                          {tagsArray.length > 0 && (
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: 6,
                                marginBottom: 16,
                              }}
                            >
                              {tagsArray.map((t) => (
                                <span
                                  key={t}
                                  style={{
                                    fontFamily: "'DM Sans', sans-serif",
                                    fontSize: 11,
                                    color: activeStyle.color,
                                    background: activeStyle.lightColor,
                                    padding: "4px 10px",
                                    borderRadius: 100,
                                    fontWeight: 500,
                                  }}
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Booking Route Link Button */}
                          <a
                            href={`/offerings/${encodeURIComponent(sub.name)}/book`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                              background: activeStyle.color,
                              color: "white",
                              padding: "10px 20px",
                              borderRadius: 100,
                              fontSize: 13,
                              fontWeight: 600,
                              textDecoration: "none",
                              width: "100%",
                              boxSizing: "border-box",
                              transition: "transform 0.2s ease",
                              textAlign: "center",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.transform =
                                "translateY(-2px)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.transform =
                                "translateY(0)";
                            }}
                          >
                            {sub.requiresBooking
                              ? "View Available Slots"
                              : "Register / Submit Form"}
                            <ArrowUpRight size={16} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
      </div>
    </section>
  );
}
