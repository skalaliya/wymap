export const formatShortDate = (value: Date) =>
  value.toLocaleDateString(undefined, { month: "short", day: "numeric" });

export const formatDateTime = (value: Date) =>
  value.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatTime = (value: Date) =>
  value.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
