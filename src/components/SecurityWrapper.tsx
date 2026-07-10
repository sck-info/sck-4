"use client";

import React, { useState, useEffect } from "react";

export default function SecurityWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const auth = sessionStorage.getItem("site_auth");
      if (auth === "SharathJGD") {
        setIsAuthenticated(true);
        return;
      }

      const password = prompt("Enter passcode to access this site:");
      if (password === "SharathJGD") {
        sessionStorage.setItem("site_auth", "SharathJGD");
        setIsAuthenticated(true);
      } else {
        alert("Incorrect passcode.");
        checkAuth(); // Keep asking
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return null;
  }

  return <>{children}</>;
}
