// app/api/auth/user/route.ts
import { getCurrentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await getCurrentUser();
  // console.log('user from route.ts:', user);
  
  if (!user) return NextResponse.json(null, { status: 401 });
  return NextResponse.json(user);
}