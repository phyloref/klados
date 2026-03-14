# Future Work

This file documents deferred work from the Vue 2 → Vue 3 migration.

## Vue Migration

- **Remove `@vue/compat`** once all Vue 2 deprecation warnings surfaced in the browser console are resolved
- **Address remaining Vue compat warnings** surfaced by `@vue/compat` MODE: 2 console output
- **Refactor components** from Options API to Composition API (`<script setup>`)
- **Migrate Vuex 4 → Pinia** (official Vue 3 state management recommendation)

## Dependencies

- **Restore full cookie plugin** — `vue-cookies` was removed during the Vue 3 migration because it
  injects itself onto the Vue prototype (`Vue.$cookies`) in a way that is incompatible with Vue 3.
  It has been replaced by a minimal inline helper at `src/cookies.js` that covers exactly the API
  surface used in Klados. A proper replacement such as
  [`vue3-cookies`](https://www.npmjs.com/package/vue3-cookies) or
  [`universal-cookie`](https://www.npmjs.com/package/universal-cookie) should be evaluated and
  adopted so that edge cases (SameSite flags, Secure flag, domain scoping) are handled correctly.
- **Migrate Bootstrap 4 → 5** (and update Bootstrap Icons 1.x accordingly)
- **Remove `@vitejs/plugin-legacy`** (IE 11 support) if browser targets allow
- **Remove jQuery** (`window.$ = jQuery`) once `phylotree` no longer requires it or is replaced
- **Upgrade `@fortawesome/vue-fontawesome`** from v0.1.10 to v3 API properly (currently
  ModifiedIcon.vue uses v0.x component registration; v3 uses global `app.component()` setup per
  library docs)
- **Migrate FontAwesome setup** (`@fortawesome/free-solid-svg-icons` + `fontawesome-svg-core`) to
  global registration in main.js

## Code Quality

- **Deduplicate code** between klados and `@phyloref/phyx` library (overlapping data model logic)
