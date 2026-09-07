"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRealtime } from "@/hooks/useRealtime";
import { ArrowRight, Volume2 } from "lucide-react";

interface MarqueeItem {
  id: string;
  title: string;
  content: string;
  link: string | null;
  linkText: string | null;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
}

export default function HeaderMarquee() {
  const [marquee, setMarquee] = useState<MarqueeItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveMarquee = useCallback(async () => {
    try {
      // Use cache-busting timestamp to avoid stale HTTP cache
      const res = await fetch(`/api/marquees/active?t=${Date.now()}`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) throw new Error("Failed to fetch active marquee");
      const json = await res.json();
      setMarquee(json.data || null);
    } catch (err) {
      console.error("[HeaderMarquee] Error loading active marquee:", err);
      setMarquee(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchActiveMarquee();

    // Also re-verify whenever user switches back to this browser tab
    const handleFocus = () => fetchActiveMarquee();
    window.addEventListener("focus", handleFocus);

    // Periodic check every 60 seconds for scheduled start/end expirations
    const interval = setInterval(fetchActiveMarquee, 60000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [fetchActiveMarquee]);

  // Real-time synchronization when admin activates/deactivates or edits marquees
  useRealtime(["marquees"], (payload) => {
    console.log("[HeaderMarquee] Realtime update event received:", payload?.eventType);
    fetchActiveMarquee();
  });

  // Sync CSS variables so page content starts down below marquee
  useEffect(() => {
    if (marquee) {
      document.documentElement.style.setProperty("--header-height", "112px");
      document.documentElement.style.setProperty("--marquee-height", "40px");
    } else {
      document.documentElement.style.setProperty("--header-height", "72px");
      document.documentElement.style.setProperty("--marquee-height", "0px");
    }
    return () => {
      document.documentElement.style.setProperty("--header-height", "72px");
      document.documentElement.style.setProperty("--marquee-height", "0px");
    };
  }, [marquee]);

  if (loading || !marquee) {
    return null;
  }

  // Render the marquee content (Category tag, rich content with bold/italic/underline, and optional action link)
  const renderMessageContent = () => (
    <div className="inline-flex items-center gap-4 px-4 select-none">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#e8962e]/20 border border-[#e8962e]/40 text-[#f5c16c] text-[11px] font-bold uppercase tracking-wider shrink-0 shadow-2xs">
        <Volume2 className="w-3 h-3 text-[#e8962e]" />
        <span>{marquee.title}</span>
      </span>

      <span
        className="text-xs sm:text-[13px] text-[#faf7f2] font-normal leading-normal tracking-wide [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_em]:text-[#faecd7] [&_i]:italic [&_i]:text-[#faecd7] [&_u]:underline [&_u]:underline-offset-2"
        dangerouslySetInnerHTML={{ __html: marquee.content }}
      />

      {marquee.link && (
        marquee.link.startsWith("http://") || marquee.link.startsWith("https://") ? (
          <a
            href={marquee.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#e8962e]/25 hover:bg-[#e8962e]/40 text-[#f6cb82] hover:text-white border border-[#e8962e]/50 text-xs font-semibold underline underline-offset-2 transition-all cursor-pointer shadow-xs group/link shrink-0"
          >
            <span>{marquee.linkText?.trim() || "Learn More"}</span>
            <ArrowRight className="w-3 h-3 text-[#e8962e] transition-transform group-hover/link:translate-x-0.5" />
          </a>
        ) : (
          <Link
            href={marquee.link}
            className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#e8962e]/25 hover:bg-[#e8962e]/40 text-[#f6cb82] hover:text-white border border-[#e8962e]/50 text-xs font-semibold underline underline-offset-2 transition-all cursor-pointer shadow-xs group/link shrink-0"
          >
            <span>{marquee.linkText?.trim() || "Learn More"}</span>
            <ArrowRight className="w-3 h-3 text-[#e8962e] transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        )
      )}
    </div>
  );

  return (
    <div
      className="relative z-10 w-full overflow-hidden bg-gradient-to-r from-[#11132b] via-[#1c1f4a] to-[#11132b] border-b border-[#e8962e]/35 shadow-sm text-white h-10 flex items-center marquee-wrapper cursor-default"
      role="region"
      aria-label="Announcement Marquee"
    >
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#11132b] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#11132b] to-transparent z-10 pointer-events-none" />

      <div className="animate-sck-marquee whitespace-nowrap flex items-center py-1">
        {renderMessageContent()}
      </div>
    </div>
  );
}
