// JWT_SECRET de prueba: solo para tests, no usar en prod.
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'test-secret-for-vitest-must-be-at-least-32-chars-long';
