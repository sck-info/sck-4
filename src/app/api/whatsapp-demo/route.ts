import { NextResponse } from "next/server";
import {
  sendTextMessage,
  sendImage,
  sendDocument,
  sendVideo,
  sendAudio,
  sendLocation,
  sendContact,
  sendPoll,
  getLastKnownAllowedTypes,
  WhatsAppRateLimitError,
  WhatsAppDailyLimitError,
  WhatsAppTypeNotAllowedError,
  WhatsAppApiError,
  WhatsAppSuccessResponse,
} from "@/lib/whatsapp";

/**
 * Sample Next.js App Router API Route demonstrating how to integrate and use the
 * SwiftVane WhatsApp Gateway across multiple real-world application scenarios.
 * 
 * Scenarios covered:
 * 1. OTP Notification
 * 2. Appointment / Booking Confirmation
 * 3. Document / Invoice Dispatch
 * 4. Image Dispatch (e.g. promotional flyer or payment receipt)
 * 5. Location Sharing (e.g. session venue / studio)
 * 6. Contact Sharing (e.g. seeker helpline or coordinator)
 * 7. Interactive Poll (e.g. seeker feedback or scheduling)
 * 
 * Also demonstrates error handling for:
 * - 429 RateLimit (burst limit throttle with Retry-After)
 * - 429 DailyLimit (daily cap reached)
 * - 403 TypeNotAllowed (feature not allowed in plan - permanent, non-retryable)
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, phone, ...payload } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    let result: WhatsAppSuccessResponse;

    switch (action) {
      case "otp": {
        // Example: Sending a 6-digit OTP code
        const otp = payload.otp || Math.floor(100000 + Math.random() * 900000).toString();
        const userName = payload.name || "Seeker";
        const message = `Dear ${userName},\n\nYour one-time verification code is: *${otp}*\n\nThis code expires in 10 minutes. For your security, do not share this with anyone.\n\nWarm regards,\nSharath Kancherla Team`;

        result = await sendTextMessage(phone, message);
        break;
      }

      case "appointment-reminder": {
        // Example: Session or consultation reminder
        const userName = payload.name || "Seeker";
        const sessionTitle = payload.sessionTitle || "Meditation & Breathwork Immersion";
        const sessionDate = payload.date || "Tomorrow, 7:00 AM IST";
        const venue = payload.venue || "Art of Living Center, Bangalore";

        const message =
          `Namaste ${userName} 🙏\n\n` +
          `This is a friendly reminder for your upcoming session:\n` +
          `📌 *Offering*: ${sessionTitle}\n` +
          `⏰ *Time*: ${sessionDate}\n` +
          `📍 *Venue*: ${venue}\n\n` +
          `Please arrive 15 minutes prior. If you have any questions, feel free to reply directly here.`;

        result = await sendTextMessage(phone, message);
        break;
      }

      case "invoice": {
        // Example: Sending an invoice or booking confirmation PDF
        const documentUrl =
          payload.documentUrl ||
          "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
        const fileName = payload.fileName || "Booking-Receipt.pdf";
        const caption =
          payload.caption ||
          "Here is your booking receipt. Thank you for your enrollment!";

        result = await sendDocument(phone, documentUrl, fileName, caption);
        break;
      }

      case "image": {
        // Example: Sending an event poster or payment confirmation banner
        const imageUrl =
          payload.imageUrl ||
          "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80";
        const caption = payload.caption || "Join us for morning sunrise meditation!";

        result = await sendImage(phone, imageUrl, caption);
        break;
      }

      case "location": {
        // Example: Sharing venue location coordinates
        const lat = payload.latitude || 12.9716;
        const lng = payload.longitude || 77.5946;
        const name = payload.locationName || "Sharath Kancherla Wellness Studio";
        const address = payload.address || "Koramangala, Bangalore, India";

        result = await sendLocation(phone, lat, lng, name, address);
        break;
      }

      case "contact": {
        // Example: Sharing coordinator contact card
        const contactName = payload.contactName || "SCK Support Desk";
        const contactPhone = payload.contactPhone || "919876543210";

        result = await sendContact(phone, contactName, contactPhone);
        break;
      }

      case "poll": {
        // Example: Gathering seeker feedback or preferred workshop day
        const question = payload.question || "Which day works best for the next workshop?";
        const options = payload.options || ["Saturday 10 AM", "Sunday 10 AM", "Sunday 5 PM"];
        const selectableCount = payload.selectableCount || 1;

        result = await sendPoll(phone, question, options, selectableCount);
        break;
      }

      case "video": {
        const videoUrl = payload.videoUrl || "https://www.w3schools.com/html/mov_bbb.mp4";
        const caption = payload.caption || "Introductory breathing technique tutorial";

        result = await sendVideo(phone, videoUrl, caption);
        break;
      }

      case "audio": {
        const audioUrl = payload.audioUrl || "https://www.w3schools.com/html/horse.mp3";
        result = await sendAudio(phone, audioUrl);
        break;
      }

      default: {
        return NextResponse.json(
          {
            error: `Invalid action '${action}'. Supported actions: 'otp', 'appointment-reminder', 'invoice', 'image', 'video', 'audio', 'location', 'contact', 'poll'`,
          },
          { status: 400 }
        );
      }
    }

    // ------------------------------------------------------------------------
    // Quota & Rate Limit Inspection
    // ------------------------------------------------------------------------
    if (result.quota) {
      console.log(
        `[WhatsApp Gateway] Dispatched successfully! MessageId: ${result.messageId} | ` +
        `Daily Quota: ${result.quota.usedToday}/${result.quota.dailyLimit} used | ` +
        `Remaining: ${result.quota.dailyRemaining} | Resets at: ${result.quota.resetsAt}`
      );
    } else {
      console.log(`[WhatsApp Gateway] Dispatched successfully! MessageId: ${result.messageId}`);
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      status: result.status,
      to: result.to,
      quota: result.quota,
      rateLimitInfo: result.rateLimitInfo,
    });
  } catch (err: any) {
    // ------------------------------------------------------------------------
    // Detailed Error Handling
    // ------------------------------------------------------------------------

    // Case 1: HTTP 429 - Burst Rate Limit Throttle
    if (err instanceof WhatsAppRateLimitError) {
      console.warn(
        `[WhatsApp Demo API] Burst rate limit exceeded. Retry after: ${err.retryAfter}s`
      );
      return NextResponse.json(
        {
          success: false,
          code: err.code,
          error: err.message,
          retryAfter: err.retryAfter,
        },
        {
          status: 429,
          headers: err.retryAfter ? { "Retry-After": String(err.retryAfter) } : {},
        }
      );
    }

    // Case 2: HTTP 429 - Daily Limit Cap Exceeded
    if (err instanceof WhatsAppDailyLimitError) {
      console.error(
        `[WhatsApp Demo API] Daily message quota reached. Used: ${err.usedToday}/${err.dailyLimit}. Resets at: ${err.resetsAt}`
      );
      return NextResponse.json(
        {
          success: false,
          code: err.code,
          error: err.message,
          dailyLimit: err.dailyLimit,
          usedToday: err.usedToday,
          remaining: err.remaining,
          resetsAt: err.resetsAt,
        },
        { status: 429 }
      );
    }

    // Case 3: HTTP 403 - Type Not in Plan (Permanent, Non-retryable)
    if (err instanceof WhatsAppTypeNotAllowedError) {
      console.error(
        `[WhatsApp Demo API] Feature not permitted by gateway plan:`,
        { blocked: err.blockedTypes, allowed: err.allowedTypes, plan: err.plan }
      );
      return NextResponse.json(
        {
          success: false,
          code: err.code,
          error: err.message,
          blockedTypes: err.blockedTypes,
          allowedTypes: err.allowedTypes,
          plan: err.plan,
          isPermanent: err.isPermanent,
        },
        { status: 403 }
      );
    }

    // Case 4: Other Gateway Errors
    if (err instanceof WhatsAppApiError) {
      console.error(
        `[WhatsApp Demo API] Gateway error [${err.statusCode}]: ${err.message}`,
        err.responseBody
      );
      return NextResponse.json(
        {
          success: false,
          code: err.code || "GATEWAY_ERROR",
          error: err.message,
          details: err.responseBody,
        },
        { status: err.statusCode || 502 }
      );
    }

    // Fallback unexpected server errors
    console.error("[WhatsApp Demo API] Unexpected error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "An unexpected error occurred while sending WhatsApp message.",
      },
      { status: 500 }
    );
  }
}

/**
 * GET Handler for inspecting plan capabilities and gateway health
 */
export async function GET() {
  const allowedTypes = getLastKnownAllowedTypes();
  return NextResponse.json({
    gateway: "SwiftVane WhatsApp Gateway",
    allowedTypes: allowedTypes || "Discoverable after first dispatch",
    samplePayloads: {
      otp: { action: "otp", phone: "919876543210", name: "Rohan", otp: "123456" },
      reminder: { action: "appointment-reminder", phone: "919876543210", name: "Rohan" },
      invoice: { action: "invoice", phone: "919876543210", documentUrl: "https://example.com/receipt.pdf" },
      poll: { action: "poll", phone: "919876543210", question: "Preferred time?", options: ["Morning", "Evening"] },
    },
  });
}

