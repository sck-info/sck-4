"use client";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#about", label: "About" },
    { href: "#vision", label: "Vision" },

    { href: "#sessions", label: "Sessions" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: "all 0.4s ease",
        background: scrolled ? "rgba(250,247,242,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(28,31,74,0.08)" : "none",
        padding: "0 2rem",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 72,
        }}
      >
        <a
          href="#"
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--indigo)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gold)",
              fontSize: 16,
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600,
            }}
          >
            ✦
          </div>
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20,
              fontWeight: 600,
              color: "var(--indigo)",
              letterSpacing: 0.5,
            }}
          >
            Sharath Kancherla
          </span>
        </a>

        <div
          style={{ display: "flex", gap: 36, alignItems: "center" }}
          className="desktop-nav"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--text-mid)",
                textDecoration: "none",
                letterSpacing: 0.3,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = "var(--indigo)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = "var(--text-mid)")
              }
            >
              {l.label}
            </a>
          ))}
          <a
            href="#sessions"
            style={{
              background: "var(--indigo)",
              color: "var(--ivory)",
              padding: "9px 22px",
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: 0.3,
              transition: "background 0.2s, transform 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.background = "var(--gold)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.background = "var(--indigo)";
            }}
          >
            Book a Session
          </a>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            color: "var(--indigo)",
          }}
          className="mobile-menu-btn"
          aria-label="Menu"
        >
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            {menuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div
          style={{
            background: "var(--ivory)",
            padding: "1rem 2rem 1.5rem",
            borderTop: "1px solid rgba(28,31,74,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{
                color: "var(--text-dark)",
                textDecoration: "none",
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
