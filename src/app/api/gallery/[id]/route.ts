import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gallery } from "@/db/schema/gallery";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";
import { uploadImages } from "@/lib/cloudinaryUpload";

cloudinary.config();

function getPublicIdFromUrl(url: string): string | null {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const versionRemoved = parts[1].replace(/^v\d+\//, "");
    return versionRemoved.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caption = formData.get("caption") as string | null;
    const showInScrollStr = formData.get("showInScroll") as string | null;
    const sortOrderStr = formData.get("sortOrder") as string | null;
    const isActiveStr = formData.get("isActive") as string | null;

    const existing = await db
      .select()
      .from(gallery)
      .where(eq(gallery.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Gallery item not found." }, { status: 404 });
    }

    const oldItem = existing[0];
    let imageUrl = oldItem.imageUrl;

    // Upload & delete old asset if a new image file is provided
    if (file && file.size > 0) {
      const filenamePrefix = `${Date.now()}_`;
      const urls = await uploadImages([file], "gallery", {
        publicId: (f) => `${filenamePrefix}${f.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_")}`,
      });

      if (urls.length > 0) {
        imageUrl = urls[0];

        // Delete old image in Cloudinary
        const oldPublicId = getPublicIdFromUrl(oldItem.imageUrl);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
        }
      }
    }

    const showInScroll = showInScrollStr !== null ? showInScrollStr !== "false" : oldItem.showInScroll;
    const sortOrder = sortOrderStr ? parseInt(sortOrderStr) || 0 : oldItem.sortOrder;
    const isActive = isActiveStr !== null ? isActiveStr !== "false" : oldItem.isActive;

    const [updatedItem] = await db
      .update(gallery)
      .set({
        imageUrl,
        caption: caption !== null ? caption : oldItem.caption,
        showInScroll,
        sortOrder,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(gallery.id, id))
      .returning();

    return NextResponse.json(updatedItem);
  } catch (err: any) {
    console.error("PUT /api/gallery/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to update gallery item" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const [deletedItem] = await db
      .delete(gallery)
      .where(eq(gallery.id, id))
      .returning();

    if (!deletedItem) {
      return NextResponse.json({ error: "Gallery item not found." }, { status: 404 });
    }

    // Delete image asset from Cloudinary
    const publicId = getPublicIdFromUrl(deletedItem.imageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
    }

    return NextResponse.json({ message: "Gallery item deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/gallery/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete gallery item" }, { status: 500 });
  }
}
