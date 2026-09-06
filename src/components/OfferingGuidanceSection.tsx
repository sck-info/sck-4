"use client";

import React, { useState } from "react";
import {
  OfferingGuidanceModal,
  OfferingGuidanceBottomBanner,
} from "./OfferingGuidance";

export * from "./OfferingGuidance";

export default function OfferingGuidanceSection() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <OfferingGuidanceBottomBanner onOpen={() => setOpen(true)} />
      <OfferingGuidanceModal open={open} onOpenChange={setOpen} />
    </>
  );
}
