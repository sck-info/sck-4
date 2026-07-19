import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";

cloudinary.config();

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const MAX_INPUT_SIZE = 5 * 1024 * 1024;
const TARGET_SIZE_BYTES = 500 * 1024; // 500KB

type UploadImagesOptions = {
  invalidate?: boolean;
  overwrite?: boolean;
  publicId?: string | ((file: File) => string);
  uniqueFilename?: boolean;
  useFilename?: boolean;
};

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
    const newWidth = Math.floor((meta.width || 1200) * scale);
    const newHeight = Math.floor((meta.height || 900) * scale);

    best = await sharp(buffer)
      .resize(newWidth, newHeight, { fit: "inside", withoutEnlargement: true })
      .toFormat(format, { quality: 80 })
      .toBuffer();
  }

  return best;
}

export async function uploadImages(
  files: File[],
  moduleName: string,
  options: UploadImagesOptions = {},
): Promise<string[]> {
  const folder = `sck/${moduleName.toUpperCase()}`;
  const urls: string[] = [];

  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error("Invalid image type. Only JPEG, PNG, and WEBP are supported.");
    }

    if (file.size > MAX_INPUT_SIZE) {
      throw new Error("Image must be <= 5MB");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let finalBuffer: any = buffer;

    // Only compress if the file exceeds the 1MB target size
    if (buffer.length > TARGET_SIZE_BYTES) {
      finalBuffer = await compressToTargetSize(buffer, file.type);
    }

    const publicId =
      typeof options.publicId === "function"
        ? options.publicId(file)
        : options.publicId || file.name.replace(/\.[^/.]+$/, "");

    const url = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            invalidate: options.invalidate,
            overwrite: options.overwrite,
            resource_type: "image",
            public_id: publicId,
            use_filename: options.useFilename ?? true,
            unique_filename: options.uniqueFilename ?? false,
          },
          (error, result) => {
            if (error || !result) reject(error);
            else resolve(result.secure_url);
          }
        )
        .end(finalBuffer);
    });

    urls.push(url);
  }

  return urls;
}
