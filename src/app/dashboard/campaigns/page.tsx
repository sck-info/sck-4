"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta } from "@/lib/pagination";
import { getJsonOrError } from "@/lib/utils";
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  AlertCircle,
  XCircle,
  Search,
  Copy,
  Check,
  Eye,
  Sliders,
  Calendar,
  ClipboardList,
  Star,
  Users,
  BarChart3,
  Download,
  Trash,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  List,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type {
  Campaign,
  CampaignQuestion,
  CampaignSection,
  CampaignContact,
  CampaignResponseRow,
} from "@/types/campaign";




// Rich description editor using contentEditable
function RichDescriptionEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeStyles, setActiveStyles] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value;
    }
  }, [value]);

  const checkActiveStyles = () => {
    if (typeof document !== "undefined") {
      setActiveStyles({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
      });
    }
  };

  const command = (cmd: string) => {
    ref.current?.focus();
    if (typeof document !== "undefined") {
      document.execCommand(cmd, false);
      onChange(ref.current?.innerHTML ?? "");
      checkActiveStyles();
    }
  };

  return (
    <div className="rounded-xl border border-[#e8dcc4] bg-white overflow-hidden shadow-sm">
      <div className="flex items-center gap-1 bg-[#faf7f2]/50 border-b border-[#e8dcc4] p-1.5">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => command("bold")}
          className={`p-1.5 rounded transition-all cursor-pointer ${
            activeStyles.bold
              ? "bg-[#1c1f4a] text-white hover:bg-[#1c1f4a]"
              : "hover:bg-[#1c1f4a]/10 text-[#1c1c1c]"
          }`}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => command("italic")}
          className={`p-1.5 rounded transition-all cursor-pointer ${
            activeStyles.italic
              ? "bg-[#1c1f4a] text-white hover:bg-[#1c1f4a]"
              : "hover:bg-[#1c1f4a]/10 text-[#1c1c1c]"
          }`}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => command("underline")}
          className={`p-1.5 rounded transition-all cursor-pointer ${
            activeStyles.underline
              ? "bg-[#1c1f4a] text-white hover:bg-[#1c1f4a]"
              : "hover:bg-[#1c1f4a]/10 text-[#1c1c1c]"
          }`}
          title="Underline"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => command("insertUnorderedList")}
          className="p-1.5 hover:bg-[#1c1f4a]/10 rounded text-[#1c1c1c] cursor-pointer"
          title="Bullets"
        >
          <List className="w-3.5 h-3.5" />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        onKeyUp={checkActiveStyles}
        onMouseUp={checkActiveStyles}
        onFocus={checkActiveStyles}
        className="min-h-[100px] max-h-[200px] p-3 text-xs outline-none bg-white text-[#1c1f4a] overflow-y-auto [&_ul]:list-disc [&_ul]:pl-5"
      />
    </div>
  );
}

function CampaignsContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = searchParams.get("page") || "1";
  const limit = searchParams.get("limit") || "25";
  const search = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "all";

  const [localSearch, setLocalSearch] = useState(search);
  const [localStatus, setLocalStatus] = useState(statusFilter);

  useEffect(() => {
    setLocalSearch(search);
    setLocalStatus(statusFilter);
  }, [search, statusFilter]);

  // Data states
  const [campaignsList, setCampaignsList] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteCampaign, setDeleteCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<"settings" | "builder" | "contacts" | "preview">("settings");

  // Edit / Details form draft state
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    thankYouMessage: "",
    allowMultipleSubmissions: false,
    sections: [] as {
      id?: string;
      tempId: string;
      title: string;
      description: string;
      questions: {
        id?: string;
        tempId: string;
        prompt: string;
        note: string;
        questionType: string;
        isRequired: boolean;
        optionsText: string;
        maxRating: number;
      }[];
    }[],
    contacts: [] as {
      id?: string;
      tempId: string;
      name: string;
      phoneNumber: string;
      availabilityStatus: string;
      timings: string;
    }[],
  });

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [copiedCode, setCopiedCode] = useState("");
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchCampaigns = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const searchPart = search ? `&search=${encodeURIComponent(search)}` : "";
      const statusPart = statusFilter !== "all" ? `&status=${statusFilter}` : "";

      const res = await fetch(`/api/campaigns?page=${page}&limit=${limit}${searchPart}${statusPart}`);
      if (!res.ok) throw new Error("Failed to load campaigns list.");
      const json = await res.json();
      if (json.success) {
        setCampaignsList(json.data || []);
        if (json.pagination) setPagination(json.pagination);
      }
    } catch {
      toast.error("Error loading campaigns dashboard.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, limit, search, statusFilter]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useRealtime(["campaigns", "campaign_responses"], () => fetchCampaigns(true));

  // Filters navigation helper
  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (localSearch.trim()) params.set("search", localSearch.trim());
    else params.delete("search");

    if (localStatus !== "all") params.set("status", localStatus);
    else params.delete("status");

    router.push(`${pathname}?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setLocalSearch("");
    setLocalStatus("all");
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("limit", limit);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Open creation modal
  const handleOpenCreate = () => {
    setFormData({
      title: "",
      description: "",
      thankYouMessage: "Thank you. Your response has been recorded.",
      allowMultipleSubmissions: false,
      sections: [
        {
          tempId: crypto.randomUUID(),
          title: "General Section",
          description: "",
          questions: [
            {
              tempId: crypto.randomUUID(),
              prompt: "What is your feedback?",
              note: "",
              questionType: "SHORT_ANSWER",
              isRequired: false,
              optionsText: "Option 1\nOption 2",
              maxRating: 5,
            },
          ],
        },
      ],
      contacts: [],
    });
    setFormError("");
    setCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title.trim()) {
      setFormError("Heading title is required.");
      return;
    }

    setSubmitting(true);
    try {
      // Structure fields before posting
      const body = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        thankYouMessage: formData.thankYouMessage.trim() || null,
        allowMultipleSubmissions: formData.allowMultipleSubmissions,
        contacts: formData.contacts.map((c) => ({
          name: c.name.trim(),
          phoneNumber: c.phoneNumber.trim() || null,
          availabilityStatus: c.availabilityStatus.trim() || null,
          timings: c.timings.trim() || null,
        })),
        sections: formData.sections.map((s) => ({
          title: s.title.trim() || null,
          description: s.description.trim() || null,
          questions: s.questions.map((q) => ({
            prompt: q.prompt.trim(),
            note: q.note.trim() || null,
            questionType: q.questionType,
            isRequired: q.isRequired,
            options: q.optionsText
              .split("\n")
              .map((o) => o.trim())
              .filter(Boolean),
            maxRating: Number(q.maxRating) || 5,
          })),
        })),
      };

      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await getJsonOrError(res, "Failed to create campaign form.");
      if (json.success) {
        toast.success("Campaign form created successfully!");
        setCreateModalOpen(false);
        fetchCampaigns();
      }
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Board view
  const handleOpenEdit = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormError("");
    setLoadingDetails(true);
    setActiveTab("settings");
    setEditModalOpen(true);

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`);
      if (!res.ok) throw new Error("Failed to load details");
      const json = await res.json();
      if (json.success) {
        // Map backend objects back to local wizard form builder states
        setFormData({
          title: json.campaign.title,
          description: json.campaign.description || "",
          thankYouMessage: json.campaign.thankYouMessage || "Thank you. Your response has been recorded.",
          allowMultipleSubmissions: json.campaign.allowMultipleSubmissions,
          sections: json.sections.map((s: CampaignSection) => {
            const qs = json.questions
              .filter((q: CampaignQuestion) => q.sectionId === s.id)
              .map((q: CampaignQuestion) => ({
                id: q.id,
                tempId: q.id,
                prompt: q.prompt,
                note: q.note || "",
                questionType: q.questionType,
                isRequired: q.isRequired,
                optionsText: (q.config?.options || []).join("\n"),
                maxRating: q.config?.maxRating || 5,
              }));

            return {
              id: s.id,
              tempId: s.id,
              title: s.title || "",
              description: s.description || "",
              questions: qs,
            };
          }),
          contacts: json.contacts.map((c: CampaignContact) => ({
            id: c.id,
            tempId: c.id || crypto.randomUUID(),
            name: c.name,
            phoneNumber: c.phoneNumber || "",
            availabilityStatus: c.availabilityStatus || "",
            timings: c.timings || "",
          })),
        });
      }
    } catch {
      toast.error("Failed to load campaign structure.");
      setEditModalOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateSubmit = async () => {
    if (!selectedCampaign) return;
    setFormError("");
    setSubmitting(true);

    try {
      const body = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        thankYouMessage: formData.thankYouMessage.trim() || null,
        allowMultipleSubmissions: formData.allowMultipleSubmissions,
        contacts: formData.contacts.map((c) => ({
          name: c.name.trim(),
          phoneNumber: c.phoneNumber.trim() || null,
          availabilityStatus: c.availabilityStatus.trim() || null,
          timings: c.timings.trim() || null,
        })),
        sections: formData.sections.map((s) => ({
          id: s.id?.startsWith("default") ? undefined : s.id,
          title: s.title.trim() || null,
          description: s.description.trim() || null,
          questions: s.questions.map((q) => ({
            id: q.id,
            prompt: q.prompt.trim(),
            note: q.note.trim() || null,
            questionType: q.questionType,
            isRequired: q.isRequired,
            options: q.optionsText
              .split("\n")
              .map((o) => o.trim())
              .filter(Boolean),
            maxRating: Number(q.maxRating) || 5,
          })),
        })),
      };

      const res = await fetch(`/api/campaigns/${selectedCampaign.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await getJsonOrError(res, "Failed to update campaign form.");
      if (json.success) {
        toast.success("Campaign form saved successfully!");
        setEditModalOpen(false);
        fetchCampaigns();
      }
    } catch (err: any) {
      setFormError(err.message || "Failed to save configuration.");
      toast.error(err.message || "Failed to save configuration.");
    } finally {
      setSubmitting(false);
    }
  };

  // Change campaign status
  const handleToggleStatus = async (camp: Campaign, newStatus: string) => {
    try {
      const patchRes = await fetch(`/api/campaigns/${camp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (patchRes.ok) {
        toast.success(`Campaign marked as ${newStatus}`);
        fetchCampaigns(true);
      }
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCampaign) return;
    try {
      const res = await fetch(`/api/campaigns/${deleteCampaign.id}`, { method: "DELETE" });
      const json = await getJsonOrError(res, "Failed to delete campaign.");
      if (json.success) {
        toast.success("Campaign deleted successfully.");
        fetchCampaigns();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete campaign.");
    } finally {
      setDeleteCampaign(null);
    }
  };

  const handleCopyLink = (code: string) => {
    if (typeof window !== "undefined") {
      const host = window.location.origin;
      navigator.clipboard.writeText(`${host}/campaigns/${code}`);
      setCopiedCode(code);
      toast.success("Campaign link copied to clipboard!");
      setTimeout(() => setCopiedCode(""), 2000);
    }
  };

  // Section CRUD logic inside formData
  const addSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          tempId: crypto.randomUUID(),
          title: `Section ${prev.sections.length + 1}`,
          description: "",
          questions: [],
        },
      ],
    }));
  };

  const removeSection = (tempId: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.tempId !== tempId),
    }));
  };

  const updateSectionTitle = (tempId: string, title: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.tempId === tempId ? { ...s, title } : s)),
    }));
  };

  const updateSectionDesc = (tempId: string, description: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => (s.tempId === tempId ? { ...s, description } : s)),
    }));
  };

  // Question CRUD logic
  const addQuestion = (sectionTempId: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.tempId !== sectionTempId) return s;
        return {
          ...s,
          questions: [
            ...s.questions,
            {
              tempId: crypto.randomUUID(),
              prompt: "",
              note: "",
              questionType: "SHORT_ANSWER",
              isRequired: false,
              optionsText: "Option 1\nOption 2",
              maxRating: 5,
            },
          ],
        };
      }),
    }));
  };

  const removeQuestion = (sectionTempId: string, questionTempId: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.tempId !== sectionTempId) return s;
        return {
          ...s,
          questions: s.questions.filter((q) => q.tempId !== questionTempId),
        };
      }),
    }));
  };

  const updateQuestionField = (
    sectionTempId: string,
    questionTempId: string,
    field: string,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.tempId !== sectionTempId) return s;
        return {
          ...s,
          questions: s.questions.map((q) =>
            q.tempId === questionTempId ? { ...q, [field]: value } : q
          ),
        };
      }),
    }));
  };

  // Contacts CRUD
  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [
        ...prev.contacts,
        {
          tempId: crypto.randomUUID(),
          name: "",
          phoneNumber: "",
          availabilityStatus: "Available",
          timings: "9:00 AM - 6:00 PM",
        },
      ],
    }));
  };

  const removeContact = (tempId: string) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((c) => c.tempId !== tempId),
    }));
  };

  const updateContactField = (tempId: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c) => (c.tempId === tempId ? { ...c, [field]: value } : c)),
    }));
  };



  return (
    <div className="w-full space-y-6 max-w-6xl">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8dcc4] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">
            Campaign Forms Control
          </h1>
          <p className="text-xs text-[#5a5e7a] mt-1">
            Build and manage public campaigns, design dynamic sections, and collect responses.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="h-9 px-4 bg-[#b86a16] hover:bg-[#b86a16]/90 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer rounded-xl shadow-sm transition-all"
        >
          <Plus className="w-4.5 h-4.5" />
          Create Campaign Form
        </Button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row items-end gap-3 p-4 border border-[#e8dcc4]/60 bg-[#faf7f2]/20 rounded-2xl">
        <div className="flex-1 min-w-[200px] space-y-1 w-full">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider block">
            Search campaigns
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
            <Input
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by title..."
              className="pl-9 h-9 text-xs border-[#e8dcc4] bg-white rounded-xl placeholder:text-gray-400 text-[#1c1f4a]"
            />
          </div>
        </div>

        <div className="w-full md:w-44 space-y-1">
          <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider block">
            Status
          </Label>
          <Select value={localStatus} onValueChange={setLocalStatus}>
            <SelectTrigger className="w-full h-9 text-xs border-[#e8dcc4] bg-white rounded-xl text-[#1c1f4a]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 shrink-0">
          <Button
            type="button"
            onClick={handleClearFilters}
            variant="outline"
            className="h-9 px-4 border-[#e8dcc4] bg-white hover:bg-[#faf7f2] text-xs font-bold text-[#5a5e7a] rounded-xl flex items-center justify-center cursor-pointer flex-1 md:flex-none"
          >
            Clear
          </Button>
          <Button
            type="button"
            onClick={handleApplyFilters}
            className="h-9 px-4 bg-[#b86a16] hover:bg-[#b86a16]/90 text-white text-xs font-bold rounded-xl flex items-center justify-center cursor-pointer shadow-sm transition-all flex-1 md:flex-none"
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Campaigns list table */}
      <div className="bg-white border border-[#e8dcc4] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#faf7f2]/50">
              <TableRow className="border-b border-[#e8dcc4]">
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a]">
                  Code
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a] w-1/3">
                  Title
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a]">
                  Submissions
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a]">
                  Status
                </TableHead>
                <TableHead className="py-3.5 px-4 text-xs font-bold text-[#1c1f4a] text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-[#e8dcc4]/40">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <Loader2 className="w-6 h-6 text-[#b86a16] animate-spin mx-auto" />
                    <p className="text-xs text-[#5a5e7a] mt-2">Loading campaigns...</p>
                  </TableCell>
                </TableRow>
              ) : campaignsList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <AlertCircle className="w-8 h-8 text-[#b86a16]/60 mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#1c1f4a]">No campaigns found.</p>
                    <p className="text-[10px] text-[#5a5e7a] mt-1">Try resetting filters or create a new form campaign.</p>
                  </TableCell>
                </TableRow>
              ) : (
                campaignsList.map((camp) => (
                  <TableRow
                    key={camp.id}
                    className="border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors"
                  >
                    <TableCell className="py-3.5 px-4 text-xs font-bold text-[#b86a16]">
                      <div className="flex items-center gap-1">
                        <code>{camp.code}</code>
                        <button
                          onClick={() => handleCopyLink(camp.code)}
                          className="p-1 hover:bg-[#faf7f2] text-gray-400 hover:text-[#1c1f4a] rounded-lg transition-colors cursor-pointer"
                          title="Copy Link"
                        >
                          {copiedCode === camp.code ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs font-semibold text-[#1c1f4a]">
                      <div>
                        <p className="font-bold text-[#1c1f4a]">{camp.title}</p>
                        <p className="text-[10px] text-[#5a5e7a] truncate max-w-[280px]">
                          {camp.description ? camp.description.replace(/<[^>]*>/g, "") : "No description"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs text-[#1c1f4a] font-bold">
                      <Link
                        href={`/dashboard/campaigns/${camp.id}/responses`}
                        className="flex items-center gap-1.5 text-[#1c1f4a] hover:text-[#b86a16] hover:underline transition-all cursor-pointer"
                        title="View Submissions Queue"
                      >
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>{camp.responseCount || 0} responses</span>
                      </Link>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                            camp.status === "PUBLISHED"
                              ? "bg-[#6b8f71]/15 text-[#6b8f71]"
                              : camp.status === "CLOSED"
                              ? "bg-[#c4796a]/15 text-[#c4796a]"
                              : "bg-[#5a5e7a]/15 text-[#5a5e7a]"
                          }`}
                        >
                          {camp.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        {camp.status === "DRAFT" && (
                          <Button
                            onClick={() => handleToggleStatus(camp, "PUBLISHED")}
                            className="h-7 px-2.5 bg-[#6b8f71] hover:bg-[#6b8f71]/90 text-white text-[10px] font-bold cursor-pointer rounded-lg"
                          >
                            Publish
                          </Button>
                        )}
                        {camp.status === "PUBLISHED" && (
                          <Button
                            onClick={() => handleToggleStatus(camp, "CLOSED")}
                            className="h-7 px-2.5 bg-[#c4796a] hover:bg-[#c4796a]/90 text-white text-[10px] font-bold cursor-pointer rounded-lg"
                          >
                            Close Form
                          </Button>
                        )}
                        {camp.status === "CLOSED" && (
                          <Button
                            onClick={() => handleToggleStatus(camp, "PUBLISHED")}
                            className="h-7 px-2.5 bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white text-[10px] font-bold cursor-pointer rounded-lg"
                          >
                            Reopen
                          </Button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(camp)}
                          className="p-1.5 hover:bg-[#b86a16]/10 text-[#b86a16] border border-transparent hover:border-[#b86a16]/30 rounded-xl transition-all cursor-pointer"
                          title="Configure Form Fields"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteCampaign(camp)}
                          className="p-1.5 hover:bg-red-50 text-red-600 border border-transparent hover:border-red-100 rounded-xl transition-all cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <TablePaginationFooter pagination={pagination} variant="bottom" />
      </div>

      {/* Creation Wizard Dialog */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-5 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold">
              Create Campaign Form
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                Form Heading Title <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter campaign title..."
                className="h-10 text-xs bg-[#faf7f2]/40 border-[#e8dcc4] rounded-xl text-[#1c1f4a] focus-visible:ring-[#b86a16]"
                required
                disabled={submitting}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                Description / Instructions
              </Label>
              <RichDescriptionEditor
                value={formData.description}
                onChange={(desc) => setFormData({ ...formData, description: desc })}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox
                id="allowMultiple"
                checked={formData.allowMultipleSubmissions}
                onCheckedChange={(checked) => setFormData({ ...formData, allowMultipleSubmissions: !!checked })}
              />
              <Label htmlFor="allowMultiple" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide cursor-pointer">
                Allow multiple submissions (Show &quot;Submit another response&quot; button)
              </Label>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-[#e8dcc4]/50">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
                disabled={submitting}
                className="border-[#e8dcc4] text-[#1c1f4a] rounded-xl hover:bg-[#faf7f2]/40 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl text-xs font-semibold"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create & Start"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Main Campaign CONFIG & STATS Board Editor */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="bg-[#1c1f4a] text-white px-6 py-4.5 flex flex-row justify-between items-center shrink-0">
            <DialogTitle className="text-white text-md font-bold flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-[#b86a16]" />
              <span>Configure Campaign: {selectedCampaign?.title}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Navigation Tabs bar */}
          <div className="flex bg-[#faf7f2] border-b border-[#e8dcc4] px-6 py-1 shrink-0 text-xs font-bold text-[#5a5e7a]">
            {[
              { id: "settings", label: "General Settings" },
              { id: "builder", label: "Form Designer" },
              { id: "contacts", label: "Support Contacts" },
              { id: "preview", label: "Live Form Preview" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-4.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "border-[#b86a16] text-[#b86a16]"
                    : "border-transparent hover:text-[#1c1f4a]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content panel */}
          <div className="flex-1 overflow-y-auto p-6 bg-white space-y-4">
            {loadingDetails ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
                <p className="text-xs text-[#5a5e7a] font-medium">Loading campaign structure...</p>
              </div>
            ) : (
              <>
                {activeTab === "settings" && (
              <div className="space-y-4 max-w-xl">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                    Form Heading Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="h-10 text-xs bg-[#faf7f2]/40 border-[#e8dcc4] rounded-xl text-[#1c1f4a]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                    Description / Instructions
                  </Label>
                  <RichDescriptionEditor
                    value={formData.description}
                    onChange={(desc) => setFormData({ ...formData, description: desc })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide block">
                    Thank You Message
                  </Label>
                  <Input
                    value={formData.thankYouMessage}
                    onChange={(e) => setFormData({ ...formData, thankYouMessage: e.target.value })}
                    className="h-10 text-xs bg-[#faf7f2]/40 border-[#e8dcc4] rounded-xl text-[#1c1f4a]"
                  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Checkbox
                    id="editAllowMultiple"
                    checked={formData.allowMultipleSubmissions}
                    onCheckedChange={(checked) => setFormData({ ...formData, allowMultipleSubmissions: !!checked })}
                  />
                  <Label htmlFor="editAllowMultiple" className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide cursor-pointer">
                    Allow multiple submissions (Show &quot;Submit another response&quot; button)
                  </Label>
                </div>
              </div>
            )}

            {activeTab === "builder" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wider">
                    Form Sections &amp; Questions
                  </h3>
                  <Button
                    type="button"
                    onClick={addSection}
                    className="h-8 px-3 bg-[#b86a16] hover:bg-[#b86a16]/90 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                  >
                    + Add Section
                  </Button>
                </div>

                <div className="space-y-6">
                  {formData.sections.map((section, sIdx) => (
                    <div key={section.tempId} className="border border-[#e8dcc4] rounded-2xl p-5 bg-[#faf7f2]/20 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 space-y-1">
                          <Input
                            placeholder="Section Title..."
                            value={section.title}
                            onChange={(e) => updateSectionTitle(section.tempId, e.target.value)}
                            className="bg-white border-[#e8dcc4] font-bold text-xs h-9 rounded-xl"
                          />
                          <Input
                            placeholder="Section Helper/Description text (Required if section has no questions)..."
                            value={section.description}
                            onChange={(e) => updateSectionDesc(section.tempId, e.target.value)}
                            className="bg-white border-[#e8dcc4] text-[11px] h-8 rounded-xl"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeSection(section.tempId)}
                          className="text-red-500 hover:bg-red-50 p-1.5 h-8 rounded-xl cursor-pointer"
                          title="Remove Section"
                        >
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Section Questions */}
                      <div className="space-y-4 pl-4 border-l-2 border-[#e8dcc4]">
                        {section.questions.map((q, qIdx) => (
                          <div key={q.tempId} className="border border-[#e8dcc4]/60 bg-white p-4 rounded-xl space-y-3 shadow-sm">
                            <div className="flex flex-col md:flex-row gap-3">
                              <div className="flex-1 space-y-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-[#1c1f4a] uppercase">Question prompt</Label>
                                    <Input
                                      placeholder="Enter question prompt..."
                                      value={q.prompt}
                                      onChange={(e) => updateQuestionField(section.tempId, q.tempId, "prompt", e.target.value)}
                                      className="border-[#e8dcc4] text-xs h-9 rounded-xl"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-[#1c1f4a] uppercase">Helper Subtext (Optional)</Label>
                                    <Input
                                      placeholder="Note/guideline..."
                                      value={q.note}
                                      onChange={(e) => updateQuestionField(section.tempId, q.tempId, "note", e.target.value)}
                                      className="border-[#e8dcc4] text-xs h-9 rounded-xl"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-[#1c1f4a] uppercase">Answer Type</Label>
                                    <Select
                                      value={q.questionType}
                                      onValueChange={(val) => updateQuestionField(section.tempId, q.tempId, "questionType", val)}
                                    >
                                      <SelectTrigger className="w-full text-[11px] h-9 rounded-xl border-[#e8dcc4]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                                        <SelectItem value="LONG_ANSWER">Long Answer</SelectItem>
                                        <SelectItem value="DATE">Date</SelectItem>
                                        <SelectItem value="NUMBER">Number</SelectItem>
                                        <SelectItem value="STAR_RATING">Star Rating</SelectItem>
                                        <SelectItem value="SINGLE_SELECT">Single Select</SelectItem>
                                        <SelectItem value="MULTI_SELECT">Multi Select</SelectItem>
                                        <SelectItem value="URL">URL</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  {(q.questionType === "SINGLE_SELECT" || q.questionType === "MULTI_SELECT") && (
                                    <div className="col-span-2 space-y-1">
                                      <Label className="text-[10px] font-bold text-[#1c1f4a] uppercase">Options list (one per line)</Label>
                                      <textarea
                                        value={q.optionsText}
                                        onChange={(e) => updateQuestionField(section.tempId, q.tempId, "optionsText", e.target.value)}
                                        rows={2}
                                        placeholder="Option 1&#10;Option 2&#10;Other"
                                        className="w-full p-2 bg-white border border-[#e8dcc4] text-xs rounded-xl outline-none focus-visible:ring-1 focus-visible:ring-[#b86a16]"
                                      />
                                    </div>
                                  )}

                                  {q.questionType === "STAR_RATING" && (
                                    <div className="space-y-1">
                                      <Label className="text-[10px] font-bold text-[#1c1f4a] uppercase">Max Stars (1-10)</Label>
                                      <Input
                                        type="text"
                                        value={q.maxRating ?? ""}
                                        onChange={(e) => {
                                          const raw = e.target.value;
                                          if (raw === "") {
                                            updateQuestionField(section.tempId, q.tempId, "maxRating", "");
                                          } else {
                                            const parsed = parseInt(raw, 10);
                                            updateQuestionField(section.tempId, q.tempId, "maxRating", isNaN(parsed) ? "" : parsed);
                                          }
                                        }}
                                        className="text-xs h-9 rounded-xl border-[#e8dcc4]"
                                      />
                                    </div>
                                  )}

                                  <div className="flex items-center gap-1.5 pt-4">
                                    <Checkbox
                                      id={`req-${q.tempId}`}
                                      checked={q.isRequired}
                                      onCheckedChange={(checked) => updateQuestionField(section.tempId, q.tempId, "isRequired", !!checked)}
                                    />
                                    <Label htmlFor={`req-${q.tempId}`} className="text-[11px] text-[#1c1f4a] font-bold cursor-pointer uppercase">
                                      Required
                                    </Label>
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeQuestion(section.tempId, q.tempId)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-xl self-end md:self-center cursor-pointer"
                                title="Remove Question"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => addQuestion(section.tempId)}
                          className="h-8 px-3 border-dashed border-[#e8dcc4] text-[10px] text-[#b86a16] font-bold rounded-xl cursor-pointer hover:bg-[#faf7f2]/20"
                        >
                          + Add Question
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "contacts" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wider">
                    Form Support Contacts
                  </h3>
                  <Button
                    type="button"
                    onClick={addContact}
                    className="h-8 px-3 bg-[#b86a16] hover:bg-[#b86a16]/90 text-white text-[10px] font-bold rounded-lg cursor-pointer"
                  >
                    + Add Support Contact
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {formData.contacts.map((contact) => (
                    <div key={contact.tempId} className="border border-[#e8dcc4] p-4 bg-[#faf7f2]/10 rounded-2xl space-y-3 relative">
                      <button
                        type="button"
                        onClick={() => removeContact(contact.tempId)}
                        className="absolute right-3 top-3 text-red-500 hover:bg-red-50 p-1 rounded-xl cursor-pointer"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-[#1c1f4a] uppercase">Support Person Name</Label>
                        <Input
                          placeholder="Name..."
                          value={contact.name}
                          onChange={(e) => updateContactField(contact.tempId, "name", e.target.value)}
                          className="h-8.5 text-xs border-[#e8dcc4] bg-white rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-[#1c1f4a] uppercase">Phone Number</Label>
                        <Input
                          placeholder="Phone..."
                          value={contact.phoneNumber}
                          onChange={(e) => updateContactField(contact.tempId, "phoneNumber", e.target.value)}
                          className="h-8.5 text-xs border-[#e8dcc4] bg-white rounded-xl"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-[#1c1f4a] uppercase">Status</Label>
                          <Input
                            placeholder="Available..."
                            value={contact.availabilityStatus}
                            onChange={(e) => updateContactField(contact.tempId, "availabilityStatus", e.target.value)}
                            className="h-8.5 text-xs border-[#e8dcc4] bg-white rounded-xl"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-bold text-[#1c1f4a] uppercase">Timings</Label>
                          <Input
                            placeholder="Hours..."
                            value={contact.timings}
                            onChange={(e) => updateContactField(contact.tempId, "timings", e.target.value)}
                            className="h-8.5 text-xs border-[#e8dcc4] bg-white rounded-xl"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "preview" && (
              <div className="border border-[#e8dcc4] bg-[#faf7f2] rounded-3xl p-6 shadow-inner max-w-2xl mx-auto space-y-4">
                <div className="flex justify-between items-center border-b border-[#e8dcc4]/50 pb-2">
                  <span className="text-[10px] font-bold text-[#b86a16] uppercase tracking-wider">LIVE PREVIEW</span>
                  <span className="text-[9px] bg-amber-500/10 text-amber-700 px-2 py-0.5 rounded font-extrabold">READONLY</span>
                </div>
                <h1 className="text-xl font-bold text-[#1c1f4a]">{formData.title || "Form Heading"}</h1>
                {formData.description && (
                  <div
                    className="text-xs text-[#5a5e7a] leading-relaxed border-b border-[#e8dcc4]/30 pb-3"
                    dangerouslySetInnerHTML={{ __html: formData.description }}
                  />
                )}

                <div className="space-y-5 pt-2">
                  {formData.sections.map((section, sIdx) => (
                    <div key={section.tempId} className="bg-white border border-[#e8dcc4] p-5 rounded-2xl space-y-3">
                      <div className="pb-2 border-b border-[#faf7f2]">
                        <span className="text-[9px] font-bold uppercase text-[#b86a16]">Section {sIdx + 1} of {formData.sections.length}</span>
                        <h3 className="text-xs font-bold text-[#1c1f4a] mt-0.5">{section.title || `Section ${sIdx + 1}`}</h3>
                        {section.description && (
                          <div
                            className="text-[10px] text-[#5a5e7a] mt-1"
                            dangerouslySetInnerHTML={{ __html: section.description }}
                          />
                        )}
                      </div>

                      <div className="space-y-4">
                        {section.questions.map((q) => (
                          <div key={q.tempId} className="space-y-1.5 p-3 bg-[#faf7f2]/10 border border-[#faf7f2] rounded-xl">
                            <Label className="text-xs font-bold text-[#1c1f4a] flex items-center gap-0.5">
                              {q.prompt || "Question prompt..."}
                              {q.isRequired && <span className="text-red-500">*</span>}
                            </Label>
                            {q.note && <p className="text-[10px] text-[#5a5e7a] font-semibold italic">{q.note}</p>}

                            <div className="mt-2 text-xs text-gray-400 italic">
                              {q.questionType === "SHORT_ANSWER" && <Input placeholder="Short answer text" disabled className="bg-white border-[#e8dcc4] text-xs h-9 rounded-xl" />}
                              {q.questionType === "LONG_ANSWER" && <textarea placeholder="Long answer text" disabled className="w-full p-2 bg-white border border-[#e8dcc4] text-xs rounded-xl" />}
                              {q.questionType === "DATE" && <Input type="date" disabled className="bg-white border-[#e8dcc4] text-xs h-9 rounded-xl" />}
                              {q.questionType === "NUMBER" && <Input type="number" placeholder="0" disabled className="bg-white border-[#e8dcc4] text-xs h-9 rounded-xl" />}
                              {q.questionType === "URL" && <Input placeholder="https://..." disabled className="bg-white border-[#e8dcc4] text-xs h-9 rounded-xl" />}
                              {q.questionType === "STAR_RATING" && (
                                <div className="flex gap-1">
                                  {Array.from({ length: q.maxRating }).map((_, idx) => (
                                    <Star key={idx} className="w-5 h-5 text-gray-300 fill-none border border-transparent" />
                                  ))}
                                </div>
                              )}
                              {(q.questionType === "SINGLE_SELECT" || q.questionType === "MULTI_SELECT") && (
                                <div className="space-y-1.5">
                                  {q.optionsText.split("\n").filter(Boolean).map((opt, oIdx) => (
                                    <div key={oIdx} className="flex items-center gap-1.5">
                                      <input type={q.questionType === "SINGLE_SELECT" ? "radio" : "checkbox"} disabled className="scale-90" />
                                      <span className="text-xs text-[#1c1f4a]">{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
              </>
            )}
          </div>

          <div className="bg-[#faf7f2] px-6 py-4.5 border-t border-[#e8dcc4] flex justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={submitting}
              className="border-[#e8dcc4] text-[#1c1f4a] rounded-xl hover:bg-[#faf7f2]/40 text-xs font-semibold h-10 px-5 cursor-pointer"
            >
              Close
            </Button>
            {activeTab !== "preview" && (
              <Button
                type="button"
                onClick={handleUpdateSubmit}
                disabled={submitting}
                className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-xl text-xs font-semibold h-10 px-6 cursor-pointer shadow-sm"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Configuration"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Campaign Confirmation */}
      <AlertDialog open={!!deleteCampaign} onOpenChange={(open) => !open && setDeleteCampaign(null)}>
        <AlertDialogContent className="rounded-3xl border border-[#e8dcc4] bg-white max-w-sm p-6 font-sans shadow-lg text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="text-base font-bold text-[#1c1f4a]">
                Delete Campaign Form
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-[#5a5e7a] leading-relaxed">
                Are you sure you want to delete this campaign? All sections, questions, and replies answers will be deleted. This cannot be undone.
              </AlertDialogDescription>
            </div>
          </div>
          <AlertDialogFooter className="flex sm:flex-row gap-2 mt-6 justify-center w-full">
            <AlertDialogCancel className="flex-1 border border-[#e8dcc4] text-xs font-semibold rounded-xl hover:bg-[#faf7f2]/50 py-2 h-9">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl py-2 h-9"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[45vh]">
        <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin" />
      </div>
    }>
      <CampaignsContent />
    </Suspense>
  );
}
