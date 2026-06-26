"use client";
import { useState } from "react";
import { categories } from "@/data/content";

type Session = {
  name: string;
  duration: string;
  price: string;
  priceNote: string;
  description: string;
  benefits: string[];
  format: string;
};

export default function Sessions() {
  const [activeTab, setActiveTab] = useState(0);
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
        <div style={{ marginBottom: "clamp(3rem, 5vw, 4rem)" }}>
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
              What I Offer
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
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                color: "var(--text-mid)",
                maxWidth: 380,
                lineHeight: 1.7,
                fontWeight: 300,
              }}
            >
              Each offering is carefully crafted to address the whole person —
              body, mind, and spirit. Prices are shown in the registration form.
              <br></br>
              *Once you submit the form and complete your payment, our team will
              reach out within <b>48 to 72 hours</b> to schedule and confirm
              your booking.
            </p>
          </div>
        </div>

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
              onClick={() => setActiveTab(i)}
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

        <div
          style={{
            background: "white",
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid rgba(28,31,74,0.06)",
            boxShadow: "0 4px 40px rgba(28,31,74,0.05)",
          }}
        >
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
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: "clamp(20px, 2.5vw, 24px)",
                    fontWeight: 500,
                    color: "var(--indigo)",
                    marginBottom: "0.5rem",
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
