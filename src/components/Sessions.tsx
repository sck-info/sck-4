"use client";
import { useState, useEffect } from "react";
import { categories } from "@/data/content";
import { Session } from "@/types/session";
import { ArrowUpRight } from "lucide-react";

export default function Sessions() {
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const updateFromHash = () => {
      const hash = window.location.hash.replace("#", "");

      if (!hash) return;

      const index = categories.findIndex((c) => c.id === hash);

      if (index !== -1) {
        setActiveTab(index);

        // wait until React renders the selected tab
        setTimeout(() => {
          document
            .getElementById(hash)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    };

    updateFromHash();

    window.addEventListener("hashchange", updateFromHash);

    return () => window.removeEventListener("hashchange", updateFromHash);
  }, []);
  const cat = categories[activeTab];

  return (
    <section
      id="sessions"
      style={{
        background: "var(--ivory)",
        padding: "clamp(5rem, 10vw, 9rem) 2rem",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header */}
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
              Offerings
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
                <span
                  style={{
                    color: "var(--gold)",
                    fontWeight: 600,
                  }}
                >
                  48–72 hours
                </span>{" "}
                to confirm and schedule your session.
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: "2.5rem",
            flexWrap: "wrap",
          }}
        >
          {categories.map((c, i) => (
            <button
              key={c.id}
              onClick={() => {
                setActiveTab(i);
                window.history.replaceState(null, "", `#${c.id}`);
              }}
              style={{
                padding: "10px 24px",
                borderRadius: 100,
                border:
                  activeTab === i
                    ? `1.5px solid ${c.color}`
                    : "1.5px solid rgba(28,31,74,0.12)",
                background: activeTab === i ? c.lightColor : "transparent",
                color: activeTab === i ? c.color : "var(--text-mid)",
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
              <span>{c.icon}</span>
              {c.label}
            </button>
          ))}
        </div>

        {/* Session Panel */}
        <div
          id={cat.id}
          style={{
            background: "white",
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(28,31,74,0.06)",
            boxShadow: "0 4px 40px rgba(28,31,74,0.05)",
            scrollMarginTop: "100px",
          }}
        >
          {/* Category header */}
          <div
            style={{
              background: cat.color,
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
                {cat.sessions.length} offering
                {cat.sessions.length > 1 ? "s" : ""}
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
                {cat.icon} {cat.label}
              </h3>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  color: "rgba(255,255,255,0.75)",
                  maxWidth: 480,
                  lineHeight: 1.7,
                  fontWeight: 300,
                }}
              >
                {cat.description}
              </p>
            </div>

            <a
              href={cat.formUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: "white",
                color: cat.color,
                padding: "14px 32px",
                borderRadius: 100,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
                transition: "transform 0.2s, box-shadow 0.2s",
                boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 8px 24px rgba(0,0,0,0.18)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 2px 12px rgba(0,0,0,0.1)";
              }}
            >
              Register for {cat.label}
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M7 17L17 7M17 7H7M17 7v10" />
              </svg>
            </a>
          </div>

          {/* Category Quote */}
          <div
            style={{
              padding: "1.2rem 2rem",
              background: cat.lightColor,
              border: `1px solid ${cat.color}25`,
              textAlign: "center",
              position: "relative",
            }}
          >
            {/* Decorative line */}
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
                  background: `${cat.color}55`,
                }}
              />
              <span
                style={{
                  color: cat.color,
                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                ✦
              </span>
              <div
                style={{
                  width: 45,
                  height: 1,
                  background: `${cat.color}55`,
                }}
              />
            </div>

            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(16px,1.8vw,19px)",
                color: cat.color,
                fontWeight: 500,
                lineHeight: 1.7,
                marginBottom: "0.35rem",
              }}
            >
              &ldquo;{cat.sanskritQuote}&rdquo;
            </p>

            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(12px,1.2vw,14px)",
                color: "var(--text-mid)",
                fontStyle: "italic",
                lineHeight: 1.5,
                maxWidth: 760,
                margin: "0 auto",
              }}
            >
              {cat.englishQuote}
            </p>

            {/* Bottom decoration */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                marginTop: "0.5rem",
              }}
            >
              <div
                style={{
                  width: 45,
                  height: 1,
                  background: `${cat.color}55`,
                }}
              />
              <span
                style={{
                  color: cat.color,
                  fontSize: 12,
                  opacity: 0.7,
                }}
              >
                ✦
              </span>
              <div
                style={{
                  width: 45,
                  height: 1,
                  background: `${cat.color}55`,
                }}
              />
            </div>
          </div>

          {/* Session cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 1,
              background: "rgba(28,31,74,0.06)",
            }}
          >
            {(cat.sessions as Session[]).map((session) => (
              <div
                key={session.name}
                style={{
                  background: "white",
                  padding: "clamp(1.5rem, 3vw, 2rem)",
                  transition: "background 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    cat.lightColor)
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background = "white")
                }
              >
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: cat.lightColor,
                      border: `1px solid ${cat.color}30`,
                      borderRadius: 100,
                      padding: "4px 12px",
                    }}
                  >
                    <svg
                      width="11"
                      height="11"
                      fill="none"
                      stroke={cat.color}
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 11,
                        color: cat.color,
                        fontWeight: 600,
                      }}
                    >
                      {session.duration}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      background: "rgba(28,31,74,0.04)",
                      border: "1px solid rgba(28,31,74,0.08)",
                      borderRadius: 100,
                      padding: "4px 12px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 11,
                        color: "var(--text-mid)",
                        fontWeight: 500,
                      }}
                    >
                      {session.format}
                    </span>
                  </div>
                </div>

                <h4
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(20px, 2.5vw, 24px)",
                    fontWeight: 500,
                    color: "var(--indigo)",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {session.name}
                </h4>

                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    color: "var(--text-mid)",
                    lineHeight: 1.7,
                    marginBottom: "1.25rem",
                    fontWeight: 300,
                    flex: 1,
                  }}
                >
                  {session.description}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {session.benefits.map((b) => (
                    <span
                      key={b}
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 11,
                        color: cat.color,
                        background: cat.lightColor,
                        padding: "3px 10px",
                        borderRadius: 100,
                        fontWeight: 500,
                      }}
                    >
                      {b}
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "1.25rem",
                  }}
                >
                  <a
                    href={session.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Register for ${session.name}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: cat.color,
                      color: "white",
                      padding: "10px 18px",
                      borderRadius: 9999,
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: "none",
                      width: "fit-content",
                      transition: "transform 0.2s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "translateY(-2px)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "translateY(0)")
                    }
                  >
                    Register
                    <ArrowUpRight size={18} strokeWidth={2.5} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
