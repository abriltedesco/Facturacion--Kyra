const DAY_MS = 24 * 60 * 60 * 1000

export function getArcaStatus(entity, now = new Date()) {
  if (entity?.legalType === 'llc') return 'not_applicable'

  const expirationDate = entity?.currentArcaDocument?.expirationDate
  if (!expirationDate) return 'missing'

  const expirationTime = Date.parse(`${expirationDate}T00:00:00Z`)
  if (Number.isNaN(expirationTime)) return 'missing'

  const todayTime = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  const daysRemaining = Math.round((expirationTime - todayTime) / DAY_MS)

  if (daysRemaining < 0) return 'expired'
  if (daysRemaining <= 30) return 'expiring'
  return 'valid'
}