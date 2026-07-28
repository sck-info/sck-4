"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen w-full bg-[#faf7f2] font-sans selection:bg-[#b86a16]/20">
      <header className="flex items-center justify-between px-6 h-16 border-b border-[#e8dcc4]/60 bg-white/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#5a5e7a]">User Portal</span>
        </div>

        {status === "authenticated" && session?.user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white border border-[#e8dcc4]/60 shadow-xs">
              <div className="w-7 h-7 rounded-full bg-[#b86a16] flex items-center justify-center text-white font-bold text-xs shrink-0">
                {session.user.name ? session.user.name[0] : "U"}
              </div>
              <div className="flex flex-col text-left min-w-0 max-w-[120px] sm:max-w-[180px]">
                <span className="text-[11px] font-bold text-[#1c1f4a] leading-none truncate">
                  {session.user.name || "User"}
                </span>
                <span className="text-[9px] text-[#5a5e7a] leading-none mt-0.5 truncate">
                  {session.user.email}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                toast.success("Successfully logged out!");
                setTimeout(async () => {
                  await signOut({ callbackUrl: "/" });
                }, 800);
              }}
              className="text-[#c4796a] hover:text-[#c4796a] hover:bg-[#c4796a]/10 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
