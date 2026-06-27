// SOMENTE SERVIDOR — gera planilhas (.xlsx) e PDFs a partir de linhas tabulares.
import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

type Rows = (string | number)[][]

/** Gera um .xlsx (primeira linha = cabeçalho em negrito) e retorna o Buffer. */
export async function buildXlsx(sheetName: string, rows: Rows): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet(sheetName.slice(0, 31)) // limite do Excel para nome de aba

  rows.forEach((r, i) => {
    const row = ws.addRow(r)
    if (i === 0) row.font = { bold: true }
  })

  // Largura automática simples por coluna (com teto).
  ws.columns.forEach((col) => {
    let max = 10
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = String(cell.value ?? '').length
      if (len > max) max = len
    })
    col.width = Math.min(max + 2, 50)
  })

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}

/** Gera um PDF em paisagem com título + tabela (cabeçalho na 1ª linha) e retorna o Buffer. */
export function buildPdf(title: string, rows: Rows): Buffer {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt' })
  doc.setFontSize(14)
  doc.text(title, 40, 40)

  autoTable(doc, {
    head: [rows[0].map(String)],
    body: rows.slice(1).map((r) => r.map(String)),
    startY: 56,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [44, 74, 46], textColor: [245, 240, 232] }, // verde floresta / on-dark
    alternateRowStyles: { fillColor: [247, 243, 236] }, // canvas
    margin: { left: 40, right: 40 },
  })

  return Buffer.from(doc.output('arraybuffer'))
}
