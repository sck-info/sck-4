"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRealtime } from "@/hooks/useRealtime";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import TablePaginationFooter from "@/components/dashboard/TablePaginationFooter";
import { type PaginationMeta, DEFAULT_PAGE_LIMIT } from "@/lib/pagination";
import {
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  Loader2,
  CheckCircle,
  Settings,
  ArrowUpDown,
  BookOpen,
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

type QuestionRow = {
  id: string;
  fieldLabel: string;
  fieldType: "short_answer" | "long_answer" | "number" | "single_select" | "multi_select" | "date" | "time" | "url" | "star_rating";
  options: string[] | null;
  allowOther: boolean;
  createdAt: string | null;
};

type SubCategoryRow = {
  id: string;
  name: string;
};

type LinkedQuestionRow = {
  id: string; // formQuestion.id
  fieldLabel: string;
  fieldType: string;
  isRequired: boolean;
  sortOrder: number;
};

function FormBuilderDashboardContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Active build context: Tab (library vs mapping)
  const activeTab = searchParams.get("tab") || "library";
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
    if (!params.has("tab")) {
      params.set("tab", "library");
      changed = true;
    }
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
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategoryRow[]>([]);
  const [selectedSubId, setSelectedSubId] = useState<string>("");
  const [linkedQuestions, setLinkedQuestions] = useState<LinkedQuestionRow[]>([]);

  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [loadingLinked, setLoadingLinked] = useState(false);

  const [libPagination, setLibPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 1,
  });

  // Modal control states (Library Questions)
  const [libModalOpen, setLibModalOpen] = useState(false);
  const [editingLib, setEditingLib] = useState<QuestionRow | null>(null);
  const [libFormData, setLibFormData] = useState({
    fieldLabel: "",
    fieldType: "short_answer" as any,
    optionsRaw: "",
    allowOther: false,
  });
  const [libFormLoading, setLibFormLoading] = useState(false);
  const [deleteLibId, setDeleteLibId] = useState<string | null>(null);

  // Link Question state
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkFormData, setLinkFormData] = useState({
    questionId: "",
    isRequired: true,
    sortOrder: 10,
  });
  const [linkLoading, setLinkLoading] = useState(false);
  const [unlinkConfirmId, setUnlinkConfirmId] = useState<string | null>(null);

  // Fetch Reusable Questions Library
  const fetchLibrary = useCallback(async () => {
    if (activeTab !== "library") {
      setLoadingLibrary(false);
      return;
    }
    setLoadingLibrary(true);
    try {
      const res = await fetch(`/api/questions?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to load questions");
      const json = await res.json();
      setQuestions(json.data);
      setLibPagination(json.pagination);
    } catch (err) {
      console.error(err);
      toast.error("Error loading questions library");
    } finally {
      setLoadingLibrary(false);
    }
  }, [activeTab, page, limit]);

  // Fetch Sub-categories (offerings) for mapping dropdown
  const fetchSubCategories = async () => {
    try {
      const res = await fetch("/api/sub-categories?page=1&limit=100");
      if (res.ok) {
        const json = await res.json();
        setSubCategories(json.data);
        if (json.data.length > 0 && !selectedSubId) {
          setSelectedSubId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch linked questions for selected Sub-category
  const fetchLinkedQuestions = useCallback(async () => {
    if (!selectedSubId) return;
    setLoadingLinked(true);
    try {
      const res = await fetch(`/api/sub-categories/${selectedSubId}/questions`);
      if (!res.ok) throw new Error("Failed to load linked questionnaire");
      const json = await res.json();
      setLinkedQuestions(json.data);
    } catch (err) {
      console.error(err);
      toast.error("Error loading sub-category questionnaire");
    } finally {
      setLoadingLinked(false);
    }
  }, [selectedSubId]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  useEffect(() => {
    fetchSubCategories();
  }, []);

  useEffect(() => {
    fetchLinkedQuestions();
  }, [fetchLinkedQuestions]);

  // Real-time updates
  useRealtime(["form_questions"], fetchLibrary);
  useRealtime(["sub_category_questions"], fetchLinkedQuestions);

  // Tab switch
  const handleTabChange = (tab: "library" | "mapping") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    params.set("page", "1");
    pushParams(params);
  };

  // Submit library question
  const handleLibSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLibFormLoading(true);

    const options = ["single_select", "multi_select"].includes(libFormData.fieldType)
      ? libFormData.optionsRaw.split(",").map((o) => o.trim()).filter(Boolean)
      : null;

    const payload = {
      fieldLabel: libFormData.fieldLabel,
      fieldType: libFormData.fieldType,
      options,
      allowOther: libFormData.allowOther,
    };

    try {
      const url = editingLib ? `/api/questions/${editingLib.id}` : "/api/questions";
      const method = editingLib ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save question to library");
      toast.success(editingLib ? "Question updated in library" : "Question created successfully");
      setLibModalOpen(false);
      fetchLibrary();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLibFormLoading(false);
    }
  };

  // Delete Library Question
  const handleConfirmDeleteLib = async () => {
    if (!deleteLibId) return;
    try {
      const res = await fetch(`/api/questions/${deleteLibId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete question");
      toast.success("Question deleted successfully");
      fetchLibrary();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setDeleteLibId(null);
    }
  };

  // Link Question to Offering submit
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubId || !linkFormData.questionId) return;
    setLinkLoading(true);

    try {
      const res = await fetch(`/api/sub-categories/${selectedSubId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: linkFormData.questionId,
          isRequired: linkFormData.isRequired,
          sortOrder: linkFormData.sortOrder,
        }),
      });

      if (!res.ok) throw new Error("Failed to link question to this offering form");
      toast.success("Question linked successfully");
      setLinkModalOpen(false);
      fetchLinkedQuestions();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setLinkLoading(false);
    }
  };

  // Unlink Question from offering
  const handleConfirmUnlink = async () => {
    if (!selectedSubId || !unlinkConfirmId) return;
    try {
      const res = await fetch(`/api/sub-categories/${selectedSubId}/questions/${unlinkConfirmId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to unlink question");
      toast.success("Question unlinked successfully");
      fetchLinkedQuestions();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setUnlinkConfirmId(null);
    }
  };

  // Inline edit order / required status change
  const handleInlineUpdate = async (questionId: string, isRequired: boolean, sortOrder: number) => {
    try {
      const res = await fetch(`/api/sub-categories/${selectedSubId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, isRequired, sortOrder }),
      });
      if (!res.ok) throw new Error();
      toast.success("Questionnaire layout order updated");
      fetchLinkedQuestions();
    } catch {
      toast.error("Failed to update layout settings");
    }
  };

  const showOptionsField = ["single_select", "multi_select"].includes(libFormData.fieldType);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e8dcc4] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">Form Questionnaires Builder</h1>
          <p className="text-xs text-[#5a5e7a] mt-1">Configure reusable questions pool and link questionnaires to sub-category offerings.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#e8dcc4] pb-px overflow-x-auto selection:bg-transparent">
        <button
          onClick={() => handleTabChange("library")}
          className={`py-3 px-5 text-xs font-bold border-b-2 tracking-wide transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "library"
              ? "border-[#b86a16] text-[#b86a16] font-extrabold"
              : "border-transparent text-[#5a5e7a] hover:text-[#1c1f4a] hover:border-[#e8dcc4]"
          }`}
        >
          ✦ Reusable Questions Pool (Library)
        </button>
        <button
          onClick={() => handleTabChange("mapping")}
          className={`py-3 px-5 text-xs font-bold border-b-2 tracking-wide transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "mapping"
              ? "border-[#b86a16] text-[#b86a16] font-extrabold"
              : "border-transparent text-[#5a5e7a] hover:text-[#1c1f4a] hover:border-[#e8dcc4]"
          }`}
        >
          ✦ Offering Questionnaires Linker
        </button>
      </div>

      {/* TAB PANEL 1: Questions Pool Library */}
      {activeTab === "library" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#e8dcc4]/60 pb-3">
            <h2 className="text-sm font-bold text-[#1c1f4a] font-display flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#b86a16]" /> Questions Library
            </h2>
            <Button
              onClick={() => {
                setEditingLib(null);
                setLibFormData({ fieldLabel: "", fieldType: "short_answer", optionsRaw: "", allowOther: false });
                setLibModalOpen(true);
              }}
              className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full h-8 px-4 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Create Question
            </Button>
          </div>

          {loadingLibrary ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
              <p className="text-xs text-[#5a5e7a]">Loading library...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-12 rounded-[2rem] text-center">
              <p className="text-xs text-[#5a5e7a]">Questions pool is empty. Click Create Question above to populate reusable fields.</p>
            </div>
          ) : (
            <div className="p-1">
              <Table>
                <TableHeader className="bg-[#1c1f4a]/5">
                  <TableRow className="border-b border-[#e8dcc4]">
                    <TableHead className="py-2.5 px-3 font-bold text-[#1c1f4a] text-xs">Field Label</TableHead>
                    <TableHead className="py-2.5 px-3 font-bold text-[#1c1f4a] text-xs">Input Format Type</TableHead>
                    <TableHead className="py-2.5 px-3 font-bold text-[#1c1f4a] text-xs">Select options list</TableHead>
                    <TableHead className="py-2.5 px-3 font-bold text-[#1c1f4a] text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((q) => (
                    <TableRow key={q.id} className="border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors">
                      <TableCell className="py-2.5 px-3 text-xs font-semibold text-[#1c1f4a]">{q.fieldLabel}</TableCell>
                      <TableCell className="py-2.5 px-3 text-xs">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-[#faf7f2]/80 border border-[#e8dcc4] text-[#b86a16] uppercase">
                          {q.fieldType.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-xs text-[#5a5e7a] max-w-[250px] truncate">
                        {Array.isArray(q.options) && q.options.length > 0 ? (
                          <span>{q.options.join(", ")} {q.allowOther && "(allow other)"}</span>
                        ) : (
                          <span className="text-[#9396ae] italic">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2.5 px-3 text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => {
                              setEditingLib(q);
                              setLibFormData({
                                fieldLabel: q.fieldLabel,
                                fieldType: q.fieldType,
                                optionsRaw: Array.isArray(q.options) ? q.options.join(", ") : "",
                                allowOther: q.allowOther,
                              });
                              setLibModalOpen(true);
                            }}
                            className="p-1.5 hover:bg-[#b86a16]/10 text-[#b86a16] rounded-lg border border-transparent hover:border-[#b86a16]/30 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteLibId(q.id)}
                            className="p-1.5 hover:bg-[#c4796a]/10 text-[#c4796a] rounded-lg border border-transparent hover:border-[#c4796a]/30 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePaginationFooter pagination={libPagination} variant="bottom" />
            </div>
          )}
        </div>
      )}

      {/* TAB PANEL 2: Offering Questionnaire Linker */}
      {activeTab === "mapping" && (
        <div className="space-y-6">
          <div className="bg-white border border-[#e8dcc4]/60 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Select Offering Sub-Category</Label>
              <Select value={selectedSubId} onValueChange={setSelectedSubId}>
                <SelectTrigger className="w-[300px] h-10 border-[#e8dcc4] bg-[#faf7f2]/30 text-xs font-semibold text-[#1c1f4a]">
                  <SelectValue placeholder="Select offering..." />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSubId && (
              <Button
                onClick={() => {
                  setLinkFormData({ questionId: "", isRequired: true, sortOrder: 10 });
                  setLinkModalOpen(true);
                }}
                className="bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white rounded-full h-9 px-5 text-xs font-semibold sm:mt-5"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Question to Form
              </Button>
            )}
          </div>

          {selectedSubId && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#b86a16]" />
                <h4 className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wider">Form Questions Sequence &amp; Requirements</h4>
              </div>

              {loadingLinked ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-[#b86a16] animate-spin mb-2" />
                  <p className="text-[11px] text-[#5a5e7a]">Retrieving linked questions...</p>
                </div>
              ) : linkedQuestions.length === 0 ? (
                <div className="border border-dashed border-[#e8dcc4] bg-white/40 p-8 rounded-2xl text-center">
                  <p className="text-xs text-[#5a5e7a]">This form has no linked questions. It will only collect standard credentials (Name, Email, Phone).</p>
                </div>
              ) : (
                <div className="bg-white border border-[#e8dcc4]/60 rounded-2xl overflow-hidden shadow-sm p-1">
                  <Table>
                    <TableHeader className="bg-[#1c1f4a]/5">
                      <TableRow className="border-b border-[#e8dcc4]">
                        <TableHead className="py-2.5 px-3 font-bold text-[#1c1f4a] text-xs">Field Label</TableHead>
                        <TableHead className="py-2.5 px-3 font-bold text-[#1c1f4a] text-xs">Type</TableHead>
                        <TableHead className="py-2.5 px-3 font-bold text-[#1c1f4a] text-xs">Is Required?</TableHead>
                        <TableHead className="py-2.5 px-3 font-bold text-[#1c1f4a] text-xs">Layout Order Weight</TableHead>
                        <TableHead className="py-2.5 px-3 font-bold text-[#1c1f4a] text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkedQuestions.map((lq) => (
                        <TableRow key={lq.id} className="border-b border-[#e8dcc4]/60 last:border-b-0 hover:bg-[#faf7f2]/20 transition-colors">
                          <TableCell className="py-2.5 px-3 text-xs font-semibold text-[#1c1f4a]">{lq.fieldLabel}</TableCell>
                          <TableCell className="py-2.5 px-3 text-xs">
                            <span className="text-[10px] text-[#5a5e7a] uppercase font-mono">{lq.fieldType.replace("_", " ")}</span>
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-xs">
                            <input
                              type="checkbox"
                              checked={lq.isRequired}
                              onChange={(e) => handleInlineUpdate(lq.id, e.target.checked, lq.sortOrder)}
                              className="w-4 h-4 text-[#b86a16] border-[#e8dcc4] rounded accent-[#b86a16] cursor-pointer"
                            />
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-xs">
                            <Input
                              type="number"
                              value={lq.sortOrder}
                              onChange={(e) => handleInlineUpdate(lq.id, lq.isRequired, parseInt(e.target.value) || 0)}
                              className="w-16 h-8 bg-[#faf7f2]/40 border-[#e8dcc4] text-xs px-2"
                            />
                          </TableCell>
                          <TableCell className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => setUnlinkConfirmId(lq.id)}
                              className="p-1.5 hover:bg-[#c4796a]/10 text-[#c4796a] rounded-lg border border-transparent hover:border-[#c4796a]/30 transition-all cursor-pointer"
                              title="Unlink Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* DIALOG: Library Question Creator Form */}
      <Dialog open={libModalOpen} onOpenChange={setLibModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold">
              {editingLib ? "Edit Question Pool details" : "Add Library Question"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleLibSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Question Field Label / Text</Label>
              <Input
                value={libFormData.fieldLabel}
                onChange={(e) => setLibFormData({ ...libFormData, fieldLabel: e.target.value })}
                placeholder="e.g. Do you have any chronic spinal injuries?"
                required
                disabled={libFormLoading}
                className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Answer Format Type</Label>
              <Select
                value={libFormData.fieldType}
                onValueChange={(val) => setLibFormData({ ...libFormData, fieldType: val as any })}
                disabled={libFormLoading}
              >
                <SelectTrigger className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short_answer">Short Text Answer</SelectItem>
                  <SelectItem value="long_answer">Paragraph/Long Answer</SelectItem>
                  <SelectItem value="number">Number input</SelectItem>
                  <SelectItem value="single_select">Single Select (Dropdown)</SelectItem>
                  <SelectItem value="multi_select">Multi Select (Checkboxes)</SelectItem>
                  <SelectItem value="star_rating">1 to 5 Star Rating</SelectItem>
                  <SelectItem value="date">Date Picker</SelectItem>
                  <SelectItem value="time">Time Picker</SelectItem>
                  <SelectItem value="url">URL Link input</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {showOptionsField && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Options List (Comma-separated)</Label>
                <textarea
                  value={libFormData.optionsRaw}
                  onChange={(e: any) => setLibFormData({ ...libFormData, optionsRaw: e.target.value })}
                  placeholder="e.g. Yes, No, Not sure"
                  required
                  disabled={libFormLoading}
                  className="w-full p-3 bg-[#faf7f2]/40 border border-[#e8dcc4] rounded-xl text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#b86a16]"
                />
              </div>
            )}

            {showOptionsField && (
              <div className="flex items-center gap-2.5 pt-1">
                <input
                  type="checkbox"
                  id="allowOther"
                  checked={libFormData.allowOther}
                  onChange={(e) => setLibFormData({ ...libFormData, allowOther: e.target.checked })}
                  disabled={libFormLoading}
                  className="w-4 h-4 text-[#b86a16] border-[#e8dcc4] rounded accent-[#b86a16]"
                />
                <Label htmlFor="allowOther" className="text-xs font-semibold text-[#1c1f4a] cursor-pointer">Include &quot;Other&quot; option to write-in details</Label>
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-[#e8dcc4]/60 pt-4">
              <Button type="button" variant="outline" onClick={() => setLibModalOpen(false)} disabled={libFormLoading} className="h-10 px-5 rounded-full border border-[#e8dcc4] text-[#5a5e7a]">
                Cancel
              </Button>
              <Button type="submit" disabled={libFormLoading} className="h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs">
                {libFormLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Save Details
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Link Question to Offering Form */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader className="bg-[#1c1f4a] text-white -mx-6 -mt-6 px-6 py-4 rounded-t-3xl">
            <DialogTitle className="text-white text-md font-bold">Link Library Question</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleLinkSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Select Question</Label>
              <Select
                value={linkFormData.questionId}
                onValueChange={(val) => setLinkFormData({ ...linkFormData, questionId: val })}
                disabled={linkLoading}
              >
                <SelectTrigger className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs w-full">
                  <SelectValue placeholder="Choose a library question..." />
                </SelectTrigger>
                <SelectContent>
                  {questions
                    .filter((q) => !linkedQuestions.some((l) => l.id === q.id))
                    .map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.fieldLabel} ({q.fieldType.replace("_", " ")})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1c1f4a] uppercase tracking-wide">Layout Order Weight</Label>
                <Input
                  type="number"
                  value={linkFormData.sortOrder}
                  onChange={(e) => setLinkFormData({ ...linkFormData, sortOrder: parseInt(e.target.value) || 0 })}
                  required
                  disabled={linkLoading}
                  className="bg-[#faf7f2]/40 border-[#e8dcc4] h-10 rounded-xl text-xs"
                />
              </div>
              <div className="flex items-center gap-2.5 pt-6">
                <input
                  type="checkbox"
                  id="linkRequired"
                  checked={linkFormData.isRequired}
                  onChange={(e) => setLinkFormData({ ...linkFormData, isRequired: e.target.checked })}
                  disabled={linkLoading}
                  className="w-4 h-4 text-[#b86a16] border-[#e8dcc4] rounded accent-[#b86a16]"
                />
                <Label htmlFor="linkRequired" className="text-xs font-semibold text-[#1c1f4a] cursor-pointer">Is Required field?</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#e8dcc4]/60 pt-4">
              <Button type="button" variant="outline" onClick={() => setLinkModalOpen(false)} disabled={linkLoading} className="h-10 px-5 rounded-full border border-[#e8dcc4] text-[#5a5e7a]">
                Cancel
              </Button>
              <Button type="submit" disabled={linkLoading} className="h-10 px-5 rounded-full bg-[#1c1f4a] hover:bg-[#1c1f4a]/90 text-white font-semibold text-xs">
                {linkLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null} Link Question
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ALERT: Confirm Delete Library Question */}
      <AlertDialog open={deleteLibId !== null} onOpenChange={(open) => !open && setDeleteLibId(null)}>
        <AlertDialogContent className="w-[300px] max-w-[90vw] bg-white rounded-3xl border-0 shadow-xl p-6">
          <AlertDialogHeader className="text-center flex flex-col items-center">
            <AlertDialogTitle className="text-center text-base font-semibold text-gray-900">Delete Question</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-gray-600 mt-1">
              Are you sure? This will delete the question from the pool and UNLINK it from ALL sub-category forms!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-center mt-4">
            <AlertDialogCancel className="flex-1 border border-[#c4796a] text-[#c4796a] hover:bg-[#c4796a]/5 rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
              No
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteLib} className="flex-1 bg-[#c4796a] hover:bg-[#c4796a]/90 text-white rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ALERT: Confirm Unlink Question */}
      <AlertDialog open={unlinkConfirmId !== null} onOpenChange={(open) => !open && setUnlinkConfirmId(null)}>
        <AlertDialogContent className="w-[300px] max-w-[90vw] bg-white rounded-3xl border-0 shadow-xl p-6">
          <AlertDialogHeader className="text-center flex flex-col items-center">
            <AlertDialogTitle className="text-center text-base font-semibold text-gray-900">Unlink Question</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-xs text-gray-600 mt-1">
              Are you sure you want to remove this question from this offering form? Responses already submitted by users will remain archived.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 justify-center mt-4">
            <AlertDialogCancel className="flex-1 border border-[#c4796a] text-[#c4796a] hover:bg-[#c4796a]/5 rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
              No
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUnlink} className="flex-1 bg-[#c4796a] hover:bg-[#c4796a]/90 text-white rounded-xl px-2 py-1.5 text-xs transition-colors cursor-pointer">
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function FormBuilderDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#b86a16] animate-spin mb-4" />
          <p className="text-xs text-[#5a5e7a] font-medium">Loading form builder console...</p>
        </div>
      }
    >
      <FormBuilderDashboardContent />
    </Suspense>
  );
}
