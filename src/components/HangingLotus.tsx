import React from "react";

export default function HangingLotus({
  className = "",
  align = "left",
  offset = "",
}: {
  className?: string;
  align?: "left" | "right";
  offset?: string;
}) {
  return (
    <div
      className={`block absolute top-0 pointer-events-none select-none z-20 ${
        offset
          ? offset
          : align === "left"
            ? "left-4 sm:left-12"
            : "right-4 sm:right-12"
      } ${className}`}
    >
      <svg
        width="48"
        height="180"
        viewBox="0 0 60 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-[#E8C36A] w-12 h-44 md:w-14 md:h-52"
      >
        <line
          x1="30"
          y1="0"
          x2="30"
          y2="120"
          stroke="#BFA67A"
          strokeOpacity="0.6"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <circle cx="30" cy="40" r="3" fill="#D4A346" opacity="0.65" />
        <circle cx="30" cy="80" r="3" fill="#D4A346" opacity="0.65" />
        <circle cx="30" cy="115" r="4.5" fill="#D36037" opacity="0.8" />

        <g transform="translate(30, 140) scale(1)">
          <path
            d="M0 -25 C -8 -10 -12 10 0 25 C 12 10 8 -10 0 -25 Z"
            fill="currentColor"
            opacity="0.8"
          />
          <path
            d="M0 -15 C -20 -5 -25 15 -10 25 C -2 20 0 10 0 -15 Z"
            fill="currentColor"
            opacity="0.65"
          />
          <path
            d="M0 -5 C -30 10 -25 30 -15 28 C -5 20 0 10 0 -5 Z"
            fill="currentColor"
            opacity="0.45"
          />
          <path
            d="M0 -15 C 20 -5 25 15 10 25 C 2 20 0 10 0 -15 Z"
            fill="currentColor"
            opacity="0.65"
          />
          <path
            d="M0 -5 C 30 10 25 30 15 28 C 5 20 0 10 0 -5 Z"
            fill="currentColor"
            opacity="0.45"
          />
          <circle cx="0" cy="22" r="3" fill="#D4A346" />
        </g>
      </svg>
    </div>
  );
}
