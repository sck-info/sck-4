"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  Images,
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

type SlideRow = {
  id: string;
  imageUrl: string;
  tag: string;
  alt: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

function AboutSlidesPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
  }, [pathname, router, searchParams, pushParams]);

  const [slides, setSlides] = useState<SlideRow[]>([]);
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
    tag: "",
    alt: "",
    sortOrder: 0,
    isActive: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Fetch all slides
  const fetchSlides = useCallback(async () => {
    try {
      if (isInitialLoadRef.current) {
        setLoading(true);
        isInitialLoadRef.current = false;
      }
      const res = await fetch(
        `/api/about-slides?all=true&page=${page}&limit=${limit}`,
      );
      if (!res.ok) {
        throw new Error("Failed to load slides.");
      }
      const result = await res.json();
      setSlides(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load slideshow slides.");
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchSlides();
  }, [fetchSlides]);

  // Realtime hook to automatically update on db mutations
  useRealtime(["about_slides"], () => {
    console.log(
      "[Realtime Trigger] About slides updated in DB, refetching list...",
    );
    fetchSlides();
  });

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      tag: "",
      alt: "",
      sortOrder: slides.length * 10,
      isActive: true,
    });
    setSelectedFile(null);
    setFormError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (slide: SlideRow) => {
    setEditingId(slide.id);
    setFormData({
      tag: slide.tag,
      alt: slide.alt,
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
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
      const res = await fetch(`/api/about-slides/${deletingId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete slide");
      }
      setSlides((prev) => prev.filter((s) => s.id !== deletingId));
      toast.success("Slide deleted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete slide.");
    } finally {
      setDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (slide: SlideRow) => {
    try {
      const bodyData = new FormData();
      bodyData.append("tag", slide.tag);
      bodyData.append("alt", slide.alt);
      bodyData.append("sortOrder", slide.sortOrder.toString());
      bodyData.append("isActive", (!slide.isActive).toString());

      const res = await fetch(`/api/about-slides/${slide.id}`, {
        method: "PUT",
        body: bodyData,
      });

      if (!res.ok) {
        throw new Error("Failed to toggle status");
      }
      toast.success(
        slide.isActive
          ? "Slide deactivated successfully!"
          : "Slide activated successfully!",
      );
      fetchSlides();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle status.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    if (!formData.tag.trim()) {
      setFormError("Tag is required (e.g. LIFE SKILLS FACILITATOR).");
      setFormLoading(false);
      return;
    }

    if (!editingId && !selectedFile) {
      setFormError("An image file is required to create a slide.");
      setFormLoading(false);
      return;
    }

    try {
      const url = editingId
        ? `/api/about-slides/${editingId}`
        : "/api/about-slides";
      const method = editingId ? "PUT" : "POST";

      const bodyData = new FormData();
      bodyData.append("tag", formData.tag);
      bodyData.append("alt", formData.alt);
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
        throw new Error(data.error || "Failed to save slide");
      }

      toast.success(
        editingId
          ? "Slide updated successfully!"
          : "Slide created successfully!",
      );
      setModalOpen(false);
      fetchSlides();
    } catch (err: any) {
      setFormError(err.message || "An error occurred.");
      toast.error(err.message || "Failed to save slide.");
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
            Manage About Slideshow
          </h1>
          <p className="text-xs text-[#5a5e7a] mt-1">
            Configure images, tags, and display ordering in the About section
            slideshow.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs shadow-sm transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Slide
        </button>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading slides...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 border border-[#c4796a]/20 bg-[#faf0ee] rounded-2xl text-center text-[#c4796a]">
          <AlertCircle className="w-8 h-8 mx-auto mb-3" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      ) : slides.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <Images className="w-12 h-12 text-[#9396ae] mx-auto mb-4" />
          <h3 className="text-md font-bold text-[#1c1f4a] font-display">
            No slides created
          </h3>
          <p className="text-xs text-[#5a5e7a] mt-1 max-w-sm mx-auto">
            You don't have any slideshow images configured. The landing page
            will fall back to displaying the default main photo.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-6 inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full bg-[#b86a16] hover:bg-[#b86a16]/90 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
          >
            Upload First Slide
          </button>
        </div>
      ) : (
        <div className="p-1">
          <TablePaginationFooter pagination={pagination} variant="top" />
          <Table>
            <TableHeader className="bg-[#1c1f4a]/5">
              <TableRow className="border-b border-[#e8dcc4]">
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] w-24">
                  Image
                </TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] w-32">
                  Status
                </TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] w-32">
                  Sort Order
                </TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a]">
                  Slide Tag
                </TableHead>
                <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-right w-32">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {slides.map((slide) => (
                <TableRow
                  key={slide.id}
                  className={`border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors ${
                    slide.isActive ? "bg-[#eaf2eb]/30" : ""
                  }`}
                >
                  <TableCell className="py-3 px-4">
                    <div className="w-10 h-12 relative rounded-lg border border-[#e8dcc4] overflow-hidden bg-gray-100 shrink-0">
                      <Image
                        src={slide.imageUrl}
                        alt={slide.alt || slide.tag}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(slide)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition-all cursor-pointer ${
                        slide.isActive
                          ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                          : "bg-[#9396ae]/10 text-[#5a5e7a] hover:bg-[#b86a16]/10 hover:text-[#b86a16]"
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {slide.isActive ? "Active" : "Set Active"}
                    </button>
                  </TableCell>
                  <TableCell className="py-3 px-4 font-mono text-[#5a5e7a] text-xs">
                    {slide.sortOrder}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-[#1c1f4a] font-bold text-xs uppercase tracking-wider">
                    {slide.tag}
                  </TableCell>
                  <TableCell className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(slide)}
                        className="p-2 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleTriggerDelete(slide.id)}
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

      {/* Create/Edit dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-5 rounded-t-3xl flex flex-row items-center gap-2">
            <DialogTitle className="text-white text-md font-bold">
              {editingId ? "Edit Slide Details" : "Create Slide Details"}
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
                <Label
                  htmlFor="tag"
                  className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide"
                >
                  Slide Tag / Caption
                </Label>
                <Input
                  id="tag"
                  type="text"
                  placeholder="e.g. MUSIC THERAPIST"
                  value={formData.tag}
                  onChange={(e) =>
                    setFormData({ ...formData, tag: e.target.value })
                  }
                  disabled={formLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="sortOrder"
                  className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide"
                >
                  Display Order Weight
                </Label>
                <Input
                  id="sortOrder"
                  type="number"
                  placeholder="e.g. 10"
                  value={formData.sortOrder}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={formLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="alt"
                className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide"
              >
                Image Alt Description (Optional)
              </Label>
              <Input
                id="alt"
                type="text"
                placeholder="e.g. Sharath Kancherla playing sitar"
                value={formData.alt}
                onChange={(e) =>
                  setFormData({ ...formData, alt: e.target.value })
                }
                disabled={formLoading}
                className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                Slide Image Asset
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
                  {selectedFile
                    ? selectedFile.name
                    : editingId
                      ? "Click to replace existing image (optional)"
                      : "Click to select local JPEG, PNG, or WEBP"}
                </span>
                <span className="text-[9px] text-[#5a5e7a] mt-0.5">
                  Max Size: 5MB. Target size will compress to &lt; 150KB
                  automatically.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-[#e8dcc4]/60 pt-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                disabled={formLoading}
                className="w-4 h-4 text-[#b86a16] border-[#e8dcc4] rounded accent-[#b86a16] focus:ring-[#b86a16] cursor-pointer"
              />
              <Label
                htmlFor="isActive"
                className="text-xs font-semibold text-[#1c1f4a] cursor-pointer selection:bg-transparent"
              >
                Activate this slide in the rotation slideshow
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
              Delete Slide
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-gray-600 mt-1">
              Are you sure you want to delete this slideshow slide? This will
              delete the image from Cloudinary.
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

export default function AboutSlidesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">
            Loading about slides dashboard...
          </p>
        </div>
      }
    >
      <AboutSlidesPageContent />
    </Suspense>
  );
}
