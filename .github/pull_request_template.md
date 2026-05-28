## Summary

<!-- 1-3 bullet points: qué cambia y por qué -->

-
-

## Test plan

<!-- Cómo verificaste el cambio. Checklist con steps reproducibles -->

- [ ] `bash harness-nestjs-next/init.sh` → exit 0
- [ ] Probado manualmente en `npm run dev`
- [ ] Tests agregados/actualizados (si aplica)

## Checklist

- [ ] Commit con conventional format (`feat:`, `fix:`, `chore:` ...)
- [ ] Sin `console.log` de debug
- [ ] Sin `TODO` sin contexto
- [ ] Si toca DB: SQL ejecutado en Railway + migración trackeada en `prisma/migrations/`
- [ ] Si toca env vars: agregadas a `.env.example` y documentadas
