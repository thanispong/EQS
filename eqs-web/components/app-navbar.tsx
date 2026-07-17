'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface AppNavbarProps {
  title: string;
}

export default function AppNavbar({
  title,
}: AppNavbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] =
    useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await apiFetch<{ message: string }>(
        '/auth/logout',
        {
          method: 'POST',
        },
      );
    } finally {
      router.replace('/login');
      router.refresh();
      setIsLoggingOut(false);
    }
  }

  return (
    <header className="navbar border-b border-base-300 bg-base-100 px-4 shadow-sm">
      <div className="flex-1">
        <span className="text-xl font-bold">
          {title}
        </span>
      </div>

      <div className="flex-none">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="btn btn-outline btn-sm"
        >
          {isLoggingOut && (
            <span className="loading loading-spinner loading-xs" />
          )}

          {isLoggingOut ? 'Signing out...' : 'Logout'}
        </button>
      </div>
    </header>
  );
}