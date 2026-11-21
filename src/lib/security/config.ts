/**
 * Default block rules. They are plain counters over the activity log, so they work 24/7 without any AI service.
 * A row in the collection security-rules (admin panel > Security > Rules) can change score, threshold or window, or switch a rule off.
 */
export type Level = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type Rule = {
  key: string
  label: string
  /** the activity category that is counted */
  category: string
  /** what the count is grouped by */
  by: 'ip' | 'user'
  /** how many events in the window trigger the rule */
  threshold: number
  windowMinutes: number
  /** count different values of this evidence field instead of events (credential stuffing: different e-mails) */
  distinct?: 'email' | 'ipHash'
  score: number
}

export const DEFAULT_RULES: Rule[] = [
  { key: 'brute_force', label: 'Brute-force logins', category: 'login_failed', by: 'ip', threshold: 5, windowMinutes: 10, score: 70 },
  { key: 'credential_stuffing', label: 'Credential stuffing (many e-mails from one network)', category: 'login_failed', by: 'ip', threshold: 5, windowMinutes: 10, distinct: 'email', score: 85 },
  { key: 'bot_scraping', label: 'Bots and scraping (many rate-limited requests)', category: 'rate_limited', by: 'ip', threshold: 5, windowMinutes: 10, score: 45 },
  { key: 'unauthorized_api', label: 'Unauthorized API access', category: 'api_unauthorized', by: 'ip', threshold: 5, windowMinutes: 10, score: 65 },
  { key: 'privilege_escalation', label: 'Privilege escalation (becoming admin, editing someone else)', category: 'privilege_escalation', by: 'user', threshold: 1, windowMinutes: 60, score: 90 },
  { key: 'price_manipulation', label: 'Price manipulation (order does not match the real prices)', category: 'price_manipulation', by: 'user', threshold: 1, windowMinutes: 60, score: 90 },
  { key: 'fake_order_burst', label: 'Burst of orders', category: 'order_created', by: 'user', threshold: 5, windowMinutes: 10, score: 65 },
  { key: 'failed_payments', label: 'Pattern of failed payments', category: 'payment_failed', by: 'user', threshold: 3, windowMinutes: 30, score: 60 },
  { key: 'many_networks', label: 'Logins from many networks', category: 'login_ok', by: 'user', threshold: 4, windowMinutes: 1440, distinct: 'ipHash', score: 55 },
  { key: 'admin_mass_delete', label: 'Admin mass deletions', category: 'admin_delete', by: 'user', threshold: 10, windowMinutes: 10, score: 85 },
]

export const levelOf = (score: number): Level => (score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW')

/** What happens at each level. */
export const ACTIONS: Record<Level, string> = {
  LOW: 'Logged',
  MEDIUM: 'Flagged for review',
  HIGH: 'The operation is restricted for a while, admin alerted',
  CRITICAL: "Request blocked, the user's sessions ended, admin alerted",
}

export const RESTRICT_MINUTES_HIGH = 30
export const RESTRICT_MINUTES_CRITICAL = 24 * 60
export const retentionDays = () => Number(process.env.SECURITY_RETENTION_DAYS || 180)
