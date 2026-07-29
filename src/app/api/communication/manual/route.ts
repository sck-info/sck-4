import { NextResponse } from "next/server";
import { sendWhatsApp } from "@/lib/whatsapp";

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let phoneInput = "";
    let message = "";
    let mediaType = "text"; // text, image, video, audio, document
    let mediaSource = "url"; // url, upload
    let mediaUrl = "";
    let fileBase64 = "";
    let fileName = "";
    let fileMime = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      phoneInput = (formData.get("phone") as string) || "";
      message = (formData.get("message") as string) || "";
      mediaType = (formData.get("mediaType") as string) || "text";
      mediaSource = (formData.get("mediaSource") as string) || "url";
      mediaUrl = (formData.get("mediaUrl") as string) || "";

      const file = formData.get("file") as File | null;
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        fileBase64 = buffer.toString("base64");
        fileName = file.name;
        fileMime = file.type;
      }
    } else {
      const body = await req.json();
      phoneInput = body.phone || "";
      message = body.message || "";
      mediaType = body.mediaType || "text";
      mediaSource = body.mediaSource || "url";
      mediaUrl = body.mediaUrl || "";
      fileBase64 = body.fileBase64 || "";
      fileName = body.fileName || "";
      fileMime = body.fileMime || "";
    }

    let phonesList: string[] = [];
    if (phoneInput.trim().startsWith("[")) {
      try {
        phonesList = JSON.parse(phoneInput);
      } catch {
        phonesList = [phoneInput];
      }
    } else {
      phonesList = phoneInput
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    }

    if (phonesList.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient phone number is required." },
        { status: 400 },
      );
    }

    let attachment: any = undefined;

    if (mediaType !== "text") {
      if (mediaSource === "url" && mediaUrl) {
        try {
          const res = await fetch(mediaUrl);
          if (!res.ok) {
            throw new Error(
              `Failed to fetch media from URL. Status: ${res.statusText}`,
            );
          }
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          fileBase64 = buffer.toString("base64");
          fileMime =
            res.headers.get("content-type") ||
            getMimeFromUrlOrType(mediaUrl, mediaType);
          fileName = getFileNameFromUrl(mediaUrl);
          mediaSource = "upload"; // Treat as upload so we send base64!
        } catch (fetchErr: any) {
          console.error(
            "Failed to fetch remote media URL on server:",
            fetchErr,
          );
          return NextResponse.json(
            { error: `Failed to download media URL: ${fetchErr.message}` },
            { status: 400 },
          );
        }
      }

      if (mediaSource === "upload" && fileBase64) {
        attachment = {
          contentBase64: fileBase64,
          contentType: fileMime,
          fileName: fileName,
        };
      } else {
        return NextResponse.json(
          { error: "Missing media file or media URL." },
          { status: 400 },
        );
      }
    }

    // Call WhatsApp helper for each recipient
    for (const phone of phonesList) {
      try {
        await sendWhatsApp(phone, message, attachment);
      } catch (err) {
        console.error(`[Manual API] Failed to send to ${phone}:`, err);
      }
    }

    return NextResponse.json({ success: true, count: phonesList.length });
  } catch (err: any) {
    console.error("Manual message API error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to dispatch message." },
      { status: 500 },
    );
  }
}

function getMimeFromUrlOrType(url: string, mediaType: string): string {
  const ext = url.split(".").pop()?.toLowerCase() || "";
  if (mediaType === "image") return ext ? `image/${ext}` : "image/png";
  if (mediaType === "video") return ext ? `video/${ext}` : "video/mp4";
  if (mediaType === "audio") return ext ? `audio/${ext}` : "audio/mpeg";
  return "application/octet-stream";
}

function getFileNameFromUrl(url: string): string {
  return url.substring(url.lastIndexOf("/") + 1) || "file";
}
