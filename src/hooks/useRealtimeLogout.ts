"use client";

import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { getSupabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useRealtimeLogout() {
  const { data: session, update } = useSession();
  const sessionVersion = (session?.user as any)?.sessionVersion;
  const userId = session?.user?.id;
  const prevVersion = useRef(sessionVersion);

  useEffect(() => {
    if (!userId) return;

    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel("realtime-logout")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "users",
          filter: `id=eq.${userId}`,
        },
        (payload: any) => {
          const newVersion = payload.new?.session_version;
          const isActive = payload.new?.is_active;

          if (isActive === false) {
            toast.error("Your account has been deactivated.");
            setTimeout(() => signOut({ callbackUrl: "/login" }), 2000);
            return;
          }

          if (newVersion && prevVersion.current !== undefined && newVersion !== prevVersion.current) {
            prevVersion.current = newVersion;
            toast.error("Session expired. Please login again.");
            setTimeout(() => signOut({ callbackUrl: "/login" }), 2000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, sessionVersion]);
}
