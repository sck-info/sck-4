"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ArrowLeft,
  Mail,
  Phone,
  User,
  MessageSquare,
  Loader2,
  MapPin,
  Clock,
  Compass,
  ArrowRight,
  MessageCircle,
} from "lucide-react";
import { FaInstagram, FaLinkedin, FaYoutube } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useRealtime } from "@/hooks/useRealtime";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Dynamic Contact info with fallback defaults
  const [liveContact, setLiveContact] = useState<{
    email: string;
    phone: string;
    location: string;
    instagramLink: string;
    linkedinLink: string;
    youtubeLink: string;
  }>({
    email: "sharathchandra.kancherla@gmail.com",
    phone: "+91 8374896261",
    location: "Hyderabad, Telangana",
    instagramLink:
      "https://www.instagram.com/sharathkancherla?igsh=MWtvZXI1a3czbzdlYg==",
    linkedinLink:
      "https://www.linkedin.com/in/sharath-chandra-kancherla-b38422108?utm_source=share_via&utm_content=profile&utm_medium=member_android",
    youtubeLink: "https://youtube.com/@sharathkancherla?si=d8kXq71Z1eJ0e18K",
  });

  const fetchActiveContact = useCallback(async () => {
    try {
      const res = await fetch("/api/contacts/active");
      if (!res.ok) return;
      const data = await res.json();
      if (data) {
        setLiveContact({
          email: data.email || "sharathchandra.kancherla@gmail.com",
          phone: data.phone || "+91 8374896261",
          location: data.location || "Hyderabad, Telangana",
          instagramLink:
            data.instagramLink ||
            "https://www.instagram.com/sharathkancherla?igsh=MWtvZXI1a3czbzdlYg==",
          linkedinLink:
            data.linkedinLink ||
            "https://www.linkedin.com/in/sharath-chandra-kancherla-b38422108?utm_source=share_via&utm_content=profile&utm_medium=member_android",
          youtubeLink:
            data.youtubeLink ||
            "https://youtube.com/@sharathkancherla?si=d8kXq71Z1eJ0e18K",
        });
      }
    } catch (err) {
      console.warn(
        "Failed to fetch live contact details, using defaults:",
        err,
      );
    }
  }, []);

  useEffect(() => {
    fetchActiveContact();
  }, [fetchActiveContact]);

  useRealtime(["contacts"], () => {
    fetchActiveContact();
  });

  const getPhoneNumber = () => {
    if (!phone) return { number: "", code: "91" };
    const cleaned = phone.replace(/\D/g, "");
    const code = "91";
    const number = cleaned.startsWith(code)
      ? cleaned.slice(code.length)
      : cleaned;
    return { number, code };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !message) {
      toast.error("All fields are required.");
      return;
    }

    const { number, code } = getPhoneNumber();
    if (number.length < 10) {
      toast.error("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phoneCode: `+${code}`,
          phone: number,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to submit query.");
        return;
      }

      toast.success(
        "Message sent successfully! We will contact you via WhatsApp.",
      );
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cleanPhoneDigits = liveContact.phone.replace(/\D/g, "");

  return (
    <>
      <Navbar />
      <main
        style={{
          minHeight: "100vh",
          background: "var(--ivory)",
          paddingTop: 96,
        }}
        className="relative overflow-hidden"
      >
        {/* Subtle Decorative Ambient Glows */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-[#b86a16]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 left-0 w-[500px] h-[500px] bg-[#1c1f4a]/5 rounded-full blur-3xl pointer-events-none" />

        <section style={{ padding: "0 2rem clamp(3rem, 6vw, 6rem) 2rem" }}>
          <div style={{ width: "100%", maxWidth: 1600, margin: "0 auto" }}>
            {/* Back button */}
            <div style={{ marginBottom: "1.5rem", marginLeft: "-0.5rem" }}>
              <a
                href="/"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#b86a16] hover:text-[#1c1f4a] uppercase tracking-widest transition-all cursor-pointer group"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Back to Home
              </a>
            </div>

            {/* Two-Column Contact Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
              {/* Left Column: Contact Channels & Presence */}
              <div className="lg:col-span-5 space-y-8">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#b86a16]/10 border border-[#b86a16]/20 text-[#b86a16] text-[11px] font-semibold tracking-wider uppercase">
                    <Compass className="w-3.5 h-3.5 text-[#b86a16]" />
                    <span>Direct Communication</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-normal text-[#1c1f4a] font-serif leading-tight">
                    Connect with Sharath Kancherla
                  </h1>
                  <p className="text-sm text-[#5a5e7a] leading-relaxed font-sans font-light">
                    Whether you seek clarity on personal sessions, workshops,
                    Satsangs, or have inquiries regarding our spiritual
                    offerings, we are here to support your path.
                  </p>
                </div>

                {/* Contact Channels Cards */}
                <div className="space-y-4">
                  {/* WhatsApp & Call */}
                  <a
                    href={`https://wa.me/${cleanPhoneDigits}?text=${encodeURIComponent(
                      "Hi Sharath, I would like to know more about your offerings.",
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#e8dcc4] hover:border-[#b86a16]/50 shadow-xs hover:shadow-md transition-all duration-200 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#e8962e]/10 text-[#b86a16] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider mb-0.5">
                        WhatsApp Support
                      </div>
                      <div className="text-sm font-medium text-[#1c1f4a] truncate">
                        {liveContact.phone}
                      </div>
                      <div className="text-xs text-[#b86a16] mt-1 flex items-center gap-1 font-medium">
                        <span>Chat on WhatsApp</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </a>

                  {/* Email Address */}
                  <a
                    href={`mailto:${liveContact.email}`}
                    className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#e8dcc4] hover:border-[#b86a16]/50 shadow-xs hover:shadow-md transition-all duration-200 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#1c1f4a]/5 text-[#1c1f4a] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider mb-0.5">
                        Email Inquiries
                      </div>
                      <div className="text-sm font-medium text-[#1c1f4a] truncate">
                        {liveContact.email}
                      </div>
                      <div className="text-xs text-[#5a5e7a] mt-1">
                        Collaborations & questions
                      </div>
                    </div>
                  </a>

                  {/* Location */}
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#e8dcc4] shadow-xs">
                    <div className="w-11 h-11 rounded-xl bg-[#c4796a]/10 text-[#c4796a] flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider mb-0.5">
                        Sanctuary Location
                      </div>
                      <div className="text-sm font-medium text-[#1c1f4a]">
                        {liveContact.location}
                      </div>
                      <div className="text-xs text-[#5a5e7a] mt-1">
                        In-person & global online sessions
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fast Response Reassurance Box */}
                <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#faf0dc]/60 border border-[#e8dcc4]/80 text-[#1c1f4a]">
                  <Clock className="w-4 h-4 text-[#b86a16] shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-[#5a5e7a]">
                    <span className="font-semibold text-[#1c1f4a]">
                      Prompt Response:
                    </span>{" "}
                    Our administrative team will review your message and reply
                    directly to your WhatsApp within{" "}
                    <span className="font-semibold text-[#b86a16]">
                      12–24 hours
                    </span>
                    .
                  </div>
                </div>

                {/* Social Channels */}
                <div className="pt-2">
                  <div className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider mb-3">
                    Follow Sharath Kancherla
                  </div>
                  <div className="flex items-center gap-3">
                    {liveContact.instagramLink && (
                      <a
                        href={liveContact.instagramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white border border-[#e8dcc4] text-[#1c1f4a] hover:text-[#b86a16] hover:border-[#b86a16] flex items-center justify-center transition-colors shadow-2xs"
                        aria-label="Instagram"
                      >
                        <FaInstagram size={17} />
                      </a>
                    )}
                    {liveContact.linkedinLink && (
                      <a
                        href={liveContact.linkedinLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white border border-[#e8dcc4] text-[#1c1f4a] hover:text-[#b86a16] hover:border-[#b86a16] flex items-center justify-center transition-colors shadow-2xs"
                        aria-label="LinkedIn"
                      >
                        <FaLinkedin size={17} />
                      </a>
                    )}
                    {liveContact.youtubeLink && (
                      <a
                        href={liveContact.youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-white border border-[#e8dcc4] text-[#1c1f4a] hover:text-[#b86a16] hover:border-[#b86a16] flex items-center justify-center transition-colors shadow-2xs"
                        aria-label="YouTube"
                      >
                        <FaYoutube size={17} />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Interactive Query Form */}
              <div className="lg:col-span-7">
                <div className="bg-white border border-[#e8dcc4] rounded-[2rem] p-7 sm:p-10 shadow-xl relative overflow-hidden">
                  {/* Decorative Top Accent Line */}
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#1c1f4a] via-[#e8962e] to-[#1c1f4a]" />

                  <div className="mb-7">
                    <h2 className="text-2xl sm:text-3xl font-normal text-[#1c1f4a] font-serif">
                      Send a Message
                    </h2>
                    <p className="text-xs sm:text-sm text-[#5a5e7a] mt-1.5 leading-relaxed font-sans">
                      Have questions about sessions, packages, or coachings?
                      Leave your message below, and our team will reply directly
                      to your WhatsApp.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-name"
                        className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider block"
                      >
                        Full Name <span className="text-[#b86a16]">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b86a16]/60 pointer-events-none" />
                        <input
                          id="contact-name"
                          type="text"
                          required
                          disabled={loading}
                          placeholder="Your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full h-11 pl-10 pr-4 bg-[#faf7f2]/50 hover:bg-white focus:bg-white border border-[#e8dcc4] focus:border-[#b86a16] focus:ring-1 focus:ring-[#b86a16] rounded-xl text-sm text-[#1c1f4a] placeholder:text-gray-400 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-email"
                        className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider block"
                      >
                        Email Address <span className="text-[#b86a16]">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b86a16]/60 pointer-events-none" />
                        <input
                          id="contact-email"
                          type="email"
                          required
                          disabled={loading}
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full h-11 pl-10 pr-4 bg-[#faf7f2]/50 hover:bg-white focus:bg-white border border-[#e8dcc4] focus:border-[#b86a16] focus:ring-1 focus:ring-[#b86a16] rounded-xl text-sm text-[#1c1f4a] placeholder:text-gray-400 outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* WhatsApp Phone Number */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-phone"
                        className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider block"
                      >
                        WhatsApp Phone Number{" "}
                        <span className="text-[#b86a16]">*</span>
                      </label>
                      <div className="h-11 rounded-xl bg-[#faf7f2]/50 hover:bg-white focus-within:bg-white border border-[#e8dcc4] focus-within:border-[#b86a16] focus-within:ring-1 focus-within:ring-[#b86a16] transition-all flex items-center px-3 shadow-2xs">
                        <PhoneInput
                          international
                          defaultCountry="IN"
                          countries={["IN"]}
                          value={phone}
                          onChange={(val) => setPhone(val || "")}
                          disabled={loading}
                          placeholder="Enter 10-digit number"
                          className="w-full h-full flex items-center [&_.PhoneInputCountry]:flex [&_.PhoneInputCountry]:items-center [&_.PhoneInputCountry]:gap-1.5 [&_.PhoneInputCountry]:border-r [&_.PhoneInputCountry]:border-[#e8dcc4] [&_.PhoneInputCountry]:pr-2.5 [&_.PhoneInputCountry]:mr-2.5 [&_.PhoneInputCountrySelect]:cursor-pointer [&_.PhoneInputCountryIcon]:w-5 [&_.PhoneInputCountryIcon]:h-3.5 [&_.PhoneInputCountryIcon]:rounded-xs [&_input]:bg-transparent [&_input]:border-0 [&_input]:outline-none [&_input]:w-full [&_input]:h-full [&_input]:text-sm [&_input]:text-[#1c1f4a] [&_input]:placeholder:text-gray-400 font-sans"
                        />
                      </div>
                    </div>

                    {/* Message / Query */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact-message"
                        className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider block"
                      >
                        Message / Query{" "}
                        <span className="text-[#b86a16]">*</span>
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-[#b86a16]/60 pointer-events-none" />
                        <textarea
                          id="contact-message"
                          required
                          disabled={loading}
                          rows={4}
                          placeholder="How can we support you on your healing journey?"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-[#faf7f2]/50 hover:bg-white focus:bg-white border border-[#e8dcc4] rounded-xl text-sm text-[#1c1f4a] placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#b86a16] focus:border-[#b86a16] transition-all font-sans"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-[#1c1f4a] hover:bg-[#282d6b] active:scale-[0.99] text-white rounded-full font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            <span>Sending Message...</span>
                          </>
                        ) : (
                          <>
                            <span>Send Message</span>
                            <ArrowRight className="w-4 h-4 text-[#e8962e] transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
