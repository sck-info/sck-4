"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface CircularCropDialogProps {
  open: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedImage: File) => Promise<void>;
  isUploading?: boolean;
}

export function CircularCropDialog({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  isUploading = false,
}: CircularCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleCropComplete = (_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleMediaLoaded = (mediaSize: {
    naturalWidth: number;
    naturalHeight: number;
  }) => {
    setImageReady(true);

    setCroppedAreaPixels((currentCrop) => {
      if (currentCrop) return currentCrop;

      const size = Math.min(mediaSize.naturalWidth, mediaSize.naturalHeight);
      return {
        x: Math.max(0, (mediaSize.naturalWidth - size) / 2),
        y: Math.max(0, (mediaSize.naturalHeight - size) / 2),
        width: size,
        height: size,
      };
    });
  };

  const createCircularImage = async (imageSrc: string, crop: Area) => {
    return new Promise<File>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        const sourceSize = Math.max(1, Math.min(crop.width, crop.height));
        const sourceX = Math.max(
          0,
          Math.min(crop.x, image.naturalWidth - sourceSize),
        );
        const sourceY = Math.max(
          0,
          Math.min(crop.y, image.naturalHeight - sourceSize),
        );
        const outputSize = 512;
        const canvas = document.createElement("canvas");
        canvas.width = outputSize;
        canvas.height = outputSize;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.beginPath();
        ctx.arc(
          outputSize / 2,
          outputSize / 2,
          outputSize / 2,
          0,
          Math.PI * 2,
        );
        ctx.clip();

        ctx.drawImage(
          image,
          sourceX,
          sourceY,
          sourceSize,
          sourceSize,
          0,
          0,
          outputSize,
          outputSize,
        );

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "profile-photo.png", {
              type: "image/png",
            });
            resolve(file);
          } else {
            reject(new Error("Could not create blob"));
          }
        }, "image/png");
      };
      image.onerror = () => reject(new Error("Could not load image"));
      image.src = imageSrc;
    });
  };

  const handleUpload = async () => {
    if (!imageSrc || !imageReady || !croppedAreaPixels) {
      toast.error("Please wait for the image to finish loading");
      return;
    }

    try {
      setUploading(true);
      const croppedFile = await createCircularImage(imageSrc, croppedAreaPixels);
      await onCropComplete(croppedFile);
      handleClose();
    } catch (error) {
      console.error("Crop error:", error);
      toast.error("Failed to process image");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setImageReady(false);
    onClose();
  };

  const uploadDisabled =
    uploading || isUploading || !imageSrc || !imageReady || !croppedAreaPixels;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-md bg-[#faf7f2] border-[#e8dcc4] rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-[#1c1f4a] font-display">Crop Profile Photo</DialogTitle>
        </DialogHeader>

        <div className="relative w-full bg-gray-100 rounded-2xl overflow-hidden border border-[#e8dcc4]">
          {imageSrc && (
            <div className="relative w-full h-80">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1 / 1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={handleCropComplete}
                onMediaLoaded={handleMediaLoaded}
                onZoomChange={setZoom}
                classes={{
                  containerClassName: "w-full h-full",
                }}
              />
            </div>
          )}

          <div className="p-4 bg-white border-t border-[#e8dcc4]">
            <label className="text-xs font-semibold text-[#1c1f4a] uppercase tracking-wider mb-2 block">
              Zoom
            </label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#b86a16]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={handleClose}
            className="rounded-full px-5 border-[#e8dcc4] hover:bg-[#faf7f2] cursor-pointer"
            disabled={uploading || isUploading}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#1c1f4a] hover:bg-[#b86a16] text-white rounded-full px-6 cursor-pointer"
            onClick={handleUpload}
            disabled={uploadDisabled}
          >
            {uploading || isUploading ? "Uploading..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
