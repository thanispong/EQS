'use client';

import AppNavbar from '@/components/app-navbar';
import AuthGuard from '@/components/auth-guard';

export default function AdminPage() {
  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-base-200">
        <AppNavbar title="EQS Admin" />

        <main className="mx-auto max-w-7xl p-6">
          <div className="card border border-base-300 bg-base-100 shadow-md">
            <div className="card-body">
              <h1 className="card-title text-2xl">
                Admin Dashboard
              </h1>

              <p className="text-base-content/70">
                Manage subjects, topics, quizzes and
                questions.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="card border border-base-300 bg-base-200">
                  <div className="card-body">
                    <h2 className="card-title">
                      Subjects
                    </h2>
                    <p>Manage subjects</p>
                  </div>
                </div>

                <div className="card border border-base-300 bg-base-200">
                  <div className="card-body">
                    <h2 className="card-title">
                      Topics
                    </h2>
                    <p>Manage topics</p>
                  </div>
                </div>

                <div className="card border border-base-300 bg-base-200">
                  <div className="card-body">
                    <h2 className="card-title">
                      Quizzes
                    </h2>
                    <p>Manage quizzes</p>
                  </div>
                </div>

                <div className="card border border-base-300 bg-base-200">
                  <div className="card-body">
                    <h2 className="card-title">
                      Questions
                    </h2>
                    <p>Manage questions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}