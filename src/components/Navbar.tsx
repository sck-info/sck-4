"use client";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const dropdownItems = [
  {
    href: "/events-and-updates",
    label: "Events & Updates",
    type: "link" as const,
  },
  { href: "#Testimonials", label: "Wall of Love", type: "scroll" as const },
  { href: "/sky", label: "SKY", type: "link" as const },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isHome = pathname === "/";
  const getHref = (href: string) =>
    !isHome && href.startsWith("#") ? `/${href}` : href;

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToSection = (id: string) => {
    if (isHome) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  const navLinkStyle = {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: scrolled || !isHome ? "var(--text-mid)" : "rgba(250,247,242,0.8)",
    textDecoration: "none",
    letterSpacing: 0.3,
    transition: "color 0.2s",
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 0,
  };

  const handleLinkHover = (e: React.SyntheticEvent, entering: boolean) => {
    (e.target as HTMLElement).style.color = entering
      ? scrolled || !isHome
        ? "var(--indigo)"
        : "var(--ivory)"
      : scrolled || !isHome
        ? "var(--text-mid)"
        : "rgba(250,247,242,0.8)";
  };

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        transition: "all 0.4s ease",
        background:
          scrolled || !isHome ? "rgba(250,247,242,0.92)" : "transparent",
        backdropFilter: scrolled || !isHome ? "blur(12px)" : "none",
        borderBottom:
          scrolled || !isHome ? "1px solid rgba(28,31,74,0.08)" : "none",
        padding: "0 2rem",
      }}
    >
      <div
        style={{
          width: "100%",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 72,
        }}
      >
        <a
          href={getHref("#")}
          style={{
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 600,
              color: scrolled || !isHome ? "var(--indigo)" : "var(--ivory)",
              letterSpacing: 0.5,
              transition: "color 0.4s",
            }}
          >
            Sharath Kancherla
          </span>
        </a>

        {/* Desktop nav */}
        <div
          style={{ display: "flex", gap: 36, alignItems: "center" }}
          className="desktop-nav"
        >
          {/* About */}
          <a
            href={getHref("#about")}
            style={navLinkStyle}
            onMouseEnter={(e) => handleLinkHover(e, true)}
            onMouseLeave={(e) => handleLinkHover(e, false)}
          >
            About
          </a>

          {/* Vision */}
          <a
            href={getHref("#vision")}
            style={navLinkStyle}
            onMouseEnter={(e) => handleLinkHover(e, true)}
            onMouseLeave={(e) => handleLinkHover(e, false)}
          >
            Vision
          </a>

          {/*Gallery*/}
          <a
            href="/gallery"
            style={navLinkStyle}
            onMouseEnter={(e) => handleLinkHover(e, true)}
            onMouseLeave={(e) => handleLinkHover(e, false)}
          >
            Gallery
          </a>

          {/* More dropdown: Events & Updates, Wall of Love, SKY */}
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              style={{
                ...navLinkStyle,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
              onMouseEnter={(e) => handleLinkHover(e, true)}
              onMouseLeave={(e) => !dropdownOpen && handleLinkHover(e, false)}
            >
              More
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                style={{
                  transition: "transform 0.2s",
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <path
                  d="M1 3L5 7L9 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 14px)",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--ivory)",
                  borderRadius: 12,
                  boxShadow: "0 12px 32px rgba(28,31,74,0.14)",
                  border: "1px solid rgba(28,31,74,0.08)",
                  padding: "8px 0",
                  minWidth: 190,
                  zIndex: 200,
                }}
              >
                {dropdownItems.map((item) =>
                  item.type === "link" ? (
                    <a
                      key={item.href}
                      href={getHref(item.href)}
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: "block",
                        padding: "10px 20px",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--text-mid)",
                        textDecoration: "none",
                        transition: "background 0.15s, color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.background =
                          "rgba(28,31,74,0.05)";
                        (e.target as HTMLElement).style.color = "var(--indigo)";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.background =
                          "transparent";
                        (e.target as HTMLElement).style.color =
                          "var(--text-mid)";
                      }}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <button
                      key={item.href}
                      onClick={() => {
                        setDropdownOpen(false);
                        scrollToSection(item.href.replace("#", ""));
                      }}
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "left",
                        padding: "10px 20px",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--text-mid)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        transition: "background 0.15s, color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.background =
                          "rgba(28,31,74,0.05)";
                        (e.target as HTMLElement).style.color = "var(--indigo)";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.background =
                          "transparent";
                        (e.target as HTMLElement).style.color =
                          "var(--text-mid)";
                      }}
                    >
                      {item.label}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>

          {/* Offerings */}
          <a
            href="/offerings"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              fontWeight: 600,
              color: scrolled || !isHome ? "var(--indigo)" : "var(--ivory)",
              border:
                scrolled || !isHome
                  ? "1.5px solid rgba(28,31,74,0.15)"
                  : "1.5px solid rgba(250,247,242,0.3)",
              padding: "7px 18px",
              borderRadius: 100,
              textDecoration: "none",
              letterSpacing: 0.5,
              transition: "all 0.2s ease",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.background =
                scrolled || !isHome ? "var(--indigo)" : "var(--ivory)";
              el.style.color =
                scrolled || !isHome ? "var(--ivory)" : "var(--indigo)";
              el.style.borderColor =
                scrolled || !isHome ? "var(--indigo)" : "var(--ivory)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.background = "transparent";
              el.style.color =
                scrolled || !isHome
                  ? "var(--indigo)"
                  : "rgba(250,247,242,0.85)";
              el.style.borderColor =
                scrolled || !isHome
                  ? "rgba(28,31,74,0.15)"
                  : "rgba(250,247,242,0.3)";
            }}
          >
            Offerings
          </a>

          {/* Dynamic Login / Dashboard Button */}
          {session ? (
            <a
              href="/dashboard"
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
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "var(--indigo)";
              }}
            >
              Dashboard
            </a>
          ) : (
            <a
              href="/login"
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
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "var(--indigo)";
              }}
            >
              Login
            </a>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
            color: scrolled || !isHome ? "var(--indigo)" : "var(--ivory)",
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

      {/* Mobile menu */}
      {menuOpen && (
        <div
          style={{
            background: "var(--ivory)",
            padding: "1rem 2rem 1.5rem",
            borderTop: "1px solid rgba(28,31,74,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          {/* About */}
          <a
            href={getHref("#about")}
            onClick={() => setMenuOpen(false)}
            style={{
              color: "var(--text-dark)",
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 500,
              padding: "10px 0",
              borderBottom: "1px solid rgba(28,31,74,0.06)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            About
          </a>

          {/* Vision */}
          <a
            href={getHref("#vision")}
            onClick={() => setMenuOpen(false)}
            style={{
              color: "var(--text-dark)",
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 500,
              padding: "10px 0",
              borderBottom: "1px solid rgba(28,31,74,0.06)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Vision
          </a>

          {/* Gallery */}
          <a
            href="/gallery"
            onClick={() => setMenuOpen(false)}
            style={{
              color: "var(--text-dark)",
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 500,
              padding: "10px 0",
              borderBottom: "1px solid rgba(28,31,74,0.06)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Gallery
          </a>

          {/* More (collapsible) */}
          <button
            onClick={() => setMobileDropdownOpen((o) => !o)}
            style={{
              color: "var(--text-dark)",
              fontSize: 16,
              fontWeight: 500,
              padding: "10px 0",
              borderBottom: "1px solid rgba(28,31,74,0.06)",
              fontFamily: "'DM Sans', sans-serif",
              background: "none",
              border: "none",
              textAlign: "left",
              width: "100%",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            More
            <svg
              width="12"
              height="12"
              viewBox="0 0 10 10"
              fill="none"
              style={{
                transition: "transform 0.2s",
                transform: mobileDropdownOpen
                  ? "rotate(180deg)"
                  : "rotate(0deg)",
              }}
            >
              <path
                d="M1 3L5 7L9 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Offerings */}
          <a
            href="/offerings"
            onClick={() => setMenuOpen(false)}
            style={{
              color: "var(--text-dark)",
              textDecoration: "none",
              fontSize: 16,
              fontWeight: 500,
              padding: "10px 0",
              borderBottom: "1px solid rgba(28,31,74,0.06)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Offerings
          </a>

          {mobileDropdownOpen && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                paddingLeft: 16,
                borderBottom: "1px solid rgba(28,31,74,0.06)",
              }}
            >
              {dropdownItems.map((item) =>
                item.type === "link" ? (
                  <a
                    key={item.href}
                    href={getHref(item.href)}
                    onClick={() => {
                      setMenuOpen(false);
                      setMobileDropdownOpen(false);
                    }}
                    style={{
                      color: "var(--text-mid)",
                      textDecoration: "none",
                      fontSize: 15,
                      fontWeight: 500,
                      padding: "8px 0",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {item.label}
                  </a>
                ) : (
                  <button
                    key={item.href}
                    onClick={() => {
                      setMenuOpen(false);
                      setMobileDropdownOpen(false);
                      scrollToSection(item.href.replace("#", ""));
                    }}
                    style={{
                      color: "var(--text-mid)",
                      fontSize: 15,
                      fontWeight: 500,
                      padding: "8px 0",
                      fontFamily: "'DM Sans', sans-serif",
                      background: "none",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    {item.label}
                  </button>
                ),
              )}
            </div>
          )}

          {/* Dynamic Login / Dashboard Link */}
          {session ? (
            <a
              href="/dashboard"
              onClick={() => setMenuOpen(false)}
              style={{
                color: "var(--text-dark)",
                textDecoration: "none",
                fontSize: 16,
                fontWeight: 500,
                padding: "10px 0",
                borderBottom: "1px solid rgba(28,31,74,0.06)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Dashboard
            </a>
          ) : (
            <a
              href="/login"
              onClick={() => setMenuOpen(false)}
              style={{
                color: "var(--text-dark)",
                textDecoration: "none",
                fontSize: 16,
                fontWeight: 500,
                padding: "10px 0",
                borderBottom: "1px solid rgba(28,31,74,0.06)",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Login
            </a>
          )}
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
