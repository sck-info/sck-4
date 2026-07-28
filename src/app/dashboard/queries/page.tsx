"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  MessageSquare,
  Reply,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  X,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface QueryRow {
  id: string;
  name: string;
  email: string;
  phoneCode: string;
  phone: string;
  message: string;
  status: "pending" | "replied";
  replyMessage: string | null;
  repliedAt: string | null;
  createdAt: string;
}

function QueriesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || DEFAULT_PAGE_LIMIT.toString());

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
    const params: Record<string, string> = {};
    let changed = false;
    if (!searchParams.get("page")) {
      params.page = "1";
      changed = true;
    }
    if (!searchParams.get("limit")) {
      params.limit = DEFAULT_PAGE_LIMIT.toString();
      changed = true;
    }
    if (changed) {
      pushParams(params, true);
    }
  }, [pathname, router, searchParams, pushParams]);

  const [queries, setQueries] = useState<QueryRow[]>([]);
  const isInitialLoadRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [error, setError] = useState("");

  // Reply state
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState<QueryRow | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);

  // Delete state
  const [deleteQueryId, setDeleteQueryId] = useState<string | null>(null);

  const fetchQueries = useCallback(async () => {
    try {
      setError("");
      if (isInitialLoadRef.current) {
        setLoading(true);
        isInitialLoadRef.current = false;
      }
      const res = await fetch(`/api/queries?page=${page}&limit=${limit}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to load queries.");
      }
      const result = await res.json();
      setQueries(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading queries.");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  useRealtime(["user_queries"], () => {
    fetchQueries();
  });

  const handleOpenReply = (query: QueryRow) => {
    setActiveQuery(query);
    setReplyText(
      query.replyMessage ||
        `Hi ${query.name}, this is Sharath's admin team replying to your message regarding: "${query.message.slice(0, 40)}${query.message.length > 40 ? "..." : ""}"\n\n`
    );
    setReplyDialogOpen(true);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuery || !replyText.trim()) return;

    setReplyLoading(true);

    try {
      const res = await fetch(`/api/queries/${activeQuery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyMessage: replyText }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to dispatch reply.");
      }

      toast.success("Reply dispatched successfully to user via WhatsApp.");
      setReplyDialogOpen(false);
      fetchQueries();
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDeleteQuery = async () => {
    if (!deleteQueryId) return;

    try {
      const res = await fetch(`/api/queries/${deleteQueryId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete query.");
      }

      toast.success("Query deleted successfully.");
      fetchQueries();
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setDeleteQueryId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">
            Manage Queries
          </h1>
          <p className="text-xs text-[#5a5e7a] mt-1">
            Review submitted messages and send replies via automated WhatsApp messages.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading queries...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 border border-[#c4796a]/20 bg-[#faf0ee] rounded-2xl text-center text-[#c4796a]">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : queries.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <MessageSquare className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">
            No queries submitted
          </h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            Queries submitted through the public contact page will appear here.
          </p>
        </div>
      ) : (
        <div className="p-1">
          <TablePaginationFooter pagination={pagination} variant="top" />
          <Table>
            <TableHeader className="bg-[#1c1f4a]/5">
              <TableRow className="border-b border-[#e8dcc4]">
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">User Info</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">Contact Number</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">Message / Query</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">Status</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queries.map((q) => (
                <TableRow
                  key={q.id}
                  className="border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors"
                >
                  <TableCell className="py-3 px-4">
                    <div>
                      <p className="text-sm font-semibold text-[#1c1f4a]">{q.name}</p>
                      <span className="flex items-center gap-1.5 text-xs text-[#5a5e7a] mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-[#9396ae]" />
                        {q.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-[#1c1f4a]">
                      <Phone className="w-3.5 h-3.5 text-[#9396ae]" />
                      {q.phoneCode} {q.phone}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4 max-w-xs sm:max-w-md">
                    <div>
                      <p className="text-xs text-[#1c1f4a] font-normal leading-relaxed whitespace-pre-wrap">
                        {q.message}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-[#9396ae] mt-1.5">
                        <Calendar className="w-3 h-3" />
                        Submitted on {new Date(q.createdAt).toLocaleDateString()}
                      </div>
                      {q.replyMessage && (
                        <div className="mt-2.5 p-2 bg-[#6b8f71]/5 border border-[#6b8f71]/15 rounded-lg">
                          <p className="text-[11px] font-bold text-[#6b8f71]">Our Response:</p>
                          <p className="text-[11px] text-[#5a5e7a] whitespace-pre-wrap mt-0.5">{q.replyMessage}</p>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                      q.status === "replied"
                        ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                        : "bg-[#c4796a]/10 text-[#c4796a]"
                    }`}>
                      {q.status}
                    </span>
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleOpenReply(q)}
                        className="p-2 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                        title={q.status === "replied" ? "Edit Reply" : "Send Reply"}
                      >
                        <Reply className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteQueryId(q.id)}
                        className="p-2 hover:bg-[#c4796a]/10 text-[#c4796a] border border-transparent hover:border-[#c4796a]/30 rounded-xl transition-all cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePaginationFooter pagination={pagination} variant="bottom" />
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-5 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold">
              Reply to {activeQuery?.name}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSendReply} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                User Query Message
              </Label>
              <div className="p-3 bg-[#faf7f2] border border-[#e8dcc4] rounded-xl text-xs text-[#5a5e7a] whitespace-pre-wrap">
                {activeQuery?.message}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="replyText" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Reply Message (sent via WhatsApp)
              </Label>
              <textarea
                id="replyText"
                required
                disabled={replyLoading}
                rows={5}
                placeholder="Write your response message..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-3 bg-white border border-[#e8dcc4] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#b86a16] focus:border-transparent transition-all"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-[#e8dcc4]/60 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={replyLoading}
                onClick={() => setReplyDialogOpen(false)}
                className="h-10 px-5 rounded-full border border-[#e8dcc4] text-[#5a5e7a]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={replyLoading}
                className="h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                {replyLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Send Reply via WhatsApp
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={deleteQueryId !== null} onOpenChange={(open) => !open && setDeleteQueryId(null)}>
        <AlertDialogContent className="w-[300px] max-w-[90vw] bg-white rounded-3xl border-0 shadow-xl p-6">
          <AlertDialogHeader className="text-center flex flex-col items-center">
            <AlertDialogTitle className="text-center text-base font-semibold text-gray-900">
              Delete Query
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-gray-600 mt-1">
              Are you sure you want to delete this query? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-center mt-4">
            <AlertDialogCancel className="flex-1 border border-[#c4796a] text-[#c4796a] hover:bg-[#c4796a]/5 rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuery}
              className="flex-1 bg-[#c4796a] hover:bg-[#c4796a]/90 text-white rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function QueriesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading queries dashboard...
          </p>
        </div>
      }
    >
      <QueriesPageContent />
    </Suspense>
  );
}
