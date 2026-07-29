"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  Calendar,
  Clock,
  Loader2,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  User,
  MessageSquare,
  Download,
  AlertTriangle,
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
import { formatDate, formatTimeRange } from "@/lib/format";

type AbandonedBookingRow = {
  id: string;
  selectedFormat: string | null;
  formResponses: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  category: {
    id: string;
    name: string;
  };
  subCategory: {
    id: string;
    name: string;
  };
  slot: {
    id: string;
    slotDate: string;
    startTime: string;
    endTime: string;
  } | null;
  location: {
    id: string;
    name: string;
  } | null;
};

function AbandonedBookingsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL Query Params
  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";
  const categoryFilter = searchParams.get("category") || "all";
  const subCategoryFilter = searchParams.get("subCategory") || "all";
  const searchQuery = searchParams.get("search") || "";

  // Local state for filters (Do not auto-apply)
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [localCategory, setLocalCategory] = useState(categoryFilter);
  const [localSubCategory, setLocalSubCategory] = useState(subCategoryFilter);

  const pushParams = useCallback(
    (params: URLSearchParams, replace = false) => {
      const url = `${pathname}?${params.toString()}`;
      if (replace) router.replace(url);
      else router.push(url);
    },
    [pathname, router],
  );

  // Sync URL search parameters
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
    setLocalCategory(categoryFilter);
    setLocalSubCategory(subCategoryFilter);
  }, [searchQuery, categoryFilter, subCategoryFilter]);

  // Data states
  const [leads, setLeads] = useState<AbandonedBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstLoad, setFirstLoad] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [subCategories, setSubCategories] = useState<
    { id: string; name: string; categoryId: string }[]
  >([]);
  const [allQuestions, setAllQuestions] = useState<Record<string, string>>({});
  const [sortedQuestions, setSortedQuestions] = useState<any[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  const [viewLeadDetails, setViewLeadDetails] =
    useState<AbandonedBookingRow | null>(null);

  // Fetch target offering custom questions layout when viewing details
  useEffect(() => {
    if (!viewLeadDetails) {
      setSortedQuestions([]);
      return;
    }
    const fetchSortedQuestions = async () => {
      try {
        const res = await fetch(
          `/api/sub-categories/${viewLeadDetails.subCategory.id}/questions`,
        );
        if (res.ok) {
          const json = await res.json();
          setSortedQuestions(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load offering questions:", err);
      }
    };
    fetchSortedQuestions();
  }, [viewLeadDetails]);

  // Load configs
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const catRes = await fetch("/api/categories");
        if (catRes.ok) {
          const json = await catRes.json();
          setCategories(json.data || []);
        }
        const subRes = await fetch("/api/sub-categories");
        if (subRes.ok) {
          const json = await subRes.json();
          setSubCategories(json.data || []);
        }
        const qRes = await fetch("/api/questions?limit=500");
        if (qRes.ok) {
          const json = await qRes.json();
          const qMap: Record<string, string> = {};
          (json.data || []).forEach((q: any) => {
            qMap[q.id] = q.fieldLabel;
          });
          setAllQuestions(qMap);
        }
      } catch (err) {
        console.error("Failed to load category filters/questions:", err);
      }
    };
    fetchConfig();
  }, []);

  // Fetch leads
  const fetchLeads = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      try {
        const searchPart = searchQuery
          ? `&search=${encodeURIComponent(searchQuery)}`
          : "";
        const catObj = categories.find((c) => c.name === categoryFilter);
        const catPart = catObj ? `&categoryId=${catObj.id}` : "";
        const subObj = subCategories.find((s) => s.name === subCategoryFilter);
        const subPart = subObj ? `&subCategoryId=${subObj.id}` : "";

        const res = await fetch(
          `/api/bookings/abandoned?page=${page}&limit=${limit}${searchPart}${catPart}${subPart}`,
        );
        if (!res.ok) throw new Error("Failed to load draft bookings");
        const json = await res.json();
        setLeads(json.data || []);
        setPagination(json.pagination);
      } catch (err) {
        console.error("Error loading leads queue:", err);
        toast.error("Error loading abandoned bookings queue");
      } finally {
        setLoading(false);
        setFirstLoad(false);
      }
    },
    [
      categories,
      subCategories,
      categoryFilter,
      subCategoryFilter,
      searchQuery,
      page,
      limit,
    ],
  );

  useEffect(() => {
    fetchLeads(firstLoad);
  }, [fetchLeads, firstLoad]);

  // Real-time listener
  useRealtime(["booking_drafts"], () => fetchLeads(true));

  const handleLocalCategoryChange = (val: string) => {
    setLocalCategory(val);
    const catObj = categories.find((c) => c.name === val);
    if (catObj && localSubCategory !== "all") {
      const belongs = subCategories.some(
        (s) => s.name === localSubCategory && s.categoryId === catObj.id,
      );
      if (!belongs) {
        setLocalSubCategory("all");
      }
    } else {
      setLocalSubCategory("all");
    }
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("search", localSearch.trim());
    params.set("category", localCategory);
    params.set("subCategory", localSubCategory);
    params.set("page", "1");
    pushParams(params);
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalCategory("all");
    setLocalSubCategory("all");

    const params = new URLSearchParams(searchParams.toString());
    params.set("search", "");
    params.set("category", "all");
    params.set("subCategory", "all");
    params.set("page", "1");
    pushParams(params);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const searchPart = searchQuery
        ? `&search=${encodeURIComponent(searchQuery)}`
        : "";
      const catObj = categories.find((c) => c.name === categoryFilter);
      const catPart = catObj ? `&categoryId=${catObj.id}` : "";
      const subObj = subCategories.find((s) => s.name === subCategoryFilter);
      const subPart = subObj ? `&subCategoryId=${subObj.id}` : "";

      const res = await fetch(
        `/api/bookings/abandoned?export=true${searchPart}${catPart}${subPart}`,
      );
      if (!res.ok) throw new Error("Failed to export leads");
      const json = await res.json();
      const dataRows: AbandonedBookingRow[] = json.data || [];

      // Define columns
      const headers = [
        "Lead Reference ID",
        "Seeker Name",
        "Seeker Email",
        "Seeker Phone",
        "Offering Category",
        "Session Offering",
        "Selected Format",
        "Selected Location",
        "Slot Date",
        "Slot Time",
        "Last Draft Update",
        "Incomplete Responses Data",
      ];

      const csvRows = [headers.join(",")];

      for (const row of dataRows) {
        const slotDateStr = row.slot?.slotDate
          ? formatDate(row.slot.slotDate)
          : "Not selected yet";
        const slotTimingStr = row.slot
          ? formatTimeRange(row.slot.startTime, row.slot.endTime)
          : "";
        const formattedUpdateStr = formatDate(row.updatedAt);
        const formatStr = row.selectedFormat || "Not selected yet";
        const locationStr = row.location?.name || "Not selected yet";

        // Construct readable responses dump string
        const responsesDump: string[] = [];
        Object.entries(row.formResponses || {}).forEach(([qId, val]) => {
          const qLabel = allQuestions[qId] || "Question";
          let ansStr = "";
          if (val && typeof val === "object") {
            const selectedOpt = Array.isArray(val.selected)
              ? val.selected.join(", ")
              : String(val.selected);
            const specifyVal = val.customValue
              ? ` (Specified: ${val.customValue})`
              : "";
            ansStr = `${selectedOpt}${specifyVal}`;
          } else {
            ansStr = Array.isArray(val) ? val.join(", ") : String(val || "");
          }
          responsesDump.push(`${qLabel}: ${ansStr}`);
        });

        const values = [
          row.id,
          row.user?.name || "",
          row.user?.email || "",
          row.user?.phone || "",
          row.category?.name || "",
          row.subCategory?.name || "",
          formatStr,
          locationStr,
          slotDateStr,
          slotTimingStr,
          formattedUpdateStr,
          responsesDump.join(" | "),
        ];

        const escaped = values.map((val) => {
          const stringified = String(val);
          if (
            stringified.includes(",") ||
            stringified.includes('"') ||
            stringified.includes("\n")
          ) {
            return `"${stringified.replace(/"/g, '""')}"`;
          }
          return stringified;
        });

        csvRows.push(escaped.join(","));
      }

      const csvContent =
        "data:text/csv;charset=utf-8,\uFEFF" +
        encodeURIComponent(csvRows.join("\n"));
      const link = document.createElement("a");
      link.setAttribute("href", csvContent);

      const catClean =
        categoryFilter !== "all"
          ? categoryFilter.replace(/[^a-zA-Z0-9]/g, "_")
          : "";
      const subCatClean =
        subCategoryFilter !== "all"
          ? subCategoryFilter.replace(/[^a-zA-Z0-9]/g, "_")
          : "";
      let filterParts = ["abandoned_bookings"];
      if (catClean) filterParts.push(catClean);
      if (subCatClean) filterParts.push(subCatClean);

      const filterName = filterParts
        .join("_")
        .replace(/__+/g, "_")
        .toLowerCase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `${filterName}_${timestamp}.csv`;

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Abandoned bookings CSV leads downloaded successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to export draft bookings list");
    } finally {
      setExporting(false);
    }
  };

  // Filter subcategories dynamically based on local category choice
  const activeCategoryId = categories.find((c) => c.name === localCategory)?.id;
  const filteredSubCategoriesOptions = activeCategoryId
    ? subCategories.filter((s) => s.categoryId === activeCategoryId)
    : subCategories;

  return (
    <div className="w-full space-y-5">
      {/* Title & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#1c1f4a] font-display">
            Abandoned Bookings Leads
          </h1>
          <p className="text-[11px] text-[#5a5e7a] mt-0.5">
            View draft registrations where seekers entered form details or
            selected slots but dropped out before final payment submission.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => fetchLeads(false)}
            variant="outline"
            className="h-9 px-3 border-[#e8dcc4] bg-white hover:bg-[#faf7f2] text-xs font-bold text-[#b86a16] flex items-center gap-1.5 cursor-pointer rounded-xl"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh Leads
          </Button>
          <Button
            onClick={handleExportCSV}
            disabled={exporting || leads.length === 0}
            className="h-9 px-4 bg-[#b86a16] hover:bg-[#b86a16]/90 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer rounded-xl shadow-sm transition-all"
          >
            {exporting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            Export leads (CSV)
          </Button>
        </div>
      </div>

      {/* Filter Toolbar controls with side-by-side flex layout */}
      <div className="flex flex-col md:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
        <div className="flex-1 min-w-[200px] space-y-1 w-full">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
            Search Seekers
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
            <Input
              type="text"
              placeholder="Search name, email, or phone..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 h-9 text-xs border-[#e8dcc4] bg-white rounded-xl placeholder:text-gray-400 text-[#1c1f4a]"
            />
          </div>
        </div>

        <div className="w-full md:w-48 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
            Filter Category
          </Label>
          <Select
            value={localCategory}
            onValueChange={handleLocalCategoryChange}
          >
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">✦ All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.name}>
                  ✦ {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-56 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
            Filter Offering
          </Label>
          <Select
            value={localSubCategory}
            onValueChange={(val) => setLocalSubCategory(val)}
          >
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue placeholder="All Offerings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">✦ All Offerings</SelectItem>
              {filteredSubCategoriesOptions.map((s) => (
                <SelectItem key={s.id} value={s.name}>
                  ✦ {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Manual Filter Action Buttons */}
        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
          <Button
            type="button"
            onClick={handleApplyFilters}
            className="h-9 px-4 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer shadow-sm transition-all flex-1 md:flex-none"
          >
            Apply
          </Button>
          <Button
            type="button"
            onClick={handleClearFilters}
            variant="outline"
            className="h-9 px-4 border-[#e8dcc4] bg-white hover:bg-[#faf7f2] text-xs font-bold text-[#5a5e7a] rounded-xl flex items-center justify-center cursor-pointer flex-1 md:flex-none"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Main Leads Table with Responsive scrollbar */}
      <div className="border border-[#e8dcc4] rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto min-w-full">
          <Table>
            <TableHeader className="bg-[#1c1f4a]/5 border-b border-[#e8dcc4]/50">
              <TableRow>
                <TableHead className="text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider py-3.5 pl-5">
                  Seeker Profile
                </TableHead>
                <TableHead className="text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider py-3.5">
                  Offering Details
                </TableHead>
                <TableHead className="text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider py-3.5">
                  Session Format
                </TableHead>
                <TableHead className="text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider py-3.5">
                  Selected Slot
                </TableHead>
                <TableHead className="text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider py-3.5">
                  Last Active
                </TableHead>
                <TableHead className="text-[10px] font-bold text-[#1c1f4a] uppercase tracking-wider py-3.5 text-right pr-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[#e8dcc4]/40">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <Loader2 className="w-6 h-6 text-[#b86a16] animate-spin mx-auto" />
                    <p className="text-xs text-[#5a5e7a] mt-2">
                      Loading abandoned bookings queue...
                    </p>
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <AlertTriangle className="w-8 h-8 text-[#b86a16]/60 mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#1c1f4a]">
                      No abandoned leads found.
                    </p>
                    <p className="text-[10px] text-[#5a5e7a] mt-1">
                      Try resetting filters or checking back later.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((row) => {
                  return (
                    <TableRow
                      key={row.id}
                      className="hover:bg-[#faf7f2]/20 transition-colors"
                    >
                      {/* Seeker Profile Column */}
                      <TableCell className="py-4 pl-5">
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#b86a16]/10 text-[#b86a16] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                            {row.user?.name ? (
                              row.user.name.charAt(0).toUpperCase()
                            ) : (
                              <User className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#1c1f4a] truncate max-w-[180px]">
                              {row.user?.name}
                            </p>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <span className="text-[10px] text-[#5a5e7a] flex items-center gap-1">
                                <Mail className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                {row.user?.email}
                              </span>
                              {row.user?.phone && (
                                <span className="text-[10px] text-[#5a5e7a] flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5 text-gray-400 shrink-0" />
                                  {row.user.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Offering Details Column */}
                      <TableCell className="py-4">
                        <span className="inline-block text-[9px] font-bold text-[#b86a16] bg-[#b86a16]/5 border border-[#b86a16]/15 rounded-md px-1.5 py-0.5 uppercase tracking-wide">
                          {row.category?.name}
                        </span>
                        <p className="text-xs font-bold text-[#1c1f4a] mt-1 truncate max-w-[180px]">
                          {row.subCategory?.name}
                        </p>
                      </TableCell>

                      {/* Format Column */}
                      <TableCell className="py-4 text-xs font-semibold text-[#1c1f4a]">
                        {row.selectedFormat ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="capitalize">
                              {row.selectedFormat}
                            </span>
                            {row.location?.name && (
                              <span className="text-[10px] font-medium text-[#5a5e7a]">
                                {row.location.name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">
                            Not selected yet
                          </span>
                        )}
                      </TableCell>

                      {/* Date & Time Column */}
                      <TableCell className="py-4 text-xs font-semibold text-[#1c1f4a]">
                        {row.slot ? (
                          <div className="space-y-0.5">
                            <span className="flex items-center gap-1 font-bold">
                              <Calendar className="w-3 h-3 text-[#b86a16]" />
                              {formatDate(row.slot.slotDate)}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#5a5e7a]">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {formatTimeRange(
                                row.slot.startTime,
                                row.slot.endTime,
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">
                            Not selected yet
                          </span>
                        )}
                      </TableCell>

                      {/* Last Active Timestamp */}
                      <TableCell className="py-4 text-xs font-semibold text-[#1c1f4a]">
                        {formatDate(row.updatedAt)}
                      </TableCell>

                      {/* View Details Action */}
                      <TableCell className="py-4 text-right pr-5">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setViewLeadDetails(row)}
                          className="h-8 w-8 p-0 hover:bg-[#faf7f2] hover:text-[#b86a16] text-[#1c1f4a] cursor-pointer rounded-lg"
                          title="View Entered Responses"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Table Pagination Footer */}
        {leads.length > 0 && <TablePaginationFooter pagination={pagination} />}
      </div>

      {/* Answer Preview Dialog Modal */}
      <Dialog
        open={!!viewLeadDetails}
        onOpenChange={(open) => !open && setViewLeadDetails(null)}
      >
        <DialogContent className="max-w-lg border border-[#e8dcc4] bg-white rounded-2xl overflow-hidden p-0 shadow-lg font-sans">
          <DialogHeader className="bg-[#1c1f4a] text-white p-5">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-white">
              <MessageSquare className="w-4.5 h-4.5 text-[#b86a16]" />
              Seeker Draft Registration Responses
            </DialogTitle>
          </DialogHeader>

          {viewLeadDetails && (
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Seeker details card */}
              <div className="p-4 border border-[#e8dcc4] bg-[#faf7f2]/30 rounded-xl space-y-2">
                <p className="text-xs font-extrabold text-[#1c1f4a] uppercase tracking-wide">
                  Customer Details
                </p>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-[#5a5e7a] block font-bold">
                      NAME
                    </span>
                    <span className="font-bold text-[#1c1f4a]">
                      {viewLeadDetails.user?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5a5e7a] block font-bold">
                      EMAIL
                    </span>
                    <span className="font-bold text-[#1c1f4a]">
                      {viewLeadDetails.user?.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5a5e7a] block font-bold">
                      PHONE
                    </span>
                    <span className="font-bold text-[#1c1f4a]">
                      {viewLeadDetails.user?.phone || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#5a5e7a] block font-bold">
                      LAST ACTIVE
                    </span>
                    <span className="font-bold text-[#1c1f4a]">
                      {formatDate(viewLeadDetails.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Answers details */}
              <div className="space-y-3">
                <p className="text-xs font-extrabold text-[#1c1f4a] uppercase tracking-wide border-b border-[#e8dcc4] pb-1">
                  Entered Form Answers
                </p>

                {Object.keys(viewLeadDetails.formResponses || {}).length ===
                0 ? (
                  <p className="text-center text-xs text-[#5a5e7a] py-6 italic">
                    No questions answered in this draft yet.
                  </p>
                ) : (
                  <div className="space-y-3 divide-y divide-[#e8dcc4]/20">
                    {/* Render questions in configured sorted order */}
                    {sortedQuestions.length > 0
                      ? sortedQuestions.map((q) => {
                          const answer = viewLeadDetails.formResponses[q.id];
                          if (answer === undefined) return null;

                          let displayVal = "";
                          if (
                            answer &&
                            typeof answer === "object" &&
                            !Array.isArray(answer)
                          ) {
                            const selected = Array.isArray(answer.selected)
                              ? answer.selected.join(", ")
                              : String(answer.selected);
                            const specify = answer.customValue
                              ? ` (Specified: "${answer.customValue}")`
                              : "";
                            displayVal = `${selected}${specify}`;
                          } else {
                            displayVal = Array.isArray(answer)
                              ? answer.join(", ")
                              : String(answer || "");
                          }

                          return (
                            <div key={q.id} className="pt-2.5 first:pt-0">
                              <span className="text-[10px] font-bold text-[#b86a16] block uppercase">
                                {q.fieldLabel}
                              </span>
                              <p className="text-xs font-semibold text-[#1c1f4a] mt-0.5 break-words whitespace-pre-wrap">
                                {displayVal || (
                                  <span className="text-gray-400 italic">
                                    Left empty
                                  </span>
                                )}
                              </p>
                            </div>
                          );
                        })
                      : // Fallback listing unsorted if questions config not loaded yet
                        Object.entries(viewLeadDetails.formResponses).map(
                          ([qId, answer]) => {
                            const qLabel = allQuestions[qId] || "Question";
                            let displayVal = "";
                            if (
                              answer &&
                              typeof answer === "object" &&
                              !Array.isArray(answer)
                            ) {
                              const selected = Array.isArray(answer.selected)
                                ? answer.selected.join(", ")
                                : String(answer.selected);
                              const specify = answer.customValue
                                ? ` (Specified: "${answer.customValue}")`
                                : "";
                              displayVal = `${selected}${specify}`;
                            } else {
                              displayVal = Array.isArray(answer)
                                ? answer.join(", ")
                                : String(answer || "");
                            }

                            return (
                              <div key={qId} className="pt-2.5 first:pt-0">
                                <span className="text-[10px] font-bold text-[#b86a16] block uppercase">
                                  {qLabel}
                                </span>
                                <p className="text-xs font-semibold text-[#1c1f4a] mt-0.5 break-words whitespace-pre-wrap">
                                  {displayVal || (
                                    <span className="text-gray-400 italic">
                                      Left empty
                                    </span>
                                  )}
                                </p>
                              </div>
                            );
                          },
                        )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AbandonedBookingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
        </div>
      }
    >
      <AbandonedBookingsContent />
    </Suspense>
  );
}
