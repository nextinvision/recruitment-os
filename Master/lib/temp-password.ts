/**
 * Generates a random password that satisfies admin reset-password API rules:
 * length ≥ 8, uppercase, lowercase, number, special (!@#$%^&*(),.?":{}|<>).
 */
export function generateCompliantTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%^&*(),.?":{}|<>'
  const pick = (chars: string, n: number) =>
    Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')

  const required = pick(upper, 1) + pick(lower, 1) + pick(digits, 1) + pick(special, 1)
  const pool = upper + lower + digits + special
  const rest = pick(pool, 12)
  const combined = (required + rest).split('')
  for (let i = combined.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[combined[i], combined[j]] = [combined[j], combined[i]]
  }
  return combined.join('')
}
