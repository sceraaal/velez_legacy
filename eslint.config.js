import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Le Edge Functions girano su Deno (server di Supabase), non nel browser:
    // lì esiste l'oggetto globale "Deno".
    files: ['supabase/functions/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser, Deno: 'readonly' },
    },
  },
])
