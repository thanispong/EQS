"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/app-navbar";
import AuthGuard from "@/components/auth-guard";
import { apiFetch } from "@/lib/api";
import type { QuizItem, StartAttemptResponse } from "@/types/quiz";
import { getErrorMessage } from "@/lib/get-error-message";

export default function QuizzesPage() {
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startingQuizId, setStartingQuizId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadQuizzes() {
      try {
        const result = await apiFetch<QuizItem[]>("/quizzes");

        setQuizzes(
          result.filter((quiz) => quiz.isActive && quiz.status === "published"),
        );
      } catch (error) {
        setErrorMessage(
          getErrorMessage(
            error,
            'Unable to load quizzes',
          ),
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadQuizzes();
  }, []);

  const groupedQuizzes = useMemo(() => {
    return quizzes.reduce<Record<string, QuizItem[]>>((groups, quiz) => {
      const subjectName = quiz.topic.subject.name;

      if (!groups[subjectName]) {
        groups[subjectName] = [];
      }

      groups[subjectName].push(quiz);

      return groups;
    }, {});
  }, [quizzes]);

  async function handleStartQuiz(quizId: number) {
    setStartingQuizId(quizId);
    setErrorMessage("");

    try {
      const result = await apiFetch<StartAttemptResponse>(
        `/quiz-attempts/quizzes/${quizId}/start`,
        {
          method: "POST",
        },
      );

      sessionStorage.setItem(
        `quiz-attempt-${result.attempt.id}`,
        JSON.stringify(result),
      );

      router.push(`/quiz-attempts/${result.attempt.id}`);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to start quiz",
      );
    } finally {
      setStartingQuizId(null);
    }
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <div className="min-h-screen bg-base-200">
        <AppNavbar
          title="Educational Quiz System"
          showStudentMenu
          sticky
        />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold sm:text-3xl">Available Quizzes</h1>

            <p className="mt-2 text-base-content/70">Select a quiz to begin.</p>
          </div>

          {errorMessage && (
            <div role="alert" className="alert alert-error mb-6">
              <span>{errorMessage}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : quizzes.length === 0 ? (
            <div className="card border border-base-300 bg-base-100 shadow">
              <div className="card-body items-center text-center">
                <h2 className="card-title">No quizzes available</h2>

                <p className="text-base-content/70">
                  Published quizzes will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedQuizzes).map(
                ([subjectName, subjectQuizzes]) => (
                  <section key={subjectName}>
                    <h2 className="mb-4 break-words text-xl font-bold sm:text-2xl">{subjectName}</h2>

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                      {subjectQuizzes.map((quiz) => (
                        <article
                          key={quiz.id}
                          className="card min-w-0 border border-base-300 bg-base-100 shadow-md"
                        >
                          <div className="card-body min-w-0 p-4 sm:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <h3 className="card-title min-w-0 flex-1 break-words">{quiz.title}</h3>

                              <span className="badge badge-success badge-outline">
                                Published
                              </span>
                            </div>

                            <p className="break-words text-sm text-base-content/60">
                              {quiz.topic.name}
                            </p>

                            <p className="break-words text-base-content/80 sm:min-h-12">
                              {quiz.description || "No description"}
                            </p>

                            <div className="mt-2 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                              <div className="rounded-box bg-base-200 p-3">
                                <div className="text-base-content/60">
                                  Passing score
                                </div>

                                <div className="font-bold">
                                  {Number(quiz.passingPercentage)}%
                                </div>
                              </div>

                              <div className="rounded-box bg-base-200 p-3">
                                <div className="text-base-content/60">
                                  Time limit
                                </div>

                                <div className="font-bold">
                                  {quiz.timeLimitMinutes
                                    ? `${quiz.timeLimitMinutes} min`
                                    : "No limit"}
                                </div>
                              </div>

                              <div className="rounded-box bg-base-200 p-3">
                                <div className="text-base-content/60">
                                  Questions
                                </div>

                                <div className="font-bold">
                                  {quiz._count?.questions ?? 0}
                                </div>
                              </div>

                              <div className="rounded-box bg-base-200 p-3">
                                <div className="text-base-content/60">
                                  Review answers
                                </div>

                                <div className="font-bold">
                                  {quiz.isShowAnswer ? "Yes" : "No"}
                                </div>
                              </div>
                            </div>

                            <div className="card-actions mt-4 justify-end">
                              <button
                                type="button"
                                onClick={() => handleStartQuiz(quiz.id)}
                                disabled={startingQuizId !== null}
                                className="btn btn-primary w-full sm:w-auto"
                              >
                                {startingQuizId === quiz.id && (
                                  <span className="loading loading-spinner loading-sm" />
                                )}

                                {startingQuizId === quiz.id
                                  ? "Starting..."
                                  : "Start Quiz"}
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ),
              )}
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
