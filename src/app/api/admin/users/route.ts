import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CreateUserSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  // Rate limit estricto: 5 intentos por IP cada 10 min
  if (!(await rateLimit(`admin-users:${ip}`, 5, 10 * 60 * 1000))) {
    console.warn('[POST /api/admin/users] rate_limited', { ip });
    return NextResponse.json({ error: 'RATE_LIMITED' }, { status: 429 });
  }

  const expected = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'NOT_CONFIGURED' }, { status: 500 });
  }

  const provided = req.headers.get('x-admin-bootstrap-secret');
  if (provided !== expected) {
    console.warn('[POST /api/admin/users] invalid_secret', {
      ip,
      hasHeader: provided != null,
    });
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: 'EMAIL_TAKEN' }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: { email: parsed.data.email, passwordHash },
    select: { id: true, email: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
