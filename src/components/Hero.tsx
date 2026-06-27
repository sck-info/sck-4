"use client";
import { useEffect, useRef } from "react";

export default function Hero() {
  const mandalaRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let angle = 0;
    const animate = () => {
      angle += 0.08;
      if (mandalaRef.current) {
        mandalaRef.current.setAttribute(
          "transform",
          `translate(50,50) rotate(${angle})`,
        );
      }
      requestAnimationFrame(animate);
    };
    const id = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(id);
  }, []);

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
      >
        <svg viewBox="0 0 100 100" width="100%" height="100%">
          <g ref={mandalaRef}>
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
              (deg, i) => (
                <g key={i} transform={`rotate(${deg})`}>
                  <ellipse cx="0" cy="-30" rx="2.5" ry="8" fill="#E8962E" />
                  <ellipse cx="0" cy="-44" rx="1.5" ry="5" fill="#E8962E" />
                  <circle cx="0" cy="-22" r="1.5" fill="#E8962E" />
                </g>
              ),
            )}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <g key={i} transform={`rotate(${deg})`}>
                <path d="M0,-14 L3,-8 L0,-4 L-3,-8 Z" fill="#FAF7F2" />
              </g>
            ))}
            <circle
              cx="0"
              cy="0"
              r="6"
              fill="none"
              stroke="#E8962E"
              strokeWidth="0.5"
            />
            <circle
              cx="0"
              cy="0"
              r="14"
              fill="none"
              stroke="#FAF7F2"
              strokeWidth="0.3"
            />
            <circle
              cx="0"
              cy="0"
              r="22"
              fill="none"
              stroke="#E8962E"
              strokeWidth="0.3"
            />
            <circle
              cx="0"
              cy="0"
              r="36"
              fill="none"
              stroke="#FAF7F2"
              strokeWidth="0.2"
            />
            <circle
              cx="0"
              cy="0"
              r="46"
              fill="none"
              stroke="#E8962E"
              strokeWidth="0.2"
            />
          </g>
        </svg>
      </div>

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

// "use client";

// import { useEffect, useRef } from "react";
// import Image from "next/image";

// export default function Hero() {
//   const mandalaRef = useRef<SVGGElement>(null);

//   useEffect(() => {
//     let angle = 0;
//     let animationId: number;

//     const animate = () => {
//       angle += 0.08;

//       if (mandalaRef.current) {
//         mandalaRef.current.setAttribute(
//           "transform",
//           `translate(50,50) rotate(${angle})`,
//         );
//       }

//       animationId = requestAnimationFrame(animate);
//     };

//     animationId = requestAnimationFrame(animate);

//     return () => cancelAnimationFrame(animationId);
//   }, []);

//   return (
//     <section
//       style={{
//         minHeight: "100vh",
//         background: "var(--indigo)",
//         position: "relative",
//         display: "flex",
//         alignItems: "center",
//         overflow: "hidden",
//       }}
//     >
//       <div
//         style={{
//           position: "absolute",
//           right: "-5%",
//           top: "50%",
//           transform: "translateY(-50%)",
//           width: "min(700px, 90vw)",
//           height: "min(700px, 90vw)",
//           pointerEvents: "none",
//         }}
//       >
//         <svg
//           viewBox="0 0 100 100"
//           width="100%"
//           height="100%"
//           style={{
//             opacity: 0.18,
//             position: "absolute",
//             inset: 0,
//           }}
//         >
//           <g ref={mandalaRef}>
//             {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(
//               (deg, i) => (
//                 <g key={i} transform={`rotate(${deg})`}>
//                   <ellipse cx="0" cy="-30" rx="2.5" ry="8" fill="#E8962E" />
//                   <ellipse cx="0" cy="-44" rx="1.5" ry="5" fill="#E8962E" />
//                   <circle cx="0" cy="-22" r="1.5" fill="#E8962E" />
//                 </g>
//               ),
//             )}

//             {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
//               <g key={`inner-${i}`} transform={`rotate(${deg})`}>
//                 <path d="M0,-14 L3,-8 L0,-4 L-3,-8 Z" fill="#FAF7F2" />
//               </g>
//             ))}

//             <circle
//               cx="0"
//               cy="0"
//               r="6"
//               fill="none"
//               stroke="#E8962E"
//               strokeWidth="0.5"
//             />
//             <circle
//               cx="0"
//               cy="0"
//               r="14"
//               fill="none"
//               stroke="#FAF7F2"
//               strokeWidth="0.3"
//             />
//             <circle
//               cx="0"
//               cy="0"
//               r="22"
//               fill="none"
//               stroke="#E8962E"
//               strokeWidth="0.3"
//             />
//             <circle
//               cx="0"
//               cy="0"
//               r="36"
//               fill="none"
//               stroke="#FAF7F2"
//               strokeWidth="0.2"
//             />
//             <circle
//               cx="0"
//               cy="0"
//               r="46"
//               fill="none"
//               stroke="#E8962E"
//               strokeWidth="0.2"
//             />
//           </g>
//         </svg>

//         <div
//           style={{
//             position: "absolute",
//             left: "50%",
//             top: "50%",
//             transform: "translate(-50%, -50%)",
//             width: 320,
//             height: 320,
//             borderRadius: "50%",
//             background:
//               "radial-gradient(circle, rgba(232,150,46,0.25) 0%, rgba(232,150,46,0.08) 50%, transparent 75%)",
//             filter: "blur(25px)",
//             zIndex: 1,
//           }}
//         />

//         <div
//           style={{
//             position: "absolute",
//             inset: 0,
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             zIndex: 2,
//           }}
//         >
//           <Image
//             src="/meditation.png"
//             alt="Meditating Person"
//             width={400}
//             height={400}
//             priority
//             style={{
//               objectFit: "contain",
//               filter: "drop-shadow(0 0 30px rgba(232,150,46,0.3))",
//               opacity: 1,
//             }}
//           />
//         </div>
//       </div>

//       <div
//         style={{
//           position: "absolute",
//           top: 0,
//           left: 0,
//           right: 0,
//           height: 3,
//           background:
//             "linear-gradient(90deg, transparent, var(--gold), transparent)",
//         }}
//       />

//       <div
//         style={{
//           maxWidth: 1200,
//           margin: "0 auto",
//           padding: "8rem 2rem 5rem",
//           width: "100%",
//           position: "relative",
//           zIndex: 10,
//         }}
//       >
//         <div style={{ maxWidth: 680 }}>
//           <div
//             style={{
//               display: "inline-flex",
//               alignItems: "center",
//               gap: 8,
//               background: "rgba(232,150,46,0.12)",
//               border: "1px solid rgba(232,150,46,0.3)",
//               borderRadius: 100,
//               padding: "6px 16px",
//               marginBottom: "2rem",
//             }}
//           >
//             <span style={{ color: "var(--gold)", fontSize: 10 }}>✦</span>
//             <span
//               style={{
//                 color: "var(--gold)",
//                 fontSize: 12,
//                 fontWeight: 500,
//                 letterSpacing: 1.5,
//                 textTransform: "uppercase",
//                 fontFamily: "'DM Sans', sans-serif",
//               }}
//             >
//               Holistic Healing & Ancient Wisdom
//             </span>
//           </div>

//           <h1
//             style={{
//               fontFamily: "'Cormorant Garamond', serif",
//               fontSize: "clamp(52px, 8vw, 88px)",
//               fontWeight: 300,
//               color: "var(--ivory)",
//               lineHeight: 1.05,
//               marginBottom: "1.5rem",
//               letterSpacing: -1,
//             }}
//           >
//             Inspire.
//             <br />
//             <span style={{ color: "var(--gold)", fontStyle: "italic" }}>
//               Heal. Uplift.
//             </span>
//           </h1>

//           <p
//             style={{
//               fontFamily: "'DM Sans', sans-serif",
//               fontSize: "clamp(16px, 2vw, 18px)",
//               color: "rgba(250,247,242,0.65)",
//               lineHeight: 1.75,
//               maxWidth: 520,
//               marginBottom: "3rem",
//               fontWeight: 300,
//             }}
//           >
//             Sharath Chandra Kancherla — Life Skills Facilitator, Mind & Breath
//             Expert, Holistic Wellness Coach & Professional Singer. Inspiring 1.5
//             lakh+ lives across 10+ countries.
//           </p>
//           <div
//             style={{
//               display: "flex",
//               gap: 16,
//               flexWrap: "wrap",
//             }}
//           >
//             <a
//               href="#sessions"
//               style={{
//                 background: "var(--gold)",
//                 color: "var(--indigo)",
//                 padding: "14px 32px",
//                 borderRadius: 100,
//                 fontSize: 15,
//                 fontWeight: 600,
//                 textDecoration: "none",
//                 fontFamily: "'DM Sans', sans-serif",
//                 letterSpacing: 0.3,
//                 display: "inline-flex",
//                 alignItems: "center",
//                 gap: 8,
//                 transition: "all 0.3s ease",
//               }}
//             >
//               Explore Sessions
//               <span style={{ fontSize: 18 }}>→</span>
//             </a>

//             <a
//               href="#about"
//               style={{
//                 border: "1px solid rgba(250,247,242,0.25)",
//                 color: "var(--ivory)",
//                 padding: "14px 32px",
//                 borderRadius: 100,
//                 fontSize: 15,
//                 fontWeight: 400,
//                 textDecoration: "none",
//                 fontFamily: "'DM Sans', sans-serif",
//                 letterSpacing: 0.3,
//               }}
//             >
//               About Sharath Kancherla
//             </a>
//           </div>
//         </div>
//       </div>
//     </section>
//   );
// }
