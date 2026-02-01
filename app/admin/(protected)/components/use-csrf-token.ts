"use client";

import { useEffect, useState } from "react";

export const useCsrfToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      const response = await fetch("/api/csrf");
      const data = await response.json();
      setToken(data.token);
    };
    fetchToken();
  }, []);

  return token;
};
