/*
 * A small cookie helper covering exactly what Klados uses.
 *
 * This replaces vue-cookies, which installed itself onto the Vue 2 prototype as
 * `Vue.$cookies`. Vue 3 has no prototype to install onto, and the plugin's Vue 3
 * successors are a dependency for four functions that are a line or two each
 * over `document.cookie`.
 *
 * Values are URI-encoded, so curator names containing spaces and email
 * addresses containing '@' survive a round trip.
 */

import { COOKIE_EXPIRY_DAYS } from '@/config';

/** Returns the value of a cookie, or null if it is not set. */
export function get(name) {
  const prefix = `${encodeURIComponent(name)}=`;
  const found = document.cookie.split('; ').find((pair) => pair.startsWith(prefix));
  return found === undefined ? null : decodeURIComponent(found.slice(prefix.length));
}

/** Sets a cookie, expiring the given number of days from now. */
export function set(name, value, expiryInDays = COOKIE_EXPIRY_DAYS) {
  const expires = new Date(Date.now() + expiryInDays * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`
    + `; expires=${expires}; path=/; SameSite=Lax`;
}

/** Deletes a cookie, by expiring it in the past. */
export function remove(name) {
  document.cookie = `${encodeURIComponent(name)}=`
    + '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
}

/** Returns the names of every cookie readable from this page. */
export function keys() {
  return document.cookie
    .split('; ')
    .filter((pair) => pair !== '')
    .map((pair) => decodeURIComponent(pair.slice(0, pair.indexOf('='))));
}
