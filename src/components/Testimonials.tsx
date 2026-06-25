"use client";
const testimonials = [
  {
    name: "ABC",
    role: "CST Client, Bengaluru",
    text: "Wonderful experience",
    initial: "A",
    color: "#6B8F71",
    light: "#EAF2EB",
  },
  {
    name: "DEF",
    role: "Vedic Astrology Consultation",
    text: "His reading was extraordinarily precise.",
    initial: "A",
    color: "#C4796A",
    light: "#FAF0EE",
  },
  {
    name: "GHI",
    role: "NLP Workshop Attendee",
    text: "The NLP workshop transformed the way I relate to my own mind.",
    initial: "A",
    color: "#C9873A",
    light: "#FDF4E8",
  },
];

export default function Testimonials() {
  return (
    <section
      style={{
        background: "white",
        padding: "clamp(5rem, 10vw, 8rem) 2rem",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            textAlign: "center",
            marginBottom: "clamp(3rem, 5vw, 4rem)",
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
              Testimonials
            </span>
            <div style={{ width: 32, height: 1, background: "var(--gold)" }} />
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 400,
              color: "var(--indigo)",
              lineHeight: 1.1,
            }}
          >
            Stories of Experiences
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          {testimonials.map((t) => (
            <div
              key={t.name}
              style={{
                border: "1px solid rgba(28,31,74,0.06)",
                borderRadius: 20,
                padding: "2rem",
                background: "var(--ivory)",
                transition: "transform 0.2s, box-shadow 0.2s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-4px)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 12px 40px rgba(28,31,74,0.08)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 80,
                  lineHeight: 0.8,
                  color: t.color,
                  opacity: 0.2,
                  marginBottom: "0.5rem",
                  fontWeight: 300,
                }}
              >
                "
              </div>

              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(17px, 2.5vw, 20px)",
                  color: "var(--text-dark)",
                  lineHeight: 1.65,
                  marginBottom: "1.5rem",
                  fontStyle: "italic",
                }}
              >
                {t.text}
              </p>

              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: t.light,
                    border: `1.5px solid ${t.color}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: t.color,
                  }}
                >
                  {t.initial}
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--indigo)",
                    }}
                  >
                    {t.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 12,
                      color: t.color,
                    }}
                  >
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
