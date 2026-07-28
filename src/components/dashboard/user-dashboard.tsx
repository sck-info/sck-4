"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Construction } from "lucide-react";

export default function UserDashboard() {
  const { data: session } = useSession();

  return (
    <div className="min-h-full flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center max-w-md"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-[#1c1f4a]/5 flex items-center justify-center">
            <Construction className="w-10 h-10 text-[#b86a16]" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-[#1c1f4a] font-display mb-3">
          Under Development
        </h1>

        <p className="text-sm text-[#5a5e7a] leading-relaxed">
          Welcome, {session?.user?.name || "User"}! This section is currently
          under development. Check back soon for updates.
        </p>
      </motion.div>
    </div>
  );
}
