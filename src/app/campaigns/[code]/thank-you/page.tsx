"use client";

import React, { useEffect, useState, use, useCallback } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Home, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ code: string }>;
};

export default function ThankYouPage({ params }: Props) {
  const { code } = use(params);
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<any>(null);

  const loadCampaign = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/code/${code}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setCampaign(data.campaign);
      }
    } catch (err) {
      console.error(err);
    }
  }, [code]);

  useEffect(() => {
    loadCampaign().finally(() => setLoading(false));
  }, [loadCampaign]);

  useRealtime(["campaigns"], (payload) => {
    if (payload.eventType === "DELETE") {
      const oldRow = payload.old as any;
      const isCurrent = oldRow && (oldRow.code === code || oldRow.id === campaign?.id);
      if (isCurrent) {
        setCampaign(null);
      }
      return;
    }

    const nextRow = payload.new as any;
    if (!nextRow || !nextRow.id) return;
    const isCurrent = nextRow.code === code || nextRow.id === campaign?.id;
    if (!isCurrent) return;

    loadCampaign();
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf7f2]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
          <p className="text-xs text-[#5a5e7a]">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  const thankYouMessage = campaign?.thankYouMessage || "Thank you. Your response has been recorded.";
  const allowMultiple = campaign?.allowMultipleSubmissions ?? false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf7f2] px-4 py-10">
      <div className="w-full max-w-xl bg-white border border-[#e8dcc4] rounded-3xl overflow-hidden shadow-lg text-center p-8 sm:p-10 space-y-6">
        <div className="flex justify-center">
          <span className="font-display font-bold text-xl tracking-wider text-[#1c1f4a]">
            Sharath Kancherla
          </span>
        </div>

        <div className="w-16 h-16 bg-[#6b8f71]/10 text-[#6b8f71] rounded-full flex items-center justify-center mx-auto border border-[#6b8f71]/20">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-light font-display text-[#1c1f4a] tracking-tight">
            Submission Received
          </h1>
          <p className="text-sm font-semibold text-[#6b8f71] bg-[#6b8f71]/5 inline-block px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
            {campaign?.title || "Campaign Form"}
          </p>
        </div>

        <p className="text-xs sm:text-sm text-[#5a5e7a] max-w-md mx-auto leading-relaxed">
          {thankYouMessage}
        </p>

        <div className="pt-4 border-t border-[#faf7f2] flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            asChild
            variant="outline"
            className="w-full sm:w-auto border-[#e8dcc4] text-[#1c1f4a] hover:bg-[#faf7f2]/40 rounded-xl text-xs h-10 font-bold px-6 cursor-pointer"
          >
            <Link href="/" className="flex items-center gap-1.5 justify-center">
              <Home className="w-4 h-4" /> Go to Home
            </Link>
          </Button>

          {allowMultiple && (
            <Button
              asChild
              className="w-full sm:w-auto bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl text-xs h-10 font-bold px-6 cursor-pointer shadow-sm"
            >
              <Link href={`/campaigns/${code}`} className="flex items-center gap-1.5 justify-center">
                <RefreshCw className="w-4 h-4" /> Submit Another Response
              </Link>
            </Button>
          )}
        </div>

        <footer className="text-[10px] text-[#5a5e7a]/60 pt-4">
          <p>Thank you for participating. This form response was recorded securely.</p>
        </footer>
      </div>
    </div>
  );
}
