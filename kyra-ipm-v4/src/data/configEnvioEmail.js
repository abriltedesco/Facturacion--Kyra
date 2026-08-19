// /src/data/configEnvioEmail.js
// Configuración global del módulo de envío de emails.
// Esta configuración vive en el contexto de Emails y se persiste en estado local.

export const CONFIG_EMAIL_INICIAL = {
  // Toggle global: si está en false, ningún envío automático se dispara
  envioAutomaticoGlobal: true,

  // Plantilla que se usa cuando el cliente no tiene una asignada específicamente
  plantillaDefaultId: 1,

  // Remitente que se muestra en el "De:" del email
  emailRemitente: 'facturacion@wearekyra.com',
  nombreRemitente: 'Kyra Facturación',
}
