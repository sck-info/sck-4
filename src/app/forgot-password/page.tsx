"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Mail, Phone, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

type Step = "choose" | "input" | "done";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>("choose");
  const [method, setMethod] = useState<"email" | "whatsapp" | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getPhoneNumber = () => {
    if (!phone) return { number: "", code: "" };
    const cleaned = phone.replace(/\D/g, "");
    const code = "91";
    const number = cleaned.startsWith(code) ? cleaned.slice(code.length) : cleaned;
    return { number, code };
  };

  const handleSend = async () => {
    if (method === "email" && !email) {
      setError("Please enter your email.");
      return;
    }
    if (method === "whatsapp") {
      const { number } = getPhoneNumber();
      if (number.length < 10) {
        setError("Please enter a valid 10-digit phone number.");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const body: any = { method };
      if (method === "email") body.email = email;
      else {
        const { number, code } = getPhoneNumber();
        body.phone = number;
        body.phoneCode = code;
      }

      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send reset link.");
        return;
      }

      toast.success(data.message);
      setStep("done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-[#faf7f2] overflow-hidden selection:bg-[#b86a16]/20">
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full border border-[#b86a16]/10" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[30rem] h-[30rem] rounded-full border border-[#b86a16]/10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-white/80 backdrop-blur-md border border-[#e8dcc4] rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(28,31,74,0.05)]">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#b86a16]/10 text-[#b86a16] mb-3">
                Sharath Kancherla
              </span>
            </div>
            <CardTitle className="text-3xl font-bold text-[#1c1f4a] tracking-tight font-display mb-1">
              {step === "done" ? "Link Sent" : "Reset Password"}
            </CardTitle>
            <CardDescription className="text-sm text-[#5a5e7a]">
              {step === "choose"
                ? "How would you like to receive the reset link?"
                : step === "input"
                ? `Enter your ${method === "email" ? "email address" : "phone number"}`
                : "Check your inbox or WhatsApp for the reset link."}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-2">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-[#faf0ee] border border-[#c4796a]/20 text-[#c4796a] text-xs font-medium rounded-2xl"
              >
                {error}
              </motion.div>
            )}

            {step === "choose" && (
              <div className="space-y-3">
                <button
                  onClick={() => { setMethod("email"); setStep("input"); setError(""); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[#e8dcc4] bg-white hover:bg-[#faf7f2] transition-colors text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-[#b86a16]/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-[#b86a16]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1c1f4a]">Email</p>
                    <p className="text-[10px] text-[#5a5e7a]">Receive reset link via email</p>
                  </div>
                </button>

                <button
                  onClick={() => { setMethod("whatsapp"); setStep("input"); setError(""); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-[#e8dcc4] bg-white hover:bg-[#faf7f2] transition-colors text-left cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full bg-[#6b8f71]/10 flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-[#6b8f71]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1c1f4a]">WhatsApp</p>
                    <p className="text-[10px] text-[#5a5e7a]">Receive reset link via WhatsApp</p>
                  </div>
                </button>

                <div className="pt-4 text-center">
                  <Link href="/login" className="text-xs text-[#b86a16] hover:text-[#b86a16]/80 font-semibold transition-colors inline-flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" />
                    Back to login
                  </Link>
                </div>
              </div>
            )}

            {step === "input" && (
              <div className="space-y-5">
                {method === "email" ? (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        className="pl-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                      />
                    </div>
                  </div>
                ) : (
                    <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                      Phone Number
                    </Label>
                    <div>
                      <PhoneInput
                        international
                        defaultCountry="IN"
                        countries={["IN"]}
                        value={phone}
                        onChange={(value) => setPhone(value || "")}
                        disabled={loading}
                        className="h-11 bg-[#faf7f2]/50 border border-[#e8dcc4] rounded-xl focus-within:ring-[#b86a16] [&_.PhoneInput]:h-full [&_.PhoneInputCountry]:ml-3 [&_.PhoneInputCountrySelect]:cursor-pointer [&_input]:bg-transparent [&_input]:border-0 [&_input]:outline-none [&_input]:h-full [&_input]:w-full [&_input]:text-sm [&_input]:pl-2"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleSend}
                  disabled={loading || (method === "email" && !email) || (method === "whatsapp" && !phone)}
                  className="w-full h-11 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(28,31,74,0.15)] cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Send Reset Link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <button
                  onClick={() => { setStep("choose"); setMethod(null); setError(""); }}
                  className="w-full text-xs text-[#5a5e7a] hover:text-[#b86a16] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  Choose a different method
                </button>
              </div>
            )}

            {step === "done" && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#6b8f71]/10 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-[#6b8f71]" />
                  </div>
                </div>
                <p className="text-xs text-[#5a5e7a] leading-relaxed">
                  If an account exists with that {method === "email" ? "email" : "phone number"}, you will receive a reset link shortly.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full font-semibold text-sm transition-all cursor-pointer"
                >
                  Back to Login
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
