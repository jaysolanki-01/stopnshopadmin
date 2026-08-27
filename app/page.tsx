import { redirect } from 'next/navigation';

// Will redirect to /login once auth is implemented in Phase 6
export default function Root() {
  redirect('/dashboard');
}
