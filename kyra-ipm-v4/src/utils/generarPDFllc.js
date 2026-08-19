// /src/utils/generarPDFllc.js
// Genera el PDF de invoice LLC (Mercury LLC) con jsPDF.
// 100% cliente. Sin servidor de PDF.
// El PDF va en inglés (es un documento internacional).

import { jsPDF } from 'jspdf'

const MERCURY_LLC = {
  name:    'Mercury LLC',
  address: '1234 Brickell Ave, Suite 500',
  city:    'Miami, FL 33131, USA',
  email:   'billing@kyraagency.com',
  ein:     'EIN: 82-1234567',
}

const MESES_EN = {
  enero: 'January', febrero: 'February', marzo: 'March',
  abril: 'April',   mayo: 'May',        junio: 'June',
  julio: 'July',    agosto: 'August',   septiembre: 'September',
  octubre: 'October', noviembre: 'November', diciembre: 'December',
}

/**
 * Genera y descarga el PDF de invoice LLC.
 * @param {Object} linea  — línea de facturación (con importeNeto, moneda, etc.)
 * @param {Object} cliente — objeto cliente con nombre, email, dirección
 * @param {Object} servicio — objeto servicio con nombre
 * @param {string} nroInvoice — e.g. "INV-2026-042"
 * @returns {string} dataUri del PDF generado (para preview)
 */
export function generarPDFllc({ linea, cliente, servicio, nroInvoice }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 20

  // ── Colores ──────────────────────────────────────────────────────────────
  const negro   = [20, 20, 20]
  const gris    = [100, 100, 100]
  const grisCla = [200, 200, 200]
  const verde   = [34, 197, 94]
  const fondo   = [248, 250, 252]

  // ── Header ───────────────────────────────────────────────────────────────
  doc.setFillColor(...fondo)
  doc.rect(0, 0, W, 45, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...negro)
  doc.text(MERCURY_LLC.name, margin, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...gris)
  doc.text(MERCURY_LLC.address, margin, 27)
  doc.text(MERCURY_LLC.city,    margin, 32)
  doc.text(MERCURY_LLC.email,   margin, 37)
  doc.text(MERCURY_LLC.ein,     margin, 42)

  // INVOICE label (derecha)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(...verde)
  doc.text('INVOICE', W - margin, 20, { align: 'right' })

  // ── Línea separadora ─────────────────────────────────────────────────────
  doc.setDrawColor(...grisCla)
  doc.setLineWidth(0.5)
  doc.line(margin, 48, W - margin, 48)

  // ── Invoice info ─────────────────────────────────────────────────────────
  let y = 58
  const col2 = W / 2 + 10

  _label(doc, 'Invoice Number', margin, y, gris)
  _value(doc, nroInvoice, margin, y + 6, negro)

  const mesEN = MESES_EN[linea.mes] || linea.mes
  _label(doc, 'Issue Date',    col2, y, gris)
  _value(doc, _hoy(),          col2, y + 6, negro)

  _label(doc, 'Period',   margin, y + 14, gris)
  _value(doc, `${mesEN} ${linea.anio}`, margin, y + 20, negro)

  _label(doc, 'Due Date', col2, y + 14, gris)
  _value(doc, _ultimoDiaMes(linea.mes, linea.anio), col2, y + 20, negro)

  // ── Bill To ───────────────────────────────────────────────────────────────
  y += 34
  doc.setFillColor(...fondo)
  doc.rect(margin, y - 4, W - margin * 2, 28, 'F')

  _label(doc, 'BILL TO', margin + 4, y + 2, gris)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...negro)
  doc.text(cliente?.nombre || 'Client', margin + 4, y + 9)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...gris)
  if (cliente?.email)     doc.text(cliente.email,     margin + 4, y + 15)
  if (cliente?.direccion) doc.text(cliente.direccion, margin + 4, y + 20)

  // ── Tabla de servicios ────────────────────────────────────────────────────
  y += 38

  // Encabezado tabla
  doc.setFillColor(...negro)
  doc.rect(margin, y, W - margin * 2, 9, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(255, 255, 255)
  doc.text('Description',  margin + 4,        y + 6)
  doc.text('Qty',          margin + 100,       y + 6)
  doc.text('Unit Price',   margin + 115,       y + 6)
  doc.text('Amount',       W - margin - 4,     y + 6, { align: 'right' })

  // Fila de servicio
  y += 9
  doc.setFillColor(255, 255, 255)
  doc.rect(margin, y, W - margin * 2, 12, 'F')
  doc.setDrawColor(...grisCla)
  doc.rect(margin, y, W - margin * 2, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...negro)

  const desc = servicio?.nombre || 'Marketing Services'
  const qty  = linea.cantidadHoras || 1
  const unitPrice = linea.cantidadHoras
    ? _fmtUSD(linea.tarifaHora)
    : _fmtUSD(linea.importeNeto)
  const amount = _fmtUSD(linea.importeNeto)

  doc.text(desc,          margin + 4,      y + 8)
  doc.text(String(qty),   margin + 100,    y + 8)
  doc.text(unitPrice,     margin + 115,    y + 8)
  doc.text(amount,        W - margin - 4,  y + 8, { align: 'right' })

  // ── Resumen ───────────────────────────────────────────────────────────────
  y += 20
  const xResumen = W - margin - 70

  _summaryRow(doc, 'Subtotal',  _fmtUSD(linea.importeNeto),    xResumen, y, gris, negro)
  y += 8
  _summaryRow(doc, 'Tax (12.5%)', _fmtUSD(linea.impuesto || 0), xResumen, y, gris, negro)

  y += 6
  doc.setDrawColor(...grisCla)
  doc.line(xResumen, y, W - margin, y)
  y += 6

  // Total
  doc.setFillColor(...verde)
  doc.rect(xResumen - 4, y - 4, W - margin - xResumen + 8, 12, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL',               xResumen,       y + 4)
  doc.text(_fmtUSD(linea.importeBruto), W - margin - 4, y + 4, { align: 'right' })

  // ── Notas / footer ────────────────────────────────────────────────────────
  y += 24
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(...gris)
  doc.text('Payment terms: Net 30 days. Please transfer to the account on file.', margin, y)
  doc.text('Thank you for your business.', margin, y + 5)

  // Línea y número de página
  doc.setDrawColor(...grisCla)
  doc.line(margin, 280, W - margin, 280)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(`${MERCURY_LLC.name} · ${nroInvoice}`, margin, 285)
  doc.text('Page 1 of 1', W - margin, 285, { align: 'right' })

  // ── Descarga ─────────────────────────────────────────────────────────────
  const nombreCliente = (cliente?.nombre || 'Client').replace(/\s+/g, '_')
  const mesNombre     = (MESES_EN[linea.mes] || linea.mes).slice(0, 3)
  const filename      = `Invoice_${nombreCliente}_${mesNombre}_${linea.anio}.pdf`

  doc.save(filename)

  return doc.output('datauristring')
}

// ── helpers ───────────────────────────────────────────────────────────────────

function _label(doc, text, x, y, color) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...color)
  doc.text(text.toUpperCase(), x, y)
}

function _value(doc, text, x, y, color) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...color)
  doc.text(String(text), x, y)
}

function _summaryRow(doc, label, value, x, y, labelColor, valueColor) {
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...labelColor)
  doc.text(label, x, y)
  doc.setTextColor(...valueColor)
  doc.text(value, 190, y, { align: 'right' })
}

function _fmtUSD(n) {
  if (n == null) return 'USD 0.00'
  return `USD ${Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
}

function _hoy() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function _ultimoDiaMes(mes, anio) {
  const idx = ['enero','febrero','marzo','abril','mayo','junio',
    'julio','agosto','septiembre','octubre','noviembre','diciembre'].indexOf(mes)
  if (idx < 0) return ''
  const d = new Date(anio, idx + 1, 0)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
