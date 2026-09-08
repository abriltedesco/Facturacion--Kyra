export function isValidCuit(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false

  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0)
  const remainder = 11 - (sum % 11)
  const verifier = remainder === 11 ? 0 : remainder === 10 ? 9 : remainder

  return verifier === Number(digits[10])
}
