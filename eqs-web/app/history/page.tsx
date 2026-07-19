'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppNavbar from '@/components/app-navbar';
import AuthGuard from '@/components/auth-guard';
import { apiFetch } from '@/lib/api';
import type { QuizHistoryItem } from '@/types/quiz-history';

export default function HistoryPage() {
  const router = useRouter();

  const [history, setHistory] = useState<
    QuizHistoryItem[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] =
    useState('');

  useEffect(() => {
    async function loadHistory() {
      try {
        const result = await apiFetch<
          QuizHistoryItem[]
        >('/quiz-attempts/my-history');

        setHistory(result);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to load quiz history',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadHistory();
  }, []);

  function formatDate(value: string | null) {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  return (
    <AuthGuard allowedRoles={['student']}>
      <div className="min-h-screen bg-base-200">
        <AppNavbar
          title="Education Quiz System"
          showStudentMenu
        />

        <main className="mx-auto max-w-7xl p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">
              Quiz History
            </h1>

            <p className="mt-2 text-base-content/70">
              View your previous quiz attempts and
              scores.
            </p>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="alert alert-error mb-6"
            >
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : history.length === 0 ? (
            <div className="card border border-base-300 bg-base-100 shadow">
              <div className="card-body items-center text-center">
                <h2 className="card-title">
                  No quiz history
                </h2>

                <p className="text-base-content/70">
                  Complete a quiz and your result will
                  appear here.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push('/quizzes')
                  }
                  className="btn btn-primary mt-4"
                >
                  Browse Quizzes
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100 shadow">
              <table className="table">
                <thead>
                  <tr>
                    <th>Quiz</th>
                    <th>Subject / Topic</th>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Percentage</th>
                    <th>Result</th>
                    <th />
                  </tr>
                </thead>

                <tbody>
                  {history.map((attempt) => (
                    <tr key={attempt.id}>
                      <td>
                        <div className="font-bold">
                          {attempt.quiz.title}
                        </div>

                        <div className="text-xs text-base-content/60">
                          Attempt #{attempt.id}
                        </div>
                      </td>

                      <td>
                        <div>
                          {
                            attempt.quiz.topic.subject
                              .name
                          }
                        </div>

                        <div className="text-xs text-base-content/60">
                          {attempt.quiz.topic.name}
                        </div>
                      </td>

                      <td>
                        {formatDate(
                          attempt.submittedAt ??
                            attempt.startedAt,
                        )}
                      </td>

                      <td>
                        {Number(attempt.score)} /{' '}
                        {Number(attempt.totalScore)}
                      </td>

                      <td>
                        {Number(attempt.percentage)}%
                      </td>

                      <td>
                        {attempt.status ===
                        'in_progress' ? (
                          <span className="badge badge-warning">
                            In progress
                          </span>
                        ) : attempt.isPassed ? (
                          <span className="badge badge-success">
                            Passed
                          </span>
                        ) : (
                          <span className="badge badge-error">
                            Failed
                          </span>
                        )}
                      </td>

                      {/* <td>
                        {attempt.status ===
                        'submitted' ? (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/quiz-attempts/${attempt.id}/result`,
                              )
                            }
                            className="btn btn-outline btn-sm"
                          >
                            View result
                          </button>
                        ) : (
                          <span className="text-sm text-base-content/50">
                            Not submitted
                          </span>
                        )}
                      </td> */}
                      <td>
                        {attempt.status === 'in_progress' ? (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/quiz-attempts/${attempt.id}`,
                              )
                            }
                            className="btn btn-primary btn-sm"
                          >
                            Continue
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/quiz-attempts/${attempt.id}/result`,
                              )
                            }
                            className="btn btn-outline btn-sm"
                          >
                            View result
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}