/**
 * Minimal browser-cookie helpers used by Klados.
 *
 * This replaces the vue-cookies plugin, which is not compatible with Vue 3.
 * The API intentionally mirrors the subset of vue-cookies used in this
 * codebase so that call-sites require minimal changes:
 *   cookies.get(name)          → string | null
 *   cookies.set(name, val, expiry)  expiry is a string like '30d', a number
 *                                    (seconds), or a Date
 *   cookies.remove(name)
 *   cookies.keys()             → string[]
 */

/** Parse a vue-cookies-style expiry value into a Date. */
function expiryToDate(expiry) {
  if (!expiry) return undefined;
  if (expiry instanceof Date) return expiry;
  if (typeof expiry === 'number') {
    const d = new Date();
    d.setTime(d.getTime() + expiry * 1000);
    return d;
  }
  // String form: '30d', '12h', '60m', '3600s'
  const match = String(expiry).match(/^(\d+)([smhd])$/i);
  if (match) {
    const n = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
    const d = new Date();
    d.setTime(d.getTime() + n * multipliers[unit] * 1000);
    return d;
  }
  return undefined;
}

export const cookies = {
  get(name) {
    const nameEq = encodeURIComponent(name) + '=';
    for (const part of document.cookie.split(';')) {
      const c = part.trim();
      if (c.startsWith(nameEq)) {
        return decodeURIComponent(c.slice(nameEq.length));
      }
    }
    return null;
  },

  set(name, value, expiry) {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/`;
    const expires = expiryToDate(expiry);
    if (expires) cookie += `; expires=${expires.toUTCString()}`;
    document.cookie = cookie;
  },

  remove(name) {
    document.cookie = `${encodeURIComponent(name)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  },

  keys() {
    if (!document.cookie) return [];
    return document.cookie.split(';').map(part => decodeURIComponent(part.trim().split('=')[0]));
  },
};
