import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";
import sharp from "sharp";

cloudinary.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

const TARGET_SIZE_BYTES = 500 * 1024; // 500KB

async function compressToTargetSize(
  buffer: any,
  mimeType: string,
): Promise<any> {
  const format = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpeg";

  let quality = 80;
  let result = await sharp(buffer)
    .toFormat(format, { quality })
    .toBuffer();

  if (result.length <= TARGET_SIZE_BYTES) return result;

  let low = 1;
  let high = 80;
  let best = result;

  for (let i = 0; i < 8; i++) {
    quality = Math.floor((low + high) / 2);
    result = await sharp(buffer)
      .toFormat(format, { quality })
      .toBuffer();

    if (result.length <= TARGET_SIZE_BYTES) {
      best = result;
      low = quality + 1;
    } else {
      high = quality - 1;
    }

    if (low > high) break;
  }

  if (best.length > TARGET_SIZE_BYTES) {
    const scale = Math.sqrt(TARGET_SIZE_BYTES / best.length);
    const meta = await sharp(best).metadata();
    const newWidth = Math.floor((meta.width || 1200) * scale);
    const newHeight = Math.floor((meta.height || 900) * scale);

    best = await sharp(buffer)
      .resize(newWidth, newHeight, { fit: "inside", withoutEnlargement: true })
      .toFormat(format, { quality: 80 })
      .toBuffer();
  }

  return best;
}

async function uploadLocalFileToCloudinary(localPath: string, publicId: string): Promise<string> {
  // localPath will be e.g. "images/sck-lifeskills.jpeg"
  const absolutePath = path.join(process.cwd(), "public", localPath);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`Local file not found at ${absolutePath}, falling back to local path: /${localPath}`);
    return `/${localPath}`;
  }

  const buffer = fs.readFileSync(absolutePath);
  const ext = path.extname(localPath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

  let finalBuffer: any = buffer;
  if (buffer.length > TARGET_SIZE_BYTES) {
    console.log(`Compressing and uploading public/${localPath} to Cloudinary...`);
    finalBuffer = await compressToTargetSize(buffer, mimeType);
  } else {
    console.log(`Bypassing compression for public/${localPath} (under 1MB)...`);
  }

  const url = await new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "sck/ABOUT",
          public_id: publicId,
          resource_type: "image",
          overwrite: true,
          invalidate: true,
        },
        (error, result) => {
          if (error || !result) reject(error || new Error("Upload failed"));
          else resolve(result.secure_url);
        }
      )
      .end(finalBuffer);
  });

  return url;
}

async function main() {
  const hasCloudinary = process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_URL.includes("<YOUR_API_SECRET>");
  if (!hasCloudinary) {
    console.warn("WARNING: CLOUDINARY_URL is missing or contains the placeholder in .env.");
    console.warn("Slideshow will be seeded using local public paths fallback instead.");
  }

  console.log("Seeding about slides database with compressed assets...");

  try {
    const existingSlides = await db.select().from(schema.aboutSlides);
    if (existingSlides.length === 0) {
      const defaultSlidesRaw = [
        {
          localPath: "images/sck-lifeskills.jpeg",
          tag: "LIFE SKILLS FACILITATOR",
          alt: "Sharath Chandra Kancherla - CST touch",
          sortOrder: 10,
          isActive: true,
        },
        {
          localPath: "images/sck-music-therapy.jpeg",
          tag: "MUSIC THERAPIST",
          alt: "Sharath Chandra Kancherla - Swara Frequencies",
          sortOrder: 20,
          isActive: true,
        },
        {
          localPath: "images/sck-yoga.jpeg",
          tag: "YOGA & RAKKENHO",
          alt: "Sharath Chandra Kancherla - Sole Pressure",
          sortOrder: 30,
          isActive: true,
        },
        {
          localPath: "images/sck-tutuor.jpeg",
          tag: "VEDIC ASTROLOGER",
          alt: "Sharath Chandra Kancherla - Habit Adjustments",
          sortOrder: 40,
          isActive: true,
        },
        {
          localPath: "images/sck-cool.jpeg",
          tag: "NLP COACH & MENTOR",
          alt: "Sharath Chandra Kancherla - Chart Reading",
          sortOrder: 50,
          isActive: true,
        },
      ];

      const defaultSlides = [];
      const timestamp = Date.now();

      for (const slide of defaultSlidesRaw) {
        let imageUrl = `/${slide.localPath}`;

        if (hasCloudinary) {
          try {
            // Extract filename to use as public_id base
            const baseName = path.basename(slide.localPath, path.extname(slide.localPath));
            const publicId = `${timestamp}_${baseName.replace(/[^a-zA-Z0-9-_]/g, "_")}`;
            imageUrl = await uploadLocalFileToCloudinary(slide.localPath, publicId);
          } catch (err: any) {
            console.error(`Failed to upload ${slide.localPath} to Cloudinary, using fallback:`, err.message || err);
          }
        }

        defaultSlides.push({
          imageUrl,
          tag: slide.tag,
          alt: slide.alt,
          sortOrder: slide.sortOrder,
          isActive: slide.isActive,
        });
      }

      await db.insert(schema.aboutSlides).values(defaultSlides);
      console.log(`Created ${defaultSlides.length} default slideshow records successfully!`);
    } else {
      console.log("Slides already seeded");
    }

    console.log("Slides seeding completed successfully!");
  } catch (error) {
    console.error("Error during slides seeding:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
