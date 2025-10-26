// src/middleware/authMiddleware.ts
import { NextResponse ,NextRequest} from 'next/server';
import { verifyJWT } from '@/lib/jwt';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  if (!token || !verifyJWT(token)) {
    return NextResponse.redirect(new URL('/signin', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/guard/:path*']
}
