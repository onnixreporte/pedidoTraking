import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  tracesSampleRate: 0,
  // Si no hay DSN, Sentry SDK queda no-op silencioso.
  enabled: !!dsn,
});
