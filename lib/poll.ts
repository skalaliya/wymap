"use client";

import { useEffect, useRef } from "react";

export const usePoll = (callback: () => void, intervalMs: number) => {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  }, [callback]);

  useEffect(() => {
    const tick = () => saved.current();
    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
};
