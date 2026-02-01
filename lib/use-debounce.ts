"use client";

import { useEffect, useState } from "react";

export const useDebounce = <T,>(value: T, delayMs = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(handle);
  }, [value, delayMs]);

  return debounced;
};
