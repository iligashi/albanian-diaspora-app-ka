/**
 * Where to send someone after signing in. Only same-site paths are allowed:
 * `//evil.com` and `/\evil.com` are protocol-relative to browsers, and control
 * characters can be used to smuggle either form past a naive check.
 */
export function safeRedirectPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 512) return null
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null
  if (/[\u0000-\u001f\u007f\\]/.test(value)) return null
  return value
}
