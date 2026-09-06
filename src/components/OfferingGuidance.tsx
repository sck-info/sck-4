"use client";

import React, { useState } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  User,
  Mail,
  Loader2,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  ShieldCheck,
  Compass,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OfferingGuidanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Spiritual Luxury Offering Guidance Modal
 * Allows seekers who are undecided to connect directly with Sharath Kancherla via WhatsApp.
 */
export function OfferingGuidanceModal({
  open,
  onOpenChange,
}: OfferingGuidanceModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const getPhoneNumber = () => {
    if (!phone) return { number: "", code: "91" };
    const cleaned = phone.replace(/\D/g, "");
    const code = "91";
    const number = cleaned.startsWith(code) ? cleaned.slice(code.length) : cleaned;
    return { number, code };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your full name.");
      return;
    }

    const { number, code } = getPhoneNumber();
    if (!number || number.length < 10) {
      toast.error("Please enter a valid 10-digit WhatsApp phone number.");
      return;
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/offering-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phoneCode: `+${code}`,
          phone: number,
          email: email.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to submit your request.");
      }

      setSubmitted(true);
      toast.success("Request received! We'll get back to you soon on WhatsApp.");
    } catch (err: any) {
      toast.error(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setTimeout(() => {
        setSubmitted(false);
        setName("");
        setPhone("");
        setEmail("");
      }, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px] w-[94vw] p-0 border border-[#e8dcc4] bg-white rounded-3xl shadow-2xl font-sans max-h-[85vh] overflow-y-auto top-[calc(50%+36px)] translate-y-[-50%]">
        {/* Subtle Decorative Top Gradient Accent */}
        <div className="w-full h-1 bg-gradient-to-r from-[#1c1f4a] via-[#e8962e] to-[#1c1f4a]" />

        {submitted ? (
          /* Submission Success View */
          <div className="p-7 sm:p-8 text-center space-y-4">
            <div className="w-13 h-13 rounded-full bg-[#b86a16]/15 border border-[#b86a16]/30 text-[#b86a16] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#b86a16]/10 text-[#b86a16] text-[10px] font-bold uppercase tracking-wider">
                Request Confirmed
              </div>
              <h3 className="text-xl font-normal text-[#1c1f4a] font-serif">
                Received with Gratitude
              </h3>
              <p className="text-xs text-[#5a5e7a] max-w-xs mx-auto leading-relaxed">
                Thank you, <span className="font-semibold text-[#1c1f4a]">{name}</span>. Sharath Kancherla or our guidance team will reach out directly on WhatsApp to help you choose the ideal session.
              </p>
            </div>

            <div className="pt-2">
              <Button
                onClick={() => handleClose(false)}
                className="w-full h-10 rounded-xl bg-[#1c1f4a] hover:bg-[#282d6b] text-white text-xs font-semibold cursor-pointer shadow-md"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Guidance Request Form View */
          <div>
            <DialogHeader className="p-5 pb-1 sm:p-6 sm:pb-2 text-center sm:text-center">
              <div className="inline-flex items-center justify-center gap-1.5 mb-1 text-[11px] font-semibold text-[#b86a16] uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-[#b86a16]" />
                <span>Offering Guidance</span>
              </div>

              <DialogTitle className="text-[20px] sm:text-[22px] font-normal text-[#1c1f4a] font-serif leading-tight">
                Connect with Sharath Kancherla
              </DialogTitle>
              <DialogDescription className="text-xs text-[#5a5e7a] leading-relaxed mt-1 max-w-xs mx-auto font-sans">
                Every seeker&apos;s journey is unique. Share your details below and our team will get in touch directly on WhatsApp.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="px-5 pb-5 pt-2 sm:px-6 sm:pb-6 space-y-3">
              {/* Full Name */}
              <div className="space-y-1 text-left">
                <label
                  htmlFor="guidance-name"
                  className="block text-[11px] font-semibold text-[#1c1f4a] uppercase tracking-wider"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b86a16]/60 pointer-events-none" />
                  <input
                    id="guidance-name"
                    type="text"
                    required
                    disabled={loading}
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-[#faf7f2]/60 hover:bg-white focus:bg-white border border-[#e8dcc4] focus:border-[#b86a16] focus:ring-1 focus:ring-[#b86a16] text-xs text-[#1c1f4a] placeholder:text-gray-400 outline-none transition-all shadow-2xs font-sans"
                  />
                </div>
              </div>

              {/* WhatsApp Phone Number */}
              <div className="space-y-1 text-left">
                <label
                  htmlFor="guidance-phone"
                  className="block text-[11px] font-semibold text-[#1c1f4a] uppercase tracking-wider"
                >
                  WhatsApp Phone Number
                </label>
                <div className="h-10 rounded-xl bg-[#faf7f2]/60 hover:bg-white focus-within:bg-white border border-[#e8dcc4] focus-within:border-[#b86a16] focus-within:ring-1 focus-within:ring-[#b86a16] transition-all flex items-center px-3 shadow-2xs">
                  <PhoneInput
                    international
                    defaultCountry="IN"
                    countries={["IN"]}
                    value={phone}
                    onChange={(val) => setPhone(val || "")}
                    disabled={loading}
                    placeholder="Enter 10-digit number"
                    className="w-full h-full flex items-center [&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:gap-1.5 [&_.PhoneInputCountry]:border-r [&_.PhoneInputCountry]:border-[#e8dcc4] [&_.PhoneInputCountry]:pr-2.5 [&_.PhoneInputCountry]:mr-2.5 [&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputCountryIcon]:w-5 [&_.PhoneInputCountryIcon]:h-3.5 [&_.PhoneInputCountryIcon]:rounded-xs [&_input]:bg-transparent [&_input]:border-0 [&_input]:outline-none [&_input]:w-full [&_input]:h-full [&_input]:text-xs [&_input]:text-[#1c1f4a] [&_input]:placeholder:text-gray-400 font-sans"
                  />
                </div>
              </div>

              {/* Email Address (Strictly NO "Optional" label or badge) */}
              <div className="space-y-1 text-left">
                <label
                  htmlFor="guidance-email"
                  className="block text-[11px] font-semibold text-[#1c1f4a] uppercase tracking-wider"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b86a16]/60 pointer-events-none" />
                  <input
                    id="guidance-email"
                    type="email"
                    disabled={loading}
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 rounded-xl bg-[#faf7f2]/60 hover:bg-white focus:bg-white border border-[#e8dcc4] focus:border-[#b86a16] focus:ring-1 focus:ring-[#b86a16] text-xs text-[#1c1f4a] placeholder:text-gray-400 outline-none transition-all shadow-2xs font-sans"
                  />
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl bg-[#1c1f4a] hover:bg-[#282d6b] active:scale-[0.99] text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      Submitting Request...
                    </>
                  ) : (
                    <>
                      <span>Get Guidance on WhatsApp</span>
                      <ArrowRight className="w-4 h-4 text-[#e8962e] transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Touchpoint 1: Integrated Grid Card
 * Displayed as a distinct guidance card inside the category's subcategories grid.
 */
export function OfferingGuidanceGridCard({
  onOpen,
  categoryColor = "#b86a16",
}: {
  onOpen: () => void;
  categoryColor?: string;
}) {
  return (
    <div
      style={{
        background: "linear-gradient(150deg, #fdfbf7 0%, #f6eee2 100%)",
        padding: "clamp(1.5rem, 3vw, 2rem)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: 20,
        border: "1.5px dashed rgba(184, 106, 22, 0.4)",
        position: "relative",
        overflow: "hidden",
      }}
      className="group transition-all duration-300 hover:border-[#b86a16]"
    >
      {/* Decorative Warm Ambient Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#b86a16]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10">
        {/* Tags Badge List */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              color: "white",
              background: "#b86a16",
              padding: "3px 8px",
              borderRadius: 4,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Personal Guidance
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 10,
              color: "var(--indigo)",
              background: "rgba(28,31,74,0.06)",
              padding: "3px 8px",
              borderRadius: 4,
              fontWeight: 500,
            }}
          >
            1-on-1 Consultation
          </span>
        </div>

        <h4
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(22px, 2.5vw, 26px)",
            fontWeight: 500,
            color: "var(--indigo)",
            margin: "0 0 10px 0",
            lineHeight: 1.2,
          }}
        >
          Confused about which offering to pick?
        </h4>

        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: "var(--text-mid)",
            lineHeight: 1.6,
            fontWeight: 300,
            margin: 0,
          }}
        >
          Every seeker&apos;s journey is unique. If you feel drawn to multiple sessions or need clarity before booking, connect directly with Sharath Kancherla to find your path.
        </p>
      </div>

      <div className="relative z-10">
        {/* Reassuring Feature Pills */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: "#b86a16",
              background: "rgba(184,106,22,0.1)",
              padding: "4px 10px",
              borderRadius: 100,
              fontWeight: 500,
            }}
          >
            WhatsApp Support
          </span>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: "#1c1f4a",
              background: "rgba(28,31,74,0.06)",
              padding: "4px 10px",
              borderRadius: 100,
              fontWeight: 500,
            }}
          >
            Personalized Clarity
          </span>
        </div>

        {/* Action Button */}
        <button
          onClick={onOpen}
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            background: "var(--indigo)",
            color: "white",
            padding: "10px 20px",
            borderRadius: 100,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            width: "100%",
            boxSizing: "border-box",
            transition: "all 0.2s ease",
            textAlign: "center",
            cursor: "pointer",
            border: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
            (e.currentTarget as HTMLElement).style.background = "#282d6b";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLElement).style.background = "var(--indigo)";
          }}
        >
          <span>Ask Sharath Kancherla</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

/**
 * Touchpoint 2: Post-Browse Bottom Banner
 * Displayed at the bottom of the offerings section (after the visitor has scrolled through categories).
 */
export function OfferingGuidanceBottomBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="w-full mt-12 sm:mt-16">
      <div className="relative overflow-hidden rounded-3xl border border-[#e8dcc4] bg-gradient-to-br from-[#faf7f2] via-white to-[#f5ede0]/70 p-6 sm:p-9 shadow-xs">
        {/* Subtle decorative accents */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-52 h-52 bg-[#b86a16]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-44 h-44 bg-[#1c1f4a]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#b86a16]/10 text-[#b86a16] text-[10px] font-bold uppercase tracking-wider">
              <Compass className="w-3.5 h-3.5" />
              Spiritual Guidance & Clarity
            </div>
            <h3 className="text-2xl sm:text-3xl font-normal text-[#1c1f4a] font-serif">
              Confused about which offering to pick?
            </h3>
            <p className="text-xs sm:text-sm text-[#5a5e7a] leading-relaxed">
              Every seeker&apos;s journey is unique. Connect directly with Sharath Kancherla and our team to receive personalized clarity on selecting the offering that best supports your spiritual and life transformation.
            </p>
          </div>

          <Button
            onClick={onOpen}
            className="shrink-0 h-12 px-7 rounded-full bg-[#1c1f4a] hover:bg-[#282d6b] text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center gap-2 group"
          >
            <span>Get in touch with Sharath</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Touchpoint 3: Floating Bottom-Right Concierge Pill
 * Pinned at bottom-6 right-6, providing an omnipresent and elegant touchpoint.
 */
export function OfferingGuidanceFloatingPill({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      type="button"
      className="fixed bottom-6 right-6 z-40 bg-[#1c1f4a]/95 hover:bg-[#282d6b] text-white backdrop-blur-md border border-[#e8962e]/45 shadow-xl hover:shadow-2xl shadow-indigo-950/25 rounded-full px-4 sm:px-5 py-3 flex items-center gap-3 transition-all duration-300 hover:scale-[1.03] cursor-pointer group"
      aria-label="Ask Sharath Kancherla for guidance"
    >
      {/* Icon with subtle halo */}
      <div className="w-7 h-7 rounded-full bg-[#b86a16]/25 flex items-center justify-center text-[#e8962e] shrink-0">
        <MessageCircle className="w-4 h-4" />
      </div>

      {/* Label */}
      <div className="text-left">
        <span className="hidden sm:inline text-xs font-medium text-white/90 group-hover:text-white">
          Need Help Choosing? <span className="text-[#e8962e] font-semibold">• Talk to Sharath</span>
        </span>
        <span className="inline sm:hidden text-xs font-semibold text-white">
          Talk to Sharath
        </span>
      </div>

      {/* Pulsing indicator */}
      <span className="relative flex h-2 w-2 ml-0.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e8962e] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e8962e]" />
      </span>
    </button>
  );
}
