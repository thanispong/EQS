'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppNavbar from '@/components/app-navbar';
import AuthGuard from '@/components/auth-guard';
import { apiFetch } from '@/lib/api';
import { getErrorMessage } from '@/lib/get-error-message';
import type { QuizResult } from '@/types/quiz-result';

export default function QuizResultPage() {
  const params = useParams<{ attemptId: string }>();
  const router = useRouter();

  const attemptId = Number(params.attemptId);

  const [result, setResult] =
    useState<QuizResult | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState('');

  useEffect(() => {
    async function loadResult() {
      const storedResult = sessionStorage.getItem(
        `quiz-result-${attemptId}`,
      );

      if (storedResult) {
        try {
          setResult(
            JSON.parse(storedResult) as QuizResult,
          );
          setIsLoading(false);
          return;
        } catch {
          sessionStorage.removeItem(
            `quiz-result-${attemptId}`,
          );
        }
      }

      try {
        const apiResult =
          await apiFetch<QuizResult>(
            `/quiz-attempts/${attemptId}/result`,
          );

        setResult(apiResult);
      } catch (error) {
        setErrorMessage(
          getErrorMessage(
            error,
            'Unable to load result',
          ),
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadResult();
  }, [attemptId]);

  return (
    <AuthGuard allowedRoles={['student']}>
      <div className="min-h-screen bg-base-200">
        <AppNavbar
          title="Educational Quiz System"
          showStudentMenu
          sticky
        />

        <main className="mx-auto max-w-3xl px-4 py-6 sm:p-6">
          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : errorMessage ? (
            <div className="alert alert-error">
              <span>{errorMessage}</span>
            </div>
          ) : result ? (
            <div className="card min-w-0 border border-base-300 bg-base-100 shadow-xl">
              <div className="card-body min-w-0 items-center p-4 text-center sm:p-6">
                <div
                  className={`badge badge-lg ${
                    result.isPassed
                      ? 'badge-success'
                      : 'badge-error'
                  }`}
                >
                  {result.isPassed ? 'Passed' : 'Failed'}
                </div>

                <h1 className="mt-4 break-words text-2xl font-bold sm:text-3xl">
                  {result.quiz?.title ||
                    result.quizTitle ||
                    'Quiz Result'}
                </h1>

                <div
                  className={`radial-progress my-6 ${
                    result.isPassed
                      ? 'text-success'
                      : 'text-error'
                  }`}
                  style={
                    {
                      '--value': Number(
                        result.percentage,
                      ),
                      '--size': '10rem',
                      '--thickness': '0.8rem',
                    } as React.CSSProperties
                  }
                  role="progressbar"
                >
                  {Number(result.percentage)}%
                </div>

                <div className="grid w-full gap-4 sm:grid-cols-2">
                  <div className="stat rounded-box bg-base-200">
                    <div className="stat-title">
                      Score
                    </div>

                    <div className="stat-value text-2xl">
                      {Number(result.score)} /{' '}
                      {Number(result.totalScore)}
                    </div>
                  </div>

                  <div className="stat rounded-box bg-base-200">
                    <div className="stat-title">
                      Passing score
                    </div>

                    <div className="stat-value text-2xl">
                      {Number(
                        result.passingPercentage,
                      )}
                      %
                    </div>
                  </div>

                  <div className="stat rounded-box bg-base-200">
                    <div className="stat-title">
                      Correct
                    </div>

                    <div className="stat-value text-success">
                      {result.correctCount}
                    </div>
                  </div>

                  <div className="stat rounded-box bg-base-200">
                    <div className="stat-title">
                      Wrong
                    </div>

                    <div className="stat-value text-error">
                      {result.wrongCount}
                    </div>
                  </div>
                </div>

                {result.review && result.review.length > 0 && (
                  <section className="mt-6 w-full text-left">
                    <h2 className="mb-4 text-xl font-bold">
                      Answer review
                    </h2>

                    <div className="space-y-4">
                      {result.review.map((item, questionIndex) => (
                        <article
                          key={item.questionId}
                          className="rounded-box border border-base-300 bg-base-100 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold">
                              {questionIndex + 1}. {item.questionText}
                            </h3>

                            <span
                              className={`badge shrink-0 ${
                                item.isCorrect
                                  ? 'badge-success'
                                  : 'badge-error'
                              }`}
                            >
                              {item.isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                          </div>

                          <div className="mt-3 space-y-2">
                            {item.choices.map((choice, choiceIndex) => {
                              const isCorrectChoice =
                                choice.id === item.correctChoiceId;
                              const isSelectedChoice =
                                choice.id === item.selectedChoiceId;

                              return (
                                <div
                                  key={choice.id}
                                  className={`rounded-box border p-3 ${
                                    isCorrectChoice
                                      ? 'border-success bg-success/10'
                                      : isSelectedChoice
                                        ? 'border-error bg-error/10'
                                        : 'border-base-300'
                                  }`}
                                >
                                  <span className="font-medium">
                                    {String.fromCharCode(65 + choiceIndex)}.
                                  </span>{' '}
                                  {choice.choiceText}

                                  {isCorrectChoice && (
                                    <span className="badge badge-success badge-sm ml-2">
                                      Correct answer
                                    </span>
                                  )}

                                  {isSelectedChoice && !isCorrectChoice && (
                                    <span className="badge badge-error badge-sm ml-2">
                                      Your answer
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {item.explanation && (
                            <div className="mt-3 rounded-box bg-base-200 p-3 text-sm">
                              <span className="font-semibold">
                                Explanation:
                              </span>{' '}
                              {item.explanation}
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </section>
                )}

                <div className="card-actions mt-6 w-full justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      router.push('/quizzes')
                    }
                    className="btn btn-primary w-full sm:w-auto"
                  >
                    Back to Quizzes
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </AuthGuard>
  );
}
