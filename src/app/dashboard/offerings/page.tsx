"use client";

import React, { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  Tag,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  FolderOpen,
  ArrowUpDown,
  BookOpen,
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

type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  sanskritText: string | null;
  sanskritMeaning: string | null;
  sortOrder: number;
  isActive: boolean;
};

type SubCategoryRow = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  topTags: string[];
  tags: string[];
  requiresBooking: boolean;
  paymentQrId: string | null;
  sortOrder: number;
  isActive: boolean;
};

type QRRow = {
  id: string;
  name: string;
};

function OfferingsDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL pagination + tab + filter params
  const activeTabName = searchParams.get("tab") || "";
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

  // Data states
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryRow[]>([]);
  const [qrs, setQrs] = useState<QRRow[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(true);

  const [subPagination, setSubPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  // Modal control states
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryRow | null>(null);
  const [catFormData, setCatFormData] = useState({
    name: "",
    description: "",
    sanskritText: "",
    sanskritMeaning: "",
    sortOrder: 10,
    isActive: true,
  });
  const [catFormLoading, setCatFormLoading] = useState(false);

  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubCategoryRow | null>(null);
  const [subFormData, setSubFormData] = useState({
    name: "",
    description: "",
    topTagsRaw: "",
    tagsRaw: "",
    requiresBooking: true,
    paymentQrId: "none",
    sortOrder: 10,
    isActive: true,
  });
  const [subFormLoading, setSubFormLoading] = useState(false);

  // Deletion States
  const [deleteCatId, setDeleteCatId] = useState<string | null>(null);
  const [deleteSubId, setDeleteSubId] = useState<string | null>(null);

  // Find active category
  const activeCategory = categories.find((c) => c.name === activeTabName) || categories[0];

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories?page=1&limit=100");
      if (!res.ok) throw new Error("Failed to load categories");
      const json = await res.json();
      setCategories(json.data);

    } catch (err) {
      console.error(err);
      toast.error("Error loading offering categories");
    } finally {
      setLoadingCats(false);
    }
  }, []);

  // Fetch Sub-Categories belonging to the active Category
  const fetchSubCategories = useCallback(async () => {
    if (!activeCategory) return;
    setLoadingSubs(true);
    try {
      const searchPart = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
      const statusPart = statusFilter !== "all" ? `&status=${statusFilter}` : "";

      const res = await fetch(`/api/sub-categories?categoryId=${activeCategory.id}&page=${page}&limit=${limit}${searchPart}${statusPart}`);
      if (!res.ok) throw new Error("Failed to load sub-categories");
      const json = await res.json();
      setSubCategories(json.data);
      setSubPagination(json.pagination);
    } catch (err) {
      console.error(err);
      toast.error("Error loading sub-category offerings");
    } finally {
      setLoadingSubs(false);
    }
  }, [activeCategory, page, limit, searchQuery, statusFilter]);

  // Fetch QRs list for mapping
  const fetchQRs = async () => {
    try {
      const res = await fetch("/api/qrs?page=1&limit=100");
      if (res.ok) {
        const json = await res.json();
        setQrs(json.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchQRs();
  }, [fetchCategories]);

  useEffect(() => {
    fetchSubCategories();
  }, [fetchSubCategories]);

  // Sync local inputs when URL filter parameters change
  useEffect(() => {
    setLocalSearch(searchQuery);
    setLocalStatus(statusFilter);
  }, [searchQuery, statusFilter]);

  // Real-time Sync
  useRealtime(["offering_categories"], fetchCategories);
  useRealtime(["offering_sub_categories"], fetchSubCategories);

  // Tab change handler
  const handleTabChange = (catName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", catName);
    params.set("page", "1");
    // Preserve filters on tab switch if desired, or reset page
    pushParams(params);
  };

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

  // Category Actions
  const handleOpenAddCat = () => {
    setEditingCat(null);
    // Autofill order logic
    const maxVal = categories.reduce((max, c) => (c.sortOrder > max ? c.sortOrder : max), 0);
    setCatFormData({
      name: "",
      description: "",
      sanskritText: "",
      sanskritMeaning: "",
      sortOrder: maxVal + 10,
      isActive: true,
    });
    setCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: CategoryRow) => {
    setEditingCat(cat);
    setCatFormData({
      name: cat.name,
      description: cat.description || "",
      sanskritText: cat.sanskritText || "",
      sanskritMeaning: cat.sanskritMeaning || "",
      sortOrder: cat.sortOrder,
      isActive: cat.isActive,
    });
    setCatModalOpen(true);
  };

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormData.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setCatFormLoading(true);
    const method = editingCat ? "PUT" : "POST";
    const url = editingCat ? `/api/categories/${editingCat.id}` : "/api/categories";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catFormData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save category");

      toast.success(editingCat ? "Category updated successfully" : "Category created successfully");
      setCatModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to commit category changes");
    } finally {
      setCatFormLoading(false);
    }
  };

  const handleConfirmDeleteCat = async () => {
    if (!deleteCatId) return;
    try {
      const res = await fetch(`/api/categories/${deleteCatId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete category");

      toast.success("Category dropped from index");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete category");
    } finally {
      setDeleteCatId(null);
    }
  };

  // Sub-Category Actions
  const handleOpenAddSub = () => {
    if (!activeCategory) {
      toast.error("Create a category folder first!");
      return;
    }
    setEditingSub(null);
    // Autofill subcategory max sort order + 10 logic
    const maxVal = subCategories.reduce((max, s) => (s.sortOrder > max ? s.sortOrder : max), 0);
    setSubFormData({
      name: "",
      description: "",
      topTagsRaw: "",
      tagsRaw: "",
      requiresBooking: true,
      paymentQrId: "none",
      sortOrder: maxVal + 10,
      isActive: true,
    });
    setSubModalOpen(true);
  };

  const handleOpenEditSub = (sub: SubCategoryRow) => {
    setEditingSub(sub);
    setSubFormData({
      name: sub.name,
      description: sub.description || "",
      topTagsRaw: Array.isArray(sub.topTags) ? sub.topTags.join(", ") : "",
      tagsRaw: Array.isArray(sub.tags) ? sub.tags.join(", ") : "",
      requiresBooking: sub.requiresBooking,
      paymentQrId: sub.paymentQrId || "none",
      sortOrder: sub.sortOrder,
      isActive: sub.isActive,
    });
    setSubModalOpen(true);
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subFormData.name.trim()) {
      toast.error("Offering name is required");
      return;
    }
    setSubFormLoading(true);
    const method = editingSub ? "PUT" : "POST";
    const url = editingSub ? `/api/sub-categories/${editingSub.id}` : "/api/sub-categories";

    const payload = {
      categoryId: activeCategory.id,
      name: subFormData.name,
      description: subFormData.description,
      topTags: subFormData.topTagsRaw.split(",").map((t) => t.trim()).filter(Boolean),
      tags: subFormData.tagsRaw.split(",").map((t) => t.trim()).filter(Boolean),
      requiresBooking: subFormData.requiresBooking,
      paymentQrId: subFormData.paymentQrId === "none" ? null : subFormData.paymentQrId,
      sortOrder: subFormData.sortOrder,
      isActive: subFormData.isActive,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save offering");

      toast.success(editingSub ? "Offering updated successfully" : "Offering created successfully");
      setSubModalOpen(false);
      fetchSubCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to save offering details");
    } finally {
      setSubFormLoading(false);
    }
  };

  const handleConfirmDeleteSub = async () => {
    if (!deleteSubId) return;
    try {
      const res = await fetch(`/api/sub-categories/${deleteSubId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete sub-category");
      toast.success("Offering removed successfully");
      fetchSubCategories();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setDeleteSubId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8dcc4] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">Manage Offerings</h1>
          <p className="text-xs text-[#5a5e7a] mt-1">Configure categories, sub-categories, specific slots flags, and payment links.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleOpenAddCat} className="bg-transparent hover:bg-[#b86a16]/10 text-[#b86a16] border border-[#b86a16]/30 rounded-full h-9 px-4 text-xs font-semibold">
            <FolderOpen className="w-3.5 h-3.5 mr-1" /> Add Category
          </Button>
          <Button onClick={handleOpenAddSub} className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full h-9 px-4 text-xs font-semibold">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Offering
          </Button>
        </div>
      </div>

      {loadingCats && categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a]">Loading category tabs...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
          <p className="text-sm text-[#5a5e7a]">No categories announced. Create a Category first using the button above.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* URL Tabbed Navigation (No Stars) */}
          <div className="flex gap-2 border-b border-[#e8dcc4] pb-px overflow-x-auto selection:bg-transparent">
            {categories.map((cat) => {
              const isSel = activeCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleTabChange(cat.name)}
                  className={`py-3 px-5 text-xs font-bold border-b-2 tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                    isSel
                      ? "border-[#b86a16] text-[#b86a16] font-extrabold"
                      : "border-transparent text-[#5a5e7a] hover:text-[#1c1f4a] hover:border-[#e8dcc4]"
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>

          {/* Active Category Header Card */}
          {activeCategory && (
            <div className="bg-[#1c1f4a] text-white p-6 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-white/60">Active Category Details</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                    activeCategory.isActive ? "bg-[#6b8f71]/20 text-[#8fc397]" : "bg-red-500/20 text-red-300"
                  }`}>
                    {activeCategory.isActive ? "Active on Website" : "Hidden"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white font-display">{activeCategory.name}</h3>
                {activeCategory.sanskritText && (
                  <p className="text-[#e8dcc4] italic text-xs font-serif">
                    &ldquo;{activeCategory.sanskritText}&rdquo; &ndash; {activeCategory.sanskritMeaning}
                  </p>
                )}
                {activeCategory.description && (
                  <p className="text-xs text-white/70 max-w-2xl leading-relaxed">{activeCategory.description}</p>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Button onClick={() => handleOpenEditCat(activeCategory)} className="border border-white/20 text-white bg-transparent hover:bg-white/10 hover:text-white rounded-full h-8 px-4 text-xs font-semibold flex items-center justify-center shadow-none">
                  <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit Category
                </Button>
                <Button onClick={() => setDeleteCatId(activeCategory.id)} className="border border-red-500/30 text-red-300 bg-transparent hover:bg-red-500/10 hover:text-red-300 rounded-full h-8 px-4 text-xs font-semibold flex items-center justify-center shadow-none">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Category
                </Button>
              </div>
            </div>
          )}

          {/* Sub-Categories Offerings List Table with Filter Toolbar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pt-2">
              <BookOpen className="w-4 h-4 text-[#b86a16]" />
              <h4 className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wider">Sub-Category Offerings List</h4>
            </div>

            {/* Filter Toolbar (Clear first, then Apply) */}
            <div className="flex flex-col sm:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
              <div className="flex-1 min-w-[200px] space-y-1 w-full">
                <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">Search Offerings</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
                  <Input
                    type="text"
                    placeholder="Search by name or description..."
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
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Hidden Only</SelectItem>
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

            {loadingSubs && subCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-[#b86a16] animate-spin mb-2" />
                <p className="text-[11px] text-[#5a5e7a]">Loading offerings...</p>
              </div>
            ) : subCategories.length === 0 ? (
              <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-8 rounded-2xl text-center">
                <p className="text-xs text-[#5a5e7a]">No offerings found fitting this filter. Click Add Offering to create program configurations.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <TablePaginationFooter pagination={subPagination} variant="top" />
                <div className={`bg-white border border-[#e8dcc4]/60 rounded-3xl overflow-hidden shadow-xs transition-opacity duration-200 ${loadingSubs ? "opacity-50 pointer-events-none" : ""}`}>
                  <Table>
                    <TableHeader className="bg-[#1c1f4a]/5">
                      <TableRow className="border-b border-[#e8dcc4]">
                        <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Offering Name</TableHead>
                        <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Booking Type</TableHead>
                        <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Tags / Highlights</TableHead>
                        <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Sort Order</TableHead>
                        <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs">Status</TableHead>
                        <TableHead className="py-3 px-4 font-bold text-[#1c1f4a] text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subCategories.map((sub) => (
                        <TableRow key={sub.id} className="border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors">
                          <TableCell className="py-3 px-4">
                            <div>
                              <div className="text-xs font-bold text-[#1c1f4a]">{sub.name}</div>
                              {sub.description && <div className="text-[10px] text-[#5a5e7a] truncate max-w-[220px] mt-0.5">{sub.description}</div>}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-xs">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                              sub.requiresBooking ? "bg-[#b86a16]/10 text-[#b86a16]" : "bg-[#9396ae]/15 text-[#1c1f4a]"
                            }`}>
                              {sub.requiresBooking ? "Slot Booking" : "Direct Form"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-xs">
                            <div className="flex flex-wrap gap-1">
                              {Array.isArray(sub.topTags) && sub.topTags.map((tag) => (
                                <span key={tag} className="bg-[#b86a16] text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                                  {tag}
                                </span>
                              ))}
                              {Array.isArray(sub.tags) && sub.tags.map((tag) => (
                                <span key={tag} className="bg-gray-100 text-[#5a5e7a] text-[8px] font-medium px-1.5 py-0.5 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-xs font-mono text-[#5a5e7a]">{sub.sortOrder}</TableCell>
                          <TableCell className="py-3 px-4 text-xs">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              sub.isActive ? "bg-[#6b8f71]/15 text-[#6b8f71]" : "bg-red-100 text-red-600"
                            }`}>
                              {sub.isActive ? "Active" : "Hidden"}
                            </span>
                          </TableCell>
                          <TableCell className="py-3 px-4 text-right">
                            <div className="inline-flex gap-1.5">
                              <button onClick={() => handleOpenEditSub(sub)} className="p-1.5 hover:bg-[#b86a16]/10 text-[#b86a16] rounded-lg border border-transparent hover:border-[#b86a16]/30 transition-all cursor-pointer">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => setDeleteSubId(sub.id)} className="p-1.5 hover:bg-[#c4796a]/10 text-[#c4796a] rounded-lg border border-transparent hover:border-[#c4796a]/30 transition-all cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <TablePaginationFooter pagination={subPagination} variant="bottom" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIALOG: Category Form */}
      <Dialog open={catModalOpen} onOpenChange={setCatModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold">
              {editingCat ? "Edit Category details" : "Add Offering Category"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCatSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Category Name</Label>
              <Input
                value={catFormData.name}
                onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                placeholder="e.g. Alternative Therapies"
                required
                disabled={catFormLoading}
                className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Sanskrit Phrase (Optional)</Label>
                <Input
                  value={catFormData.sanskritText}
                  onChange={(e) => setCatFormData({ ...catFormData, sanskritText: e.target.value })}
                  placeholder="e.g. प्राणस्य प्राणः"
                  disabled={catFormLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Sanskrit Translation</Label>
                <Input
                  value={catFormData.sanskritMeaning}
                  onChange={(e) => setCatFormData({ ...catFormData, sanskritMeaning: e.target.value })}
                  placeholder="e.g. Breath of breath"
                  disabled={catFormLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Description</Label>
              <textarea
                value={catFormData.description}
                onChange={(e: any) => setCatFormData({ ...catFormData, description: e.target.value })}
                placeholder="Brief category summary shown on the public listing website..."
                rows={3}
                disabled={catFormLoading}
                className="w-full p-3 bg-[#faf7f2]/40 border border-[#e8dcc4] rounded-xl text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#b86a16]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Display order weight</Label>
                <Input
                  type="text"
                  value={catFormData.sortOrder === 0 ? "" : catFormData.sortOrder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCatFormData({ ...catFormData, sortOrder: val === "" ? 0 : parseInt(val) || 0 });
                  }}
                  required
                  disabled={catFormLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
                />
              </div>
              <div className="flex items-center gap-2.5 pt-6">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={catFormData.isActive}
                  onChange={(e) => setCatFormData({ ...catFormData, isActive: e.target.checked })}
                  disabled={catFormLoading}
                  className="w-4 h-4 text-[#b86a16] border-[#e8dcc4] rounded accent-[#b86a16]"
                />
                <Label htmlFor="catActive" className="text-xs font-semibold text-[#1c1f4a] cursor-pointer">Active on Website</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#e8dcc4]/60 pt-4">
              <Button type="button" variant="outline" onClick={() => setCatModalOpen(false)} disabled={catFormLoading} className="h-10 px-5 rounded-full border border-[#e8dcc4] text-[#5a5e7a]">
                Cancel
              </Button>
              <Button type="submit" disabled={catFormLoading} className="h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs">
                {catFormLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save Details
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Sub-Category (Offering) Form */}
      <Dialog open={subModalOpen} onOpenChange={setSubModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold">
              {editingSub ? "Edit Offering Details" : "Create New Offering"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Offering Name</Label>
              <Input
                value={subFormData.name}
                onChange={(e) => setSubFormData({ ...subFormData, name: e.target.value })}
                placeholder="e.g. Breathwork Session (Pranayama)"
                required
                disabled={subFormLoading}
                className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Description</Label>
              <textarea
                value={subFormData.description}
                onChange={(e: any) => setSubFormData({ ...subFormData, description: e.target.value })}
                placeholder="Description of the offering..."
                rows={3}
                disabled={subFormLoading}
                className="w-full p-3 bg-[#faf7f2]/40 border border-[#e8dcc4] rounded-xl text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#b86a16]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Top Badges (Comma-separated)</Label>
                <Input
                  value={subFormData.topTagsRaw}
                  onChange={(e) => setSubFormData({ ...subFormData, topTagsRaw: e.target.value })}
                  placeholder="e.g. Popular, New"
                  disabled={subFormLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Highlight Tags (Comma-separated)</Label>
                <Input
                  value={subFormData.tagsRaw}
                  onChange={(e) => setSubFormData({ ...subFormData, tagsRaw: e.target.value })}
                  placeholder="e.g. 60 Mins, Holistic"
                  disabled={subFormLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Linked Payment QR</Label>
                <Select
                  value={subFormData.paymentQrId}
                  onValueChange={(val) => setSubFormData({ ...subFormData, paymentQrId: val })}
                  disabled={subFormLoading}
                >
                  <SelectTrigger className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No QR (Free/Direct Submission)</SelectItem>
                    {qrs.map((qr) => (
                      <SelectItem key={qr.id} value={qr.id}>
                        {qr.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Sort Weight</Label>
                <Input
                  type="text"
                  value={subFormData.sortOrder === 0 ? "" : subFormData.sortOrder}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSubFormData({ ...subFormData, sortOrder: val === "" ? 0 : parseInt(val) || 0 });
                  }}
                  required
                  disabled={subFormLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="requiresBooking"
                  checked={subFormData.requiresBooking}
                  onChange={(e) => setSubFormData({ ...subFormData, requiresBooking: e.target.checked })}
                  disabled={subFormLoading}
                  className="w-4 h-4 text-[#b86a16] border-[#e8dcc4] rounded accent-[#b86a16]"
                />
                <Label htmlFor="requiresBooking" className="text-xs font-semibold text-[#1c1f4a] cursor-pointer">Requires timing slot selection</Label>
              </div>

              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="subActive"
                  checked={subFormData.isActive}
                  onChange={(e) => setSubFormData({ ...subFormData, isActive: e.target.checked })}
                  disabled={subFormLoading}
                  className="w-4 h-4 text-[#b86a16] border-[#e8dcc4] rounded accent-[#b86a16]"
                />
                <Label htmlFor="subActive" className="text-xs font-semibold text-[#1c1f4a] cursor-pointer">Show on website</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#e8dcc4]/60 pt-4">
              <Button type="button" variant="outline" onClick={() => setSubModalOpen(false)} disabled={subFormLoading} className="h-10 px-5 rounded-full border border-[#e8dcc4] text-[#5a5e7a]">
                Cancel
              </Button>
              <Button type="submit" disabled={subFormLoading} className="h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs">
                {subFormLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save Details
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERT DIALOG: Delete Category */}
      <AlertDialog open={!!deleteCatId} onOpenChange={(open) => !open && setDeleteCatId(null)}>
        <AlertDialogContent className="rounded-2xl border-[#e8dcc4] bg-white font-sans max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1c1f4a] font-bold">Delete Category Folder</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
              Are you sure you want to permanently delete this category folder? All associated offering items and seeker booking queues under this category will no longer match this scope.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-[#e8dcc4] text-xs font-semibold rounded-xl hover:bg-[#faf7f2]/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteCat} className="bg-[#c4796a] hover:bg-[#c4796a]/90 text-white text-xs font-semibold rounded-xl">
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ALERT DIALOG: Delete Sub-Category */}
      <AlertDialog open={!!deleteSubId} onOpenChange={(open) => !open && setDeleteSubId(null)}>
        <AlertDialogContent className="rounded-2xl border-[#e8dcc4] bg-white font-sans max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1c1f4a] font-bold">Delete Offering Program</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
              Are you sure you want to permanently delete this sub-category offering? This action cannot be undone and will affect live booking options.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="border-[#e8dcc4] text-xs font-semibold rounded-xl hover:bg-[#faf7f2]/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteSub} className="bg-[#c4796a] hover:bg-[#c4796a]/90 text-white text-xs font-semibold rounded-xl">
              Delete Offering
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function OfferingsDashboard() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
      </div>
    }>
      <OfferingsDashboardContent />
    </Suspense>
  );
}
