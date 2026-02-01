const escapeCell = (value: string | number | null | undefined) => {
  const text = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export const toCsv = (rows: Array<Array<string | number | null | undefined>>) =>
  rows.map((row) => row.map(escapeCell).join(",")).join("\n");
