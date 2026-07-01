"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { profile } from "@/data/content";
import type { ReactElement } from "react";

const slideshowImages = [
  {
    src: "/images/profile-hero1.jpeg",
    tag: "LIFE SKILLS FACILITATOR",
    alt: "Sharath Chandra Kancherla - CST touch",
  },
  {
    src: "/images/sck-music-therapy.jpeg",
    tag: "MUSIC THERAPIST",
    alt: "Sharath Chandra Kancherla - Swara Frequencies",
  },
  {
    src: "/images/sck-yoga.jpeg",
    tag: "YOGA & RAKKENHO",
    alt: "Sharath Chandra Kancherla - Sole Pressure",
  },
  {
    src: "/images/sck-tutuor.jpeg",
    tag: "VEDIC ASTROLOGER",
    alt: "Sharath Chandra Kancherla - Habit Adjustments",
  },
  {
    src: "/images/sck-cool.jpeg",
    tag: "NLP COACH & MENTOR",
    alt: "Sharath Chandra Kancherla - Chart Reading",
  },
];

const highlights = [
  "Art of Living",
  "13+ years of experience",
  "30,000+ IT employees",
  "Infosys, IBM, Microsoft, Google, Cognizant, TCS & Mylan",
  "100+ students",
  "1.5 lakh+ lives",
  "10+ countries",
  "8 states in India",
];


type HighlightPart = string | ReactElement;

function highlightText(text: string): HighlightPart[] {
  let result: HighlightPart[] = [text];

  highlights.forEach((phrase) => {
    result = result.flatMap((part) => {
      if (typeof part !== "string") return [part];

      return part.split(phrase).flatMap((segment, index, arr) => {
        if (index === arr.length - 1) return [segment];

        return [
          segment,
          <span
            key={`${phrase}-${index}`}
            style={{
              color: "var(--gold)",
              fontWeight: 600,
            }}
          >
            {phrase}
          </span>,
        ];
      });
    });
  });

  return result;
}

function useCountUp(target: number, duration = 2000, startTrigger: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startTrigger) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, startTrigger]);
  return count;
}

function StatCard({ num, label }: { num: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [triggered, setTriggered] = useState(false);

  const match = num.match(/^([\d.]+)(.*)$/);
  const numeric = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : num;

  const count = useCountUp(numeric, 2000, triggered);
  const display = Number.isInteger(numeric) ? count : count.toFixed(1);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setTriggered(true);
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 36,
          fontWeight: 400,
          color: "var(--indigo)",
          lineHeight: 1,
        }}
      >
        {triggered ? `${display}${suffix}` : "0"}
      </div>

      <div
        style={{
          width: 24,
          height: 1,
          background: "rgba(232,150,46,.35)",
          margin: "14px auto",
        }}
      />

      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 10,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          fontWeight: 600,
          color: "var(--text-light)",
          lineHeight: 1.6,
          maxWidth: 110,
          margin: "0 auto",
        }}
      >
        {label}
      </div>
    </div>
  );
}

function StatsBar({ stats }: { stats: { num: string; label: string }[] }) {
  return (
    <section
      style={{
        marginTop: "clamp(4rem, 7vw, 6rem)",
      }}
    >
      <div
        style={{
          maxWidth: 850,
          margin: "0 auto",
        }}
      >
        {/* Heading */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            marginBottom: "2rem",
          }}
        >
          {/* Same design as About */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginBottom: "1.25rem",
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
              Our Impact
            </span>
            <div
              style={{
                width: 32,
                height: 1,
                background: "var(--gold)",
              }}
            />
          </div>

          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(32px,5vw,48px)",
              fontWeight: 400,
              color: "var(--indigo)",
              lineHeight: 1.1,
              marginBottom: "1.5rem",
            }}
          >
            Transforming{" "}
            <span
              style={{
                color: "var(--gold)",
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              Thousands of Lives
            </span>
          </h2>

          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 18,
              color: "var(--gold)",
              fontStyle: "italic",
              marginBottom: "1rem",
              lineHeight: 1.5,
              maxWidth: 700,
            }}
          >
            More than a decade of nurturing well-being through breathwork,
            meditation, mindfulness and holistic wellness.
          </p>
        </div>

        {/* Cards */}
        <div className="stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="metric-card">
              <div className="corner top" />
              <div className="corner bottom" />

              <StatCard num={s.num} label={s.label} />
            </div>
          ))}
        </div>

        <style>{`
          .stats-grid{
            display:grid;
            grid-template-columns:repeat(5,minmax(0, 1fr));
            gap:20px;
          }

          .metric-card{
            position:relative;
            background:#fff;
            border:1px solid rgba(28,31,74,.08);
            height:150px;
            display:flex;
            justify-content:center;
            align-items:center;
            transition:.3s;
          }

          .metric-card:hover{
            transform:translateY(-5px);
            border-color:rgba(232,150,46,.35);
            box-shadow:0 12px 28px rgba(28,31,74,.08);
          }

          .corner{
            position:absolute;
            width:8px;
            height:8px;
          }

          .corner.top{
            top:8px;
            left:8px;
            border-top:1px solid rgba(232,150,46,.35);
            border-left:1px solid rgba(232,150,46,.35);
          }

          .corner.bottom{
            right:8px;
            bottom:8px;
            border-right:1px solid rgba(232,150,46,.35);
            border-bottom:1px solid rgba(232,150,46,.35);
          }

          @media(max-width:1200px){
  .stats-grid{
    grid-template-columns:repeat(3,1fr);
  }
}

@media(max-width:768px){
  .stats-grid{
    grid-template-columns:repeat(2,1fr);
  }
}

@media(max-width:600px){
  .stats-grid{
    grid-template-columns:1fr;
  }
}
        `}</style>
      </div>
    </section>
  );
}

export default function About() {
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setImgIndex((prev) => (prev + 1) % slideshowImages.length);
    }, 4000);
    return () => clearInterval(slideTimer);
  }, []);

  return (
    <section
      id="about"
      style={{
        background: "var(--ivory)",
        padding: "1.5rem 2rem",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "clamp(2rem, 4vw, 3rem)",
            alignItems: "center",
          }}
        >
          {/* Photo Carousel (matching sck-3) */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                inset: -16,
                border: "1px solid rgba(232,150,46,0.25)",
                borderRadius: 24,
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 1,
                borderRadius: 20,
                overflow: "hidden",
                // aspectRatio: "3/4",
                height: "clamp(420px, 60vw, 560px)",
                background: "#d4c4b0",
                border: "1px solid rgba(232,150,46,0.3)",
                boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  overflow: "hidden",
                  // position: "relative",
                  maxWidth: "580px",
                  // width: "100%",
                  // margin: "0 auto",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={imgIndex}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    <Image
                      src={slideshowImages[imgIndex].src}
                      alt={slideshowImages[imgIndex].alt}
                      fill
                      priority
                      style={{ objectFit: "cover" }}
                      sizes="(min-width: 1024px) 30vw, 85vw"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Tag Badge */}
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "var(--indigo)",
                  color: "var(--light-gold)",
                  fontSize: 10,
                  fontFamily: "monospace",
                  letterSpacing: "0.15em",
                  fontWeight: "bold",
                  padding: "6px 14px",
                  borderRadius: 6,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                  zIndex: 30,
                  overflow: "hidden",
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={imgIndex}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: "block" }}
                  >
                    {slideshowImages[imgIndex].tag}
                  </motion.span>
                </AnimatePresence>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "rgba(28,31,74,0.92)",
                  backdropFilter: "blur(8px)",
                  padding: "1rem 1.25rem",
                  zIndex: 20,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 18,
                    color: "var(--ivory)",
                    fontStyle: "italic",
                    lineHeight: 1.4,
                    textAlign: "center",
                  }}
                >
                  Inspired by{" "}
                  <span style={{ color: "var(--light-gold)" }}>
                    <a
                      href="https://gurudev.artofliving.org/"
                      style={{ color: "inherit", textDecoration: "underline" }}
                    >
                      Gurudev Sri Sri Ravi Shankar
                    </a>
                  </span>
                </p>
              </div>
            </div>

            {/* Years badge */}
            <div
              style={{
                position: "absolute",
                bottom: -20,
                right: -16,
                background: "var(--light-gold)",
                borderRadius: 14,
                padding: "10px 16px",
                zIndex: 2,
                boxShadow: "0 4px 20px rgba(232,150,46,0.3)",
              }}
            >
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 28,
                  fontWeight: 600,
                  color: "var(--indigo)",
                  lineHeight: 1,
                }}
              >
                13+
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11,
                  color: "var(--indigo)",
                  fontWeight: 600,
                  letterSpacing: 0.5,
                }}
              >
                Years
              </div>
            </div>
          </div>

          {/* Text */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{ width: 32, height: 1, background: "var(--gold)" }}
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
                About
              </span>
            </div>

            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 400,
                color: "var(--indigo)",
                lineHeight: 0.8,
                marginBottom: "0.5rem",
              }}
            >
              {profile.name}
            </h2>

            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 18,
                color: "var(--gold)",
                fontStyle: "italic",
                marginBottom: "0.75rem",
                lineHeight: 1.5,
              }}
            >
              Young &amp; Dynamic International Faculty · Life Skills
              Facilitator · Mind &amp; Breath Expert · Holistic Wellness Coach ·
              Professional Singer
            </p>

            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                color: "var(--text-mid)",
                lineHeight: 1.7,
                marginBottom: "1.5rem",
                fontWeight: 300,
              }}
            >
              {highlightText(profile.bio)}
            </p>

            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 11,
                color: "var(--text-light)",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBottom: "0.75rem",
              }}
            >
              Credentials &amp; Expertise
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {profile.credentials.map((cred) => (
                <div
                  key={cred}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                >
                  <span
                    style={{
                      color: "var(--gold)",
                      fontSize: 8,
                      marginTop: 5,
                      flexShrink: 0,
                    }}
                  >
                    ◆
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      color: "var(--text-mid)",
                      lineHeight: 1.5,
                    }}
                  >
                    {cred}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <StatsBar stats={profile.stats} />
    </section>
  );
}
