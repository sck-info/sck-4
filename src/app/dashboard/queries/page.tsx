"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  MessageSquare,
  Reply as ReplyIcon,
  Trash2,
  CheckCircle,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  X,
  Search,
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  // URL pagination & filter params
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || DEFAULT_PAGE_LIMIT.toString());
  const statusFilter = searchParams.get("status") || "all";
  const searchQuery = searchParams.get("search") || "";

  // Local filter states
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localStatus, setLocalStatus] = useState(statusFilter);

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
  }, [searchParams, pushParams]);

  // Sync local states with URL parameters
  useEffect(() => {
    setLocalSearch(searchQuery);
    setLocalStatus(statusFilter);
  }, [searchQuery, statusFilter]);

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
  const [activeQueryReplies, setActiveQueryReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
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
      const searchPart = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const statusPart = statusFilter !== "all" ? `&status=${statusFilter}` : "";

      const res = await fetch(`/api/queries?page=${page}&limit=${limit}${searchPart}${statusPart}`);
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
  }, [page, limit, searchQuery, statusFilter]);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  useRealtime(["user_queries"], () => {
    fetchQueries();
  });

  const handleApplyFilters = () => {
    pushParams({
      search: localSearch.trim(),
      status: localStatus,
      page: "1",
    });
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalStatus("all");
    pushParams({
      search: "",
      status: "all",
      page: "1",
    });
  };

  const handleOpenReply = async (query: QueryRow) => {
    setActiveQuery(query);
    setReplyText("");
    setActiveQueryReplies([]);
    setReplyDialogOpen(true);
    setLoadingReplies(true);
    try {
      const res = await fetch(`/api/queries/${query.id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setActiveQueryReplies(json.data.replies || []);
        }
      }
    } catch (err) {
      console.error("Failed to load conversation history:", err);
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeQuery || !replyText.trim()) return;
    setReplyLoading(true);

    try {
      const res = await fetch(`/api/queries/${activeQuery.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyMessage: replyText.trim() }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to dispatch reply message.");

      toast.success("Reply successfully sent via WhatsApp!");
      setReplyText("");
      
      // Refresh replies list
      const freshRes = await fetch(`/api/queries/${activeQuery.id}`);
      if (freshRes.ok) {
        const freshJson = await freshRes.json();
        if (freshJson.success && freshJson.data) {
          setActiveQueryReplies(freshJson.data.replies || []);
        }
      }
      fetchQueries();
    } catch (err: any) {
      toast.error(err.message || "Could not send reply.");
    } finally {
      setReplyLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteQueryId) return;
    try {
      const res = await fetch(`/api/queries/${deleteQueryId}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete query.");

      toast.success("Contact query deleted successfully.");
      fetchQueries();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete query.");
    } finally {
      setDeleteQueryId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8dcc4] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">Contact Queries Queue</h1>
          <p className="text-xs text-[#5a5e7a] mt-1">Review contact inquiries submitted by users and reply directly using your WhatsApp gateway.</p>
        </div>
      </div>

      {/* Filter Toolbar (Clear first, then Apply) */}
      <div className="flex flex-col sm:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
        <div className="flex-1 min-w-[200px] space-y-1 w-full">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Search Queries</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
            <Input
              type="text"
              placeholder="Search customer name, email, phone, message..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 h-9 text-xs border-[#e8dcc4] bg-white rounded-xl placeholder:text-gray-400 text-[#1c1f4a]"
            />
          </div>
        </div>

        <div className="w-full sm:w-48 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Query Status</Label>
          <Select value={localStatus} onValueChange={setLocalStatus}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Queries</SelectItem>
              <SelectItem value="pending">Pending Only</SelectItem>
              <SelectItem value="replied">Replied Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            type="button"
            onClick={handleClearFilters}
            variant="outline"
            className="h-9 px-4 border-[#e8dcc4] bg-white hover:bg-[#faf7f2] text-xs font-bold text-[#5a5e7a] rounded-xl flex items-center justify-center cursor-pointer flex-1 sm:flex-none"
          >
            Clear
          </Button>
          <Button
            type="button"
            onClick={handleApplyFilters}
            className="h-9 px-4 bg-[#b86a16] hover:bg-[#b86a16]/90 text-white text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer shadow-sm transition-all flex-1 sm:flex-none"
          >
            Apply
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading queries queue...</p>
        </div>
      ) : error ? (
        <div className="p-6 border border-[#c4796a]/20 bg-[#faf0ee] rounded-2xl text-center text-[#c4796a]">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : queries.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <MessageSquare className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">No queries found</h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            Try adjusting your search query or status filter to find inquiries.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <TablePaginationFooter pagination={pagination} variant="top" />
          <div className="bg-white border border-[#e8dcc4]/60 rounded-3xl overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-[#1c1f4a]/5">
                <TableRow className="border-b border-[#e8dcc4]">
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Customer Name</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Contact Details</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Message</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Created At</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Status</TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queries.map((query) => (
                  <TableRow
                    key={query.id}
                    className="border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors"
                  >
                    <TableCell className="py-3 px-4 text-xs font-bold text-[#1c1f4a]">{query.name}</TableCell>
                    <TableCell className="py-3 px-4 text-xs text-[#5a5e7a]">
                      <div className="flex flex-col gap-1 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#9396ae]" /> {query.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#9396ae]" /> {query.phoneCode} {query.phone}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-[#5a5e7a] max-w-[280px]">
                      <p className="line-clamp-2" title={query.message}>{query.message}</p>
                      {query.replyMessage && (
                        <div className="mt-1.5 p-2 bg-[#faf7f2]/80 border border-[#e8dcc4] rounded-xl">
                          <span className="text-[10px] font-bold text-[#b86a16] block uppercase tracking-wide">Reply Dispatched:</span>
                          <p className="text-[11px] text-[#1c1f4a] font-medium leading-relaxed italic">"{query.replyMessage}"</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs text-[#5a5e7a] font-semibold">{formatDate(query.createdAt)}</TableCell>
                    <TableCell className="py-3 px-4 text-xs">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                        query.status === "replied"
                          ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                          : "bg-[#b86a16]/15 text-[#b86a16]"
                      }`}>
                        {query.status === "replied" ? "Replied" : "Pending"}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleOpenReply(query)}
                          className={`p-2 border border-transparent rounded-xl transition-all cursor-pointer ${
                            query.status === "replied"
                              ? "hover:bg-[#1c1f4a]/10 text-[#1c1f4a] hover:border-[#1c1f4a]/30"
                              : "bg-[#1c1f4a]/10 border-[#1c1f4a]/30 text-[#1c1f4a] hover:bg-[#1c1f4a]/20"
                          }`}
                          title={query.status === "replied" ? "View Conversation / Follow up" : "Send WhatsApp Reply"}
                        >
                          <ReplyIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteQueryId(query.id)}
                          className="p-2 hover:bg-[#c4796a]/10 text-[#c4796a] border border-transparent hover:border-[#c4796a]/30 rounded-xl transition-all cursor-pointer"
                          title="Delete Query"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePaginationFooter pagination={pagination} variant="bottom" />
        </div>
      )}

      {/* Reply Modal Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={(open) => { if (!open) setReplyDialogOpen(false); }}>
        <DialogContent className="max-w-lg border border-[#e8dcc4] bg-white rounded-2xl overflow-hidden p-0 shadow-lg font-sans">
          <DialogHeader className="bg-[#1c1f4a] text-white p-5">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-white">
              <ReplyIcon className="w-4.5 h-4.5 text-[#b86a16]" />
              Reply via WhatsApp gateway
            </DialogTitle>
          </DialogHeader>

          {activeQuery && (
            <form onSubmit={handleSendReply} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-[#5a5e7a] block font-bold uppercase">Customer</span>
                  <span className="font-bold text-[#1c1f4a]">{activeQuery.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#5a5e7a] block font-bold uppercase">Phone number</span>
                  <span className="font-mono font-bold text-[#1c1f4a]">{activeQuery.phoneCode} {activeQuery.phone}</span>
                </div>
              </div>

              <div className="p-3 bg-[#faf7f2]/30 border border-[#e8dcc4] rounded-xl text-xs space-y-1.5">
                <span className="text-[10px] text-[#5a5e7a] block font-bold uppercase">Original Message:</span>
                <p className="text-[#1c1f4a] leading-relaxed italic">
                  "{activeQuery.message}"
                </p>
              </div>

              {/* Conversation History / Dispatched Replies */}
              {activeQueryReplies.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-[#5a5e7a] block font-bold uppercase tracking-wider">Dispatched Replies ({activeQueryReplies.length})</span>
                  <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 divide-y divide-[#e8dcc4]/20 border border-[#e8dcc4]/40 rounded-xl p-3 bg-[#faf7f2]/10">
                    {activeQueryReplies.map((reply, index) => (
                      <div key={reply.id} className={`text-xs space-y-1 ${index > 0 ? "pt-2" : ""}`}>
                        <div className="flex justify-between items-center text-[9px] text-[#5a5e7a] font-semibold">
                          <span className="text-[#b86a16]">ADMIN REPLY #{index + 1}</span>
                          <span>{formatDate(reply.createdAt)}</span>
                        </div>
                        <p className="text-[#1c1f4a] font-medium leading-relaxed break-words whitespace-pre-wrap">
                          {reply.message}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {loadingReplies && (
                <div className="flex items-center justify-center py-4 gap-1.5 text-xs text-[#5a5e7a]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#b86a16]" />
                  <span>Loading dispatch log...</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="replyText" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                  Reply Message
                </Label>
                <textarea
                  id="replyText"
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  disabled={replyLoading}
                  placeholder="Type message to dispatch to seeker's phone..."
                  className="w-full p-3 bg-[#faf7f2]/40 border border-[#e8dcc4] rounded-xl text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#b86a16] text-[#1c1f4a]"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#e8dcc4]/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReplyDialogOpen(false)}
                  disabled={replyLoading}
                  className="border-[#e8dcc4] text-[#1c1f4a] rounded-xl hover:bg-[#faf7f2]/40 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={replyLoading}
                  className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl text-xs font-semibold"
                >
                  {replyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send WhatsApp message"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Query Confirmation Dialog */}
      <AlertDialog open={!!deleteQueryId} onOpenChange={(open) => !open && setDeleteQueryId(null)}>
        <AlertDialogContent className="rounded-2xl border-[#e8dcc4] bg-white font-sans max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1c1f4a] font-bold">
              Confirm Query Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
              Are you sure you want to permanently delete this contact request record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-[#e8dcc4] text-xs font-semibold rounded-xl hover:bg-[#faf7f2]/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-[#c4796a] hover:bg-[#c4796a]/90 text-white text-xs font-semibold rounded-xl"
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
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
      </div>
    }>
      <QueriesPageContent />
    </Suspense>
  );
}
