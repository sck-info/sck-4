'use client';

import { useState, useEffect } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  size: number;
}

interface ChakraMeditationProps {
  size?: number;
  speed?: number;
}

export default function ChakraMeditation({ size = 360, speed = 1000 }: ChakraMeditationProps) {
  const [step, setStep] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 15 }).map((_, i) => ({
        id: i,
        x: 40 + Math.random() * 120,
        y: 100 + Math.random() * 140,
        delay: Math.random() * 5,
        duration: 3 + Math.random() * 4,
        size: 0.5 + Math.random() * 1.2,
      }))
    );
  }, []);

  useEffect(() => {
    let delay = speed;
    if (step === 7 || step === 14) {
      delay = 1000;
    }
    const timeoutId = setTimeout(() => {
      setStep((s) => {
        const next = s + 1;
        if (next > 14) return 1;
        return next;
      });
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [step, speed]);

  const isChakraActive = (i: number) => {
    if (step === 0) return false;
    if (step > 0 && step <= 7) return step > i;
    if (step > 7 && step <= 14) return i < 14 - step;
    return false;
  };

  const chakrasData = [
    { name: "Root",         sanskrit: "Muladhara",    color: "#EF4444", cy: 230, r: 11, baseGlow: "4px",  maxGlow: "10px", location: "Base of spine",    description: "Grounding, stability, security.",  side: "right" },
    { name: "Sacral",       sanskrit: "Svadhisthana", color: "#F97316", cy: 191, r: 11, baseGlow: "5px",  maxGlow: "12px", location: "Lower abdomen",    description: "Creativity, emotion, sensuality.",  side: "left"  },
    { name: "Solar Plexus", sanskrit: "Manipura",     color: "#EAB308", cy: 151, r: 11, baseGlow: "6px",  maxGlow: "14px", location: "Upper abdomen",    description: "Willpower, confidence, identity.",  side: "right" },
    { name: "Heart",        sanskrit: "Anahata",      color: "#22C55E", cy: 112, r: 11, baseGlow: "7px",  maxGlow: "16px", location: "Center of chest",   description: "Love, compassion, harmony.",       side: "left"  },
    { name: "Throat",       sanskrit: "Vishuddha",    color: "#3B82F6", cy:  72, r: 11, baseGlow: "8px",  maxGlow: "18px", location: "Throat",            description: "Expression, truth, communication.", side: "right" },
    { name: "Third Eye",    sanskrit: "Ajna",         color: "#6366F1", cy:  46, r: 11, baseGlow: "9px",  maxGlow: "20px", location: "Between eyebrows",  description: "Intuition, insight, perception.",   side: "left"  },
    { name: "Crown",        sanskrit: "Sahasrara",    color: "#A855F7", cy:  20, r: 12, baseGlow: "12px", maxGlow: "24px", location: "Top of head",       description: "Consciousness, awareness, wisdom.", side: "right" },
  ];

  const renderCard = (i: number) => {
    const c = chakrasData[i];
    const active = isChakraActive(i);
    return (
      <div
        key={c.name}
        className={`chakra-card chakra-card-${c.side} ${active ? "chakra-card-visible" : ""}`}
        aria-hidden={!active}
      >
        <div className="chakra-card-head">
          <span className="chakra-card-dot" style={{ background: c.color, color: c.color }} />
          <div>
            <div className="chakra-card-name">{c.name}</div>
            <div className="chakra-card-sanskrit">{c.sanskrit}</div>
          </div>
        </div>
        <div className="chakra-card-meta">{c.location}</div>
        <div className="chakra-card-desc">{c.description}</div>
      </div>
    );
  };

  return (
    <div className="chakra-meditation-root">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .chakra-meditation-root {
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 24px;
              /* CHANGED: Prevent cards from wrapping to the next line on intermediate screens */
              flex-wrap: nowrap;
              padding: 16px;
            }
            .chakra-column {
              display: flex;
              flex-direction: column-reverse;
              justify-content: space-around;
              width: 220px;
              min-height: ${size}px;
            }
            .chakra-column-left  { align-items: flex-end; }
            .chakra-column-right { align-items: flex-start; }

            .chakra-card {
              width: 100%;
              max-width: 220px;
              box-sizing: border-box;
              padding: 12px 14px;
              background: #ffffff;
              border: 1px solid rgba(28, 31, 74, 0.08);
              border-radius: 12px;
              opacity: 0;
              transform: translateY(6px);
              transition: opacity 0.7s ease, transform 0.7s ease;
              pointer-events: none;
              box-shadow: 0 4px 20px rgba(28, 31, 74, 0.02);
            }
            .chakra-card-left  { transform: translate(-6px, 6px); }
            .chakra-card-right { transform: translate( 6px, 6px); }
            .chakra-card-visible {
              opacity: 1;
              transform: translate(0, 0);
              pointer-events: auto;
            }

            .chakra-card-head {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 6px;
            }
            .chakra-card-dot {
              width: 10px;
              height: 10px;
              border-radius: 50%;
              flex-shrink: 0;
              box-shadow: 0 0 8px currentColor;
            }
            .chakra-card-name     { font-size: 13px; font-weight: 600; color: #1c1f4a; line-height: 1.2; }
            .chakra-card-sanskrit { font-size: 10px; font-style: italic; color: #5a5e7a; line-height: 1.2; }
            .chakra-card-meta     { font-size: 10px; color: #888c9f; margin-bottom: 4px; }
            .chakra-card-desc     { font-size: 11px; color: #5a5e7a; line-height: 1.4; }

            .chakra {
              will-change: transform, filter, opacity;
              transform-origin: center;
            }
            .chakra-active {
              animation: pulse-glow 3s infinite alternate ease-in-out;
            }
            @keyframes pulse-glow {
              0%   { transform: scale(1);    filter: brightness(1)   drop-shadow(0 0 var(--glow-base) var(--chakra-color)); }
              100% { transform: scale(1.08); filter: brightness(1.2) drop-shadow(0 0 var(--glow-max)  var(--chakra-color)); }
            }
            .particle {
              fill: #FFFFFF;
              opacity: 0;
              animation: float-up var(--duration) linear var(--delay) infinite;
            }
            @keyframes float-up {
              0%   { transform: translateY(0);      opacity: 0;   }
              20%  {                                opacity: 0.2; }
              80%  {                                opacity: 0.2; }
              100% { transform: translateY(-80px);  opacity: 0;   }
            }

            @media (max-width: 900px) {
              /* CHANGED: Hide the left and right popup columns completely on small screens */
              .chakra-column { 
                display: none; 
              }
            }
            @media (prefers-reduced-motion: reduce) {
              .chakra-active {
                animation: none !important;
                filter: brightness(1.1) drop-shadow(0 0 var(--glow-base) var(--chakra-color));
              }
              .particle { display: none !important; }
              .chakra-card { transition: opacity 0.3s ease !important; }
            }
          `,
        }}
      />

      {/* LEFT column */}
      <div className="chakra-column chakra-column-left">
        {chakrasData.map((c, i) => (c.side === "left" ? renderCard(i) : null))}
      </div>

      {/* CENTER SVG */}
      <svg
        viewBox="0 -10 200 280"
        style={{ height: size, maxWidth: "100%" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {chakrasData.map((c, i) => (
            <radialGradient id={`grad-${i}`} key={`grad-${i}`}>
              <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="30%"  stopColor={c.color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={c.color} stopOpacity="0.1" />
            </radialGradient>
          ))}
        </defs>

        {/* Meditation silhouette */}
        <g opacity="0.85" fill="#1C1F4A">
          <circle cx="100" cy="32" r="15" />
          <path d="
            M 93 47
            L 93 58
            C 80 60 70 68 65 82
            C 60 100 62 130 68 158
            C 72 178 76 198 82 215
            C 87 223 93 227 100 227
            C 107 227 113 223 118 215
            C 124 198 128 178 132 158
            C 138 130 140 100 135 82
            C 130 68 120 60 107 58
            L 107 47 Z" />
          <path d="
            M 68 76
            C 55 90 46 122 46 155
            C 46 185 46 212 44 236
            Q 43 244 50 246
            L 58 246
            Q 62 244 62 236
            C 62 212 60 185 62 155
            C 63 125 68 102 76 86
            L 68 76 Z" />
          <path d="
            M 132 76
            C 145 90 154 122 154 155
            C 154 185 154 212 156 236
            Q 157 244 150 246
            L 142 246
            Q 138 244 138 236
            C 138 212 140 185 138 155
            C 137 125 132 102 124 86
            L 132 76 Z" />
          <path d="
            M 100 218
            C 76 218 52 225 38 240
            C 26 250 22 260 30 268
            Q 45 274 65 272
            C 80 270 92 265 100 260
            C 108 265 120 270 135 272
            Q 155 274 170 268
            C 178 260 174 250 162 240
            C 148 225 124 218 100 218 Z" />
        </g>

        {particles.map((p) => (
          <circle
            key={p.id}
            cx={p.x}
            cy={p.y}
            r={p.size}
            className="particle"
            style={
              {
                "--delay": `${p.delay}s`,
                "--duration": `${p.duration}s`,
              } as React.CSSProperties
            }
          />
        ))}

        {chakrasData.map((c, i) => {
          const active = isChakraActive(i);
          return (
            <g key={c.name}>
              <circle
                cx="100"
                cy={c.cy}
                r={c.r}
                fill="transparent"
                stroke={c.color}
                strokeWidth="1.5"
                strokeOpacity="0.55"
              />
              <circle
                cx="100"
                cy={c.cy}
                r={c.r}
                fill={`url(#grad-${i})`}
                className={`chakra ${active ? "chakra-active" : ""}`}
                style={
                  {
                    "--chakra-color": c.color,
                    "--glow-base": c.baseGlow,
                    "--glow-max": c.maxGlow,
                    transformOrigin: `100px ${c.cy}px`,
                    opacity: active ? 1 : 0,
                    transition: "opacity 0.8s ease",
                  } as React.CSSProperties
                }
              />
            </g>
          );
        })}
      </svg>

      {/* RIGHT column */}
      <div className="chakra-column chakra-column-right">
        {chakrasData.map((c, i) => (c.side === "right" ? renderCard(i) : null))}
      </div>
    </div>
  );
}