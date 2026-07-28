"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldOff, ArrowLeft, LayoutDashboard } from "lucide-react";

export default function NotAuthorizedPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || "User";

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 bg-[#faf7f2] overflow-hidden selection:bg-[#b86a16]/20">
      <div className="pointer-events-none absolute -top-40 -right-40 w-96 h-96 rounded-full border border-[#c4796a]/10" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 w-[30rem] h-[30rem] rounded-full border border-[#c4796a]/10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#c4796a]/10 flex items-center justify-center">
            <ShieldOff className="w-10 h-10 text-[#c4796a]" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-[#1c1f4a] font-display mb-2">403</h1>
        <p className="text-xs font-semibold text-[#c4796a] uppercase tracking-wider mb-4">Not Authorized</p>

        <p className="text-sm text-[#5a5e7a] leading-relaxed mb-8">
          You are logged in as <strong className="text-[#1c1f4a]">{role}</strong>. You do not have permission to access this page.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full border border-[#e8dcc4] bg-white text-[#1c1f4a] text-xs font-semibold hover:bg-[#faf7f2] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Go Back
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white text-xs font-semibold transition-all"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
