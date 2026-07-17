'use client';

import AppNavbar from '@/components/app-navbar';
import AuthGuard from '@/components/auth-guard';

export default function QuizzesPage() {
  return (
    <AuthGuard allowedRoles={['student']}>
      <div className="min-h-screen bg-base-200">
        <AppNavbar title="Education Quiz System" />

        <main className="mx-auto max-w-7xl p-6">
          <div className="card border border-base-300 bg-base-100 shadow-md">
            <div className="card-body">
              <h1 className="card-title text-2xl">
                Available Quizzes
              </h1>

              <p className="text-base-content/70">
                Select a quiz to begin.
              </p>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}