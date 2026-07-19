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

const TARGET_SIZE_BYTES = 150 * 1024; // 150KB

async function compressToTargetSize(
  buffer: Buffer,
  mimeType: string,
): Promise<Buffer> {
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
    const newWidth = Math.floor((meta.width || 800) * scale);
    const newHeight = Math.floor((meta.height || 600) * scale);

    best = await sharp(buffer)
      .resize(newWidth, newHeight, { fit: "inside", withoutEnlargement: true })
      .toFormat(format, { quality: 80 })
      .toBuffer();
  }

  return best;
}

async function uploadLocalFileToCloudinary(localFileName: string, publicId: string): Promise<string> {
  const absolutePath = path.join(process.cwd(), "public", localFileName);
  if (!fs.existsSync(absolutePath)) {
    console.warn(`Local file not found at ${absolutePath}, falling back to local path: /${localFileName}`);
    return `/${localFileName}`;
  }

  const buffer = fs.readFileSync(absolutePath);
  const ext = path.extname(localFileName).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";

  console.log(`Compressing and uploading public/${localFileName} to Cloudinary...`);
  const compressed = await compressToTargetSize(buffer, mimeType);

  const url = await new Promise<string>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "sck/GALLERY",
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
      .end(compressed);
  });

  return url;
}

async function main() {
  const hasCloudinary = process.env.CLOUDINARY_URL && !process.env.CLOUDINARY_URL.includes("<YOUR_API_SECRET>");
  if (!hasCloudinary) {
    console.warn("WARNING: CLOUDINARY_URL is missing or contains the placeholder in .env.");
    console.warn("Gallery will be seeded using local public paths fallback instead.");
  }

  console.log("Seeding gallery database with compressed assets...");

  try {
    const existing = await db.select().from(schema.gallery);
    if (existing.length === 0) {
      const defaultItemsRaw = [
        {
          localPath: "sharath7.jpeg",
          caption: "International Yoga Day Session",
          showInScroll: true,
          sortOrder: 10,
          isActive: true,
        },
        {
          localPath: "sharath8.jpeg",
          caption: "Alternate Therapy Consultation",
          showInScroll: true,
          sortOrder: 20,
          isActive: true,
        },
        {
          localPath: "sharath9.jpeg",
          caption: "Group Meditation Satsang",
          showInScroll: true,
          sortOrder: 30,
          isActive: true,
        },
        {
          localPath: "sharath10.jpeg",
          caption: "Interactive Jyothishya Workshop",
          showInScroll: true,
          sortOrder: 40,
          isActive: true,
        },
        {
          localPath: "sharath30.jpeg",
          caption: "CranioSacral Touch Healing Session",
          showInScroll: true,
          sortOrder: 50,
          isActive: true,
        },
        {
          localPath: "sharath31.jpeg",
          caption: "Vedic Chart Analysis Circle",
          showInScroll: true,
          sortOrder: 60,
          isActive: true,
        },
        {
          localPath: "sharath11.jpeg",
          caption: "NLP Coaching & Self Mastery Workshop",
          showInScroll: true,
          sortOrder: 70,
          isActive: true,
        },
        {
          localPath: "sharath12.jpeg",
          caption: "Vocal Frequencies Music Class",
          showInScroll: true,
          sortOrder: 80,
          isActive: true,
        },
        {
          localPath: "sharath13.jpeg",
          caption: "Soul Rhythm Meditation Session",
          showInScroll: false,
          sortOrder: 90,
          isActive: true,
        },
        {
          localPath: "sharath14.jpeg",
          caption: "Mind-Body Alignment Class",
          showInScroll: false,
          sortOrder: 100,
          isActive: true,
        },
        {
          localPath: "sharath15.jpeg",
          caption: "Sound Vibration Healing Circle",
          showInScroll: false,
          sortOrder: 110,
          isActive: true,
        },
        {
          localPath: "sharath16.jpeg",
          caption: "Rakkenho Bodywork Integration",
          showInScroll: false,
          sortOrder: 120,
          isActive: true,
        },
        {
          localPath: "sharath17.jpeg",
          caption: "Jyothishya Planetary Adjustments",
          showInScroll: false,
          sortOrder: 130,
          isActive: true,
        },
        {
          localPath: "sharath18.jpeg",
          caption: "Wellness Retreat Circle",
          showInScroll: false,
          sortOrder: 140,
          isActive: true,
        },
        {
          localPath: "sharath19.jpeg",
          caption: "Alternate Health Awareness Talk",
          showInScroll: false,
          sortOrder: 150,
          isActive: true,
        },
        {
          localPath: "sharath20.jpeg",
          caption: "Sitar & Flute Satsang Evening",
          showInScroll: false,
          sortOrder: 160,
          isActive: true,
        },
        {
          localPath: "sharath21.jpeg",
          caption: "Inner Peace Meditation Retreat",
          showInScroll: false,
          sortOrder: 170,
          isActive: true,
        },
        {
          localPath: "sharath22.jpeg",
          caption: "Breathwork & Prana Alignment",
          showInScroll: false,
          sortOrder: 180,
          isActive: true,
        },
        {
          localPath: "sharath23.jpeg",
          caption: "Vedic Astrology Individual Session",
          showInScroll: false,
          sortOrder: 190,
          isActive: true,
        },
        {
          localPath: "sharath1.jpeg",
          caption: "Sharath Chandra Kancherla Profile",
          showInScroll: false,
          sortOrder: 200,
          isActive: true,
        },
        {
          localPath: "sharath25.jpeg",
          caption: "Group Healing Touch Integration",
          showInScroll: false,
          sortOrder: 210,
          isActive: true,
        },
        {
          localPath: "sharath26.jpeg",
          caption: "Traditional Sole Pressure Therapy",
          showInScroll: false,
          sortOrder: 220,
          isActive: true,
        },
        {
          localPath: "sharath27.jpeg",
          caption: "Alternate Vocal Frequencies Class",
          showInScroll: false,
          sortOrder: 230,
          isActive: true,
        },
        {
          localPath: "sharath32.jpeg",
          caption: "Sanskrit Vedic Astrological Studies",
          showInScroll: false,
          sortOrder: 240,
          isActive: true,
        },
        {
          localPath: "sharath28.jpeg",
          caption: "Habit Adjustment Mentorship Hour",
          showInScroll: false,
          sortOrder: 250,
          isActive: true,
        },
        {
          localPath: "sharath29.jpeg",
          caption: "Corporate NLP Mindset Session",
          showInScroll: false,
          sortOrder: 260,
          isActive: true,
        },
        {
          localPath: "sharath33.jpeg",
          caption: "Alternate Energy Balancing Session",
          showInScroll: false,
          sortOrder: 270,
          isActive: true,
        },
        {
          localPath: "sharath34.jpeg",
          caption: "Satsang Devotional Gathering",
          showInScroll: false,
          sortOrder: 280,
          isActive: true,
        },
        {
          localPath: "sharath35.jpeg",
          caption: "Deep Tissue Wellness Massage",
          showInScroll: false,
          sortOrder: 290,
          isActive: true,
        },
        {
          localPath: "sharath36.jpeg",
          caption: "Vedic Chart Evaluation Guidance",
          showInScroll: false,
          sortOrder: 300,
          isActive: true,
        },
      ];

      const defaultItems = [];
      const timestamp = Date.now();

      for (const item of defaultItemsRaw) {
        let imageUrl = `/${item.localPath}`;

        if (hasCloudinary) {
          try {
            const publicId = `${timestamp}_${item.localPath.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_")}`;
            imageUrl = await uploadLocalFileToCloudinary(item.localPath, publicId);
          } catch (err: any) {
            console.error(`Failed to upload ${item.localPath} to Cloudinary, using fallback:`, err.message || err);
          }
        }

        defaultItems.push({
          imageUrl,
          caption: item.caption,
          showInScroll: item.showInScroll,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
        });
      }

      await db.insert(schema.gallery).values(defaultItems);
      console.log(`Created ${defaultItems.length} default gallery items successfully!`);
    } else {
      console.log("Gallery already seeded");
    }

    console.log("Gallery seeding completed successfully!");
  } catch (error) {
    console.error("Error during gallery seeding:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
