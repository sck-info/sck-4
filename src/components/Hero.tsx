"use client";
import { useEffect, useRef } from "react";
import BreathingAnimation from "@/components/BreathingAnimation";

export default function Hero() {
  return (
    <section
      style={{
        minHeight: "100vh",
        background: "var(--indigo)",
        position: "relative",
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <BreathingAnimation />
      <div
        style={{
          position: "absolute",
          right: "-5%",
          top: "50%",
          transform: "translateY(-50%)",
          width: "min(700px, 90vw)",
          height: "min(700px, 90vw)",
          opacity: 0.07,
          pointerEvents: "none",
        }}
      ></div>

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

      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "8rem 2rem 5rem",
          width: "100%",
        }}
      >
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
              fontSize: "clamp(52px, 8vw, 88px)",
              fontWeight: 300,
              color: "var(--ivory)",
              lineHeight: 1.05,
              marginBottom: "1.5rem",
              letterSpacing: -1,
            }}
          >
            Inspire.
            <br />
            <span style={{ color: "var(--gold)", fontStyle: "italic" }}>
              Heal. Uplift.
            </span>
          </h1>

          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "clamp(16px, 2vw, 18px)",
              color: "rgba(250,247,242,0.65)",
              lineHeight: 1.75,
              maxWidth: 520,
              marginBottom: "3rem",
              fontWeight: 300,
            }}
          >
            Sharath Chandra Kancherla — Life Skills Facilitator, Mind & Breath
            Expert, Holistic Wellness Coach & Professional Singer. Inspiring 1.5
            lakh+ lives across 10+ countries.
          </p>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a
              href="#sessions"
              style={{
                background: "var(--light-gold)",
                color: "var(--indigo)",
                padding: "14px 32px",
                borderRadius: 100,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 0.3,
                transition: "transform 0.2s, box-shadow 0.2s",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 8px 32px rgba(232,150,46,0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0)";
                (e.currentTarget as HTMLElement).style.boxShadow = "none";
              }}
            >
              Explore Sessions
              <span style={{ fontSize: 18 }}>→</span>
            </a>
            <a
              href="#about"
              style={{
                border: "1px solid rgba(250,247,242,0.25)",
                color: "var(--ivory)",
                padding: "14px 32px",
                borderRadius: 100,
                fontSize: 15,
                fontWeight: 400,
                textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: 0.3,
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(250,247,242,0.5)";
                (e.currentTarget as HTMLElement).style.background =
                  "rgba(250,247,242,0.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(250,247,242,0.25)";
                (e.currentTarget as HTMLElement).style.background =
                  "transparent";
              }}
            >
              About Sharath Kancherla
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
