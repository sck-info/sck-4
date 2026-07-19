"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, X, Loader2, Camera } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRealtime } from "@/hooks/useRealtime";
import Navbar from "@/components/Navbar";

type GalleryPhoto = {
  id: string;
  src: string;
  caption: string;
  height: number;
};


export default function PublicGalleryPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const res = await fetch("/api/gallery");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPhotos(
            data.map((item: any, index: number) => ({
              id: item.id,
              src: item.imageUrl,
              caption: item.caption || "Transformation Moment",
              // Alternate heights to create masonry effect
              height: [280, 360, 220, 320, 400, 250][index % 6],
            }))
          );
        }
      }
    } catch (err) {
      console.error("Failed to load gallery photos:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  useRealtime(["gallery"], () => {
    fetchPhotos();
  });

  const goNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex !== null && photos.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % photos.length);
    }
  };

  const goPrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (lightboxIndex !== null && photos.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
    }
  };

  // Keyboard controls for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") setLightboxIndex(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, photos]);



  return (
    <div className="min-h-screen bg-[#faf7f2] pb-24 text-[#1c1f4a] selection:bg-[#b86a16]/20 font-sans">
      <Navbar />
      {/* Top Header Section */}
      <header className="relative pt-32 pb-12 px-6 sm:px-12 border-b border-[#e8dcc4]/50 max-w-7xl mx-auto">
        <div className="flex flex-col gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[#b86a16] hover:text-[#1c1f4a] uppercase tracking-widest transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-8 h-[1px] bg-[#b86a16]" />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#b86a16]">
                  Moments of Growth
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-light font-display tracking-tight text-[#1c1f4a] leading-none">
                Wall of <span className="italic text-[#b86a16] font-normal">Transformation</span>
              </h1>
            </div>
            <p className="text-[#5a5e7a] text-xs sm:text-sm leading-relaxed max-w-md">
              A visual chronicle of therapeutic journeys, meditation satsangs, alternate healing sessions, and milestones from our community circles.
            </p>
          </div>
        </div>
      </header>

      {/* Grid Container */}
      <main className="max-w-7xl mx-auto px-6 sm:px-12 mt-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
            <p className="text-xs text-[#5a5e7a] font-medium tracking-wide">Loading gallery images...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="border border-dashed border-[#e8dcc4] bg-white/40 py-24 rounded-[2.5rem] text-center max-w-md mx-auto">
            <Camera className="w-10 h-10 text-[#9396ae] mx-auto mb-4" />
            <h3 className="text-md font-bold text-[#1c1f4a] font-display">Gallery Empty</h3>
            <p className="text-xs text-[#5a5e7a] mt-1 px-4">
              We are currently updating our wall. Check back soon for beautiful pictures!
            </p>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
            {photos.map((photo, originalIdx) => (
              <motion.div
                key={photo.id}
                layoutId={`item-${photo.id}`}
                onClick={() => setLightboxIndex(originalIdx)}
                className="break-inside-avoid mb-6 relative rounded-2xl overflow-hidden cursor-pointer group shadow-sm bg-white/30 border border-[#e8dcc4]/40"
                style={{ height: photo.height }}
                whileHover={{ y: -6, scale: 1.01 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  src={photo.src}
                  alt={photo.caption}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  priority={originalIdx < 6}
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1c1f4a]/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                  <p className="text-white text-xs font-semibold uppercase tracking-wider line-clamp-2">
                    {photo.caption}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Fullscreen Lightbox Overlay */}
      <AnimatePresence>
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setLightboxIndex(null)}
            className="fixed inset-0 bg-[#0e1026]/96 z-[999] flex flex-col items-center justify-center p-4 md:p-8"
          >
            {/* Top Bar controls */}
            <div className="absolute top-5 right-5 flex items-center gap-4 z-50">
              <span className="text-white/40 text-xs font-mono select-none">
                {lightboxIndex + 1} / {photos.length}
              </span>
              <button
                onClick={() => setLightboxIndex(null)}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Previous Arrow button */}
            <button
              onClick={goPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer z-50 border border-white/10"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Active Image container */}
            <motion.div
              key={lightboxIndex}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full h-[60vh] md:h-[75vh] flex flex-col justify-center"
            >
              <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black/40">
                <Image
                  src={photos[lightboxIndex].src}
                  alt={photos[lightboxIndex].caption}
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              {/* Lower caption info */}
              <div className="mt-4 flex flex-col gap-1 text-center">
                <p className="text-white text-sm font-semibold tracking-wide uppercase">
                  {photos[lightboxIndex].caption}
                </p>
              </div>
            </motion.div>

            {/* Next Arrow button */}
            <button
              onClick={goNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/5 hover:bg-white/10 text-white rounded-full flex items-center justify-center transition-colors cursor-pointer z-50 border border-white/10"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
