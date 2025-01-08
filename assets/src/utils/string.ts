export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const VALID_STATUSES = ['new', 'interview', 'rejected', 'hired']
export function isValidStatus(
  status: string
): status is 'new' | 'interview' | 'rejected' | 'hired' {
  return VALID_STATUSES.includes(status)
}

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}
