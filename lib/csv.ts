function escapeField(value: string | number): string {
  const s = String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

/** Serializa linhas em CSV (CRLF, BOM UTF-8 para Excel). */
export function toCsv(rows: (string | number)[][]): string {
  const body = rows.map((row) => row.map(escapeField).join(',')).join('\r\n')
  return '\uFEFF' + body
}
