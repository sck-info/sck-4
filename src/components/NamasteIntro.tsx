"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function NamasteIntro() {
  const [isComplete, setIsComplete] = useState(true);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("hasSeenIntro");
    if (hasSeen === "true") {
      setIsComplete(true);
      setShouldRender(false);
      document.documentElement.classList.remove("intro-active");
    } else {
      setIsComplete(false);
      setShouldRender(true);

      document.body.style.overflow = "hidden";
      const timer = setTimeout(() => {
        setIsComplete(true);
        sessionStorage.setItem("hasSeenIntro", "true");
        document.body.style.overflow = "";
        document.documentElement.classList.remove("intro-active");
        window.dispatchEvent(new Event("intro-complete"));
      }, 4500);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = "";
        document.documentElement.classList.remove("intro-active");
      };
    }
  }, []);

  if (!shouldRender) return null;

  return (
    <AnimatePresence>
      {!isComplete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden pointer-events-none">
          {/* Top Panel - Sliding Door */}
          <motion.div
            initial={{ y: 0 }}
            exit={{
              y: "-100%",
              transition: { duration: 1.2, ease: [0.77, 0, 0.175, 1] },
            }}
            className="absolute top-0 left-0 w-full h-[50.5vh] bg-[#1c1f4a] border-b border-[#e8962e]/20 pointer-events-auto"
          />

          {/* Bottom Panel - Sliding Door */}
          <motion.div
            initial={{ y: 0 }}
            exit={{
              y: "100%",
              transition: { duration: 1.2, ease: [0.77, 0, 0.175, 1] },
            }}
            className="absolute bottom-0 left-0 w-full h-[50.5vh] bg-[#1c1f4a] border-t border-[#e8962e]/20 pointer-events-auto"
          />

          {/* Central Logo and Texts */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { duration: 0.8, ease: "easeOut" },
            }}
            exit={{
              opacity: 0,
              scale: 1.05,
              y: -20,
              transition: { duration: 0.7, ease: [0.77, 0, 0.175, 1] },
            }}
            className="relative z-[10000] flex flex-col items-center text-center px-4"
          >
            {/* Lotus SVG */}
            <motion.div
              initial={{ rotate: -8, opacity: 0 }}
              animate={{
                rotate: 0,
                opacity: 1,
                transition: { delay: 0.2, duration: 1, ease: "easeOut" },
              }}
              className="mb-5"
            >
              <svg
                width="120"
                height="120"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-[#e8962e]"
              >
                <path
                  d="M50 20 C50 20 40 45 40 60 C40 70 45 75 50 75 C55 75 60 70 60 60 C60 45 50 20 50 20 Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M50 35 C50 35 32 50 30 62 C28 72 34 75 40 75 C46 75 50 70 50 62"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M50 35 C50 35 68 50 70 62 C72 72 66 75 60 75 C54 75 50 70 50 62"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M50 50 C50 50 20 60 20 70 C20 76 28 77 35 75"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <path
                  d="M50 50 C50 50 80 60 80 70 C80 76 72 77 65 75"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
                <circle cx="50" cy="12" r="2.5" fill="currentColor" />
              </svg>
            </motion.div>

            {/* Namaste Text */}
            <motion.h1
              initial={{ letterSpacing: "0.15em", opacity: 0 }}
              animate={{
                letterSpacing: "0.25em",
                opacity: 1,
                transition: { delay: 0.4, duration: 1.2, ease: "easeOut" },
              }}
              className="font-display italic text-4xl sm:text-6xl text-[#e8962e] font-medium leading-none tracking-widest uppercase"
            >
              Namaste
            </motion.h1>

            {/* Devanagari Script */}
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{
                opacity: 0.6,
                y: 0,
                transition: { delay: 0.8, duration: 0.8 },
              }}
              className="text-sm tracking-[0.3em] text-[#faf7f2] font-light mt-4 font-hindi"
            >
              नमस्ते
            </motion.p>

            {/* Quote */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{
                opacity: 0.5,
                transition: { delay: 1.3, duration: 1.2 },
              }}
              className="text-[10px] italic text-[#faf7f2] mt-8 tracking-widest font-mono font-light max-w-[280px]"
            >
              A space for the body and mind to reset and realize the spirit
            </motion.p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
