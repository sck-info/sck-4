"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  Camera,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Loader2,
  AlertCircle,
  Upload,
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
import Image from "next/image";

type GalleryItemRow = {
  id: string;
  imageUrl: string;
  caption: string;
  showInScroll: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

function GalleryCrudPageContent() {
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

  const [items, setItems] = useState<GalleryItemRow[]>([]);
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
    caption: "",
    showInScroll: true,
    sortOrder: 0,
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch all gallery items
  const fetchItems = useCallback(async () => {
    try {
      if (isInitialLoadRef.current) {
        setLoading(true);
        isInitialLoadRef.current = false;
      }
      const searchPart = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const statusPart = statusFilter !== "all" ? `&status=${statusFilter}` : "";

      const res = await fetch(
        `/api/gallery?all=true&page=${page}&limit=${limit}${searchPart}${statusPart}`,
      );
      if (!res.ok) {
        throw new Error("Failed to load gallery items.");
      }
      const result = await res.json();
      setItems(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load gallery items.");
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchQuery, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useRealtime(["gallery"], () => {
    fetchItems();
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
    setSelectedFile(null);
    // Autofill max display order + 10 logic
    const maxVal = items.reduce((max, i) => (i.sortOrder > max ? i.sortOrder : max), 0);
    setFormData({
      caption: "",
      showInScroll: true,
      sortOrder: maxVal + 10,
      isActive: true,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (item: GalleryItemRow) => {
    setEditingId(item.id);
    setFormError("");
    setSelectedFile(null);
    setFormData({
      caption: item.caption,
      showInScroll: item.showInScroll,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
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
      const res = await fetch(`/api/gallery/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete item.");
      }
      toast.success("Gallery item deleted successfully!");
      setDeleteDialogOpen(false);
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (item: GalleryItemRow) => {
    try {
      const bodyData = new FormData();
      bodyData.append("caption", item.caption);
      bodyData.append("showInScroll", item.showInScroll.toString());
      bodyData.append("sortOrder", item.sortOrder.toString());
      bodyData.append("isActive", (!item.isActive).toString());

      const res = await fetch(`/api/gallery/${item.id}`, {
        method: "PUT",
        body: bodyData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update item display settings.");
      }

      toast.success(
        item.isActive
          ? "Gallery item hidden successfully!"
          : "Gallery item showcased successfully!",
      );
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Failed to update display settings.");
    }
  };

  const handleToggleScroll = async (item: GalleryItemRow) => {
    try {
      const bodyData = new FormData();
      bodyData.append("caption", item.caption);
      bodyData.append("showInScroll", (!item.showInScroll).toString());
      bodyData.append("sortOrder", item.sortOrder.toString());
      bodyData.append("isActive", item.isActive.toString());

      const res = await fetch(`/api/gallery/${item.id}`, {
        method: "PUT",
        body: bodyData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update marquee track settings.");
      }

      toast.success(
        item.showInScroll
          ? "Item removed from marquee track."
          : "Item streaming in marquee track!",
      );
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Failed to update display settings.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    if (!editingId && !selectedFile) {
      setFormError("An image file is required to create a gallery item.");
      setFormLoading(false);
      return;
    }

    try {
      const url = editingId ? `/api/gallery/${editingId}` : "/api/gallery";
      const method = editingId ? "PUT" : "POST";

      const bodyData = new FormData();
      bodyData.append("caption", formData.caption);
      bodyData.append("showInScroll", formData.showInScroll.toString());
      bodyData.append("sortOrder", formData.sortOrder.toString());
      bodyData.append("isActive", formData.isActive.toString());
      if (selectedFile) {
        bodyData.append("file", selectedFile);
      }

      const res = await fetch(url, {
        method,
        body: bodyData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save item");
      }

      toast.success(
        editingId
          ? "Gallery item updated successfully!"
          : "Gallery item created successfully!",
      );
      setModalOpen(false);
      fetchItems();
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
      toast.error(err.message || "Failed to save item.");
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
            Manage Gallery Items
          </h1>
          <p className="text-xs text-[#5a5e7a] mt-1">
            Publish pictures to the masonry gallery page, or select specific highlights to stream in the marquee track.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Gallery Item
        </button>
      </div>

      {/* Filter Toolbar (Clear first, then Apply) */}
      <div className="flex flex-col sm:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
        <div className="flex-1 min-w-[200px] space-y-1 w-full">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Search Gallery</Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
            <Input
              type="text"
              placeholder="Search by caption text description..."
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
              <SelectItem value="all">All Items</SelectItem>
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

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading gallery items...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 border border-[#c4796a]/20 bg-[#faf0ee] rounded-2xl text-center text-[#c4796a]">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <Camera className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">
            No gallery items found
          </h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or status filter to locate gallery items.
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
                    Preview
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                    Caption
                  </TableHead>
                  <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">
                    Show in Marquee track
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
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className={`border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors ${
                      !item.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <TableCell className="py-3 px-4">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#e8dcc4]/60">
                        <Image
                          src={item.imageUrl}
                          alt={item.caption || "Gallery item"}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs font-semibold text-[#1c1f4a] max-w-[200px] truncate">
                      {item.caption || <span className="text-gray-400 italic">No caption provided</span>}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs font-semibold text-[#1c1f4a]">
                      <button
                        onClick={() => handleToggleScroll(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                          item.showInScroll
                            ? "bg-[#b86a16]/10 text-[#b86a16]"
                            : "bg-[#9396ae]/10 text-[#5a5e7a] hover:bg-[#b86a16]/10 hover:text-[#b86a16]"
                        }`}
                      >
                        {item.showInScroll ? "Streaming" : "Toggle track"}
                      </button>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs font-semibold text-[#1c1f4a] font-mono">
                      {item.sortOrder}
                    </TableCell>
                    <TableCell className="py-3 px-4 text-xs">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                          item.isActive
                            ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                            : "bg-[#9396ae]/10 text-[#5a5e7a] hover:bg-[#b86a16]/10 hover:text-[#b86a16]"
                        }`}
                      >
                        {item.isActive ? "Active" : "Activate"}
                      </button>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-right">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(item.id)}
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

      {/* Add / Edit Slide dialog modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[480px] border border-[#e8dcc4] bg-white rounded-2xl overflow-hidden p-0 shadow-lg font-sans">
          <DialogHeader className="bg-[#1c1f4a] text-white p-5">
            <DialogTitle className="text-white text-sm font-bold">
              {editingId ? "Edit Gallery Item" : "Add Gallery Item"}
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
                Caption Label
              </Label>
              <Input
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="Brief caption details..."
                className="bg-[#faf7f2]/40 border border-[#e8dcc4] h-10 rounded-xl text-xs"
                disabled={formLoading}
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

            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                Marquee scrolling list options
              </Label>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="showInScroll"
                  checked={formData.showInScroll}
                  onChange={(e) => setFormData({ ...formData, showInScroll: e.target.checked })}
                  disabled={formLoading}
                  className="rounded border-[#e8dcc4] text-[#b86a16] focus:ring-[#b86a16] cursor-pointer"
                />
                <label htmlFor="showInScroll" className="text-xs font-medium text-[#1c1f4a] cursor-pointer">
                  Stream this image inside marquee marquee track
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                Gallery Image File
              </Label>
              <div className="relative border-2 border-dashed border-[#e8dcc4] bg-[#faf7f2]/20 hover:bg-[#faf7f2]/50 transition-all rounded-xl p-4 text-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                  disabled={formLoading}
                />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-xs font-semibold text-[#1c1f4a] block">
                  {selectedFile ? selectedFile.name : "Click to choose gallery image file"}
                </span>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  PNG, JPG, or WEBP up to 5MB.
                </span>
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
                {formLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete slide Alert dialogue */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-[#e8dcc4] bg-white font-sans max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1c1f4a] font-bold">
              Delete Gallery Item
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
              Are you sure you want to permanently delete this gallery image from the database? This action is irreversible.
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

export default function GalleryCrudPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
      </div>
    }>
      <GalleryCrudPageContent />
    </Suspense>
  );
}
