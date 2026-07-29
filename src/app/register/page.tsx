"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  Venus,
  Mars,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

type Step = "details" | "otp";

export default function RegisterPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<string>("");
  const [gender, setGender] = useState<string>("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [age, setAge] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getPhoneNumber = () => {
    if (!phone) return { number: "", code: "" };
    const cleaned = phone.replace(/\D/g, "");
    const code = "91";
    const number = cleaned.startsWith(code) ? cleaned.slice(code.length) : cleaned;
    return { number, code };
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!phone) {
      setError("Please enter your phone number.");
      return;
    }

    const { number, code } = getPhoneNumber();
    if (number.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: number,
          phoneCode: code,
          gender: gender || null,
          dateOfBirth: dateOfBirth ? format(dateOfBirth, "yyyy-MM-dd") : null,
          age: age ? parseInt(age) : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed.");
        return;
      }

      toast.success("OTP sent to your WhatsApp!");
      setStep("otp");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");

    const { number } = getPhoneNumber();

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: number, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid OTP.");
        return;
      }

      toast.success("Phone verified! Logging you in...");

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Auto-login failed. Please sign in manually.");
        router.push("/login");
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setError("");

    const { number, code } = getPhoneNumber();

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: number, phoneCode: code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to resend OTP.");
        return;
      }

      toast.success("OTP resent to your WhatsApp!");
    } catch {
      setError("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "details") {
      await handleRegister();
    } else {
      await handleVerifyOtp();
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
        className="w-full max-w-2xl relative z-10"
      >
        <Card className="bg-white/80 backdrop-blur-md border border-[#e8dcc4] rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(28,31,74,0.05)]">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-[#b86a16]/10 text-[#b86a16] mb-3">
                Sharath Kancherla
              </span>
            </div>
            <CardTitle className="text-3xl font-bold text-[#1c1f4a] tracking-tight font-display mb-1">
              {step === "details" ? "Create Account" : "Verify Phone"}
            </CardTitle>
            <CardDescription className="text-sm text-[#5a5e7a]">
              {step === "details"
                ? "Fill in your details to register."
                : "Enter the OTP sent to your WhatsApp."}
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

            <form onSubmit={handleSubmit} className="space-y-5">
              {step === "details" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <Input
                          id="name"
                          type="text"
                          required
                          placeholder="Your full name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={loading}
                          className="pl-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                        />
                      </div>
                    </div>

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

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                        Gender
                      </Label>
                      <Select value={gender} onValueChange={setGender} disabled={loading}>
                        <SelectTrigger className="h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl w-full">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">
                            <span className="flex items-center gap-2"><Mars className="w-3.5 h-3.5" /> Male</span>
                          </SelectItem>
                          <SelectItem value="Female">
                            <span className="flex items-center gap-2"><Venus className="w-3.5 h-3.5" /> Female</span>
                          </SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                        Date of Birth
                      </Label>
                      <DatePicker
                        value={dateOfBirth}
                        onChange={(d) => {
                          setDateOfBirth(d);
                          if (d) {
                            const calculated = new Date().getFullYear() - d.getFullYear();
                            setAge(calculated.toString());
                          }
                        }}
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age" className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                        Age
                      </Label>
                      <div className="relative">
                        <Input
                          id="age"
                          type="text"
                          placeholder="Enter age"
                          value={age}
                          onChange={(e) => {
                            setAge(e.target.value);
                            if (e.target.value) {
                              const yr = new Date().getFullYear() - parseInt(e.target.value);
                              setDateOfBirth(new Date(yr, 0, 1));
                            }
                          }}
                          disabled={loading}
                          className="h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                        />
                      </div>
                      {age && (
                        <p className="text-[9px] text-[#9396ae] mt-1">
                          Age provided. DOB is auto-calculated and may not be exact.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          className="pl-10 pr-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1c1f4a] transition-colors"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          placeholder="••••••••"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={loading}
                          className="pl-10 pr-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1c1f4a] transition-colors"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !name || !email || !phone || !password || !confirmPassword}
                    className="w-full h-11 mt-4 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(28,31,74,0.15)] hover:shadow-[0_12px_24px_rgba(28,31,74,0.22)] transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        Register
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                      OTP Code
                    </Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="otp"
                        type="text"
                        required
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        disabled={loading}
                        className="pl-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16] text-center text-lg tracking-[0.5em] font-bold"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full h-11 mt-4 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(28,31,74,0.15)] hover:shadow-[0_12px_24px_rgba(28,31,74,0.22)] transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Verify & Login
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="w-full text-xs text-[#5a5e7a] hover:text-[#b86a16] transition-colors mt-2 cursor-pointer"
                  >
                    Resend OTP
                  </button>
                </>
              )}
            </form>

            {step === "details" && (
              <div className="mt-6 text-center">
                <p className="text-xs text-[#5a5e7a]">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#b86a16] hover:text-[#b86a16]/80 font-semibold transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
