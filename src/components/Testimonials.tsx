"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useRealtime } from "@/hooks/useRealtime";

const testimonials = [
  {
    name: "Usha",
    role: "Software Architect",
    text: "The CranioSacral therapy sessions with Sharath have been deeply restorative. I walked in with chronic stress and neck tension from desk work, and left feeling an incredible sense of space, lightness, and deep alignment. His gentle touch is truly therapeutic.",
    therapy: "CranioSacral Therapy",
  },
  {
    name: "Gokul",
    role: "Developer",
    text: "As a long-time practitioner of yoga, I was amazed by the effectiveness of Rakkenho. The rhythmic foot pressure completely released tension in my lower back that years of stretching couldn't touch. An ancient art masterfully applied.",
    therapy: "Rakkenho Therapy",
  },
  {
    name: "Sanjana",
    role: "Teacher",
    text: "Sharath's vocal harmonics and sound healing sessions helped me navigate a period of severe anxiety. The frequencies resonance created a safe space for emotional release and profound mental clarity. Highly recommended for inner peace.",
    therapy: "Music Therapy",
  },
  {
    name: "Harshith",
    role: "Entrepreneur",
    text: "The Vedic astrology reading was eye-opening. Sharath doesn't just read charts; he translates planetary patterns into practical life guidance. It gave me absolute clarity on my career path during a major transition phase.",
    therapy: "Vedic Astrology",
  },
  {
    name: "Sriram",
    role: "Mindfulness Advocate",
    text: "The box breathing guidance and holistic health coaching completely reset my sleep cycle and energy levels. Sharath's deep understanding of wellness integrates ancient Indian traditions with a modern lifestyle.",
    therapy: "Holistic Lifestyle Coaching",
  },
  {
    name: "Maneeth",
    role: "Lawyer",
    text: "Attending Sharath's Satsang was a truly uplifting experience. The combination of soulful music, guided meditation, and powerful wisdom created an atmosphere of peace that stayed with me long after the satsang ended. I left feeling lighter, more connected, and deeply inspired.",
    therapy: "Satsang",
  },
  {
    name: "Praneesh",
    role: "Fitness Enthusiast",
    text: "The Nutrition Workshop completely changed the way I look at food and health. Sharath explained complex nutritional concepts in a simple, practical way, making it easy to build sustainable habits. I've noticed better energy, improved digestion, and a healthier lifestyle without restrictive dieting.",
    therapy: "Nutrition Workshop",
  },
];

export default function Testimonials() {
  const [items, setItems] = useState<typeof testimonials>(testimonials);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchActiveFeedbacks = async () => {
    try {
      const res = await fetch("/api/feedbacks/active");
      if (!res.ok) return;
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setItems(json.data);
      }
    } catch (err) {
      console.error("Failed to load active testimonials:", err);
    }
  };

  useEffect(() => {
    fetchActiveFeedbacks();
  }, []);

  useRealtime(["feedbacks", "users"], fetchActiveFeedbacks);

  const nextSlide = () =>
    setCurrentIndex((prev) => (prev + 1) % items.length);

  const prevSlide = () =>
    setCurrentIndex(
      (prev) => (prev - 1 + items.length) % items.length,
    );

  const prevIndex =
    (currentIndex - 1 + items.length) % items.length;

  const nextIndex = (currentIndex + 1) % items.length;

  return (
    <section
      id="Testimonials"
      style={{
        background: "white",
        padding: "clamp(3rem, 8vw, 6rem) 1rem",
        overflow: "hidden",
      }}
    >
      <style jsx>{`
        .testimonial-carousel {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          width: 100%;
          position: relative;
        }

        .side-card {
          flex: 0 0 28%;
          opacity: 0.32;
          filter: blur(4px);
          transform: scale(0.86);
          pointer-events: none;
          transition: all 0.35s ease;
        }

        .active-card {
          flex: 0 0 48%;
          max-width: 620px;
          z-index: 10;
          transition: all 0.35s ease;
        }

        @media (max-width: 768px) {
          .testimonial-carousel {
            gap: 0;
          }

          .side-card {
            display: none;
          }

          .active-card {
            flex: 0 0 100%;
            max-width: 100%;
          }
        }
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "1rem",
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
                background: "var(--gold)",
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
              Testimonials
            </span>
            <div
              style={{
                width: 32,
                height: 1,
                background: "var(--gold)",
              }}
            />
          </div>
        </div>

        <h2
          style={{
            textAlign: "center",
            marginBottom: "3rem",
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(28px, 5vw, 48px)",
            color: "var(--indigo)",
            fontWeight: 300,
            lineHeight: 1.1,
          }}
        >
          Stories of{" "}
          <span
            style={{
              color: "var(--gold)",
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(28px, 5vw, 48px)",
              fontWeight: 300,
            }}
          >
            <i>Healing & Transformation</i>
          </span>
        </h2>

        <div className="testimonial-carousel">
          {/* Previous Card */}
          <div className="side-card">
            <TestimonialCard data={items[prevIndex]} />
          </div>

          {/* Active Card */}
          <div className="active-card">
            <TestimonialCard data={items[currentIndex]} active />
          </div>

          {/* Next Card */}
          <div className="side-card">
            <TestimonialCard data={items[nextIndex]} />
          </div>
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "20px",
            marginTop: "3rem",
          }}
        >
          <button
            onClick={prevSlide}
            aria-label="Previous testimonial"
            style={{
              cursor: "pointer",
              background: "white",
              border: "1px solid var(--gold)",
              padding: "10px",
              borderRadius: "50%",
              color: "var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {items.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to testimonial ${index + 1}`}
                style={{
                  width: index === currentIndex ? 24 : 8,
                  height: 8,
                  border: "none",
                  borderRadius: 999,
                  background:
                    index === currentIndex
                      ? "var(--gold)"
                      : "var(--gold-light)",
                  cursor: "pointer",
                  padding: 0,
                  transition: "width 0.3s ease",
                }}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            aria-label="Next testimonial"
            style={{
              cursor: "pointer",
              background: "white",
              border: "1px solid var(--gold)",
              padding: "10px",
              borderRadius: "50%",
              color: "var(--gold)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  data,
  active = false,
}: {
  data: {
    name: string;
    role: string;
    text: string;
    therapy: string;
    rating?: number;
    avatar?: string | null;
  };
  active?: boolean;
}) {
  return (
    <div
      style={{
        border: "1px solid rgba(28,31,74,0.06)",
        borderRadius: 20,
        padding: "clamp(1.5rem, 4vw, 2.5rem)",
        background: "var(--ivory)",
        minHeight: "350px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        boxShadow: active
          ? "0 24px 80px rgba(28,31,74,0.12)"
          : "0 14px 40px rgba(28,31,74,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div
          style={{
            fontSize: 40,
            lineHeight: 0.5,
            color: "var(--gold)",
            opacity: 0.3,
          }}
        >
          &ldquo;
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={13}
              style={{
                fill: i < (data.rating ?? 5) ? "var(--gold)" : "none",
                stroke: "var(--gold)",
                opacity: i < (data.rating ?? 5) ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      </div>

      <p
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "clamp(1rem, 2vw, 1.25rem)",
          color: "var(--text-dark)",
          lineHeight: 1.6,
          marginBottom: "2rem",
          fontStyle: "italic",
        }}
      >
        {data.text}
      </p>

      <div
        style={{
          marginTop: "auto",
          borderTop: "1px solid rgba(28,31,74,0.1)",
          paddingTop: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* Avatar or Letter block */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            overflow: "hidden",
            background: "rgba(28,31,74,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: "1px solid rgba(28,31,74,0.08)",
          }}
        >
          {data.avatar ? (
            <img
              src={data.avatar}
              alt={data.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "var(--indigo)",
              }}
            >
              {data.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--indigo)",
              marginBottom: 2,
            }}
          >
            {data.name}
          </p>

          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              color: "var(--text-mid)",
              marginBottom: 2,
            }}
          >
            {data.role} &bull; <span style={{ color: "var(--gold)", fontWeight: 600 }}>{data.therapy}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
