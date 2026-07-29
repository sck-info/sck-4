"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Loader2,
  AlertCircle,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type MetricRow = {
  id: string;
  num: string;
  label: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

function MetricsCrudPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL parameters
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";
  const statusFilter = searchParams.get("status") || "all";
  const searchQuery = searchParams.get("search") || "";

  // Local filter states
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localStatus, setLocalStatus] = useState(statusFilter);

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

  // Sync local inputs when URL filter parameters change
  useEffect(() => {
    setLocalSearch(searchQuery);
    setLocalStatus(statusFilter);
  }, [searchQuery, statusFilter]);

  const [metricsList, setMetricsList] = useState<MetricRow[]>([]);
  const isInitialLoadRef = useRef(true);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });
  const [error, setError] = useState("");

  // Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    num: "",
    label: "",
    sortOrder: 0,
    isActive: true,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch all metrics
  const fetchMetrics = useCallback(async () => {
    try {
      if (isInitialLoadRef.current) {
        setLoading(true);
        isInitialLoadRef.current = false;
      }
      const searchPart = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const statusPart = statusFilter !== "all" ? `&status=${statusFilter}` : "";

      const res = await fetch(
        `/api/metrics?all=true&page=${page}&limit=${limit}${searchPart}${statusPart}`,
      );
      if (!res.ok) {
        throw new Error("Failed to load metrics data.");
      }
      const result = await res.json();
      setMetricsList(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load metrics.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, statusFilter]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useRealtime(["metrics"], () => {
    fetchMetrics();
  });

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", localSearch.trim());
    params.set("status", localStatus);
    params.set("page", "1");
    pushParams(params);
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalStatus("all");

    const params = new URLSearchParams(searchParams.toString());
    params.set("search", "");
    params.set("status", "all");
    params.set("page", "1");
    pushParams(params);
  };

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormError("");
    // Autofill max display order + 10 logic
    const maxVal = metricsList.reduce((max, m) => (m.sortOrder > max ? m.sortOrder : max), 0);
    setFormData({
      num: "",
      label: "",
      sortOrder: maxVal + 10,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (metric: MetricRow) => {
    setEditingId(metric.id);
    setFormError("");
    setFormData({
      num: metric.num,
      label: metric.label,
      sortOrder: metric.sortOrder,
      isActive: metric.isActive,
    });
    setModalOpen(true);
  };

  const handleOpenDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/metrics/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete metric.");
      }
      toast.success("Metric deleted successfully!");
      setDeleteDialogOpen(false);
      fetchMetrics();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete metric.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (metric: MetricRow) => {
    try {
      const res = await fetch(`/api/metrics/${metric.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          num: metric.num,
          label: metric.label,
          sortOrder: metric.sortOrder,
          isActive: !metric.isActive,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to toggle status.");
      }

      toast.success(
        metric.isActive
          ? "Metric deactivated successfully!"
          : "Metric activated successfully!",
      );
      fetchMetrics();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle status.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    if (!formData.num.trim() || !formData.label.trim()) {
      setFormError("Metric figure/value and label description are required.");
      setFormLoading(false);
      return;
    }

    try {
      const url = editingId ? `/api/metrics/${editingId}` : "/api/metrics";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save metric");
      }

      toast.success(
        editingId
          ? "Metric updated successfully!"
          : "Metric created successfully!",
      );
      setModalOpen(false);
      fetchMetrics();
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
      toast.error(err.message || "Failed to save metric.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">
            Manage Our Impact Metrics
          </h1>
          <p className="text-xs text-[#5a5e7a] mt-1">
            Display live stats (e.g. Experience years, Sessions done) on the homepage.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Metric
        </button>
      </div>

      {/* Filter Toolbar (Clear first, then Apply) */}
      <div className="flex flex-col sm:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
        <div className="flex-1 min-w-[200px] space-y-1 w-full">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Search Metrics</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
            <Input
              type="text"
              placeholder="Search by label or metric value..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 h-9 text-xs border-[#e8dcc4] bg-white rounded-xl placeholder:text-gray-400 text-[#1c1f4a]"
            />
          </div>
        </div>

        <div className="w-full sm:w-48 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Display status</Label>
          <Select value={localStatus} onValueChange={setLocalStatus}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Metrics</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
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

      {/* Table Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading metrics...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 border border-[#c4796a]/20 bg-[#faf0ee] rounded-2xl text-center text-[#c4796a]">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : metricsList.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <TrendingUp className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">
            No metrics found
          </h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or status filter to locate impact metrics.
          </p>
        </div>
      ) : (
        <div className="p-1">
          <TablePaginationFooter pagination={pagination} variant="top" />
          <div className="bg-white border border-[#e8dcc4]/60 rounded-3xl overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-[#1c1f4a]/5">
                <TableRow className="border-b border-[#e8dcc4]">
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                    Figure / Value
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                    Label
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                    Order Weight
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                    Status
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricsList.map((metric) => (
                  <TableRow
                    key={metric.id}
                    className={`border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors ${
                      !metric.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <TableCell className="py-3 px-4 text-sm font-extrabold text-[#b86a16]">
                      {metric.num}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs font-bold text-[#1c1f4a]">
                      {metric.label}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs font-semibold text-[#1c1f4a] font-mono">
                      {metric.sortOrder}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs">
                      <button
                        onClick={() => handleToggleActive(metric)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                          metric.isActive
                            ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                            : "bg-[#9396ae]/10 text-[#5a5e7a] hover:bg-[#b86a16]/10 hover:text-[#b86a16]"
                        }`}
                      >
                        {metric.isActive ? "Active" : "Activate"}
                      </button>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleOpenEdit(metric)}
                          className="p-1.5 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(metric.id)}
                          className="p-1.5 hover:bg-[#c4796a]/10 text-[#c4796a] border border-transparent hover:border-[#c4796a]/30 rounded-xl transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Add / Edit dialog modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[420px] border border-[#e8dcc4] bg-white rounded-2xl overflow-hidden p-0 shadow-lg font-sans">
          <DialogHeader className="bg-[#1c1f4a] text-white p-5">
            <DialogTitle className="text-white text-sm font-bold">
              {editingId ? "Edit Impact Metric" : "Add Impact Metric"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {formError && (
              <div className="p-3 bg-[#faf0ee] border border-[#c4796a]/20 text-[#c4796a] text-xs font-semibold rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Figure / Value (e.g. 10+, 500+)
              </Label>
              <Input
                value={formData.num}
                onChange={(e) => setFormData({ ...formData, num: e.target.value })}
                placeholder="e.g. 15+, 100%"
                className="bg-[#faf7f2]/40 border border-[#e8dcc4] h-10 rounded-xl text-xs"
                disabled={formLoading}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Label Description
              </Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g. Years of clinical experience"
                className="bg-[#faf7f2]/40 border border-[#e8dcc4] h-10 rounded-xl text-xs"
                disabled={formLoading}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                  Order Weight
                </Label>
                <Input
                  type="text"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  placeholder="Sort order number..."
                  className="bg-[#faf7f2]/40 border border-[#e8dcc4] h-10 rounded-xl text-xs font-mono"
                  disabled={formLoading}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                  Display status
                </Label>
                <Select
                  value={formData.isActive ? "true" : "false"}
                  onValueChange={(val) => setFormData({ ...formData, isActive: val === "true" })}
                  disabled={formLoading}
                >
                  <SelectTrigger className="bg-[#faf7f2]/40 border border-[#e8dcc4] h-10 rounded-xl text-xs text-[#1c1f4a]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active / Showcased</SelectItem>
                    <SelectItem value="false">Inactive / Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-[#e8dcc4]/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
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
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Metric"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Alert dialogue */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-[#e8dcc4] bg-white font-sans max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1c1f4a] font-bold">
              Delete Impact Metric
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
              Are you sure you want to permanently delete this impact metric from the database? This action is irreversible.
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

export default function MetricsCrudPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
      </div>
    }>
      <MetricsCrudPageContent />
    </Suspense>
  );
}
