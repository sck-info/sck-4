"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, Phone, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEmail = email.includes("@");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const preRes = await fetch("/api/auth/prelogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const preData = await preRes.json();

      if (preData.status === "ACCOUNT_NOT_FOUND") {
        setError("Account not found. Please check your email/phone or register.");
        setLoading(false);
        return;
      }

      if (preData.status === "ACCOUNT_DEACTIVATED") {
        setError("Your account has been deactivated. Please contact support.");
        setLoading(false);
        return;
      }

      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Wrong password. Please try again.");
      } else {
        toast.success("Successfully logged in!");
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
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
              Welcome Back
            </CardTitle>
            <CardDescription className="text-sm text-[#5a5e7a]">
              Sign in with your email or phone number.
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
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                  Email or Phone Number
                </Label>
                <div className="relative">
                  {isEmail ? (
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  ) : (
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  )}
                  <Input
                    id="email"
                    type="text"
                    required
                    placeholder="you@example.com or phone number"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                  />
                </div>
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

              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-[10px] text-[#b86a16] hover:text-[#b86a16]/80 font-semibold transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-11 mt-2 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(28,31,74,0.15)] hover:shadow-[0_12px_24px_rgba(28,31,74,0.22)] transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-xs text-[#5a5e7a]">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="text-[#b86a16] hover:text-[#b86a16]/80 font-semibold transition-colors">
                  Register here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f2]">
        <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
