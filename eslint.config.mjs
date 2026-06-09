import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'dist/**',
      'build/**',
      '.vercel/**',
      'public/**',
      'prisma/migrations/**',
      'harness-nestjs-next/**',
      'skill-cto-josu/**',
      'skills-cto-josu/**',
      '.agents/**',
      'docs/**',
      'next-env.d.ts',
      'commitlint.config.js',
      'postcss.config.mjs',
      'tailwind.config.ts',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
      '@next/next': nextPlugin,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      // Bajamos a warn: los useEffect que sincronizan props a local state
      // (drawer/panel) son patrones legítimos. Refactor a derived state
      // o key reset queda como tech debt menor.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  // Linting con info de tipos solo para src/. Habilita reglas que necesitan
  // el type-checker. Acotado a no-misused-promises + no-floating-promises para
  // que el blast radius sea mínimo: atrapan el bug de "olvidé el await"
  // (ej. `if (!rateLimit(...))` sobre una función async) que el typecheck no ve.
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksConditionals: true, checksVoidReturn: false },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  prettierConfig,
);
