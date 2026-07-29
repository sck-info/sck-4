"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  MessageSquare,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Heart,
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

type FeedbackRow = {
  id: string;
  userName: string;
  subCategoryName: string;
  rating: number;
  comments: string | null;
  enhancedFeedback: string | null;
  isActive: boolean;
  createdAt: string;
};

function FeedbacksPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL pagination & filter params
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";
  const statusFilter = searchParams.get("status") || "all";
  const ratingFilter = searchParams.get("rating") || "all";
  const searchQuery = searchParams.get("search") || "";

  // Local filter states
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localStatus, setLocalStatus] = useState(statusFilter);
  const [localRating, setLocalRating] = useState(ratingFilter);

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
      params.limit = String(DEFAULT_PAGE_LIMIT);
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
    setLocalRating(ratingFilter);
  }, [searchQuery, statusFilter, ratingFilter]);

  // Data states
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  // Action states
  const [editingFeedback, setEditingFeedback] = useState<FeedbackRow | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({ enhancedFeedback: "" });
  const [deleteFeedbackId, setDeleteFeedbackId] = useState<string | null>(null);

  // Fetch Feedbacks
  const fetchFeedbacks = useCallback(async () => {
    try {
      const searchPart = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const statusPart = statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const ratingPart = ratingFilter !== "all" ? `&rating=${ratingFilter}` : "";

      const res = await fetch(`/api/feedbacks?page=${page}&limit=${limit}${searchPart}${statusPart}${ratingPart}`);
      if (!res.ok) throw new Error("Failed to load feedbacks");
      const json = await res.json();
      setFeedbacks(json.data);
      setPagination(json.pagination);
    } catch (err) {
      console.error(err);
      toast.error("Error loading feedbacks catalog");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, statusFilter, ratingFilter]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Real-time synchronization
  useRealtime(["feedbacks"], fetchFeedbacks);

  // Apply & Clear triggers
  const handleApplyFilters = () => {
    pushParams({
      search: localSearch.trim(),
      status: localStatus,
      rating: localRating,
      page: "1",
    });
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalStatus("all");
    setLocalRating("all");
    pushParams({
      search: "",
      status: "all",
      rating: "all",
      page: "1",
    });
  };

  // Toggle Showcase status (isActive)
  const handleToggleShowcase = async (item: FeedbackRow) => {
    try {
      const res = await fetch(`/api/feedbacks/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });

      if (!res.ok) throw new Error("Failed to toggle testimonial status");
      toast.success(item.isActive ? "Removed testimonial from landing page" : "Showcased testimonial on landing page!");
      fetchFeedbacks();
    } catch (err: any) {
      toast.error(err.message || "Action failed.");
    }
  };

  // Submit edit (enhanced feedback details)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeedback) return;
    setFormLoading(true);

    try {
      const res = await fetch(`/api/feedbacks/${editingFeedback.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enhancedFeedback: formData.enhancedFeedback }),
      });

      if (!res.ok) throw new Error("Failed to save testimonials changes");
      toast.success("Testimonials content compiled successfully!");
      setEditingFeedback(null);
      fetchFeedbacks();
    } catch (err: any) {
      toast.error(err.message || "Compile failed.");
    } finally {
      setFormLoading(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteFeedbackId) return;
    try {
      const res = await fetch(`/api/feedbacks/${deleteFeedbackId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove feedback");
      toast.success("Feedback removed successfully");
      fetchFeedbacks();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove feedback.");
    } finally {
      setDeleteFeedbackId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">Feedbacks &amp; Testimonials Compiler</h1>
        <p className="text-xs text-[#5a5e7a] mt-1">Review ratings, rewrite submissions into polished testimonials, and toggle landing page visibility.</p>
      </div>

      {/* Filter Toolbar (Clear first, then Apply) */}
      <div className="flex flex-col sm:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
        <div className="flex-1 min-w-[200px] space-y-1 w-full">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Search Feedback</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
            <Input
              type="text"
              placeholder="Search seeker, offering, comments..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 h-9 text-xs border-[#e8dcc4] bg-white rounded-xl placeholder:text-gray-400 text-[#1c1f4a]"
            />
          </div>
        </div>

        <div className="w-full sm:w-40 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Rating</Label>
          <Select value={localRating} onValueChange={setLocalRating}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full sm:w-44 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Visibility Status</Label>
          <Select value={localStatus} onValueChange={setLocalStatus}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Showcased</SelectItem>
              <SelectItem value="inactive">Hidden</SelectItem>
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
          <p className="text-xs text-[#5a5e7a] font-medium">Loading feedbacks...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <MessageSquare className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">No feedbacks found</h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            Try adjusting your search query, status, or rating filter to locate records.
          </p>
        </div>
      ) : (
        <div className="p-1">
          <TablePaginationFooter pagination={pagination} variant="top" />
          <Table>
            <TableHeader className="bg-[#1c1f4a]/5">
              <TableRow className="border-b border-[#e8dcc4]">
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Customer Name</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Session Offering</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Rating</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Raw Comments</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Testimonial (Compiled)</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbacks.map((item) => (
                <TableRow
                  key={item.id}
                  className={`border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors ${
                    !item.isActive ? "opacity-75" : ""
                  }`}
                >
                  <TableCell className="py-3.5 px-4 font-bold text-[#1c1f4a] text-xs">{item.userName}</TableCell>
                  <TableCell className="py-3.5 px-4 text-xs font-semibold text-[#1c1f4a]">{item.subCategoryName}</TableCell>
                  <TableCell className="py-3.5 px-4 text-xs">
                    <div className="text-[#b86a16] font-bold flex gap-0.5" title={`${item.rating} stars`}>
                      {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-xs text-[#5a5e7a] max-w-[200px] truncate" title={item.comments || ""}>
                    {item.comments || <span className="text-gray-400 italic">No comments</span>}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-xs text-[#1c1f4a] font-medium max-w-[250px] truncate" title={item.enhancedFeedback || ""}>
                    {item.enhancedFeedback ? (
                      <span className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-[#b86a16] fill-[#b86a16]/20 shrink-0" />
                        {item.enhancedFeedback}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Not compiled yet</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3.5 px-4 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => {
                          setEditingFeedback(item);
                          setFormData({ enhancedFeedback: item.enhancedFeedback || item.comments || "" });
                        }}
                        className="p-1.5 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                        title="Compile / Edit Testimonial"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleShowcase(item)}
                        className={`p-1.5 border border-transparent rounded-xl transition-all cursor-pointer ${
                          item.isActive
                            ? "bg-[#6b8f71]/10 border-[#6b8f71]/35 text-[#6b8f71]"
                            : "hover:bg-gray-100 hover:border-gray-300 text-[#5a5e7a]"
                        }`}
                        title={item.isActive ? "Hide Testimonial" : "Showcase Testimonial"}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteFeedbackId(item.id)}
                        className="p-1.5 hover:bg-[#c4796a]/10 text-[#c4796a] border border-transparent hover:border-[#c4796a]/30 rounded-xl transition-all cursor-pointer"
                        title="Delete Feedback"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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

      {/* Compile Testimonial Dialog Modal */}
      <Dialog open={!!editingFeedback} onOpenChange={(open) => !open && setEditingFeedback(null)}>
        <DialogContent className="max-w-lg border border-[#e8dcc4] bg-white rounded-2xl overflow-hidden p-0 shadow-lg font-sans">
          <DialogHeader className="bg-[#1c1f4a] text-white p-5">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-white">
              <MessageSquare className="w-4.5 h-4.5 text-[#b86a16]" />
              Compile Seeker Review testimonial
            </DialogTitle>
          </DialogHeader>

          {editingFeedback && (
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-[#5a5e7a] block font-bold uppercase">Customer</span>
                <span className="font-bold text-[#1c1f4a]">{editingFeedback.userName}</span>
              </div>

              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-[#5a5e7a] block font-bold uppercase">Session offering</span>
                <span className="font-bold text-[#1c1f4a]">{editingFeedback.subCategoryName}</span>
              </div>

              <div className="p-3 bg-[#faf7f2]/30 border border-[#e8dcc4] rounded-xl text-xs space-y-1.5">
                <span className="text-[10px] text-[#5a5e7a] block font-bold uppercase">Seeker's raw feedback:</span>
                <p className="text-[#1c1f4a] leading-relaxed italic">
                  "{editingFeedback.comments || "No comments written."}"
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="enhancedFeedback" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                  Polished Testimonial (Website View)
                </Label>
                <textarea
                  id="enhancedFeedback"
                  rows={4}
                  value={formData.enhancedFeedback}
                  onChange={(e) => setFormData({ enhancedFeedback: e.target.value })}
                  disabled={formLoading}
                  placeholder="Rewrite seeker comment into a polished testimonial..."
                  className="w-full p-3 bg-[#faf7f2]/40 border border-[#e8dcc4] rounded-xl text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#b86a16] text-[#1c1f4a]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#e8dcc4]/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingFeedback(null)}
                  disabled={formLoading}
                  className="border-[#e8dcc4] text-[#1c1f4a] rounded-xl hover:bg-[#faf7f2]/40 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl text-xs font-semibold"
                >
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Testimonial"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Feedback Alert Dialog */}
      <AlertDialog open={!!deleteFeedbackId} onOpenChange={(open) => !open && setDeleteFeedbackId(null)}>
        <AlertDialogContent className="rounded-2xl border-[#e8dcc4] bg-white font-sans max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1c1f4a] font-bold">
              Confirm Feedback Removal
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
              Are you sure you want to permanently delete this seeker review? This action cannot be undone.
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
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function FeedbacksPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
      </div>
    }>
      <FeedbacksPageContent />
    </Suspense>
  );
}
