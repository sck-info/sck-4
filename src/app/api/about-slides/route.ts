import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aboutSlides } from "@/db/schema/about_slides";
import { auth } from "@/lib/auth";
import { eq, asc } from "drizzle-orm";
import { uploadImages } from "@/lib/cloudinaryUpload";

export async function GET(request: Request) {
  try {
    const { searchParams = new URL(request.url).searchParams } = new URL(request.url);
    const fetchAll = searchParams.get("all") === "true";

    if (fetchAll) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const list = await db.select().from(aboutSlides).orderBy(asc(aboutSlides.sortOrder));
      return NextResponse.json(list);
    }

    const list = await db
      .select()
      .from(aboutSlides)
      .where(eq(aboutSlides.isActive, true))
      .orderBy(asc(aboutSlides.sortOrder));

    return NextResponse.json(list);
  } catch (err: any) {
    console.error("GET /api/about-slides error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch slides" }, { status: 500 });
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
    const tag = formData.get("tag") as string | null;
    const alt = formData.get("alt") as string | null;
    const sortOrderStr = formData.get("sortOrder") as string | null;
    const isActiveStr = formData.get("isActive") as string | null;

    if (!file) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }
    if (!tag) {
      return NextResponse.json({ error: "Tag is required." }, { status: 400 });
    }

    const filenamePrefix = `${Date.now()}_`;
    const urls = await uploadImages([file], "about", {
      publicId: (f) => `${filenamePrefix}${f.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_")}`,
    });

    if (urls.length === 0) {
      return NextResponse.json({ error: "Failed to upload image to Cloudinary." }, { status: 500 });
    }

    const sortOrder = sortOrderStr ? parseInt(sortOrderStr) || 0 : 0;
    const isActive = isActiveStr !== "false";

    const [newSlide] = await db
      .insert(aboutSlides)
      .values({
        imageUrl: urls[0],
        tag,
        alt: alt || "",
        sortOrder,
        isActive,
      })
      .returning();

    return NextResponse.json(newSlide, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/about-slides error:", err);
    return NextResponse.json({ error: err.message || "Failed to create slide" }, { status: 500 });
  }
}
