"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import {
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Loader2,
  AlertCircle,
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

export default function MetricsCrudPage() {
  const [metricsList, setMetricsList] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);
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
      const res = await fetch("/api/metrics?all=true");
      if (!res.ok) {
        throw new Error("Failed to load metrics data.");
      }
      const data = await res.json();
      setMetricsList(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load metrics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Realtime hook to automatically update on db mutations
  useRealtime(["metrics"], () => {
    console.log("[Realtime Trigger] Metrics updated in DB, refetching list...");
    fetchMetrics();
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      num: "",
      label: "",
      sortOrder: metricsList.length * 10,
      isActive: true,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (metric: MetricRow) => {
    setEditingId(metric.id);
    setFormData({
      num: metric.num,
      label: metric.label,
      sortOrder: metric.sortOrder,
      isActive: metric.isActive,
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleTriggerDelete = (id: string) => {
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
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete metric");
      }
      setMetricsList((prev) => prev.filter((m) => m.id !== deletingId));
      toast.success("Metric deleted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete metric.");
    } finally {
      setDeleteDialogOpen(false);
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
        throw new Error("Failed to toggle status");
      }
      toast.success(
        metric.isActive
          ? "Metric deactivated successfully!"
          : "Metric activated successfully!"
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
          : "Metric created successfully!"
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

      {/* Main content pane */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading metrics...</p>
        </div>
      ) : error ? (
        <div className="p-6 border border-[#c4796a]/20 bg-[#faf0ee] rounded-2xl text-center text-[#c4796a]">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : metricsList.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <TrendingUp className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">No metrics saved</h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            You don't have any impact metrics created yet. Add a metric to display it on the website.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-6 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full bg-[#b86a16] hover:bg-[#b86a16]/90 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            Create First Metric
          </button>
        </div>
      ) : (
        <div className="p-1">
          <Table>
            <TableHeader className="bg-[#1c1f4a]/5">
              <TableRow className="border-b border-[#e8dcc4]">
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] w-32">Status</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] w-32">Sort Order</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] w-48">Metric Value</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">Label Description</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-right w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metricsList.map((metric) => (
                <TableRow
                  key={metric.id}
                  className={`border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors ${
                    metric.isActive ? "bg-[#eaf2eb]/30" : ""
                  }`}
                >
                  <TableCell className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(metric)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all ${
                        metric.isActive
                          ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                          : "bg-[#9396ae]/10 text-[#5a5e7a] hover:bg-[#b86a16]/10 hover:text-[#b86a16] cursor-pointer"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {metric.isActive ? "Active" : "Set Active"}
                    </button>
                  </TableCell>
                  <TableCell className="py-3 px-4 font-mono text-[#5a5e7a] text-xs">
                    {metric.sortOrder}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-[#1c1f4a] font-bold text-sm">
                    {metric.num}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-[#5a5e7a] text-xs font-medium">
                    {metric.label}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(metric)}
                        className="p-2 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTriggerDelete(metric.id)}
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
        </div>
      )}

      {/* CRUD Form Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-5 rounded-t-3xl flex flex-row items-center gap-2">
            <DialogTitle className="text-white text-md font-bold">
              {editingId ? "Edit Metric Details" : "Create Metric Details"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {formError && (
              <div className="p-3 bg-[#faf0ee] border border-[#c4796a]/20 text-[#c4796a] text-xs font-semibold rounded-xl">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="num" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                  Metric Figure / Value
                </Label>
                <Input
                  id="num"
                  type="text"
                  placeholder="13+ or 1.5L+"
                  value={formData.num}
                  onChange={(e) => setFormData({ ...formData, num: e.target.value })}
                  disabled={formLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs font-semibold text-[#1c1f4a]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                  Display Order Weight
                </Label>
                <Input
                  id="sortOrder"
                  type="number"
                  placeholder="0, 10, 20"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  disabled={formLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                Label Description
              </Label>
              <Input
                id="label"
                type="text"
                placeholder="Years Experience"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                disabled={formLoading}
                className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-3 border-t border-[#e8dcc4]/60 pt-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={formLoading}
                className="w-4 h-4 text-[#b86a16] border-[#e8dcc4] rounded accent-[#b86a16] focus:ring-[#b86a16] cursor-pointer"
              />
              <Label htmlFor="isActive" className="text-xs font-semibold text-[#1c1f4a] cursor-pointer selection:bg-transparent">
                Activate this metric on the website
              </Label>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#e8dcc4]/60 pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={formLoading}
                onClick={() => setModalOpen(false)}
                className="h-10 px-5 rounded-full border border-[#e8dcc4] text-[#5a5e7a]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                className="h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs"
              >
                {formLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Details"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="w-[280px] max-w-[90vw] bg-white rounded-3xl border-0 shadow-xl p-6">
          <AlertDialogHeader className="text-center flex flex-col items-center">
            <AlertDialogTitle className="text-center text-base font-semibold text-gray-900">
              Delete Metric
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-gray-600 mt-1">
              Are you sure you want to delete this impact metric? This action cannot be undone.
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
