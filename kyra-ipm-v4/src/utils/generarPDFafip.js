// /src/utils/generarPDFafip.js
// Genera el comprobante PDF para facturas AFIP (A, B, C) con jsPDF.
// Imita el layout de un recibo/comprobante argentino estándar.

import { jsPDF } from 'jspdf'

const ENTIDADES = {
  1: { nombre: 'Kyra SRL', cuit: '30-71234567-8', iibb: '123-456789-0', domicilio: 'Av. Corrientes 1234, CABA' },
  2: { nombre: 'Kyra Monotributo', cuit: '27-12345678-9', iibb: 'Monotributista', domicilio: 'Av. Corrientes 1234, CABA' },
}

const MESES_ES = {
  enero:'Enero', febrero:'Febrero', marzo:'Marzo', abril:'Abril',
  mayo:'Mayo', junio:'Junio', julio:'Julio', agosto:'Agosto',
  septiembre:'Septiembre', octubre:'Octubre', noviembre:'Noviembre', diciembre:'Diciembre',
}

function fmtARS(n) {
  if (n == null) return '$0,00'
  return '$ ' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 })
}

function fmtFecha(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/**
 * Genera y descarga el comprobante PDF para facturas A, B, C.
 * @returns {string} dataUri del PDF
 */
export function generarPDFafip({ linea, cliente, servicio, entidad }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 16

  const emisor = ENTIDADES[linea.entidadId] || { nombre: entidad?.nombre || 'Kyra', cuit: '—' }
  const tipo   = linea.tipoFactura
  const nro    = linea.nroFactura || '—'

  // ─── Colores ──────────────────────────────────────────────────────────────
  const negro   = [20, 20, 20]
  const gris    = [100, 100, 100]
  const grisCla = [210, 210, 210]
  const azul    = [37, 99, 235]
  const fondoHdr = [241, 245, 249]

  // ─── Header: letra de factura centrada ───────────────────────────────────
  // Caja izquierda
  doc.setFillColor(...fondoHdr)
  doc.rect(margin, 12, 55, 30, 'F')
  doc.setDrawColor(...grisCla)
  doc.rect(margin, 12, 55, 30)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...gris)
  doc.text(emisor.nombre.toUpperCase(), margin + 4, 21)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(emisor.domicilio, margin + 4, 27)
  doc.text(`CUIT: ${emisor.cuit}`, margin + 4, 32)
  doc.text(`IIBB: ${emisor.iibb || '—'}`, margin + 4, 37)

  // Letra al centro
  doc.setFillColor(...azul)
  doc.rect(88, 12, 34, 30, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.text(tipo, 105, 31, { align: 'center' })
  doc.setFontSize(8)
  doc.text(`Factura tipo ${tipo}`, 105, 38, { align: 'center' })

  // Caja derecha
  doc.setFillColor(...fondoHdr)
  doc.rect(139, 12, W - margin - 139, 30, 'F')
  doc.setDrawColor(...grisCla)
  doc.rect(139, 12, W - margin - 139, 30)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...negro)
  doc.text('Nro. Comprobante:', 143, 21)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text(nro, 143, 28, { letterSpacing: 0.5 })
  doc.setFontSize(8)
  doc.text(`Fecha: ${fmtFecha(linea.fechaEmision)}`, 143, 35)
  if (linea.fechaVencimiento) {
    doc.text(`Vto: ${fmtFecha(linea.fechaVencimiento)}`, 143, 40)
  }

  // ─── Cliente ──────────────────────────────────────────────────────────────
  let y = 52
  doc.setDrawColor(...grisCla)
  doc.setLineWidth(0.3)
  doc.line(margin, y, W - margin, y)
  y += 6

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...gris)
  doc.text('DATOS DEL CLIENTE', margin, y)
  y += 5

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...negro)
  doc.text(cliente?.nombre || 'Cliente', margin, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...gris)
  if (cliente?.cuit)      doc.text(`CUIT: ${cliente.cuit}`,         margin, y)
  if (cliente?.email)     doc.text(cliente.email,                   margin + 60, y)
  if (cliente?.direccion) doc.text(cliente.direccion,               margin + 120, y)
  y += 3

  doc.line(margin, y + 3, W - margin, y + 3)
  y += 9

  // ─── Tabla de ítems ───────────────────────────────────────────────────────
  // Encabezado
  doc.setFillColor(...negro)
  doc.rect(margin, y, W - margin * 2, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text('Descripción',   margin + 3, y + 5.5)
  doc.text('Cant.',         margin + 110, y + 5.5)
  doc.text('Precio unit.',  margin + 125, y + 5.5)
  doc.text('Subtotal',      W - margin - 3, y + 5.5, { align: 'right' })
  y += 8

  // Fila de ítem
  doc.setFillColor(255, 255, 255)
  doc.rect(margin, y, W - margin * 2, 10, 'F')
  doc.setDrawColor(...grisCla)
  doc.rect(margin, y, W - margin * 2, 10)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...negro)

  const desc = servicio?.nombre || 'Servicio de marketing'
  const mesLabel = MESES_ES[linea.mes] || linea.mes
  const qty  = linea.cantidadHoras || 1
  const unit = linea.cantidadHoras ? linea.tarifaHora : linea.importeNeto

  doc.text(`${desc} — ${mesLabel} ${linea.anio}`, margin + 3, y + 6.5)
  doc.text(String(qty),              margin + 112, y + 6.5)
  doc.text(fmtARS(unit),             margin + 124, y + 6.5)
  doc.text(fmtARS(linea.importeNeto), W - margin - 3, y + 6.5, { align: 'right' })
  y += 16

  // ─── Totales ──────────────────────────────────────────────────────────────
  const xTot = W - margin - 65

  function totRow(label, value, bold) {
    if (bold) {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
    } else {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
    }
    doc.setTextColor(...negro)
    doc.text(label, xTot, y)
    doc.text(value,  W - margin - 3, y, { align: 'right' })
    y += bold ? 7 : 6
  }

  doc.setDrawColor(...grisCla)
  doc.line(xTot - 3, y - 3, W - margin, y - 3)

  totRow('Importe neto:', fmtARS(linea.importeNeto), false)

  if (linea.impuesto > 0) {
    const lblImp = tipo === 'A' ? 'IVA (21%):' : 'Impuesto:'
    totRow(lblImp, fmtARS(linea.impuesto), false)
  }

  doc.setFillColor(...azul)
  doc.rect(xTot - 4, y - 4, W - margin - xTot + 8, 10, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(255, 255, 255)
  doc.text('TOTAL:', xTot, y + 3)
  doc.text(fmtARS(linea.importeBruto), W - margin - 3, y + 3, { align: 'right' })
  y += 16

  // ─── CAE ──────────────────────────────────────────────────────────────────
  if (linea.cae) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...gris)
    doc.text(`CAE: ${linea.cae}   |   Vto. CAE: ${fmtFecha(linea.fechaVencimientoCAE)}`, margin, y)
    y += 5
  }

  // ─── Footer ───────────────────────────────────────────────────────────────
  doc.setDrawColor(...grisCla)
  doc.line(margin, 278, W - margin, 278)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(...gris)
  doc.text(`${emisor.nombre} · Factura ${tipo} Nro. ${nro}`, margin, 283)
  doc.text('Documento válido como comprobante fiscal', W - margin, 283, { align: 'right' })

  // ─── Descarga ─────────────────────────────────────────────────────────────
  const nombreCliente = (cliente?.nombre || 'Cliente').replace(/\s+/g, '_')
  const filename = `Factura_${tipo}_${nro.replace('/', '-')}_${nombreCliente}.pdf`
  doc.save(filename)

  return doc.output('datauristring')
}
