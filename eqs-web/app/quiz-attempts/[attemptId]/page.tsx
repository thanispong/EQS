'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppNavbar from '@/components/app-navbar';
import AuthGuard from '@/components/auth-guard';
import { apiFetch } from '@/lib/api';
import type {
  StartAttemptResponse,
} from '@/types/quiz';
import type { QuizResult } from '@/types/quiz-result';
import { getErrorMessage } from '@/lib/get-error-message';

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function QuizAttemptPage() {
  const params = useParams<{ attemptId: string }>();
  const router = useRouter();

  const attemptId = Number(params.attemptId);

  const [attemptData, setAttemptData] =
    useState<StartAttemptResponse | null>(null);

  const [answers, setAnswers] = useState<
    Record<number, number>
  >({});

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const [remainingSeconds, setRemainingSeconds] =
    useState<number | null>(null);

  const hasAutoSubmitted = useRef(false);

  useEffect(() => {
    async function loadAttemptData() {
      const storageKey =
        `quiz-attempt-${attemptId}`;

      const storedData =
        sessionStorage.getItem(storageKey);

      if (storedData) {
        try {
          const parsedData = JSON.parse(
            storedData,
          ) as StartAttemptResponse;

          await Promise.resolve();
          setAttemptData(parsedData);
          return;
        } catch {
          sessionStorage.removeItem(storageKey);
        }
      }

      try {
        const result =
          await apiFetch<StartAttemptResponse>(
            `/quiz-attempts/${attemptId}`,
          );

        sessionStorage.setItem(
          storageKey,
          JSON.stringify(result),
        );

        setAttemptData(result);
      } catch {
        router.replace('/quizzes');
      }
    }

    void loadAttemptData();
  }, [attemptId, router]);

  useEffect(() => {
    if (!attemptData?.quiz.timeLimitMinutes) {
      const resetTimerId = window.setTimeout(
        () => setRemainingSeconds(null),
        0,
      );

      return () => window.clearTimeout(resetTimerId);
    }

    const expiredAt =
      new Date(attemptData.attempt.startedAt).getTime() +
      attemptData.quiz.timeLimitMinutes * 60 * 1000;

    function updateRemainingTime() {
      setRemainingSeconds(
        Math.max(
          0,
          Math.ceil((expiredAt - Date.now()) / 1000),
        ),
      );
    }

    updateRemainingTime();

    const timerId = window.setInterval(
      updateRemainingTime,
      1000,
    );

    return () => window.clearInterval(timerId);
  }, [attemptData]);

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers],
  );

  function handleSelectAnswer(
    questionId: number,
    choiceId: number,
  ) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: choiceId,
    }));
  }

  const submitQuiz = useCallback(async () => {
    if (!attemptData || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const result = await apiFetch<QuizResult>(
        `/quiz-attempts/${attemptId}/submit`,
        {
          method: 'POST',
          body: JSON.stringify({
            answers: Object.entries(answers).map(
              ([questionId, selectedChoiceId]) => ({
                questionId: Number(questionId),
                selectedChoiceId,
              }),
            ),
          }),
        },
      );

      sessionStorage.removeItem(
        `quiz-attempt-${attemptId}`,
      );

      sessionStorage.setItem(
        `quiz-result-${attemptId}`,
        JSON.stringify(result),
      );

      router.replace(
        `/quiz-attempts/${attemptId}/result`,
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Unable to submit quiz',
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, attemptData, attemptId, isSubmitting, router]);

  function handleSubmit() {
    if (!attemptData || isSubmitting) {
      return;
    }

    const unansweredCount =
      attemptData.quiz.questions.length -
      answeredCount;

    const shouldSubmit =
      unansweredCount === 0 ||
      window.confirm(
        `You still have ${unansweredCount} unanswered question(s). Submit anyway?`,
      );

    if (shouldSubmit) {
      void submitQuiz();
    }
  }

  useEffect(() => {
    if (
      remainingSeconds !== 0 ||
      !attemptData ||
      isSubmitting ||
      hasAutoSubmitted.current
    ) {
      return;
    }

    hasAutoSubmitted.current = true;
    void submitQuiz();
  }, [attemptData, isSubmitting, remainingSeconds, submitQuiz]);

  const isTimeExpired = remainingSeconds === 0;

  if (!attemptData) {
    return (
      <AuthGuard allowedRoles={['student']}>
        <main className="flex min-h-screen items-center justify-center bg-base-200">
          <span className="loading loading-spinner loading-lg" />
        </main>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['student']}>
      <div className="min-h-screen bg-base-200">
        <AppNavbar
          title="Educational Quiz System"
          showStudentMenu
          sticky
        />

        <main className="mx-auto max-w-4xl px-4 py-6 sm:p-6">
          <div className="mb-6 card border border-base-300 bg-base-100 shadow">
            <div className="card-body min-w-0 p-4 sm:p-6">
              <h1 className="break-words text-2xl font-bold sm:text-3xl">
                {attemptData.quiz.title}
              </h1>

              <div className="flex flex-wrap gap-3">
                <span className="badge badge-outline">
                  {attemptData.quiz.questions.length}{' '}
                  questions
                </span>

                <span
                  className={`badge ${
                    remainingSeconds !== null && remainingSeconds <= 60
                      ? 'badge-error'
                      : 'badge-outline'
                  }`}
                >
                  {remainingSeconds !== null
                    ? `Time left ${formatRemainingTime(remainingSeconds)}`
                    : 'No time limit'}
                </span>

                <span className="badge badge-outline">
                  Answered {answeredCount}/
                  {attemptData.quiz.questions.length}
                </span>
              </div>
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="alert alert-error mb-6"
            >
              <span>{errorMessage}</span>
            </div>
          )}

          {isTimeExpired && isSubmitting && (
            <div role="status" className="alert alert-warning mb-6">
              <span>
                Time is up. Your answers are being submitted automatically.
              </span>
            </div>
          )}

          <div className="space-y-6">
            {attemptData.quiz.questions.map(
              (question, questionIndex) => (
                <section
                  key={question.id}
                  className="card min-w-0 border border-base-300 bg-base-100 shadow"
                >
                  <div className="card-body min-w-0 p-4 sm:p-6">
                    <div className="flex items-start gap-3">
                      <span className="badge badge-primary badge-lg">
                        {questionIndex + 1}
                      </span>

                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-bold">
                          {question.questionText}
                        </h2>

                        <p className="mt-1 text-sm text-base-content/60">
                          {Number(question.score)} point(s)
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      {question.choices.map(
                        (choice, choiceIndex) => (
                          <label
                            key={choice.id}
                            className={`flex min-w-0 items-start gap-3 rounded-box border border-base-300 p-3 transition sm:items-center sm:p-4 ${
                              isTimeExpired || isSubmitting
                                ? 'cursor-not-allowed opacity-70'
                                : 'cursor-pointer hover:bg-base-200'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={choice.id}
                              checked={
                                answers[question.id] ===
                                choice.id
                              }
                              onChange={() =>
                                handleSelectAnswer(
                                  question.id,
                                  choice.id,
                                )
                              }
                              disabled={isTimeExpired || isSubmitting}
                              className="radio radio-primary"
                            />

                            <span className="font-medium">
                              {String.fromCharCode(
                                65 + choiceIndex,
                              )}
                              .
                            </span>

                            <span className="min-w-0 break-words">
                              {choice.choiceText}
                            </span>
                          </label>
                        ),
                      )}
                    </div>
                  </div>
                </section>
              ),
            )}
          </div>

          <div className="sticky bottom-4 mt-8">
            <div className="card border border-base-300 bg-base-100 shadow-xl">
              <div className="card-body flex-col items-stretch justify-between gap-3 p-4 sm:flex-row sm:items-center sm:p-6">
                <span>
                  Answered {answeredCount} of{' '}
                  {attemptData.quiz.questions.length}
                </span>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || isTimeExpired}
                  className="btn btn-primary w-full sm:w-auto"
                >
                  {isSubmitting && (
                    <span className="loading loading-spinner loading-sm" />
                  )}

                  {isSubmitting
                    ? 'Submitting...'
                    : isTimeExpired
                      ? 'Time expired'
                      : 'Submit Quiz'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
