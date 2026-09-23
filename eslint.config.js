import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // `typescript-eslint/recommended` enables this rule without the two
      // options below, which the codebase already relies on:
      //
      //  - `argsIgnorePattern` / `varsIgnorePattern`: bindings renamed to a
      //    leading underscore are deliberate placeholders, e.g. a required
      //    prop a component intentionally does not read
      //    (`onSlotClick: _onSlotClick`).
      //  - `ignoreRestSiblings`: `const { drop, ...rest } = obj` names `drop`
      //    only to EXCLUDE it, so it is never read. Flagging it pushes authors
      //    toward a delete-and-mutate alternative for no benefit.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);
