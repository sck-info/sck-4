"use client";

import BreathingAnimation from "@/components/BreathingAnimation";

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        background: "var(--indigo)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* top line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background:
            "linear-gradient(90deg, transparent, var(--gold), transparent)",
        }}
      />

      <div className="hero-wrapper">
        <div className="hero-grid">
          {/* LEFT */}
          <div className="hero-content">
            <div style={{ maxWidth: 680 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(232,150,46,0.12)",
                  border: "1px solid rgba(232,150,46,0.3)",
                  borderRadius: 100,
                  padding: "6px 16px",
                  marginBottom: "2rem",
                }}
              >
                <span style={{ color: "var(--gold)", fontSize: 10 }}>✦</span>

                <span
                  style={{
                    color: "var(--gold)",
                    fontSize: 12,
                    fontWeight: 500,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Holistic Healing & Ancient Wisdom
                </span>
              </div>

              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "clamp(52px,8vw,88px)",
                  fontWeight: 300,
                  color: "var(--ivory)",
                  lineHeight: 1.05,
                  marginBottom: "1.5rem",
                }}
              >
                Inspire.
                <br />
                <span
                  style={{
                    color: "var(--gold)",
                    fontStyle: "italic",
                  }}
                >
                  Heal. Uplift.
                </span>
              </h1>

              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "clamp(16px,2vw,18px)",
                  color: "rgba(250,247,242,.65)",
                  lineHeight: 1.75,
                  maxWidth: 520,
                  marginBottom: "3rem",
                }}
              >
                Sharath Chandra Kancherla — Life Skills Facilitator, Mind &
                Breath Expert, Holistic Wellness Coach & Professional Singer.
                Inspiring 1.5 lakh+ lives across 10+ countries.
              </p>

              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <a
                  href="#sessions"
                  style={{
                    background: "var(--light-gold)",
                    color: "var(--indigo)",
                    padding: "14px 32px",
                    borderRadius: 100,
                    textDecoration: "none",
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Explore Sessions →
                </a>

                <a
                  href="#about"
                  style={{
                    border: "1px solid rgba(250,247,242,.25)",
                    color: "white",
                    padding: "14px 32px",
                    borderRadius: 100,
                    textDecoration: "none",
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  About Sharath Kancherla
                </a>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="hero-animation">
            <BreathingAnimation />
          </div>
        </div>
      </div>

      <style>{`
        .hero-wrapper{
          max-width:1200px;
          margin:0 auto;
          padding:8rem 2rem 5rem;
        }

        .hero-grid{
          display:grid;
          grid-template-columns:1.1fr .9fr;
          align-items:center;
          gap:60px;
          min-height:calc(100vh - 13rem);
        }

        .hero-animation{
          display:flex;
          justify-content:center;
          align-items:center;
        }

        @media (max-width:980px){

          .hero-grid{
            grid-template-columns:1fr;
            text-align:center;
          }

          .hero-content{
            display:flex;
            justify-content:center;
          }

          .hero-content p{
            margin-left:auto;
            margin-right:auto;
          }

          .hero-content > div > div:last-child{
            justify-content:center;
          }

          .hero-animation{
            margin-top:60px;
          }
        }
      `}</style>
    </section>
  );
}
