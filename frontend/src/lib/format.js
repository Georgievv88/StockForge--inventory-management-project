export const money = (value) =>
  new Intl.NumberFormat("mk-MK", { style: "currency", currency: "MKD" }).format(
    value,
  );
export const dateTime = (value) => new Date(value).toLocaleString();

export function downloadCsv(filename, rows) {
  const csv = rows
    .map((row) =>
      row
        .map((value) => {
          let text = String(value ?? "");
          if (typeof value === "string" && /^[\s]*[=+\-@]/.test(text))
            text = "'" + text;
          return `"${text.replaceAll('"', '""')}"`;
        })
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
