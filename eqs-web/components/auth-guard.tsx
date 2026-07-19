'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { ProfileResponse } from '@/types/auth';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function AuthGuard({
  children,
  allowedRoles,
}: AuthGuardProps) {
  const router = useRouter();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const allowedRolesKey = allowedRoles?.join(',') ?? '';

  useEffect(() => {
    async function checkAuthentication() {
      try {
        const profile =
          await apiFetch<ProfileResponse>('/auth/profile');

        const roleName = profile.role.name;
        const roles = allowedRolesKey
          ? allowedRolesKey.split(',')
          : [];

        if (
          roles.length > 0 &&
          !roles.includes(roleName)
        ) {
          router.replace(
            roleName === 'admin'
              ? '/admin'
              : '/quizzes',
          );

          return;
        }

        setIsAuthorized(true);
      } catch {
        router.replace('/login');
      } finally {
        setIsChecking(false);
      }
    }

    void checkAuthentication();
  }, [allowedRolesKey, router]);

  if (isChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg" />
      </main>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}