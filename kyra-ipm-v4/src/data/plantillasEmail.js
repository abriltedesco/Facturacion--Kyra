// /src/data/plantillasEmail.js
// Mock de plantillas de email para envío de facturas.
// tipo: "factura_mensual" | "invoice_llc" | "recordatorio" | "personalizado"
// estado: "activo" | "inactivo" — soft delete, nunca se borra del array

export const PLANTILLAS_INICIAL = [
  {
    id: 1,
    nombre: 'Factura mensual ARS',
    tipo: 'factura_mensual',
    asunto: 'Factura {{mes}} {{año}} — Kyra',
    cuerpo: `Hola {{nombre_contacto}},

Te enviamos la factura correspondiente al mes de {{mes}} {{año}}.

Nro. comprobante: {{nro_factura}}
Tipo: {{tipo_factura}}
Importe total: {{importe_bruto}}
Fecha de vencimiento: {{fecha_vencimiento}}

Adjuntamos el comprobante en formato PDF.

Ante cualquier consulta no dudes en escribirnos.

Saludos,
Kyra`,
    ultimaModificacion: '2026-07-15',
    estado: 'activo',
  },
  {
    id: 2,
    nombre: 'Invoice LLC (English)',
    tipo: 'invoice_llc',
    asunto: 'Invoice {{mes}} {{año}} — Mercury LLC',
    cuerpo: `Hi {{nombre_contacto}},

Please find attached your invoice for {{mes}} {{año}}.

Invoice number: {{nro_factura}}
Total amount: {{importe_bruto}}
Due date: {{fecha_vencimiento}}

Please don't hesitate to reach out if you have any questions.

Thank you for your business.

Best regards,
Kyra / Mercury LLC`,
    ultimaModificacion: '2026-07-15',
    estado: 'activo',
  },
  {
    id: 3,
    nombre: 'Recordatorio de pago',
    tipo: 'recordatorio',
    asunto: 'Recordatorio: Factura {{nro_factura}} — vence {{fecha_vencimiento}}',
    cuerpo: `Hola {{nombre_contacto}},

Te recordamos que la {{tipo_factura}} Nro. {{nro_factura}} correspondiente a {{mes}} {{año}} vence el {{fecha_vencimiento}}.

Importe total: {{importe_bruto}}

Si ya realizaste el pago, por favor ignorá este mensaje.

Saludos,
Kyra`,
    ultimaModificacion: '2026-07-20',
    estado: 'activo',
  },
]
