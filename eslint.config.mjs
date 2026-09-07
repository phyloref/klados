import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'docs/**', 'coverage/**', 'public/**'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      // main.js assigns window.$ = jQuery, so $ is a genuine global here.
      globals: { ...globals.browser, ...globals.node, ...globals.jquery },
    },
  },
  {
    files: ['**/*.spec.js'],
    languageOptions: { globals: globals.vitest },
  },
  skipFormatting,
];
