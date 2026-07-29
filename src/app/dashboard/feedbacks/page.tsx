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

function FeedbacksDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL pagination parameters
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";

  const pushParams = useCallback((params: URLSearchParams, replace = false) => {
    const url = `${pathname}?${params.toString()}`;
    if (replace) router.replace(url);
    else router.push(url);
  }, [pathname, router]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;
    if (!params.has("page")) {
      params.set("page", "1");
      changed = true;
    }
    if (!params.has("limit")) {
      params.set("limit", String(DEFAULT_PAGE_LIMIT));
      changed = true;
    }
    if (changed) {
      pushParams(params, true);
    }
  }, [searchParams, pushParams]);

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
      const res = await fetch(`/api/feedbacks?page=${page}&limit=${limit}`);
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
  }, [page, limit]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  // Real-time synchronization
  useRealtime(["session_feedbacks"], fetchFeedbacks);

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
        body: JSON.stringify({ enhancedFeedback: formData.enhancedFeedback || null }),
      });

      if (!res.ok) throw new Error("Failed to save compilation changes");
      toast.success("Feedback text compiled successfully!");
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading feedbacks...</p>
        </div>
      ) : feedbacks.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <MessageSquare className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">No feedback received</h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            User reviews will populate here after they complete active slots.
          </p>
        </div>
      ) : (
        <div className="p-1">
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
                  className={`border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors text-xs ${
                    item.isActive ? "bg-[#eaf2eb]/20" : ""
                  }`}
                >
                  <TableCell className="py-3 px-4 font-bold text-[#1c1f4a]">{item.userName}</TableCell>
                  <TableCell className="py-3 px-4 font-semibold text-[#5a5e7a]">{item.subCategoryName}</TableCell>
                  <TableCell className="py-3 px-4 text-xs font-mono text-[#b86a16]">
                    {"★".repeat(item.rating)}{"☆".repeat(5 - item.rating)}
                  </TableCell>
                  <TableCell className="py-3 px-4 max-w-[200px] truncate text-gray-500 italic">
                    {item.comments || <span className="text-gray-300">No comments</span>}
                  </TableCell>
                  <TableCell className="py-3 px-4 max-w-[200px] truncate font-medium text-[#1c1f4a]">
                    {item.enhancedFeedback ? (
                      <span className="text-teal-700">{item.enhancedFeedback}</span>
                    ) : (
                      <span className="text-gray-400 font-normal">Not compiled</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Button
                        onClick={() => handleToggleShowcase(item)}
                        className={`h-7 px-2.5 rounded-full text-[9px] font-bold uppercase transition-all shrink-0 ${
                          item.isActive
                            ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                            : "bg-[#9396ae]/10 text-[#5a5e7a] hover:bg-[#b86a16]/10 hover:text-[#b86a16]"
                        }`}
                        title={item.isActive ? "Hide Testimonial" : "Showcase on Landing Page"}
                      >
                        <Heart className={`w-3 h-3 mr-1 ${item.isActive ? "fill-current" : ""}`} />
                        {item.isActive ? "Showcased" : "Showcase"}
                      </Button>

                      <button
                        onClick={() => {
                          setEditingFeedback(item);
                          setFormData({ enhancedFeedback: item.enhancedFeedback || "" });
                        }}
                        className="p-1.5 hover:bg-[#b86a16]/10 text-[#b86a16] rounded-lg border border-transparent hover:border-[#b86a16]/30 transition-all cursor-pointer"
                        title="Edit Compiled Review"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setDeleteFeedbackId(item.id)}
                        className="p-1.5 hover:bg-[#c4796a]/10 text-[#c4796a] rounded-lg border border-transparent hover:border-[#c4796a]/30 transition-all cursor-pointer"
                        title="Delete Review"
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

      {/* DIALOG: Enhanced Testimonial Editor */}
      <Dialog open={editingFeedback !== null} onOpenChange={(open) => !open && setEditingFeedback(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold">Compile Testimonial</DialogTitle>
          </DialogHeader>

          {editingFeedback && (
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
              <div className="bg-[#faf7f2] p-3 rounded-xl border border-[#e8dcc4] text-xs space-y-1">
                <div className="font-bold text-[#b86a16] uppercase tracking-wider text-[9px]">Original Raw Comments:</div>
                <div className="text-gray-700 italic">&ldquo;{editingFeedback.comments || "No comments written."}&rdquo;</div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Enhanced Testimonial Content</Label>
                <textarea
                  value={formData.enhancedFeedback}
                  onChange={(e: any) => setFormData({ enhancedFeedback: e.target.value })}
                  placeholder="Rewrite raw feedback here to make it polished and ready for showing in public testimonial lists..."
                  rows={5}
                  disabled={formLoading}
                  className="w-full p-3 bg-[#faf7f2]/40 border border-[#e8dcc4] rounded-xl text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#b86a16]"
                />
                <p className="text-[10px] text-[#5a5e7a] leading-relaxed">
                  If left blank, the testimonial showcases using the customer's original raw comment text.
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingFeedback(null)} disabled={formLoading} className="h-10 px-5 rounded-full border border-[#e8dcc4] text-[#5a5e7a]">
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading} className="h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs">
                  {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save Details
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG: Remove Review */}
      <AlertDialog open={deleteFeedbackId !== null} onOpenChange={(open) => !open && setDeleteFeedbackId(null)}>
        <AlertDialogContent className="w-[300px] max-w-[90vw] bg-white rounded-3xl border-0 shadow-xl p-6">
          <AlertDialogHeader className="text-center flex flex-col items-center">
            <AlertDialogTitle className="text-center text-base font-semibold text-gray-900">Delete Review</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-gray-600 mt-1">
              Are you sure? This will remove this feedback submission and delete references from public pages permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-center mt-4">
            <AlertDialogCancel className="flex-1 border border-[#c4796a] text-[#c4796a] hover:bg-[#c4796a]/5 rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
              No
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="flex-1 bg-[#c4796a] hover:bg-[#c4796a]/90 text-white rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer"
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function FeedbacksDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading feedbacks compiler...</p>
        </div>
      }
    >
      <FeedbacksDashboardContent />
    </Suspense>
  );
}
