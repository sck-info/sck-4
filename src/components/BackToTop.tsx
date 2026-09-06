"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Spiritual Luxury Back-To-Top Button
 * - Appears only when scrolled down (> 400px).
 * - Dynamically docks above the footer so it never overlaps footer content.
 * - Smoothly scrolls to the top of the page when clicked.
 */
export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(28);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      // Only visible when scrolled past 400px
      setIsVisible(scrollY > 400);

      // Keep button docked above the footer if footer is in view
      const footer = document.querySelector("footer");
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (footerRect.top < windowHeight) {
          // Footer has entered the viewport
          const footerVisibleHeight = windowHeight - footerRect.top;
          setBottomOffset(footerVisibleHeight + 24);
        } else {
          setBottomOffset(28);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      type="button"
      style={{ bottom: `${bottomOffset}px` }}
      className="fixed right-6 sm:right-8 z-40 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1c1f4a]/95 hover:bg-[#282d6b] text-white border border-[#e8962e]/50 shadow-xl hover:shadow-2xl shadow-indigo-950/25 backdrop-blur-md flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 group"
      aria-label="Back to top"
      title="Back to top"
    >
      <ArrowUp className="w-5 h-5 text-[#e8962e] transition-transform group-hover:-translate-y-0.5" />
    </button>
  );
}
