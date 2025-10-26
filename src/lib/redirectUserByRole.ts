// // src/lib/redirectUserByRole.ts
// import { redirect } from 'next/navigation';
// import { User } from '@/types/user'; // תתאים אם יש לך טיפוס אחר

// export function redirectUserByRole(user: User | null) {
//   if (!user) {
//     redirect('/login');
//   }

//   if (user.role === 'admin') {
//     redirect('/admin/dashboard');
//   }

//   if (user.role === 'guard') {
//     redirect('/guard/dashboard');
//   }

//   // fallback אם יש רול לא ידוע
//   redirect('/login');
// }