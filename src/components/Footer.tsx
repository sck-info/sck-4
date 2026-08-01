"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  
  const getHref = (href: string) => {
    if (isHome) return href;
    if (href.startsWith("#")) return `/${href}`;
    return href;
  };

  return (
    <footer
      style={{
        background: "#13163A",
        padding: "4rem 2rem 3rem 2rem",
        color: "#faf7f2",
        borderTop: "1px solid rgba(250, 247, 242, 0.1)",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "3rem",
        }}
      >
        {/* Top Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "2.5rem",
          }}
        >
          {/* Brand info */}
          <div style={{ flex: "1 1 300px" }}>
            <h3
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "24px",
                fontWeight: 600,
                color: "#faf7f2",
                margin: "0 0 0.75rem 0",
                letterSpacing: "0.5px",
              }}
            >
              Sharath Chandra Kancherla
            </h3>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(250, 247, 242, 0.6)",
                lineHeight: 1.6,
                margin: 0,
                maxWidth: "320px",
              }}
            >
              Holistic Lifestyle Coach & Healer. Empowering individuals to live stress-free, balanced, and purposeful lives through ancient wisdom and modern therapeutic sciences.
            </p>
          </div>

          {/* Links Column: Navigation */}
          <div style={{ flex: "1 1 150px" }}>
            <h4
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                color: "#b86a16",
                margin: "0 0 1.25rem 0",
              }}
            >
              Explore
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link href="/" style={{ fontSize: "14px", color: "rgba(250, 247, 242, 0.8)", textDecoration: "none" }} className="hover:text-white transition-colors">
                Home
              </Link>
              <Link href="/offerings" style={{ fontSize: "14px", color: "rgba(250, 247, 242, 0.8)", textDecoration: "none" }} className="hover:text-white transition-colors">
                Offerings
              </Link>
              <Link href="/sky" style={{ fontSize: "14px", color: "rgba(250, 247, 242, 0.8)", textDecoration: "none" }} className="hover:text-white transition-colors">
                Sudarshan Kriya Yoga (SKY)
              </Link>
              <Link href="/gallery" style={{ fontSize: "14px", color: "rgba(250, 247, 242, 0.8)", textDecoration: "none" }} className="hover:text-white transition-colors">
                Wall of Transformation
              </Link>
              <Link href="/events-and-updates" style={{ fontSize: "14px", color: "rgba(250, 247, 242, 0.8)", textDecoration: "none" }} className="hover:text-white transition-colors">
                Events & Updates
              </Link>
              <Link href="/contact" style={{ fontSize: "14px", color: "rgba(250, 247, 242, 0.8)", textDecoration: "none" }} className="hover:text-white transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr style={{ border: 0, height: "1px", background: "rgba(250, 247, 242, 0.1)", margin: 0 }} />

        {/* Bottom Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              color: "rgba(250, 247, 242, 0.4)",
              margin: 0,
            }}
          >
            © {new Date().getFullYear()} Sharath Chandra Kancherla. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
