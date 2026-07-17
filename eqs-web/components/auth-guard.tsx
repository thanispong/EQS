'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { AuthUser } from '@/types/auth';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({
  children,
  allowedRoles,
}: AuthGuardProps) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkAuthentication() {
      try {
        const profile =
          await apiFetch<AuthUser>('/auth/profile');

        if (
          allowedRoles &&
          !allowedRoles.includes(profile.role.name)
        ) {
          if (profile.role.name === 'admin') {
            router.replace('/admin');
          } else {
            router.replace('/quizzes');
          }

          return;
        }

        setUser(profile);
      } catch {
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    }

    void checkAuthentication();
  }, [allowedRoles, router]);

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base-200">
        <div className="flex items-center gap-3">
          <span className="loading loading-spinner loading-lg" />

          <span className="text-lg">
            Checking session...
          </span>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}