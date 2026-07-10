"use client";
import { useEffect, useState } from "react";

type Phase = "inhale" | "hold-in" | "exhale" | "hold-out";

const PHASES: { phase: Phase; label: string; duration: number }[] = [
  { phase: "inhale", label: "Breathe in", duration: 6000 },
  { phase: "hold-in", label: "Hold", duration: 8000 },
  { phase: "exhale", label: "Breathe out", duration: 6000 },
  { phase: "hold-out", label: "Hold", duration: 2000 },
];

const TOTAL = PHASES.reduce((s, p) => s + p.duration, 0);

export default function BreathingAnimation() {
  const [phase, setPhase] = useState<Phase>("inhale");
  const [progress, setProgress] = useState(0); // 0–1 within current phase
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let currentPhase = 0;
    let raf: number;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const phaseDur = PHASES[currentPhase].duration;

      if (elapsed >= phaseDur) {
        startTime = now;
        currentPhase = (currentPhase + 1) % PHASES.length;
        setPhaseIndex(currentPhase);
        setPhase(PHASES[currentPhase].phase);
        setProgress(0);
      } else {
        setProgress(elapsed / phaseDur);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Ball Y position: inhale = moves UP (bottom → top), exhale = moves DOWN
  // hold phases = ball stays put
  const TRACK_HEIGHT = 260; // px, the vertical travel distance
  const getBallY = () => {
    const easeInOut = (t: number) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    switch (phase) {
      case "inhale":
        return TRACK_HEIGHT * (1 - easeInOut(progress)); // bottom → top
      case "hold-in":
        return 0; // stays at top
      case "exhale":
        return TRACK_HEIGHT * easeInOut(progress); // top → bottom
      case "hold-out":
        return TRACK_HEIGHT; // stays at bottom
    }
  };

  // Outer ring scale: expands on inhale, contracts on exhale
  const getRingScale = () => {
    const easeInOut = (t: number) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    switch (phase) {
      case "inhale":
        return 1 + 0.22 * easeInOut(progress);
      case "hold-in":
        return 1.22;
      case "exhale":
        return 1.22 - 0.22 * easeInOut(progress);
      case "hold-out":
        return 1;
    }
  };

  // Ball glow opacity: bright at top (full lungs), dim at bottom
  const getGlowOpacity = () => {
    switch (phase) {
      case "inhale":
        return 0.3 + 0.5 * progress;
      case "hold-in":
        return 0.8;
      case "exhale":
        return 0.8 - 0.5 * progress;
      case "hold-out":
        return 0.3;
    }
  };

  // Background aura color
  const getBackgroundGlow = () => {
    switch (phase) {
      case "inhale":
      case "hold-in":
        return "rgba(232,150,46,0.05)"; // warm gold
      case "exhale":
      case "hold-out":
        return "rgba(28,31,74,0.05)"; // deep indigo
    }
  };

  const ballY = getBallY();
  const ringScale = getRingScale();
  const glowOpacity = getGlowOpacity();
  const currentLabel = PHASES[phaseIndex].label;
  const currentDuration = PHASES[phaseIndex].duration / 1000;

  const orbitParticles = [
    { size: 5, radius: 150, duration: 18, delay: 0 },
    { size: 3, radius: 125, duration: 22, delay: -3 },
    { size: 4, radius: 105, duration: 16, delay: -7 },
    { size: 2, radius: 165, duration: 26, delay: -10 },
    { size: 3, radius: 135, duration: 20, delay: -14 },
    { size: 5, radius: 185, duration: 30, delay: -18 },
  ];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 520,
        aspectRatio: "1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto",
        pointerEvents: "none",
      }}
    >
      {/* Dynamic background glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          transition: "background 1.2s ease",
          background: `radial-gradient(circle,
      ${getBackgroundGlow()} 0%,
      transparent 70%)`,
          filter: "blur(50px)",
        }}
      />
      {/* Orbiting particles */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          transform: `scale(${ringScale})`,
          transition: "transform .1s linear",
        }}
      >
        {orbitParticles.map((particle, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: particle.radius * 2,
              height: particle.radius * 2,
              animation: `orbit ${particle.duration}s linear infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: particle.size,
                height: particle.size,
                borderRadius: "50%",
                background: "rgba(232,150,46,.8)",
                boxShadow: "0 0 10px rgba(232,150,46,.6)",
              }}
            />
          </div>
        ))}
      </div>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Outer breathing ring — expands and contracts with breath */}
        <div
          style={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: "50%",
            border: "1px solid rgba(232,150,46,0.2)",
            transform: `scale(${ringScale})`,
            transition: "transform 0.1s linear",
          }}
        />
        {/* Mid ring */}
        <div
          style={{
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            border: "1px solid rgba(250,247,242,0.08)",
          }}
        />

        {/* Vertical track */}
        <div
          style={{
            position: "relative",
            width: 2,
            height: TRACK_HEIGHT,
            background:
              "linear-gradient(to bottom, rgba(232,150,46,0.6), rgba(232,150,46,0.1))",
            borderRadius: 2,
          }}
        >
          {/* Track dots — top and bottom anchors */}
          <div
            style={{
              position: "absolute",
              top: -4,
              left: "50%",
              transform: "translateX(-50%)",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "rgba(232,150,46,0.5)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -4,
              left: "50%",
              transform: "translateX(-50%)",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "rgba(232,150,46,0.3)",
            }}
          />

          {/* The ball */}
          <div
            style={{
              position: "absolute",
              top: ballY - 14, // center the 28px ball on the Y position
              left: "50%",
              transform: "translateX(-50%)",
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--gold)",
              boxShadow: `0 0 ${20 + glowOpacity * 24}px ${glowOpacity * 12}px rgba(232,150,46,${glowOpacity})`,
              transition: "box-shadow 0.1s linear",
            }}
          />
        </div>

        {/* Phase label + countdown */}
        <div
          style={{
            marginTop: 36,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 18,
              color: "var(--ivory)",
              fontStyle: "italic",
              letterSpacing: 1,
              margin: 0,
              opacity: 0.85,
            }}
          >
            {currentLabel}
          </p>

          {/* Arc progress bar */}
          <svg
            width="60"
            height="6"
            style={{ marginTop: 10, display: "block", margin: "10px auto 0" }}
          >
            <rect
              x="0"
              y="1"
              width="60"
              height="4"
              rx="2"
              fill="rgba(250,247,242,0.1)"
            />
            <rect
              x="0"
              y="1"
              width={60 * progress}
              height="4"
              rx="2"
              fill="var(--gold)"
              style={{ transition: "width 0.1s linear" }}
            />
          </svg>

          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: "rgba(250,247,242,0.4)",
              letterSpacing: 2,
              textTransform: "uppercase",
              margin: "8px 0 0",
            }}
          >
            {currentDuration}s
          </p>
        </div>
      </div>
      <style>{`
@keyframes orbit{
  from{
    transform:rotate(0deg);
  }
  to{
    transform:rotate(360deg);
  }
}
`}</style>
    </div>
  );
}
