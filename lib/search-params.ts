export const getParam = (params: URLSearchParams, key: string, fallback = "") =>
  params.get(key) ?? fallback;

export const setParam = (
  params: URLSearchParams,
  key: string,
  value: string | number | null,
) => {
  if (value === null || value === "") {
    params.delete(key);
  } else {
    params.set(key, String(value));
  }
  return params;
};

export const withParams = (params: URLSearchParams, updates: Record<string, string | number | null>) => {
  const next = new URLSearchParams(params.toString());
  Object.entries(updates).forEach(([key, value]) => {
    setParam(next, key, value);
  });
  return next;
};
