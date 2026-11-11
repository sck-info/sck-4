/**
 * SwiftVane WhatsApp Gateway Integration
 * 
 * Production-ready TypeScript utility for sending WhatsApp messages, media, 
 * locations, contacts, and polls via the SwiftVane WhatsApp Gateway.
 * 
 * Features:
 * - Full type-safety for requests, responses, and quota tracking
 * - Phone number sanitization and E.164-compatible formatting (no '+' or spaces)
 * - Environment variable safety checks with backward-compatibility fallbacks
 * - Quota & rate limit header parsing (X-RateLimit-Limit, X-Quota-Daily-*)
 * - Custom typed error handling:
 *     - WhatsAppRateLimitError (HTTP 429 burst limit)
 *     - WhatsAppDailyLimitError (HTTP 429 daily cap reached)
 *     - WhatsAppTypeNotAllowedError (HTTP 403 plan restriction - permanent, never retried)
 *     - WhatsAppApiError (generic gateway errors)
 * - Exposes cached allowedTypes list for UI plan gating
 * - Backward-compatible `sendWhatsApp` helper
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface WhatsAppQuota {
  plan?: string;
  dailyLimit: number;
  usedToday: number;
  dailyRemaining: number;
  resetsAt: string; // ISO 8601 string (e.g. midnight UTC)
}

export interface WhatsAppRateLimitHeaders {
  burstLimitPerMinute?: number;
  dailyLimit?: number;
  dailyUsed?: number;
  dailyRemaining?: number;
  dailyResetsAt?: string;
}

export interface WhatsAppSuccessResponse {
  ok: boolean;
  success: boolean;
  messageId: string;
  session?: string;
  status: string; // e.g. "QUEUED", "SENT"
  to: string;
  quota?: WhatsAppQuota;
  rateLimitInfo?: WhatsAppRateLimitHeaders;
  [key: string]: unknown;
}

export interface WhatsAppAttachment {
  url?: string;
  contentType?: string;
  fileName?: string;
  contentBase64?: string; // Support for Base64 payloads / data URIs
}

export interface WhatsAppLocationPayload {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface WhatsAppContactPayload {
  fullName: string;
  phone: string;
}

export interface WhatsAppPollPayload {
  name: string;
  options: string[];
  selectableCount?: number;
}

export interface WhatsAppSendPayload {
  phone: string;
  message?: string;
  attachment?: WhatsAppAttachment;
  location?: WhatsAppLocationPayload;
  contact?: WhatsAppContactPayload;
  poll?: WhatsAppPollPayload;
}

export interface WhatsAppErrorResponse {
  ok?: boolean;
  success?: boolean;
  error?: string;
  message?: string;
  code?: string;
  retryAfter?: number;
  dailyLimit?: number;
  usedToday?: number;
  remaining?: number;
  resetsAt?: string;
  blockedTypes?: string[];
  allowedTypes?: string[];
  plan?: string;
  [key: string]: unknown;
}

// ============================================================================
// Custom Error Classes
// ============================================================================

export class WhatsAppBaseError extends Error {
  public readonly isWhatsAppError = true;

  constructor(message: string) {
    super(message);
    this.name = "WhatsAppBaseError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when HTTP 429 occurs due to per-minute burst rate throttling.
 * This is transient; caller can retry after `retryAfter` seconds.
 */
export class WhatsAppRateLimitError extends WhatsAppBaseError {
  public readonly code = "RATE_LIMIT_EXCEEDED";
  public readonly retryAfter?: number;
  public readonly isTransient = true;

  constructor(message: string, retryAfter?: number) {
    super(message);
    this.name = "WhatsAppRateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * Thrown when HTTP 429 occurs due to reaching the daily quota cap.
 * Daily quota resets at `resetsAt`. Not transient for the current UTC day.
 */
export class WhatsAppDailyLimitError extends WhatsAppBaseError {
  public readonly code = "DAILY_LIMIT_EXCEEDED";
  public readonly dailyLimit?: number;
  public readonly usedToday?: number;
  public readonly remaining?: number;
  public readonly resetsAt?: string;
  public readonly isTransient = false;

  constructor(
    message: string,
    details?: { dailyLimit?: number; usedToday?: number; remaining?: number; resetsAt?: string }
  ) {
    super(message);
    this.name = "WhatsAppDailyLimitError";
    this.dailyLimit = details?.dailyLimit;
    this.usedToday = details?.usedToday;
    this.remaining = details?.remaining;
    this.resetsAt = details?.resetsAt;
  }
}

/**
 * Thrown when HTTP 403 occurs with code TYPE_NOT_IN_PLAN.
 * Indicates the message type (e.g., poll, video) is not supported by the account plan.
 * PERMANENT: Never retry this request automatically.
 */
export class WhatsAppTypeNotAllowedError extends WhatsAppBaseError {
  public readonly code = "TYPE_NOT_IN_PLAN";
  public readonly blockedTypes: string[];
  public readonly allowedTypes: string[];
  public readonly plan?: string;
  public readonly isPermanent = true;

  constructor(data: {
    error?: string;
    blockedTypes?: string[];
    allowedTypes?: string[];
    plan?: string;
  }) {
    const blockedStr = data.blockedTypes?.length ? data.blockedTypes.join(", ") : "requested type";
    const allowedStr = data.allowedTypes?.length ? data.allowedTypes.join(", ") : "none";
    const planStr = data.plan ? ` under plan '${data.plan}'` : "";
    const msg = data.error || `WhatsApp message type [${blockedStr}] is not included in your plan${planStr}. Allowed types: [${allowedStr}].`;

    super(msg);
    this.name = "WhatsAppTypeNotAllowedError";
    this.blockedTypes = data.blockedTypes || [];
    this.allowedTypes = data.allowedTypes || [];
    this.plan = data.plan;
  }
}

/**
 * Thrown for unexpected HTTP errors (400, 401, 500, 502, etc.) from the gateway.
 */
export class WhatsAppApiError extends WhatsAppBaseError {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly responseBody?: unknown;

  constructor(message: string, statusCode: number, responseBody?: unknown, code?: string) {
    super(message);
    this.name = "WhatsAppApiError";
    this.statusCode = statusCode;
    this.responseBody = responseBody;
    this.code = code;
  }
}

// ============================================================================
// State & Configuration
// ============================================================================

// In-memory cache of allowed message types discovered from TYPE_NOT_IN_PLAN or responses
let lastKnownAllowedTypes: string[] | null = null;

/**
 * Returns the latest list of allowed message types reported by the gateway, if known.
 * Useful for the application to conditionally display or disable UI features (e.g. polls).
 */
export function getLastKnownAllowedTypes(): string[] | null {
  return lastKnownAllowedTypes ? [...lastKnownAllowedTypes] : null;
}

/**
 * Retrieves the gateway configuration from environment variables with safe fallbacks.
 */
export function getWhatsAppConfig(): { url: string; token: string } {
  const url =
    process.env.WHATSAPP_URL ||
    process.env.WHATSAPP_GATEWAY_URL ||
    "https://wg.swiftproject.in/api/send";

  const token =
    process.env.WHATSAPP_TOKEN ||
    process.env.WHATSAPP_API_TOKEN ||
    "";

  return { url, token };
}

/**
 * Formats and sanitizes phone numbers according to SwiftVane Gateway rules:
 * - Must include international country code.
 * - WITHOUT '+' sign, spaces, hyphens, brackets, or other non-digit characters.
 * - If given a 10-digit number without country code, prefixes `defaultCountryCode` (default: "91" for India).
 */
export function sanitizePhoneNumber(phone: string, defaultCountryCode: string = "91"): string {
  if (!phone || typeof phone !== "string") {
    throw new Error("Phone number must be a valid, non-empty string.");
  }

  // Remove all non-numeric characters (+, -, spaces, parentheses, etc.)
  let digits = phone.replace(/\D/g, "");

  // If leading 0 is present before country code or local number, strip leading zeroes
  digits = digits.replace(/^0+/, "");

  // If a 10-digit phone number is supplied, prepend default country code (e.g., India 91)
  if (digits.length === 10 && defaultCountryCode) {
    const cleanCode = defaultCountryCode.replace(/\D/g, "");
    digits = `${cleanCode}${digits}`;
  }

  if (digits.length < 8) {
    throw new Error(`Sanitized phone number '${digits}' is too short to be a valid international number.`);
  }

  return digits;
}

// ============================================================================
// Core Gateway Dispatcher
// ============================================================================

/**
 * Sends a generic WhatsApp payload to the SwiftVane WhatsApp Gateway.
 * Inspects rate-limit headers, parses quota objects, and throws typed exceptions.
 */
export async function sendWhatsAppMessage(payload: WhatsAppSendPayload): Promise<WhatsAppSuccessResponse> {
  const { url, token } = getWhatsAppConfig();

  if (!token) {
    const errorMsg = "[WhatsApp] Missing WHATSAPP_TOKEN (or WHATSAPP_API_TOKEN) in environment variables.";
    console.warn(errorMsg);
    throw new WhatsAppApiError(errorMsg, 401, { error: "Missing API token" }, "MISSING_TOKEN");
  }

  // Clean and validate target phone
  const cleanPhone = sanitizePhoneNumber(payload.phone);
  const sanitizedPayload: WhatsAppSendPayload = {
    ...payload,
    phone: cleanPhone,
  };

  // If contact payload exists, sanitize its phone number too
  if (sanitizedPayload.contact?.phone) {
    sanitizedPayload.contact = {
      ...sanitizedPayload.contact,
      phone: sanitizePhoneNumber(sanitizedPayload.contact.phone),
    };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(sanitizedPayload),
    });
  } catch (networkErr: any) {
    console.error("[WhatsApp] Network failure while calling WhatsApp Gateway:", networkErr);
    throw new WhatsAppApiError(
      `Network error connecting to WhatsApp gateway: ${networkErr.message || String(networkErr)}`,
      502,
      null,
      "NETWORK_ERROR"
    );
  }

  // Parse RateLimit & Quota Headers returned on every request
  const rateLimitInfo: WhatsAppRateLimitHeaders = {
    burstLimitPerMinute: response.headers.get("x-ratelimit-limit")
      ? Number(response.headers.get("x-ratelimit-limit"))
      : undefined,
    dailyLimit: response.headers.get("x-quota-daily-limit")
      ? Number(response.headers.get("x-quota-daily-limit"))
      : undefined,
    dailyUsed: response.headers.get("x-quota-daily-used")
      ? Number(response.headers.get("x-quota-daily-used"))
      : undefined,
    dailyRemaining: response.headers.get("x-quota-daily-remaining")
      ? Number(response.headers.get("x-quota-daily-remaining"))
      : undefined,
    dailyResetsAt: response.headers.get("x-quota-daily-reset") || undefined,
  };

  let responseData: any = null;
  const rawText = await response.text();

  if (rawText) {
    try {
      responseData = JSON.parse(rawText);
    } catch {
      responseData = { rawText };
    }
  }

  // --------------------------------------------------------------------------
  // Error Handling
  // --------------------------------------------------------------------------
  if (!response.ok) {
    const errorBody: WhatsAppErrorResponse = responseData || {};
    const errorCode = errorBody.code;
    const errorMsg = errorBody.error || errorBody.message || response.statusText;

    // HTTP 403: TYPE_NOT_IN_PLAN
    if (response.status === 403 && errorCode === "TYPE_NOT_IN_PLAN") {
      if (Array.isArray(errorBody.allowedTypes)) {
        lastKnownAllowedTypes = errorBody.allowedTypes;
      }
      console.error(
        `[WhatsApp] 403 Forbidden - Message type not allowed in plan:`,
        errorBody
      );
      throw new WhatsAppTypeNotAllowedError({
        error: errorBody.error,
        blockedTypes: errorBody.blockedTypes,
        allowedTypes: errorBody.allowedTypes,
        plan: errorBody.plan,
      });
    }

    // HTTP 429: Rate Limit Exceeded or Daily Quota Exceeded
    if (response.status === 429) {
      if (errorCode === "DAILY_LIMIT_EXCEEDED" || errorMsg.toLowerCase().includes("daily")) {
        console.error(`[WhatsApp] 429 Daily Limit Exceeded:`, errorBody);
        throw new WhatsAppDailyLimitError(
          errorBody.error || "Daily WhatsApp message quota reached",
          {
            dailyLimit: errorBody.dailyLimit ?? rateLimitInfo.dailyLimit,
            usedToday: errorBody.usedToday ?? rateLimitInfo.dailyUsed,
            remaining: errorBody.remaining ?? rateLimitInfo.dailyRemaining,
            resetsAt: errorBody.resetsAt ?? rateLimitInfo.dailyResetsAt,
          }
        );
      }

      // Per-minute burst throttle
      console.warn(`[WhatsApp] 429 Burst Rate Limit Exceeded:`, errorBody);
      throw new WhatsAppRateLimitError(
        errorBody.error || `Per-minute WhatsApp burst rate limit exceeded. Retry after ${errorBody.retryAfter || 30}s.`,
        errorBody.retryAfter || 30
      );
    }

    // Generic API Error
    console.error(`[WhatsApp] Gateway error (${response.status}):`, errorBody);
    throw new WhatsAppApiError(
      `WhatsApp Gateway returned status ${response.status}: ${errorMsg}`,
      response.status,
      errorBody,
      errorCode
    );
  }

  // --------------------------------------------------------------------------
  // Successful Response Handling
  // --------------------------------------------------------------------------
  const result = (responseData || {}) as WhatsAppSuccessResponse;
  result.ok = result.ok ?? true;
  result.success = result.success ?? true;
  result.rateLimitInfo = rateLimitInfo;

  // Synthesize or normalize quota info from headers if quota object is missing or partial
  if (!result.quota && (rateLimitInfo.dailyLimit !== undefined || rateLimitInfo.dailyRemaining !== undefined)) {
    result.quota = {
      dailyLimit: rateLimitInfo.dailyLimit || 0,
      usedToday: rateLimitInfo.dailyUsed || 0,
      dailyRemaining: rateLimitInfo.dailyRemaining || 0,
      resetsAt: rateLimitInfo.dailyResetsAt || "",
    };
  } else if (result.quota) {
    if (rateLimitInfo.dailyRemaining !== undefined && result.quota.dailyRemaining === undefined) {
      result.quota.dailyRemaining = rateLimitInfo.dailyRemaining;
    }
  }

  return result;
}

// ============================================================================
// Specialized Public Export Functions
// ============================================================================

/**
 * 1. Text Message
 * Sends a standard plain-text message.
 * 
 * @param phone Recipient phone number (international format e.g. "919876543210")
 * @param text The text message content
 */
export async function sendTextMessage(
  phone: string,
  text: string
): Promise<WhatsAppSuccessResponse> {
  if (!text || !text.trim()) {
    throw new Error("Text message content cannot be empty.");
  }
  return sendWhatsAppMessage({
    phone,
    message: text,
  });
}

/**
 * 2. Image (URL or Base64)
 * Sends an image attachment with an optional caption.
 * 
 * @param phone Recipient phone number
 * @param imageUrl HTTP URL or Base64 data URI (e.g. "data:image/png;base64,...")
 * @param caption Optional text caption
 * @param contentType Optional MIME type (defaults to inferred or "image/jpeg")
 */
export async function sendImage(
  phone: string,
  imageUrl: string,
  caption?: string,
  contentType?: string
): Promise<WhatsAppSuccessResponse> {
  if (!imageUrl) {
    throw new Error("Image URL or Base64 source is required.");
  }

  const mime = contentType || inferMimeType(imageUrl, "image/jpeg");
  return sendWhatsAppMessage({
    phone,
    message: caption,
    attachment: {
      url: imageUrl,
      contentType: mime,
    },
  });
}

/**
 * 3. Document / PDF
 * Sends a document/PDF file with an explicit file name and optional caption.
 * 
 * @param phone Recipient phone number
 * @param documentUrl HTTP URL or Base64 data URI
 * @param fileName Visible file name (e.g. "invoice.pdf")
 * @param caption Optional caption/message
 * @param contentType Optional MIME type (defaults to inferred or "application/pdf")
 */
export async function sendDocument(
  phone: string,
  documentUrl: string,
  fileName: string,
  caption?: string,
  contentType?: string
): Promise<WhatsAppSuccessResponse> {
  if (!documentUrl) {
    throw new Error("Document URL is required.");
  }

  const mime = contentType || inferMimeType(documentUrl, "application/pdf");
  return sendWhatsAppMessage({
    phone,
    message: caption,
    attachment: {
      url: documentUrl,
      fileName: fileName || "document.pdf",
      contentType: mime,
    },
  });
}

/**
 * 4. Video
 * Sends a video file with an optional caption.
 * 
 * @param phone Recipient phone number
 * @param videoUrl HTTP URL or Base64 data URI
 * @param caption Optional caption
 * @param contentType Optional MIME type (defaults to "video/mp4")
 */
export async function sendVideo(
  phone: string,
  videoUrl: string,
  caption?: string,
  contentType?: string
): Promise<WhatsAppSuccessResponse> {
  if (!videoUrl) {
    throw new Error("Video URL is required.");
  }

  const mime = contentType || inferMimeType(videoUrl, "video/mp4");
  return sendWhatsAppMessage({
    phone,
    message: caption,
    attachment: {
      url: videoUrl,
      contentType: mime,
    },
  });
}

/**
 * 5. Audio / Voice
 * Sends an audio track or voice message.
 * 
 * @param phone Recipient phone number
 * @param audioUrl HTTP URL or Base64 data URI
 * @param contentType Optional MIME type (defaults to "audio/mpeg")
 */
export async function sendAudio(
  phone: string,
  audioUrl: string,
  contentType?: string
): Promise<WhatsAppSuccessResponse> {
  if (!audioUrl) {
    throw new Error("Audio URL is required.");
  }

  const mime = contentType || inferMimeType(audioUrl, "audio/mpeg");
  return sendWhatsAppMessage({
    phone,
    attachment: {
      url: audioUrl,
      contentType: mime,
    },
  });
}

/**
 * 6. Location
 * Sends geographic coordinates with optional venue name and address.
 * 
 * @param phone Recipient phone number
 * @param lat Latitude (-90 to 90)
 * @param lng Longitude (-180 to 180)
 * @param name Optional location or business name
 * @param address Optional street address
 */
export async function sendLocation(
  phone: string,
  lat: number,
  lng: number,
  name?: string,
  address?: string
): Promise<WhatsAppSuccessResponse> {
  if (typeof lat !== "number" || typeof lng !== "number") {
    throw new Error("Valid latitude and longitude numbers are required.");
  }

  return sendWhatsAppMessage({
    phone,
    location: {
      latitude: lat,
      longitude: lng,
      name,
      address,
    },
  });
}

/**
 * 7. Contact Card (vCard)
 * Sends a contact card to the recipient.
 * 
 * @param phone Recipient phone number
 * @param fullName Name of the contact
 * @param contactPhone Phone number of the contact
 */
export async function sendContact(
  phone: string,
  fullName: string,
  contactPhone: string
): Promise<WhatsAppSuccessResponse> {
  if (!fullName || !contactPhone) {
    throw new Error("Full name and contact phone number are required for contact card.");
  }

  return sendWhatsAppMessage({
    phone,
    contact: {
      fullName,
      phone: contactPhone,
    },
  });
}

/**
 * 8. Interactive Poll
 * Sends an interactive poll with multiple options.
 * 
 * @param phone Recipient phone number
 * @param question The poll question
 * @param options Array of choices (at least 2 options required)
 * @param selectableCount Number of selectable options (default: 1)
 */
export async function sendPoll(
  phone: string,
  question: string,
  options: string[],
  selectableCount: number = 1
): Promise<WhatsAppSuccessResponse> {
  if (!question || !question.trim()) {
    throw new Error("Poll question cannot be empty.");
  }
  if (!Array.isArray(options) || options.length < 2) {
    throw new Error("Poll must contain at least 2 options.");
  }

  return sendWhatsAppMessage({
    phone,
    poll: {
      name: question.trim(),
      options: options.map((opt) => opt.trim()).filter(Boolean),
      selectableCount: selectableCount > 0 ? selectableCount : 1,
    },
  });
}

// ============================================================================
// Backward-Compatible Helper
// ============================================================================

/**
 * Legacy & universal dispatch helper compatible with existing routes in this project.
 * Supports both text messages and attachment payloads (URL or Base64).
 * 
 * @param to Recipient phone number
 * @param message Message text or caption
 * @param attachment Optional attachment object { url, contentBase64, contentType, fileName }
 */
export async function sendWhatsApp(
  to: string,
  message: string,
  attachment?: {
    url?: string;
    contentBase64?: string;
    contentType?: string;
    fileName?: string;
    [key: string]: any;
  }
): Promise<WhatsAppSuccessResponse> {
  const { token } = getWhatsAppConfig();
  if (!token) {
    console.warn("[WhatsApp Helper] Missing WHATSAPP_TOKEN. Skipping dispatch.");
    return {
      ok: false,
      success: false,
      messageId: "mock-skipped",
      status: "SKIPPED_NO_TOKEN",
      to,
    };
  }

  // If no attachment is provided, dispatch as a plain text message
  if (!attachment || (!attachment.url && !attachment.contentBase64)) {
    return sendTextMessage(to, message || "");
  }

  // Resolve media URL (or format Base64 data URI if contentBase64 is passed)
  let mediaUrl = attachment.url || "";
  const contentType = attachment.contentType || inferMimeType(mediaUrl, "application/octet-stream");

  if (!mediaUrl && attachment.contentBase64) {
    mediaUrl = attachment.contentBase64.startsWith("data:")
      ? attachment.contentBase64
      : `data:${contentType};base64,${attachment.contentBase64}`;
  }

  const fileName = attachment.fileName || (mediaUrl.startsWith("http") ? getFileNameFromUrl(mediaUrl) : "file");

  if (contentType.startsWith("image/")) {
    return sendImage(to, mediaUrl, message, contentType);
  }

  if (contentType.startsWith("video/")) {
    return sendVideo(to, mediaUrl, message, contentType);
  }

  if (contentType.startsWith("audio/")) {
    return sendAudio(to, mediaUrl, contentType);
  }

  return sendDocument(to, mediaUrl, fileName, message, contentType);
}

// ============================================================================
// Internal Helpers
// ============================================================================

function inferMimeType(urlOrData: string, fallback: string): string {
  if (urlOrData.startsWith("data:")) {
    const match = urlOrData.match(/^data:([^;]+);/);
    if (match) return match[1];
  }

  const cleanUrl = urlOrData.split("?")[0].split("#")[0].toLowerCase();
  const ext = cleanUrl.substring(cleanUrl.lastIndexOf(".") + 1);

  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    pdf: "application/pdf",
    mp4: "video/mp4",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    csv: "text/csv",
    txt: "text/plain",
  };

  return mimeMap[ext] || fallback;
}

function getFileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.substring(pathname.lastIndexOf("/") + 1);
    return base || "file";
  } catch {
    const clean = url.split("?")[0].split("#")[0];
    return clean.substring(clean.lastIndexOf("/") + 1) || "file";
  }
}
