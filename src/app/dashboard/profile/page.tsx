"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useRealtime } from "@/hooks/useRealtime";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  Venus,
  Mars,
  AlertCircle,
} from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CircularCropDialog } from "@/components/dashboard/circular-crop-dialog";

export default function ProfilePage() {
  const { data: session, update } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [age, setAge] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [image, setImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState(false);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);

  // Cropping states
  const [cropOpen, setCropOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data = await res.json();
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setGender(data.gender || "");
        setAge(data.age?.toString() || "");
        setImage(data.image || null);
        if (data.dateOfBirth) setDateOfBirth(new Date(data.dateOfBirth));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useRealtime(["users"], () => {
    fetchProfile();
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
        setCropOpen(true);
        setPhotoMenuOpen(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedFile: File) => {
    setSavingPersonal(true);
    const formData = new FormData();
    formData.append("file", croppedFile);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to upload profile photo.");
        return;
      }

      toast.success("Profile photo updated successfully!");
      setImage(data.image || null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setPhotoToDelete(false);
      await update({ name: data.name });
    } catch {
      toast.error("Failed to upload profile photo.");
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleRemovePhoto = async () => {
    setSavingPersonal(true);
    const formData = new FormData();
    formData.append("deletePhoto", "true");

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to remove profile photo.");
        return;
      }

      toast.success("Profile photo removed successfully!");
      setImage(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setPhotoToDelete(false);
      setPhotoMenuOpen(false);
      await update({ name: data.name });
    } catch {
      toast.error("Failed to remove profile photo.");
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSavePersonal = async () => {
    setSavingPersonal(true);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("gender", gender);
    if (dateOfBirth) {
      formData.append("dateOfBirth", format(dateOfBirth, "yyyy-MM-dd"));
    }
    if (age) {
      formData.append("age", age);
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update personal details.");
        return;
      }

      toast.success("Personal details updated successfully!");
      await update({ name: data.name });
    } catch {
      toast.error("Failed to update personal details.");
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword) {
      toast.error("Current password is required.");
      return;
    }
    if (!newPassword) {
      toast.error("New password is required.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New password and confirm password do not match.");
      return;
    }

    setSavingPassword(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to update password.");
        return;
      }

      toast.success("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch {
      toast.error("Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#b86a16] animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1c1f4a] font-display">
          Profile
        </h1>
        <p className="text-xs text-[#5a5e7a] mt-1">
          Manage your profile information.
        </p>
      </div>

      <input
        id="profileUpload"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      <Card className="border-[#e8dcc4] bg-white rounded-xl shadow-xs">
        <CardHeader className="px-6 pt-6 pb-0">
          <CardTitle className="text-sm font-bold text-[#1c1f4a]">
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Avatar Upload Header */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#e8dcc4]/60 mb-2">
            <div className="relative w-24 h-24 flex-shrink-0 group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#e8dcc4] bg-[#faf7f2]/50 shadow-xs relative">
                {previewUrl || image ? (
                  <img
                    src={previewUrl || image!}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#1c1f4a]/5 text-[#1c1f4a] font-bold text-2xl uppercase font-display">
                    {name ? name.slice(0, 2) : "US"}
                  </div>
                )}
                {/* Hover overlay */}
                <div
                  onClick={() => setPhotoMenuOpen(true)}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                >
                  <span className="text-[10px] font-bold tracking-wider uppercase">
                    Change
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoMenuOpen(true)}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#1c1f4a] text-white flex items-center justify-center shadow-md hover:bg-[#b86a16] transition-colors border-2 border-white cursor-pointer"
              >
                <User className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center sm:text-left">
              <h2 className="text-lg font-bold text-[#1c1f4a] font-display">
                {name || "User Name"}
              </h2>
              <p className="text-xs text-[#5a5e7a] mt-1">
                {email || "Email Address"}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1f4a]/5 text-[#1c1f4a] text-[10px] font-bold tracking-wider uppercase">
                {session?.user?.role || "Client"}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  value={email}
                  disabled
                  className="pl-10 h-11 bg-gray-100 border-[#e8dcc4] rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                WhatsApp Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  value={phone}
                  disabled
                  className="pl-10 h-11 bg-gray-100 border-[#e8dcc4] rounded-xl text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                Gender
              </Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">
                    <span className="flex items-center gap-2">
                      <Mars className="w-3.5 h-3.5" /> Male
                    </span>
                  </SelectItem>
                  <SelectItem value="Female">
                    <span className="flex items-center gap-2">
                      <Venus className="w-3.5 h-3.5" /> Female
                    </span>
                  </SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                Date of Birth
              </Label>
              <DatePicker
                value={dateOfBirth}
                onChange={(d) => {
                  setDateOfBirth(d);
                  if (d) {
                    const calculated =
                      new Date().getFullYear() - d.getFullYear();
                    setAge(calculated.toString());
                  }
                }}
                disabledDates={(d) => d > new Date()}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                Age
              </Label>
              <Input
                type="text"
                placeholder="Enter age"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (e.target.value) {
                    const yr =
                      new Date().getFullYear() - parseInt(e.target.value);
                    setDateOfBirth(new Date(yr, 0, 1));
                  }
                }}
                className="h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
              />
              {age && (
                <p className="text-[9px] text-[#9396ae] mt-1">
                  Providing DOB auto-calculates Age. Providing Age estimates
                  DOB, which may not be exact.{" "}
                </p>
              )}
            </div>
          </div>

          {session?.user?.role !== "ADMIN" && (
            <div className="mb-4 p-3.5 bg-[#faf7f2]/80 border border-[#e8dcc4]/80 rounded-2xl flex items-start gap-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 text-[#b86a16] shrink-0 mt-0.5" />
              <p className="text-xs text-[#5a5e7a] leading-relaxed font-medium">
                Email address and WhatsApp number cannot be edited directly. To
                update your login credentials or notifications destination,
                please{" "}
                <a
                  href="/contact"
                  className="text-[#b86a16] font-bold hover:underline"
                >
                  contact admin
                </a>
                .
              </p>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-[#e8dcc4]/60">
            <Button
              onClick={handleSavePersonal}
              disabled={savingPersonal}
              className="h-10 px-6 bg-[#1c1f4a] hover:bg-[#b86a16] text-white rounded-full font-semibold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              {savingPersonal ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#e8dcc4] bg-white rounded-xl shadow-xs">
        <CardHeader className="px-6 pt-6 pb-0">
          <CardTitle className="text-sm font-bold text-[#1c1f4a]">
            Update Password
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                Current Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1c1f4a] transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showCurrent ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1c1f4a] transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showNew ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-[#faf7f2]/50 border-[#e8dcc4] rounded-xl focus-visible:ring-[#b86a16]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1c1f4a] transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-[#e8dcc4]/60">
            <Button
              onClick={handleSavePassword}
              disabled={savingPassword}
              className="h-10 px-6 bg-[#1c1f4a] hover:bg-[#b86a16] text-white rounded-full font-semibold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              {savingPassword ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={photoMenuOpen} onOpenChange={setPhotoMenuOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-[#1c1f4a] font-display">
              Profile Photo
            </DialogTitle>
            <DialogDescription>
              Upload a new profile photo or remove your current one.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#e8dcc4] bg-[#faf7f2]/50 shadow-xs relative">
              {previewUrl || image ? (
                <img
                  src={previewUrl || image!}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#1c1f4a]/5 text-[#1c1f4a] font-bold text-3xl uppercase font-display">
                  {name ? name.slice(0, 2) : "US"}
                </div>
              )}
            </div>

            <div className="w-full space-y-2">
              <Button
                type="button"
                className="w-full bg-[#1c1f4a] hover:bg-[#b86a16] text-white rounded-xl h-11 font-semibold text-xs cursor-pointer transition-colors"
                onClick={() =>
                  document.getElementById("profileUpload")?.click()
                }
              >
                Upload Photo
              </Button>

              {(previewUrl || image) && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-red-200 hover:bg-red-50 text-red-600 rounded-xl h-11 font-semibold text-xs cursor-pointer transition-colors"
                  onClick={handleRemovePhoto}
                >
                  Remove Photo
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CircularCropDialog
        open={cropOpen}
        onClose={() => {
          setCropOpen(false);
          setImageSrc(null);
          const fileInput = document.getElementById(
            "profileUpload",
          ) as HTMLInputElement;
          if (fileInput) fileInput.value = "";
        }}
        imageSrc={imageSrc}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
