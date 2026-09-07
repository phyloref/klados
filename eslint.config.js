import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'docs/**', 'coverage/**', 'public/**'] },
  js.configs.recommended,
  ...pluginVue.configs['flat/vue2-essential'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  skipFormatting,
];
