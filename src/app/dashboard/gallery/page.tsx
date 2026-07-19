"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import {
  Camera,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Loader2,
  AlertCircle,
  Upload,
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

export default function GalleryCrudPage() {
  const [items, setItems] = useState<GalleryItemRow[]>([]);
  const [loading, setLoading] = useState(true);
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
      const res = await fetch("/api/gallery?all=true");
      if (!res.ok) {
        throw new Error("Failed to load gallery items.");
      }
      const data = await res.json();
      setItems(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load gallery items.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Realtime hook to automatically update on db mutations
  useRealtime(["gallery"], () => {
    console.log("[Realtime Trigger] Gallery updated in DB, refetching list...");
    fetchItems();
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      caption: "",
      showInScroll: true,
      sortOrder: items.length * 10,
      isActive: true,
    });
    setSelectedFile(null);
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (item: GalleryItemRow) => {
    setEditingId(item.id);
    setFormData({
      caption: item.caption,
      showInScroll: item.showInScroll,
      sortOrder: item.sortOrder,
      isActive: item.isActive,
    });
    setSelectedFile(null);
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
      const res = await fetch(`/api/gallery/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete gallery item");
      }
      setItems((prev) => prev.filter((i) => i.id !== deletingId));
      toast.success("Gallery item deleted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete item.");
    } finally {
      setDeleteDialogOpen(false);
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
        throw new Error("Failed to toggle status");
      }
      toast.success(
        item.isActive
          ? "Gallery item deactivated successfully!"
          : "Gallery item activated successfully!"
      );
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle status.");
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
        throw new Error("Failed to update display settings");
      }
      toast.success(
        item.showInScroll
          ? "Removed item from marquee scroller!"
          : "Added item to marquee scroller!"
      );
      fetchItems();
    } catch (err: any) {
      toast.error(err.message || "Failed to update display settings.");
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
          : "Gallery item created successfully!"
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

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading gallery items...</p>
        </div>
      ) : error ? (
        <div className="p-6 border border-[#c4796a]/20 bg-[#faf0ee] rounded-2xl text-center text-[#c4796a]">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <Camera className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">No gallery items</h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            You don't have any images in your gallery list. Upload items to share transformation moments.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-6 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full bg-[#b86a16] hover:bg-[#b86a16]/90 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            Add First Item
          </button>
        </div>
      ) : (
        <div className="p-1">
          <Table>
            <TableHeader className="bg-[#1c1f4a]/5">
              <TableRow className="border-b border-[#e8dcc4]">
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] w-24">Thumbnail</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] w-28">Status</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] w-36">Show In Scroll</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] w-24">Sort Order</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">Caption / Description</TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-right w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow
                  key={item.id}
                  className={`border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors ${
                    item.isActive ? "bg-[#eaf2eb]/30" : ""
                  }`}
                >
                  <TableCell className="py-3 px-4">
                    <div className="w-10 h-10 relative rounded-lg border border-[#e8dcc4] overflow-hidden bg-gray-100 shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.caption || "Gallery item"}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(item)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all ${
                        item.isActive
                          ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                          : "bg-[#9396ae]/10 text-[#5a5e7a] hover:bg-[#b86a16]/10 hover:text-[#b86a16] cursor-pointer"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {item.isActive ? "Active" : "Set Active"}
                    </button>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <button
                      onClick={() => handleToggleScroll(item)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all ${
                        item.showInScroll
                          ? "bg-[#b86a16]/15 text-[#b86a16]"
                          : "bg-[#9396ae]/10 text-[#5a5e7a] hover:bg-[#b86a16]/10 hover:text-[#b86a16] cursor-pointer"
                      }`}
                    >
                      {item.showInScroll ? "Yes" : "No"}
                    </button>
                  </TableCell>
                  <TableCell className="py-3 px-4 font-mono text-[#5a5e7a] text-xs">
                    {item.sortOrder}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-[#5a5e7a] text-xs font-semibold">
                    {item.caption || <span className="text-[#9396ae] italic">No description</span>}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-2 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTriggerDelete(item.id)}
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

      {/* Create/Edit form dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-5 rounded-t-3xl flex flex-row items-center gap-2">
            <DialogTitle className="text-white text-md font-bold">
              {editingId ? "Edit Gallery details" : "Add Gallery Item"}
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
                <Label htmlFor="caption" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                  Caption / Alt description
                </Label>
                <Input
                  id="caption"
                  type="text"
                  placeholder="e.g. Satsang Meditation Hyderabad"
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  disabled={formLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sortOrder" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">
                  Display Order Weight
                </Label>
                <Input
                  id="sortOrder"
                  type="number"
                  placeholder="e.g. 10"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  disabled={formLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                Gallery Image
              </Label>
              <div className="relative border border-dashed border-[#e8dcc4] hover:border-[#b86a16]/60 bg-[#faf7f2]/40 rounded-2xl p-4 flex flex-col items-center justify-center transition-all min-h-[90px] cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={formLoading}
                  onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      setSelectedFile(files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <Upload className="w-5 h-5 text-[#9396ae] mb-1.5" />
                <span className="text-[11px] font-bold text-[#1c1f4a] text-center max-w-[280px] truncate block">
                  {selectedFile ? selectedFile.name : editingId ? "Click to replace existing image (optional)" : "Click to select local JPEG, PNG, or WEBP"}
                </span>
                <span className="text-[9px] text-[#5a5e7a] mt-0.5">
                  Max Size: 5MB. Target size will compress to &lt; 150KB automatically.
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-[#e8dcc4]/60">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showInScroll"
                  checked={formData.showInScroll}
                  onChange={(e) => setFormData({ ...formData, showInScroll: e.target.checked })}
                  disabled={formLoading}
                  className="w-4 h-4 text-[#b86a16] border-[#e8dcc4] rounded accent-[#b86a16] focus:ring-[#b86a16] cursor-pointer"
                />
                <Label htmlFor="showInScroll" className="text-xs font-semibold text-[#1c1f4a] cursor-pointer selection:bg-transparent">
                  Show this image in the homepage scroller track
                </Label>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={formLoading}
                  className="w-4 h-4 text-[#b86a16] border-[#e8dcc4] rounded accent-[#b86a16] focus:ring-[#b86a16] cursor-pointer"
                />
                <Label htmlFor="isActive" className="text-xs font-semibold text-[#1c1f4a] cursor-pointer selection:bg-transparent">
                  Make this gallery image active on the website
                </Label>
              </div>
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
                    Uploading...
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
              Delete Gallery Item
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-gray-600 mt-1">
              Are you sure you want to delete this gallery item? This will delete the image from Cloudinary permanently.
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
