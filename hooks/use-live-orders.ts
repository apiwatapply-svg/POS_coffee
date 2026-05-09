"use client";

import { useEffect, useState } from "react";

export function useLiveOrders(onChange: () => void) {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    setIsConnected(true);
    const interval = window.setInterval(onChange, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [onChange]);

  return { isConnected };
}
