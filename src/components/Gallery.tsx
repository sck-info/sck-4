"use client";

import { photos } from "@/data/content";
import { useRef, useState, useEffect, useCallback } from "react";
import HangingLotus from "@/components/HangingLotus";
import Link from "next/link";
import { useRealtime } from "@/hooks/useRealtime";
import { ArrowRight } from "lucide-react";

export default function Gallery() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dbPhotos, setDbPhotos] = useState<{ src: string }[]>([]);

  // Fetch only checked scrollable items
  const fetchScrollPhotos = useCallback(async () => {
    try {
      const res = await fetch("/api/gallery?scroll=true");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setDbPhotos(data.map((item: any) => ({ src: item.imageUrl })));
        } else {
          setDbPhotos([]);
        }
      } else {
        setDbPhotos([]);
      }
    } catch (err) {
      console.error("Failed to fetch scroll gallery photos:", err);
      setDbPhotos([]);
    }
  }, []);

  useEffect(() => {
    fetchScrollPhotos();
  }, [fetchScrollPhotos]);

  useRealtime(["gallery"], () => {
    fetchScrollPhotos();
  });

  // Build items stream with a "View Gallery" card inserted every 3 photos
  const listItems: (
    | { type: "photo"; src: string; id: string }
    | { type: "link"; id: string }
  )[] = [];

  dbPhotos.forEach((photo, index) => {
    listItems.push({
      type: "photo" as const,
      src: photo.src,
      id: `photo-${index}`,
    });
    // Configure here to show the view gallery card after how many photos
    if ((index + 1) % 4 === 0) {
      listItems.push({
        type: "link" as const,
        id: `gallery-link-${index}`,
      });
    }
  });

  // Make sure we have a link card at the end of the stream if it doesn't end with a multiple of 3
  if (listItems.length > 0 && listItems[listItems.length - 1].type !== "link") {
    listItems.push({
      type: "link" as const,
      id: "gallery-link-final",
    });
  }

  // Double it for infinite marquee loop
  const doubled = [...listItems, ...listItems];

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
              textTransform: "uppercase",
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

      {/* Scrolling / Centered Card track */}
      <div style={{ position: "relative" }}>
        {dbPhotos.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "1rem 0",
            }}
          >
            <Link
              href="/gallery"
              style={{
                flexShrink: 0,
                width: 280,
                height: 340,
                borderRadius: 16,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #1c1f4a 0%, #0e1026 100%)",
                border: "1px dashed rgba(232, 150, 46, 0.4)",
                color: "white",
                textDecoration: "none",
                padding: "2rem",
                textAlign: "center",
                boxShadow: "0 4px 24px rgba(28,31,74,0.15)",
                cursor: "pointer",
                transition:
                  "transform 0.3s, box-shadow 0.3s, border-color 0.3s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(-6px) scale(1.02)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 16px 40px rgba(28,31,74,0.25)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--gold)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform =
                  "translateY(0) scale(1)";
                (e.currentTarget as HTMLElement).style.boxShadow =
                  "0 4px 24px rgba(28,31,74,0.08)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(232, 150, 46, 0.4)";
              }}
            >
              <div className="w-10 h-10 rounded-full bg-[#b86a16]/20 border border-[#b86a16]/40 flex items-center justify-center mb-4 transition-colors">
                <ArrowRight className="w-4 h-4 text-[#e8962e]" />
              </div>
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 20,
                  fontWeight: 500,
                  color: "var(--light-gold)",
                  marginBottom: 8,
                }}
              >
                View Gallery
              </h3>
              <p className="text-[10px] text-white/70 leading-relaxed font-sans max-w-[200px]">
                Explore more moments of growth and community gatherings
              </p>
            </Link>
          </div>
        ) : (
          <>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: 120,
                zIndex: 2,
                background:
                  "linear-gradient(to right, var(--indigo), transparent)",
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
                background:
                  "linear-gradient(to left, var(--indigo), transparent)",
                pointerEvents: "none",
              }}
            />

            <div
              ref={trackRef}
              style={{
                display: "flex",
                gap: 20,
                animation: "galleryMarquee 60s linear infinite",
                width: "max-content",
                padding: "1rem 0 2rem",
              }}
            >
              {doubled.map((item, i) => {
                if (item.type === "link") {
                  return (
                    <Link
                      key={i}
                      href="/gallery"
                      style={{
                        flexShrink: 0,
                        width: 280,
                        height: 340,
                        borderRadius: 16,
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          "linear-gradient(135deg, #1c1f4a 0%, #0e1026 100%)",
                        border: "1px dashed rgba(232, 150, 46, 0.4)",
                        color: "white",
                        textDecoration: "none",
                        padding: "2rem",
                        textAlign: "center",
                        boxShadow: "0 4px 24px rgba(28,31,74,0.08)",
                        cursor: "pointer",
                        transition:
                          "transform 0.3s, box-shadow 0.3s, border-color 0.3s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateY(-6px) scale(1.02)";
                        (e.currentTarget as HTMLElement).style.boxShadow =
                          "0 16px 40px rgba(28,31,74,0.25)";
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "var(--gold)";
                        const track = trackRef.current;
                        if (track) track.style.animationPlayState = "paused";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.transform =
                          "translateY(0) scale(1)";
                        (e.currentTarget as HTMLElement).style.boxShadow =
                          "0 4px 24px rgba(28,31,74,0.08)";
                        (e.currentTarget as HTMLElement).style.borderColor =
                          "rgba(232, 150, 46, 0.4)";
                        const track = trackRef.current;
                        if (track) track.style.animationPlayState = "running";
                      }}
                    >
                      <div className="w-10 h-10 rounded-full bg-[#b86a16]/20 border border-[#b86a16]/40 flex items-center justify-center mb-4 transition-colors">
                        <ArrowRight className="w-4 h-4 text-[#e8962e]" />
                      </div>
                      <h3
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 20,
                          fontWeight: 500,
                          color: "var(--light-gold)",
                          marginBottom: 8,
                        }}
                      >
                        View Gallery
                      </h3>
                      <p className="text-[10px] text-white/70 leading-relaxed font-sans max-w-[200px]">
                        Explore more moments of growth and community gatherings
                      </p>
                    </Link>
                  );
                }

                return (
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
                    {/* Image Card */}
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
                        src={item.src}
                        alt="Transformation moment"
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
                );
              })}
            </div>

            <style>{`
              @keyframes galleryMarquee {
                0%   { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
            `}</style>
          </>
        )}
      </div>
    </section>
  );
}
