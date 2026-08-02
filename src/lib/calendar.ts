export function getGoogleCalendarUrl(booking: any, isAdmin: boolean) {
  if (!booking) return "";
  
  // Extract slot variables
  const slotDate = booking.slot ? booking.slot.slotDate : booking.slotDate;
  const startTime = booking.slot ? booking.slot.startTime : booking.startTime;
  const endTime = booking.slot ? booking.slot.endTime : booking.endTime;
  
  if (!slotDate || !startTime || !endTime) return "";

  const subCategoryName = booking.subCategory ? booking.subCategory.name : booking.subCategoryName;
  const selectedFormat = booking.selectedFormat || "";
  const loc = booking.location;

  // Clean strings for dates parameter (basic ISO format: YYYYMMDDTHHmmSS)
  const cleanTimeStr = (t: string) => t.replace(/:/g, "").padEnd(6, "0").slice(0, 6);
  const cleanDateStr = (d: any) => {
    const s = typeof d === "string" ? d : new Date(d).toISOString().split("T")[0];
    return s.replace(/-/g, "");
  };

  const startStr = `${cleanDateStr(slotDate)}T${cleanTimeStr(startTime)}`;
  const endStr = `${cleanDateStr(slotDate)}T${cleanTimeStr(endTime)}`;
  const dates = `${startStr}/${endStr}`;

  const title = encodeURIComponent(`${subCategoryName} Session`);
  
  // Format location
  let eventLocation = "";
  if (loc) {
    if (loc.type === "offline") {
      eventLocation = loc.name;
    } else {
      eventLocation = loc.url;
    }
  } else {
    eventLocation = selectedFormat;
  }
  const locationParam = encodeURIComponent(eventLocation);

  // Format description details
  let details = "";
  if (isAdmin) {
    const pName = booking.user?.name || booking.userName || "N/A";
    const pEmail = booking.user?.email || booking.userEmail || "N/A";
    const pPhone = booking.user?.phone || booking.userPhone || "N/A";
    
    details = `Session Offering: ${subCategoryName}
Participant Name: ${pName}
Participant Email: ${pEmail}
Participant Phone: ${pPhone}
Format: ${selectedFormat}
Location Details: ${loc ? `${loc.name} (${loc.url})` : "To be Scheduled"}`;
  } else {
    const pName = booking.user?.name || "there";
    details = `Hi ${pName}!

This is a reminder for your upcoming session booking.

Session Offering: ${subCategoryName}
Format: ${selectedFormat}
Location/Meeting URL: ${loc ? `${loc.name} (${loc.url})` : "To be Scheduled"}

Looking forward to seeing you at the session!`;
  }
  const detailsParam = encodeURIComponent(details);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${detailsParam}&location=${locationParam}&ctz=Asia/Kolkata`;
}
