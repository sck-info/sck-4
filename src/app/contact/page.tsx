"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Phone, User, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function ContactPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const getPhoneNumber = () => {
    if (!phone) return { number: "", code: "" };
    const cleaned = phone.replace(/\D/g, "");
    const code = "91";
    const number = cleaned.startsWith(code) ? cleaned.slice(code.length) : cleaned;
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
          name,
          email,
          phoneCode: `+${code}`,
          phone: number,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to submit query.");
        return;
      }

      toast.success("Message sent successfully! We will contact you via WhatsApp.");
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

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#e8962e]/50 to-transparent" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#1c1f4a]/5 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-[#e8962e]/5 blur-3xl" />

      <div className="max-w-2xl mx-auto w-full z-10 my-auto">
        <button
          onClick={() => router.push("/")}
          className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-[#5a5e7a] hover:text-[#1c1f4a] transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Home
        </button>

        <div className="bg-white border border-[#e8dcc4] rounded-[2.5rem] shadow-xl p-8 sm:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#e8962e]/10 to-transparent rounded-bl-full pointer-events-none" />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#1c1f4a] font-display">
              Send a Message
            </h1>
            <p className="text-xs text-[#5a5e7a] mt-1.5 leading-relaxed">
              Have questions about sessions, packages, or coachings? Leave a message below, and Sharath&apos;s admin team will reply to you directly on WhatsApp.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  id="name"
                  type="text"
                  required
                  disabled={loading}
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  required
                  disabled={loading}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                WhatsApp Phone Number
              </Label>
              <div>
                <PhoneInput
                  international
                  defaultCountry="IN"
                  countries={["IN"]}
                  value={phone}
                  onChange={(val) => setPhone(val || "")}
                  disabled={loading}
                  className="h-11 bg-[#faf7f2]/50 border border-[#e8dcc4] rounded-xl focus-within:ring-[#b86a16] [&_.PhoneInput]:h-full [&_.PhoneInputCountry]:ml-3 [&_.PhoneInputCountrySelect]:cursor-pointer [&_input]:bg-transparent [&_input]:border-0 [&_input]:outline-none [&_input]:h-full [&_input]:w-full [&_input]:text-sm [&_input]:pl-2"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Message / Query
              </Label>
              <div className="relative">
                <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                <textarea
                  id="message"
                  required
                  disabled={loading}
                  rows={4}
                  placeholder="How can we help you on your healing journey?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#faf7f2]/50 border border-[#e8dcc4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b86a16] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full font-semibold text-sm transition-all duration-300 shadow-[0_10px_20px_rgba(28,31,74,0.15)] hover:shadow-[0_15px_25px_rgba(28,31,74,0.25)] flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending Message...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </form>
        </div>
      </div>

      <footer className="text-center text-xs text-[#9396ae] z-10 pt-8">
        © {new Date().getFullYear()} Sharath Chandra Kancherla. All rights reserved.
      </footer>
    </div>
  );
}
