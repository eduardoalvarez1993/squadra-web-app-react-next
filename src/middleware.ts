import { NextRequest, NextResponse } from 'next/server';
import { unsealData } from 'iron-session';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const COOKIE_NAME = 'squadra-session';
const PROTECTED_PREFIXES = [
  '/home', '/ponto', '/ferias', '/holerite', '/solicitacoes',
  '/perfil', '/pessoas', '/rh', '/gestao', '/percentual',
];

function getRatelimit() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  const redis = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '60 s') });
}

const ratelimit = getRatelimit();

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;
  if (!cookieValue) return false;

  try {
    const data = await unsealData<{ token?: string }>(cookieValue, {
      password: process.env.SESSION_SECRET!,
    });
    return Boolean(data?.token);
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rate limit: POST /api/auth (login)
  if (pathname === '/api/auth' && req.method === 'POST' && ratelimit) {
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? '127.0.0.1';
    const { success } = await ratelimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em breve.' },
        { status: 429 },
      );
    }
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected) {
    if (!(await hasValidSession(req))) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  if (pathname === '/') {
    if (await hasValidSession(req)) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname === '/login') {
    if (await hasValidSession(req)) {
      return NextResponse.redirect(new URL('/home', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)',
  ],
};
