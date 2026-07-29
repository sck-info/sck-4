"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Send,
  Upload,
  Link as LinkIcon,
  MessageSquare,
  Search,
  FileText,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface ActiveUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export default function ManualBroadcastPage() {
  const [users, setUsers] = useState<ActiveUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [customPhones, setCustomPhones] = useState("");

  // Message Form states
  const [message, setMessage] = useState("");
  const [mediaType, setMediaType] = useState("text"); // text, image, video, audio, document
  const [mediaSource, setMediaSource] = useState("url"); // url, upload
  const [mediaUrl, setMediaUrl] = useState("");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileDetails, setFileDetails] = useState<{
    name: string;
    size: string;
    type: string;
  } | null>(null);
  const [sending, setSending] = useState(false);

  // Load active seekers (filtered by USER role on backend)
  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await fetch("/api/communication/users");
        if (!res.ok) throw new Error("Failed to load users");
        const json = await res.json();
        setUsers(json.data || []);
      } catch (err: any) {
        console.error(err);
        toast.error("Failed to load active seekers.");
      } finally {
        setLoadingUsers(false);
      }
    }
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  const handleToggleUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id)
        ? prev.filter((userId) => userId !== id)
        : [...prev, id],
    );
  };

  const handleToggleAllFiltered = () => {
    const filteredIds = filteredUsers.map((u) => u.id);
    const allSelected = filteredIds.every((id) => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds((prev) =>
        prev.filter((id) => !filteredIds.includes(id)),
      );
    } else {
      setSelectedUserIds((prev) =>
        Array.from(new Set([...prev, ...filteredIds])),
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      setFileDetails({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        type: file.type,
      });

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    } else {
      setFileDetails(null);
      setFilePreview(null);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileDetails(null);
    const fileInput = document.getElementById(
      "manual-file-input",
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedPhones = users
      .filter((u) => selectedUserIds.includes(u.id) && u.phone)
      .map((u) => u.phone as string);

    const typedPhones = customPhones
      .split(",")
      .map((p) => p.replace(/\D/g, ""))
      .filter(Boolean);

    const allRecipientPhones = Array.from(
      new Set([...selectedPhones, ...typedPhones]),
    );

    if (allRecipientPhones.length === 0) {
      toast.error(
        "Please select at least one seeker or provide a custom phone number.",
      );
      return;
    }

    setSending(true);
    try {
      const formData = new FormData();
      formData.append("phone", JSON.stringify(allRecipientPhones));
      formData.append("message", message.trim());
      formData.append("mediaType", mediaType);
      formData.append("mediaSource", mediaSource);

      if (mediaType !== "text") {
        if (mediaSource === "url") {
          if (!mediaUrl.trim()) {
            toast.error("Please enter a media URL.");
            setSending(false);
            return;
          }
          formData.append("mediaUrl", mediaUrl.trim());
        } else {
          if (!selectedFile) {
            toast.error("Please select a media file to upload.");
            setSending(false);
            return;
          }
          formData.append("file", selectedFile);
        }
      }

      const res = await fetch("/api/communication/manual", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to dispatch broadcast");
      }

      const json = await res.json();
      toast.success(
        `Broadcast successfully sent to ${json.count || allRecipientPhones.length} active seekers!`,
      );

      setMessage("");
      setMediaUrl("");
      handleRemoveFile();
      setSelectedUserIds([]);
      setCustomPhones("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to dispatch manual broadcast.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 py-1">
      <div>
        <h1 className="text-xl font-bold text-[#1c1f4a] font-display">
          Manual WhatsApp Broadcast
        </h1>
        <p className="text-[11px] text-[#5a5e7a] mt-0.5">
          Dispatch instant text, image, video, audio, or document attachments
          via WhatsApp. Memory-only, no database logging.
        </p>
      </div>

      <Card className="border border-[#e8dcc4] bg-white rounded-2xl overflow-hidden shadow-sm w-full">
        <CardTitle className="text-xs font-bold text-[#1c1f4a] flex items-center gap-2 py-2 px-5 border-b">
          <MessageSquare className="w-4 h-4 text-[#b86a16]" />
          Compose Broadcast Message
        </CardTitle>
        <CardContent className="p-5">
          <form onSubmit={handleSend} className="space-y-4">
            {/* Seeker checklist (Single Column layout) */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
                  Select Target Seekers ({selectedUserIds.length} selected)
                </Label>
                <button
                  type="button"
                  onClick={handleToggleAllFiltered}
                  className="text-[10px] font-extrabold text-[#b86a16] hover:underline cursor-pointer"
                >
                  Toggle All Filtered
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#9396ae]" />
                <Input
                  type="text"
                  placeholder="Filter seekers by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs text-[#5a5e7a] border border-[#e8dcc4] bg-white rounded-xl h-10"
                />
              </div>

              <div className="border border-[#e8dcc4] bg-white rounded-xl max-h-48 overflow-y-auto divide-y divide-[#e8dcc4]/40 p-1">
                {loadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-4 h-4 text-[#b86a16] animate-spin" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-center text-xs text-[#5a5e7a] py-6">
                    No matching active seekers found.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-1">
                    {filteredUsers.map((u) => {
                      const checked = selectedUserIds.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => handleToggleUser(u.id)}
                          className="flex items-center gap-3 px-3 py-1.5 hover:bg-[#fcf9f2] rounded-lg transition-colors cursor-pointer select-none"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => handleToggleUser(u.id)}
                            className="rounded border-[#e8dcc4]"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-[#1c1f4a] truncate">
                              {u.name}
                            </p>
                            <p className="text-[10px] text-[#5a5e7a] truncate">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Custom phone contacts list */}
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
                Or Send to Custom Phone Numbers (Comma-separated)
              </Label>
              <Input
                type="text"
                placeholder="e.g. 919876543210"
                value={customPhones}
                onChange={(e) => setCustomPhones(e.target.value)}
                className="w-full text-xs text-[#5a5e7a] border border-[#e8dcc4] bg-white rounded-xl h-9 px-3 outline-none"
              />
              <p className="text-[9px] text-[#5a5e7a] font-medium">
                Ensure phone numbers include country prefix (e.g. 91 for India)
                without plus signs, spaces, or hyphens.
              </p>
            </div>

            {/* Media type select */}
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
                Media Attachment Type
              </Label>
              <Select
                value={mediaType}
                onValueChange={(val) => setMediaType(val)}
              >
                <SelectTrigger className="w-full text-xs text-[#5a5e7a] border border-[#e8dcc4] bg-white rounded-xl h-9 px-3 outline-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">✦ Plain Text Message</SelectItem>
                  <SelectItem value="image">
                    ✦ Image (JPG, PNG, WEBP)
                  </SelectItem>
                  <SelectItem value="video">✦ Video (MP4)</SelectItem>
                  <SelectItem value="audio">✦ Audio (MP3, WAV)</SelectItem>
                  <SelectItem value="document">
                    ✦ Document (PDF, DOCX, ZIP, etc.)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Media source inputs */}
            {mediaType !== "text" && (
              <div className="space-y-3 bg-[#fcf9f2] border border-[#e8dcc4]/50 p-4 rounded-xl">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setMediaSource("url")}
                    className={`flex-1 py-1.5 text-center text-xs font-bold border rounded-lg transition-all cursor-pointer ${
                      mediaSource === "url"
                        ? "border-[#b86a16] bg-[#b86a16]/5 text-[#b86a16]"
                        : "border-[#e8dcc4] bg-white text-[#5a5e7a]"
                    }`}
                  >
                    Provide Media URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaSource("upload")}
                    className={`flex-1 py-1.5 text-center text-xs font-bold border rounded-lg transition-all cursor-pointer ${
                      mediaSource === "upload"
                        ? "border-[#b86a16] bg-[#b86a16]/5 text-[#b86a16]"
                        : "border-[#e8dcc4] bg-white text-[#5a5e7a]"
                    }`}
                  >
                    Upload Local File
                  </button>
                </div>

                {mediaSource === "url" ? (
                  <div className="space-y-1">
                    <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider flex items-center gap-1">
                      <LinkIcon className="w-3 h-3 text-[#b86a16]" />
                      Public File URL
                    </Label>
                    <Input
                      type="url"
                      placeholder="https://example.com/file.pdf"
                      value={mediaUrl}
                      onChange={(e) => setMediaUrl(e.target.value)}
                      className="w-full text-xs text-[#5a5e7a] border border-[#e8dcc4] bg-white rounded-xl h-9 px-3 outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider flex items-center gap-1">
                      <Upload className="w-3 h-3 text-[#b86a16]" />
                      Select Local File
                    </Label>

                    {selectedFile ? (
                      <div className="relative border border-[#e8dcc4] bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-3">
                        {filePreview ? (
                          <img
                            src={filePreview}
                            alt="Upload Preview"
                            className="w-24 h-24 object-cover rounded-lg border border-dashed border-[#e8dcc4]"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center p-2 text-center text-gray-500">
                            <FileText className="w-8 h-8 text-[#b86a16] mb-1" />
                            <p className="text-[10px] font-bold text-[#1c1f4a] truncate max-w-xs">
                              {fileDetails?.name}
                            </p>
                            <p className="text-[9px] mt-0.5">
                              {fileDetails?.size}
                            </p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="px-2.5 py-1 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#e8dcc4] hover:border-[#b86a16] bg-[#faf7f2]/10 hover:bg-[#faf7f2]/30 rounded-xl cursor-pointer transition p-4">
                        <div className="flex flex-col items-center justify-center text-center">
                          <Upload className="w-6 h-6 text-[#b86a16] mb-1 animate-bounce" />
                          <p className="text-[11px] text-[#1c1f4a] font-bold">
                            Click to upload file
                          </p>
                          <p className="text-[9px] text-gray-500">
                            Support image, video, audio, or document (Max 200MB)
                          </p>
                        </div>
                        <input
                          id="manual-file-input"
                          type="file"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Message text area */}
            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold text-[#1c1f4a] uppercase tracking-wider">
                {mediaType === "text"
                  ? "Message Text Body"
                  : "Caption Message (Optional)"}
              </Label>
              <textarea
                placeholder={
                  mediaType === "text"
                    ? "Write your WhatsApp message here..."
                    : "Add an optional caption for your media attachment..."
                }
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-xs text-[#5a5e7a] border border-[#e8dcc4] bg-white rounded-xl p-3 focus:outline-none min-h-[110px] font-sans"
                required={mediaType === "text"}
              />
            </div>

            {/* Submit button */}
            <div className="pt-1">
              <Button
                type="submit"
                disabled={sending}
                className="w-full h-10 rounded-xl bg-[#b86a16] hover:bg-[#b86a16]/90 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sending
                  ? "Sending manual broadcast..."
                  : "Dispatch Manual WhatsApp Broadcast"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
