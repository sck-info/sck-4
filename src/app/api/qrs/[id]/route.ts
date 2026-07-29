import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { paymentQrs } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { uploadImages, deleteImage } from "@/lib/cloudinaryUpload";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Fetch existing QR first to verify and get old image URL
    const existing = await db
      .select()
      .from(paymentQrs)
      .where(eq(paymentQrs.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    const contentType = req.headers.get("content-type") || "";
    let name: string | undefined = undefined;
    let qrImageUrl: string | undefined = undefined;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      if (formData.has("name")) name = formData.get("name") as string;
      const file = formData.get("file") as File | null;
      if (file && file.size > 0) {
        const urls = await uploadImages([file], "qrs");
        qrImageUrl = urls[0];

        // Clean up old QR image from Cloudinary
        if (existing[0].qrImageUrl) {
          await deleteImage(existing[0].qrImageUrl);
        }
      }
    } else {
      const body = await req.json();
      name = body.name;
      qrImageUrl = body.qrImageUrl;
      if (qrImageUrl && qrImageUrl !== existing[0].qrImageUrl && existing[0].qrImageUrl) {
        await deleteImage(existing[0].qrImageUrl);
      }
    }

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (qrImageUrl !== undefined) updateFields.qrImageUrl = qrImageUrl;

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const [updatedQR] = await db
      .update(paymentQrs)
      .set(updateFields)
      .where(eq(paymentQrs.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updatedQR });
  } catch (err) {
    console.error("PATCH QR error:", err);
    return NextResponse.json({ error: "Failed to update QR code" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const [deletedQR] = await db
      .delete(paymentQrs)
      .where(eq(paymentQrs.id, id))
      .returning();

    if (!deletedQR) {
      return NextResponse.json({ error: "QR code not found" }, { status: 404 });
    }

    // Clean up old QR image from Cloudinary
    if (deletedQR.qrImageUrl) {
      await deleteImage(deletedQR.qrImageUrl);
    }

    return NextResponse.json({ success: true, data: deletedQR });
  } catch (err) {
    console.error("DELETE QR error:", err);
    return NextResponse.json({ error: "Failed to delete QR code" }, { status: 500 });
  }
}
