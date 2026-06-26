"use client";
import { profile } from "@/data/content";

export default function VisionMission() {
  return (
    <section
      id="vision"
      style={{
        background: "var(--indigo)",
        padding: "clamp(5rem, 10vw, 8rem) 2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(232,150,46,0.05) 0%, transparent 60%),
                             radial-gradient(circle at 80% 50%, rgba(107,143,113,0.05) 0%, transparent 60%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        {/* Section heading */}
        <div
          style={{
            textAlign: "center",
            marginBottom: "clamp(3rem, 5vw, 5rem)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                width: 32,
                height: 1,
                background: "rgba(232,150,46,0.5)",
              }}
            />
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
              Philosophy
            </span>
            <div
              style={{
                width: 32,
                height: 1,
                background: "rgba(232,150,46,0.5)",
              }}
            />
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(36px, 5vw, 52px)",
              fontWeight: 300,
              color: "var(--ivory)",
              lineHeight: 1.1,
            }}
          >
            Vision &amp; Mission
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          <div
            style={{
              border: "1px solid rgba(250,247,242,0.08)",
              borderRadius: 20,
              padding: "clamp(2rem, 4vw, 3rem)",
              position: "relative",
              overflow: "hidden",
              transition: "border-color 0.3s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor =
                "rgba(232,150,46,0.3)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor =
                "rgba(250,247,242,0.08)")
            }
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background:
                  "linear-gradient(90deg, transparent, var(--gold), transparent)",
              }}
            />
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 56,
                color: "rgba(232,150,46,0.15)",
                lineHeight: 1,
                marginBottom: "1.5rem",
                fontWeight: 300,
              }}
            >
              ✦
            </div>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                color: "var(--gold)",
                letterSpacing: 2,
                textTransform: "uppercase",
                fontWeight: 500,
                marginBottom: "1rem",
              }}
            >
              <b>Vision</b>
            </p>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(22px, 3vw, 28px)",
                fontWeight: 400,
                color: "var(--ivory)",
                lineHeight: 1.5,
                fontStyle: "italic",
              }}
            >
              {profile.vision}
            </p>
          </div>

          <div
            style={{
              border: "1px solid rgba(250,247,242,0.08)",
              borderRadius: 20,
              padding: "clamp(2rem, 4vw, 3rem)",
              position: "relative",
              overflow: "hidden",
              transition: "border-color 0.3s",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor =
                "rgba(107,143,113,0.4)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.borderColor =
                "rgba(250,247,242,0.08)")
            }
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background:
                  "linear-gradient(90deg, transparent, #6B8F71, transparent)",
              }}
            />
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 56,
                color: "rgba(107,143,113,0.2)",
                lineHeight: 1,
                marginBottom: "1.5rem",
                fontWeight: 300,
              }}
            >
              ◈
            </div>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                color: "#6B9F99",
                letterSpacing: 2,
                textTransform: "uppercase",
                fontWeight: 500,
                marginBottom: "1rem",
              }}
            >
              <b>Mission</b>
            </p>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(22px, 3vw, 28px)",
                fontWeight: 400,
                color: "var(--ivory)",
                lineHeight: 1.5,
                fontStyle: "italic",
              }}
            >
              {profile.mission}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
