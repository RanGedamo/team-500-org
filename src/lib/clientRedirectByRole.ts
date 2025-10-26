// src/lib/clientRedirectByRole.ts
import { useRouter } from 'next/navigation';
import { User } from '@/types/user';

export function redirectClientByRole(router: ReturnType<typeof useRouter>, user: User | null) {
  if (!user) {
    router.push('/signin');
    return;
  }

  if (user.role === 'admin') {
    router.push('/admin/dashboard');
  } else if (user.role === 'guard') {
    router.push('/guard/dashboard');
  } else {
    router.push('/login');
  }
}