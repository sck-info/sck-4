"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";

interface PublicLayoutProps {
  children: React.ReactNode;
}

/**
 * Common Persistent Public Layout
 * Houses Header, Marquee, and Footer in one shared shell so that:
 * 1. Marquee doesn't flicker or reset when navigating between pages.
 * 2. Individual pages don't need duplicate Navbar / Footer imports.
 * 3. BackToTop is consistently available across public pages.
 * 
 * Excludes dashboard, auth, and standalone campaign routes.
 */
export default function PublicLayout({ children }: PublicLayoutProps) {
  const pathname = usePathname();

  const isExcluded =
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password") ||
    pathname?.startsWith("/verify-phone") ||
    pathname?.startsWith("/not-authorized") ||
    pathname?.startsWith("/campaigns");

  if (isExcluded) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <BackToTop />
    </>
  );
}
