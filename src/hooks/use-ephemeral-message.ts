"use client";

import { useEffect, useState } from "react";

/** Success toasts: show briefly, then clear. Errors should stay until the user acts. */
export function useEphemeralMessage(durationMs = 3500) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(""), durationMs);
    return () => window.clearTimeout(timer);
  }, [message, durationMs]);

  return [message, setMessage] as const;
}
