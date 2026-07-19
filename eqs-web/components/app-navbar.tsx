'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

interface AppNavbarProps {
  title: string;
  showStudentMenu?: boolean;
  sticky?: boolean;
}

export default function AppNavbar({
  title,
  showStudentMenu = false,
  sticky = false,
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
    <header
      className={`navbar flex-wrap gap-2 border-b border-base-300 bg-base-100 px-3 py-2 shadow-sm sm:px-4 ${
        sticky ? 'sticky top-0 z-50' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <Link
          href="/quizzes"
          className="block truncate text-lg font-bold sm:text-xl"
        >
          {title}
        </Link>
      </div>

      <div
        className={`flex items-center gap-1 sm:gap-2 ${
          showStudentMenu
            ? 'w-full justify-end sm:w-auto'
            : ''
        }`}
      >
        {showStudentMenu && (
          <>
            <Link
              href="/quizzes"
              className="btn btn-ghost btn-sm"
            >
              Quizzes
            </Link>

            <Link
              href="/history"
              className="btn btn-ghost btn-sm"
            >
              History
            </Link>
          </>
        )}

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
