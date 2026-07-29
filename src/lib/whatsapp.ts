const WHATSAPP_GATEWAY_URL = process.env.WHATSAPP_GATEWAY_URL || "http://localhost:3001";
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;

export async function sendWhatsApp(to: string, message: string, attachment?: any) {
  if (!WHATSAPP_API_TOKEN) {
    console.warn("[WhatsApp Helper] Missing WHATSAPP_API_TOKEN. Skipping dispatch.");
    return;
  }
  try {
    const response = await fetch(`${WHATSAPP_GATEWAY_URL}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: WHATSAPP_API_TOKEN,
        phone: to,
        message: message,
        attachment,
      }),
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`[WhatsApp Helper] Gateway error response: ${response.status} - ${text}`);
      throw new Error(`Failed to send WhatsApp message: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (err) {
    console.error("[WhatsApp Helper] Failed to send WhatsApp message:", err);
    throw err;
  }
}
