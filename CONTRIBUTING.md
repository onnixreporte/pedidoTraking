# Contributing

## Branch naming

- `feat/<slug>` — feature nueva.
- `fix/<slug>` — bug fix.
- `chore/<slug>` — refactor, tooling, deps.
- `docs/<slug>` — solo docs.

## Commits (conventional)

```
<type>(<scope>): <subject>

<body opcional>
```

`type` ∈ `feat | fix | chore | refactor | docs | test | style | ci | perf | build | revert`.

Husky + commitlint validan cada commit. Si el mensaje no respeta el formato, el commit se aborta.

## Pre-commit

`lint-staged` corre automáticamente sobre archivos staged:
- `*.{ts,tsx,js,mjs,cjs}` → `prettier --write` + `eslint --fix`.
- `*.{json,md,css,yml,yaml}` → `prettier --write`.

Si lint-staged falla, el commit se aborta.

## Pull requests

1. Branch desde `main`.
2. Commits convencionales.
3. Antes de abrir el PR: verificar local con `bash harness-nestjs-next/init.sh` → exit 0.
4. Abrir PR contra `main`. CI corre install + prisma generate + typecheck + lint + test + audit.
5. Llenar el template (`.github/pull_request_template.md`).
6. Esperar review.

## SDD (Spec Driven Development)

Para features no triviales, el proyecto usa el harness `harness-nestjs-next/`:

```
pending → spec_author → spec_ready → ⏸ humano aprueba → in_progress → implementer → reviewer → done
```

Ver `harness-nestjs-next/README.md` para detalles.

## Tests

```bash
npm test                    # corrida única
npm run test:watch          # modo watch
npm run test:coverage       # con coverage report
```

Cualquier feature que toque `src/lib/` debería agregar/extender tests. Para nuevos endpoints, agregar tests de integración (vendrá en fase futura).

## Estilo

- Código en inglés (identifiers, comentarios técnicos).
- Strings user-facing y commits en español.
- Sin `any` salvo casting puntual documentado.
- Sin `console.log()` en código final (solo `console.warn`/`error` justificados).
- Sin TODOs sin contexto.
