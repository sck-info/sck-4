import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aboutSlides } from "@/db/schema/about_slides";
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
    const tag = formData.get("tag") as string | null;
    const alt = formData.get("alt") as string | null;
    const sortOrderStr = formData.get("sortOrder") as string | null;
    const isActiveStr = formData.get("isActive") as string | null;

    const existing = await db
      .select()
      .from(aboutSlides)
      .where(eq(aboutSlides.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "Slide not found." }, { status: 404 });
    }

    const oldSlide = existing[0];
    let imageUrl = oldSlide.imageUrl;

    // If a new image file is provided, upload & delete old asset
    if (file && file.size > 0) {
      const filenamePrefix = `${Date.now()}_`;
      const urls = await uploadImages([file], "about", {
        publicId: (f) => `${filenamePrefix}${f.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_")}`,
      });

      if (urls.length > 0) {
        imageUrl = urls[0];

        // Delete old image in Cloudinary
        const oldPublicId = getPublicIdFromUrl(oldSlide.imageUrl);
        if (oldPublicId) {
          await cloudinary.uploader.destroy(oldPublicId, { invalidate: true });
        }
      }
    }

    const sortOrder = sortOrderStr ? parseInt(sortOrderStr) || 0 : oldSlide.sortOrder;
    const isActive = isActiveStr !== null ? isActiveStr !== "false" : oldSlide.isActive;

    const [updatedSlide] = await db
      .update(aboutSlides)
      .set({
        imageUrl,
        tag: tag !== null ? tag : oldSlide.tag,
        alt: alt !== null ? alt : oldSlide.alt,
        sortOrder,
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(aboutSlides.id, id))
      .returning();

    return NextResponse.json(updatedSlide);
  } catch (err: any) {
    console.error("PUT /api/about-slides/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to update slide" }, { status: 500 });
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
    const [deletedSlide] = await db
      .delete(aboutSlides)
      .where(eq(aboutSlides.id, id))
      .returning();

    if (!deletedSlide) {
      return NextResponse.json({ error: "Slide not found." }, { status: 404 });
    }

    // Delete image asset from Cloudinary
    const publicId = getPublicIdFromUrl(deletedSlide.imageUrl);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId, { invalidate: true });
    }

    return NextResponse.json({ message: "Slide deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/about-slides/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete slide" }, { status: 500 });
  }
}
