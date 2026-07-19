import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { gallery } from "@/db/schema/gallery";
import { auth } from "@/lib/auth";
import { eq, asc, and } from "drizzle-orm";
import { uploadImages } from "@/lib/cloudinaryUpload";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fetchAll = searchParams.get("all") === "true";
    const fetchScroll = searchParams.get("scroll") === "true";

    if (fetchAll) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const list = await db.select().from(gallery).orderBy(asc(gallery.sortOrder));
      return NextResponse.json(list);
    }

    if (fetchScroll) {
      const list = await db
        .select()
        .from(gallery)
        .where(and(eq(gallery.isActive, true), eq(gallery.showInScroll, true)))
        .orderBy(asc(gallery.sortOrder));
      return NextResponse.json(list);
    }

    const list = await db
      .select()
      .from(gallery)
      .where(eq(gallery.isActive, true))
      .orderBy(asc(gallery.sortOrder));

    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/gallery error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch gallery items" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const caption = formData.get("caption") as string | null;
    const showInScrollStr = formData.get("showInScroll") as string | null;
    const sortOrderStr = formData.get("sortOrder") as string | null;
    const isActiveStr = formData.get("isActive") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    // Prefix public ID with timestamp to avoid duplicates
    const filenamePrefix = `${Date.now()}_`;
    const urls = await uploadImages([file], "gallery", {
      publicId: (f) => `${filenamePrefix}${f.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_")}`,
    });

    if (urls.length === 0) {
      return NextResponse.json({ error: "Failed to upload image to Cloudinary." }, { status: 500 });
    }

    const showInScroll = showInScrollStr !== "false";
    const sortOrder = sortOrderStr ? parseInt(sortOrderStr) || 0 : 0;
    const isActive = isActiveStr !== "false";

    const [newItem] = await db
      .insert(gallery)
      .values({
        imageUrl: urls[0],
        caption: caption || "",
        showInScroll,
        sortOrder,
        isActive,
      })
      .returning();

    return NextResponse.json(newItem, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/gallery error:", err);
    return NextResponse.json({ error: err.message || "Failed to create gallery item" }, { status: 500 });
  }
}
