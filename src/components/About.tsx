// "use client";
// import { profile } from "@/data/content";

// export default function About() {
//   return (
//     <section
//       id="about"
//       style={{
//         background: "var(--ivory)",
//         padding: "clamp(5rem, 10vw, 9rem) 2rem",
//       }}
//     >
//       <div style={{ maxWidth: 1200, margin: "0 auto" }}>
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
//             gap: "clamp(3rem, 6vw, 6rem)",
//             alignItems: "center",
//           }}
//         >
//           <div style={{ position: "relative" }}>
//             <div
//               style={{
//                 position: "absolute",
//                 inset: -16,
//                 border: "1px solid rgba(232,150,46,0.25)",
//                 borderRadius: 24,
//                 zIndex: 0,
//               }}
//             />
//             <div
//               style={{
//                 position: "relative",
//                 zIndex: 1,
//                 borderRadius: 20,
//                 overflow: "hidden",
//                 aspectRatio: "3/4",
//                 background: "#d4c4b0",
//               }}
//             >
//               <div
//                 style={{
//                   width: "100%",
//                   height: "100%",
//                   display: "flex",
//                   flexDirection: "column",
//                   alignItems: "center",
//                   justifyContent: "center",
//                   gap: 12,
//                   background:
//                     "linear-gradient(160deg, #c8b49a 0%, #a8906e 100%)",
//                 }}
//               >
//                 <div style={{ fontSize: 80 }}>🙏</div>
//                 <p
//                   style={{
//                     fontFamily: "'DM Sans', sans-serif",
//                     fontSize: 13,
//                     color: "rgba(28,31,74,0.5)",
//                     textAlign: "center",
//                     padding: "0 2rem",
//                   }}
//                 >
//                   <img
//                     src="/sharath.jpeg"
//                     alt="Sharath Chandra Kancherla"
//                     style={{
//                       width: "100%",
//                       height: "100%",
//                       objectFit: "cover",
//                     }}
//                   />{" "}
//                 </p>
//               </div>

//               <div
//                 style={{
//                   position: "absolute",
//                   bottom: 0,
//                   left: 0,
//                   right: 0,
//                   background: "var(--indigo)",
//                   padding: "1.25rem 1.5rem",
//                 }}
//               >
//                 <p
//                   style={{
//                     fontFamily: "'Cormorant Garamond', serif",
//                     fontSize: 16,
//                     color: "var(--ivory)",
//                     fontStyle: "italic",
//                     lineHeight: 1.5,
//                     textAlign: "center",
//                   }}
//                 >
//                   Inspired by{" "}
//                   <span style={{ color: "var(--gold)" }}>
//                     Gurudev Sri Sri Ravi Shankar
//                   </span>
//                 </p>
//               </div>
//             </div>

//             <div
//               style={{
//                 position: "absolute",
//                 bottom: -20,
//                 right: -16,
//                 background: "var(--gold)",
//                 borderRadius: 14,
//                 padding: "10px 16px",
//                 zIndex: 2,
//                 boxShadow: "0 4px 20px rgba(232,150,46,0.3)",
//               }}
//             >
//               <div
//                 style={{
//                   fontFamily: "'Cormorant Garamond', serif",
//                   fontSize: 28,
//                   fontWeight: 600,
//                   color: "var(--indigo)",
//                   lineHeight: 1,
//                 }}
//               >
//                 13+
//               </div>
//               <div
//                 style={{
//                   fontFamily: "'DM Sans', sans-serif",
//                   fontSize: 11,
//                   color: "var(--indigo)",
//                   fontWeight: 600,
//                   letterSpacing: 0.5,
//                 }}
//               >
//                 Years
//               </div>
//             </div>
//           </div>

//           <div>
//             <div
//               style={{
//                 display: "inline-flex",
//                 alignItems: "center",
//                 gap: 8,
//                 marginBottom: "1.25rem",
//               }}
//             >
//               <div
//                 style={{ width: 32, height: 1, background: "var(--gold)" }}
//               />
//               <span
//                 style={{
//                   fontFamily: "'DM Sans', sans-serif",
//                   fontSize: 12,
//                   color: "var(--gold)",
//                   letterSpacing: 2,
//                   textTransform: "uppercase",
//                   fontWeight: 500,
//                 }}
//               >
//                 About
//               </span>
//             </div>

//             <h2
//               style={{
//                 fontFamily: "'Cormorant Garamond', serif",
//                 fontSize: "clamp(32px, 5vw, 48px)",
//                 fontWeight: 400,
//                 color: "var(--indigo)",
//                 lineHeight: 1.1,
//                 marginBottom: "0.75rem",
//               }}
//             >
//               {profile.name}
//             </h2>

//             <p
//               style={{
//                 fontFamily: "'Cormorant Garamond', serif",
//                 fontSize: 18,
//                 color: "var(--gold)",
//                 fontStyle: "italic",
//                 marginBottom: "1.5rem",
//                 lineHeight: 1.5,
//               }}
//             >
//               Young &amp; Dynamic International Faculty of AOL · Life Skills
//               Facilitator · Mind &amp; Breath Expert · Holistic Wellness Coach ·
//               Professional Singer
//             </p>

//             <p
//               style={{
//                 fontFamily: "'DM Sans', sans-serif",
//                 fontSize: 15,
//                 color: "var(--text-mid)",
//                 lineHeight: 1.85,
//                 marginBottom: "2rem",
//                 fontWeight: 300,
//               }}
//             >
//               {profile.bio}
//             </p>

//             <p
//               style={{
//                 fontFamily: "'DM Sans', sans-serif",
//                 fontSize: 11,
//                 color: "var(--text-light)",
//                 letterSpacing: 1.5,
//                 textTransform: "uppercase",
//                 marginBottom: "0.75rem",
//               }}
//             >
//               Credentials &amp; Expertise
//             </p>
//             <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
//               {profile.credentials.map((cred) => (
//                 <div
//                   key={cred}
//                   style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
//                 >
//                   <span
//                     style={{
//                       color: "var(--gold)",
//                       fontSize: 8,
//                       marginTop: 5,
//                       flexShrink: 0,
//                     }}
//                   >
//                     ◆
//                   </span>
//                   <span
//                     style={{
//                       fontFamily: "'DM Sans', sans-serif",
//                       fontSize: 14,
//                       color: "var(--text-mid)",
//                       lineHeight: 1.5,
//                     }}
//                   >
//                     {cred}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div
//         style={{
//           marginTop: "clamp(4rem, 7vw, 6rem)",
//           background: "var(--indigo)",
//           borderRadius: 20,
//           padding: "clamp(1.5rem, 3vw, 2rem) clamp(1.5rem, 3vw, 3rem)",
//           overflow: "hidden",
//           maxWidth: 1200,
//           marginLeft: "auto",
//           marginRight: "auto",
//         }}
//       >
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
//             gap: "clamp(1.5rem, 3vw, 2rem)",
//           }}
//         >
//           {profile.stats.map((s) => (
//             <div key={s.label} style={{ textAlign: "center" }}>
//               <div
//                 style={{
//                   fontFamily: "'Cormorant Garamond', serif",
//                   fontSize: "clamp(24px, 3vw, 34px)",
//                   fontWeight: 500,
//                   color: "var(--gold)",
//                   lineHeight: 1,
//                 }}
//               >
//                 {s.num}
//               </div>
//               <div
//                 style={{
//                   fontFamily: "'DM Sans', sans-serif",
//                   fontSize: 11,
//                   color: "rgba(250,247,242,0.45)",
//                   marginTop: 6,
//                   letterSpacing: 0.5,
//                   textTransform: "uppercase",
//                   lineHeight: 1.4,
//                 }}
//               >
//                 {s.label}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

"use client";
import { useEffect, useRef, useState } from "react";
import { profile } from "@/data/content";

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
          fontSize: "clamp(24px, 3vw, 34px)",
          fontWeight: 500,
          color: "var(--light-gold)",
          lineHeight: 1,
        }}
      >
        {triggered ? `${display}${suffix}` : "0"}
      </div>
      <div
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 11,
          color: "rgba(250,247,242,0.7)",
          marginTop: 6,
          letterSpacing: 0.5,
          textTransform: "uppercase" as const,
          lineHeight: 1.4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function StatsBar({ stats }: { stats: { num: string; label: string }[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const doubled = [...stats, ...stats];

  return (
    <div
      style={{
        marginTop: "clamp(4rem, 7vw, 6rem)",
        background: "var(--indigo)",
        borderRadius: 20,
        padding: "clamp(1.5rem, 3vw, 2rem) 0",
        overflow: "hidden",
        maxWidth: 1200,
        marginLeft: "auto",
        marginRight: "auto",
        position: "relative",
      }}
    >
      {/* Left fade */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 80,
          zIndex: 2,
          background: "linear-gradient(to right, #1C1F4A, transparent)",
          borderRadius: "20px 0 0 20px",
          pointerEvents: "none",
        }}
      />
      {/* Right fade */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 80,
          zIndex: 2,
          background: "linear-gradient(to left, #1C1F4A, transparent)",
          borderRadius: "0 20px 20px 0",
          pointerEvents: "none",
        }}
      />

      <div
        ref={trackRef}
        style={{
          display: "flex",
          gap: 0,
          animation: "marquee 24s linear infinite",
          width: "max-content",
        }}
      >
        {doubled.map((s, i) => (
          <div
            key={i}
            style={{
              textAlign: "center",
              padding: "0 clamp(2rem, 4vw, 3.5rem)",
              borderRight: "1px solid rgba(250,247,242,0.08)",
              minWidth: 140,
              flexShrink: 0,
            }}
          >
            <StatCard num={s.num} label={s.label} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        div[style*="marquee"]:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

export default function About() {
  return (
    <section
      id="about"
      style={{
        background: "var(--ivory)",
        padding: "clamp(5rem, 10vw, 9rem) 2rem",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "clamp(3rem, 6vw, 6rem)",
            alignItems: "center",
          }}
        >
          {/* Photo */}
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
                aspectRatio: "3/4",
                background: "#d4c4b0",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  background:
                    "linear-gradient(160deg, #c8b49a 0%, #a8906e 100%)",
                }}
              >
                <div style={{ fontSize: 80 }}>🙏</div>
                <p
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: "rgba(28,31,74,0.5)",
                    textAlign: "center",
                    padding: "0 2rem",
                  }}
                >
                  <img
                    src="/sharath.jpeg"
                    alt="Sharath Chandra Kancherla"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </p>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: "var(--indigo)",
                  padding: "1.25rem 1.5rem",
                }}
              >
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 16,
                    color: "var(--ivory)",
                    fontStyle: "italic",
                    lineHeight: 1.5,
                    textAlign: "center",
                  }}
                >
                  Inspired by{" "}
                  <span style={{ color: "var(--gold)" }}>
                    Gurudev Sri Sri Ravi Shankar
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
                background: "var(--gold)",
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
                lineHeight: 1.1,
                marginBottom: "0.75rem",
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
                marginBottom: "1.5rem",
                lineHeight: 1.5,
              }}
            >
              Young &amp; Dynamic International Faculty of AOL · Life Skills
              Facilitator · Mind &amp; Breath Expert · Holistic Wellness Coach ·
              Professional Singer
            </p>

            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                color: "var(--text-mid)",
                lineHeight: 1.85,
                marginBottom: "2rem",
                fontWeight: 300,
              }}
            >
              {profile.bio}
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
