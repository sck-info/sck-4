"use client";

import { photos } from "@/data/content";
import { useRef } from "react";
import HangingLotus from "@/components/HangingLotus";

export default function Gallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const doubled = [...photos, ...photos];

  return (
    <section
      id="Gallery"
      style={{
        background: "var(--indigo)",
        padding: "clamp(5rem, 10vw, 8rem) 0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <HangingLotus align="left" />

      <HangingLotus align="right" />
      <div
        style={{
          textAlign: "center",
          marginBottom: "clamp(2.5rem, 4vw, 3.5rem)",
          padding: "0 2rem",
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
              color: "var(--light-gold)",
              letterSpacing: 2,
              textTransform: "uppercase" as const,
              fontWeight: 500,
            }}
          >
            Gallery
          </span>
          <div style={{ width: 32, height: 1, background: "var(--gold)" }} />
        </div>
        <h2
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 400,
            color: "var(--ivory)",
            lineHeight: 1.1,
          }}
        >
          Moments of{" "}
          <span style={{ fontStyle: "italic", color: "var(--light-gold)" }}>
            Transformation
          </span>
        </h2>
      </div>

      {/* Scrolling */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 120,
            zIndex: 2,
            background: "linear-gradient(to right, var(--indigo), transparent)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 120,
            zIndex: 2,
            background: "linear-gradient(to left, var(--indigo), transparent)",
            pointerEvents: "none",
          }}
        />

        <div
          ref={trackRef}
          style={{
            display: "flex",
            gap: 20,
            animation: "galleryMarquee 90s linear infinite",
            width: "max-content",
            padding: "1rem 0 2rem",
          }}
        >
          {doubled.map((photo, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                width: 280,
                borderRadius: 16,
                overflow: "hidden",
                position: "relative",
                boxShadow: "0 4px 24px rgba(28,31,74,0.08)",
                cursor: "pointer",
                transition: "transform 0.3s, box-shadow 0.3s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-6px) scale(1.02)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 16px 40px rgba(28,31,74,0.16)";

                const track = trackRef.current;
                if (track) track.style.animationPlayState = "paused";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0) scale(1)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 4px 24px rgba(28,31,74,0.08)";
                const track = trackRef.current;
                if (track) track.style.animationPlayState = "running";
              }}
            >
              {/* Image */}
              <div
                style={{
                  width: 280,
                  height: 340,
                  background: "linear-gradient(135deg, #c8b49a, #8a7560)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <img
                  src={photo.src}
                  // alt={photo.caption}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(28,31,74,0.85) 0%, rgba(28,31,74,0.1) 50%, transparent 100%)",
                  }}
                />
              </div>

              {/*captions*/}

              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "1.25rem",
                }}
              >
                {/* <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 16,
                    color: "white",
                    fontStyle: "italic",
                    lineHeight: 1.4,
                    margin: 0,
                  }}
                >
                  {photo.caption}
                </p> */}
              </div>

              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "var(--gold)",
                  opacity: 0,
                  transition: "opacity 0.3s",
                }}
                className="gold-accent"
              />
            </div>
          ))}
        </div>

        <style>{`
          @keyframes galleryMarquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </section>
  );
}
