"use client";

import React, { useState, useEffect, useCallback, useMemo, use, Suspense } from "react";
import Link from "next/link";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta } from "@/lib/pagination";
import {
  ArrowLeft,
  Loader2,
  Download,
  AlertCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import type {
  Campaign,
  CampaignQuestion,
  CampaignResponseRow,
} from "@/types/campaign";

type Props = {
  params: Promise<{ id: string }>;
};

function CampaignResponsesPageContent({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL pagination params
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "25");

  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<{
    campaign: Campaign;
    questions: CampaignQuestion[];
    responses: CampaignResponseRow[];
  } | null>(null);

  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  const pushParams = useCallback(
    (newParams: Record<string, string>, replace = false) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(newParams).forEach(([k, v]) => {
        if (v) params.set(k, v);
        else params.delete(k);
      });
      const url = `${pathname}?${params.toString()}`;
      if (replace) router.replace(url);
      else router.push(url);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const urlParams: Record<string, string> = {};
    let changed = false;
    if (!searchParams.get("page")) {
      urlParams.page = "1";
      changed = true;
    }
    if (!searchParams.get("limit")) {
      urlParams.limit = "25";
      changed = true;
    }
    if (changed) {
      pushParams(urlParams, true);
    }
  }, [searchParams, pushParams]);

  const fetchStats = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/campaigns/${id}/results?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch responses.");
      const json = await res.json();
      if (json.success) {
        setStatsData(json);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      }
    } catch {
      toast.error("Failed to load campaign responses.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [id, page, limit]);

  useRealtime(["campaigns", "campaign_responses", "campaign_answers"], () => fetchStats(true));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExportCSV = async () => {
    try {
      toast.loading("Fetching all responses for export...", { id: "export-csv" });
      const res = await fetch(`/api/campaigns/${id}/results?export=true`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      
      if (!json.success || !json.responses || json.responses.length === 0) {
        toast.dismiss("export-csv");
        toast.error("No submissions to export.");
        return;
      }

      const questionsList: CampaignQuestion[] = json.questions || [];
      const allResponses: CampaignResponseRow[] = json.responses;

      const headers = [
        ...questionsList.map((q) => `"${q.prompt.replace(/"/g, '""')}"`),
        "Submitted At",
      ];

      const rows = allResponses.map((resp) => {
        const cells = [
          ...questionsList.map((q) => {
            const val = resp.answers[q.id];
            if (Array.isArray(val)) return `"${val.join(", ").replace(/"/g, '""')}"`;
            if (val === null || val === undefined) return "";
            return `"${String(val).replace(/"/g, '""')}"`;
          }),
          resp.submittedAt ? new Date(resp.submittedAt).toLocaleString() : "",
        ];
        return cells.join(",");
      });

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `${json.campaign.title}_responses.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss("export-csv");
      toast.success("CSV report downloaded!");
    } catch {
      toast.dismiss("export-csv");
      toast.error("Failed to export responses.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-xs text-[#5a5e7a] gap-2">
        <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
        <p>Loading campaign responses...</p>
      </div>
    );
  }

  if (!statsData) {
    return (
      <div className="text-center py-20 bg-white border border-[#e8dcc4] rounded-3xl max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h2 className="text-base font-bold text-[#1c1f4a]">Responses Not Found</h2>
        <Button asChild className="mt-4 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl text-xs h-9 font-bold">
          <Link href="/dashboard/campaigns">Back to Campaigns</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/dashboard/campaigns"
          className="group inline-flex items-center text-[10px] font-extrabold tracking-widest text-[#b86a16] uppercase hover:text-[#b86a16]/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
          Back to Campaigns List
        </Link>
      </div>

      {/* Page Title & Exports row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8dcc4] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display flex items-center gap-3">
            <span>{statsData.campaign.title}</span>
            <span className="text-[10px] font-bold text-[#b86a16] bg-[#b86a16]/10 px-2.5 py-1 rounded-full whitespace-nowrap uppercase tracking-wider">
              {pagination.total} responses
            </span>
          </h1>
          <p className="text-xs text-[#5a5e7a] mt-1">
            Detailed public submissions list queue.
          </p>
        </div>
        <div>
          <Button
            onClick={handleExportCSV}
            className="bg-[#b86a16] hover:bg-[#b86a16]/90 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 h-10 px-5 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4" /> Export Data to CSV
          </Button>
        </div>
      </div>

      {/* Table of answers */}
      <div className="space-y-4">
        <TablePaginationFooter pagination={pagination} variant="top" />
        <div className="bg-white border border-[#e8dcc4]/60 rounded-3xl overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-[#1c1f4a]/5">
              <TableRow className="border-b border-[#e8dcc4]">
                {statsData.questions.map((q) => (
                  <TableHead key={q.id} className="py-3 px-4 font-bold text-[#1c1f4a] text-xs min-w-[150px]">
                    {q.prompt}
                  </TableHead>
                ))}
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs whitespace-nowrap">Submitted At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[#e8dcc4]/40">
              {statsData.responses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={statsData.questions.length + 1} className="text-center py-12 text-xs text-[#5a5e7a] italic">
                    No submissions received yet.
                  </TableCell>
                </TableRow>
              ) : (
                statsData.responses.map((resp) => (
                  <TableRow key={resp.id} className="hover:bg-[#faf7f2]/10 transition-colors">
                    {statsData.questions.map((q) => {
                      const val = resp.answers[q.id];
                      const displayVal = Array.isArray(val)
                        ? val.join(", ")
                        : val !== null && val !== undefined
                        ? String(val)
                        : "-";

                      const isUrl = displayVal !== "-" && (displayVal.startsWith("http://") || displayVal.startsWith("https://") || q.questionType === "URL");
                      return (
                        <TableCell key={q.id} className="py-3.5 px-4 text-xs text-[#1c1f4a]">
                          {isUrl ? (
                            <a
                              href={displayVal.startsWith("http") ? displayVal : `https://${displayVal}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#b86a16] hover:underline"
                            >
                              {displayVal}
                            </a>
                          ) : (
                            displayVal
                          )}
                        </TableCell>
                      );
                    })}
                    <TableCell className="py-3.5 px-4 text-xs text-[#5a5e7a] font-medium whitespace-nowrap">
                      {resp.submittedAt ? formatDate(resp.submittedAt) : "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePaginationFooter pagination={pagination} variant="bottom" />
      </div>
    </div>
  );
}

export default function CampaignResponsesPage({ params }: Props) {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-xs text-[#5a5e7a] gap-2">
        <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
        <p>Loading campaign responses...</p>
      </div>
    }>
      <CampaignResponsesPageContent params={params} />
    </Suspense>
  );
}
