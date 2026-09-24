export function toCsv(rows: Record<string, string | number>[], headers: { key: string; label: string }[]): string {
  function escape(value: string | number) {
    const s = String(value);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  const lines = [headers.map((h) => escape(h.label)).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h.key] ?? '')).join(','));
  }
  return lines.join('\r\n');
}
