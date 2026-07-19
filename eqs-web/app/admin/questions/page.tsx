'use client';

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';
import Link from 'next/link';
import AppNavbar from '@/components/app-navbar';
import AuthGuard from '@/components/auth-guard';
import { apiFetch } from '@/lib/api';
import type { AdminQuiz } from '@/types/admin-quiz';
import type {
  AdminQuestion,
  CreateQuestionPayload,
  QuestionChoicePayload,
  UpdateQuestionPayload,
} from '@/types/admin-question';
import { getErrorMessage } from '@/lib/get-error-message';

function createEmptyChoices(): QuestionChoicePayload[] {
  return [
    {
      choiceText: '',
      isCorrect: true,
      sortOrder: 1,
    },
    {
      choiceText: '',
      isCorrect: false,
      sortOrder: 2,
    },
  ];
}

export default function AdminQuestionsPage() {
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>(
    [],
  );

  const [questions, setQuestions] = useState<
    AdminQuestion[]
  >([]);

  const [selectedQuizId, setSelectedQuizId] =
    useState('');

  const [editingQuestion, setEditingQuestion] =
    useState<AdminQuestion | null>(null);

  const [questionText, setQuestionText] =
    useState('');
  const [explanation, setExplanation] =
    useState('');
  const [score, setScore] = useState('1');
  const [sortOrder, setSortOrder] = useState('1');

  const [choices, setChoices] = useState<
    QuestionChoicePayload[]
  >(createEmptyChoices);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState('');
  const [successMessage, setSuccessMessage] =
    useState('');

  const selectedQuiz = useMemo(
    () =>
      quizzes.find(
        (quiz) =>
          quiz.id === Number(selectedQuizId),
      ),
    [quizzes, selectedQuizId],
  );

  const selectedQuizName = selectedQuiz
    ? `${selectedQuiz.topic.subject.name} — ${selectedQuiz.topic.name} — ${selectedQuiz.title}`
    : 'Select quiz';

  async function loadQuestions(quizId: number) {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await apiFetch<
        AdminQuestion[]
      >(`/questions?quizId=${quizId}`);

      setQuestions(result);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Unable to load questions',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function initializePage() {
      try {
        const quizResult =
          await apiFetch<AdminQuiz[]>('/quizzes');

        setQuizzes(quizResult);

        if (quizResult.length > 0) {
          const firstQuizId = quizResult[0].id;

          setSelectedQuizId(String(firstQuizId));

          const questionResult = await apiFetch<
            AdminQuestion[]
          >(`/questions?quizId=${firstQuizId}`);

          setQuestions(questionResult);
        }
      } catch (error) {
        setErrorMessage(
          getErrorMessage(
            error,
            'Unable to load page data',
          ),
        );
      } finally {
        setIsLoading(false);
      }
    }

    void initializePage();
  }, []);

  function resetForm() {
    setEditingQuestion(null);
    setQuestionText('');
    setExplanation('');
    setScore('1');
    setSortOrder(
      String(questions.length + 1),
    );
    setChoices(createEmptyChoices());
  }

  async function handleQuizChange(quizId: string) {
    setSelectedQuizId(quizId);
    setEditingQuestion(null);
    setQuestionText('');
    setExplanation('');
    setScore('1');
    setChoices(createEmptyChoices());
    setSuccessMessage('');

    if (!quizId) {
      setQuestions([]);
      setSortOrder('1');
      return;
    }

    await loadQuestions(Number(quizId));
  }

  function handleEdit(question: AdminQuestion) {
    setEditingQuestion(question);
    setQuestionText(question.questionText);
    setExplanation(question.explanation ?? '');
    setScore(String(question.score));
    setSortOrder(String(question.sortOrder));

    setChoices(
      question.choices.map((choice, index) => ({
        choiceText: choice.choiceText,
        isCorrect: choice.isCorrect,
        sortOrder: choice.sortOrder ?? index + 1,
      })),
    );

    setErrorMessage('');
    setSuccessMessage('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  function handleChoiceTextChange(
    index: number,
    value: string,
  ) {
    setChoices((currentChoices) =>
      currentChoices.map((choice, choiceIndex) =>
        choiceIndex === index
          ? {
              ...choice,
              choiceText: value,
            }
          : choice,
      ),
    );
  }

  function handleCorrectChoice(index: number) {
    setChoices((currentChoices) =>
      currentChoices.map((choice, choiceIndex) => ({
        ...choice,
        isCorrect: choiceIndex === index,
      })),
    );
  }

  function handleAddChoice() {
    setChoices((currentChoices) => [
      ...currentChoices,
      {
        choiceText: '',
        isCorrect: false,
        sortOrder: currentChoices.length + 1,
      },
    ]);
  }

  function handleRemoveChoice(index: number) {
    if (choices.length <= 2) {
      setErrorMessage(
        'A question must have at least two choices',
      );
      return;
    }

    setChoices((currentChoices) => {
      const removedChoice = currentChoices[index];

      const nextChoices = currentChoices
        .filter((_, choiceIndex) => choiceIndex !== index)
        .map((choice, choiceIndex) => ({
          ...choice,
          sortOrder: choiceIndex + 1,
        }));

      if (
        removedChoice.isCorrect &&
        nextChoices.length > 0
      ) {
        nextChoices[0] = {
          ...nextChoices[0],
          isCorrect: true,
        };
      }

      return nextChoices;
    });

    setErrorMessage('');
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const quizId = Number(selectedQuizId);
    const parsedScore = Number(score);
    const parsedSortOrder = Number(sortOrder);

    if (!quizId) {
      setErrorMessage('Quiz is required');
      return;
    }

    if (!questionText.trim()) {
      setErrorMessage('Question text is required');
      return;
    }

    if (parsedScore <= 0) {
      setErrorMessage(
        'Question score must be greater than 0',
      );
      return;
    }

    if (parsedSortOrder < 0) {
      setErrorMessage(
        'Sort order cannot be negative',
      );
      return;
    }

    if (choices.length < 2) {
      setErrorMessage(
        'A question must have at least two choices',
      );
      return;
    }

    const normalizedChoices = choices.map(
      (choice, index) => ({
        choiceText: choice.choiceText.trim(),
        isCorrect: choice.isCorrect,
        sortOrder: index + 1,
      }),
    );

    if (
      normalizedChoices.some(
        (choice) => !choice.choiceText,
      )
    ) {
      setErrorMessage(
        'Every choice must contain text',
      );
      return;
    }

    const correctChoiceCount =
      normalizedChoices.filter(
        (choice) => choice.isCorrect,
      ).length;

    if (correctChoiceCount !== 1) {
      setErrorMessage(
        'Exactly one correct choice is required',
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (editingQuestion) {
        const payload: UpdateQuestionPayload = {
          quizId,
          questionText: questionText.trim(),
          explanation:
            explanation.trim() || undefined,
          score: parsedScore,
          sortOrder: parsedSortOrder,
          choices: normalizedChoices,
        };

        await apiFetch(
          `/questions/${editingQuestion.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(payload),
          },
        );

        setSuccessMessage(
          'Question updated successfully',
        );
      } else {
        const payload: CreateQuestionPayload = {
          quizId,
          questionText: questionText.trim(),
          explanation:
            explanation.trim() || undefined,
          score: parsedScore,
          sortOrder: parsedSortOrder,
          choices: normalizedChoices,
        };

        await apiFetch('/questions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setSuccessMessage(
          'Question created successfully',
        );
      }

      await loadQuestions(quizId);
      resetForm();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Unable to save question',
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(
    question: AdminQuestion,
  ) {
    const confirmed = window.confirm(
      `Deactivate this question?\n\n${question.questionText}`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await apiFetch(
        `/questions/${question.id}`,
        {
          method: 'DELETE',
        },
      );

      setSuccessMessage(
        'Question deactivated successfully',
      );

      await loadQuestions(question.quizId);

      if (
        editingQuestion?.id === question.id
      ) {
        resetForm();
      }
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Unable to deactivate question',
        ),
      );
    }
  }

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-base-200">
        <AppNavbar title="EQS Admin" sticky />

        <main className="mx-auto max-w-7xl px-4 py-6 sm:p-6">
          <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Question Management
              </h1>

              <p className="mt-2 text-base-content/70">
                Manage questions and choices for each
                quiz.
              </p>
            </div>

            <Link
              href="/admin"
              className="btn btn-outline btn-sm"
            >
              Back to dashboard
            </Link>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="alert alert-error mb-6"
            >
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              role="alert"
              className="alert alert-success mb-6"
            >
              <span>{successMessage}</span>
            </div>
          )}

          <section className="card mb-6 min-w-0 border border-base-300 bg-base-100 shadow">
            <div className="card-body min-w-0 p-4 sm:p-6">
              <fieldset className="fieldset min-w-0">
                <legend className="fieldset-legend">
                  Select quiz
                </legend>

                <div className="relative w-full min-w-0 max-w-xl">
                  <select
                    value={selectedQuizId}
                    onChange={(event) =>
                      void handleQuizChange(
                        event.target.value,
                      )
                    }
                    aria-label="Select quiz"
                    className="select select-bordered w-full min-w-0 max-w-full text-transparent [&>option]:text-base-content"
                  >
                    <option value="">
                      Select quiz
                    </option>

                    {quizzes.map((quiz) => (
                      <option
                        key={quiz.id}
                        value={quiz.id}
                      >
                        {quiz.topic.subject.name} —{' '}
                        {quiz.topic.name} —{' '}
                        {quiz.title}
                      </option>
                    ))}
                  </select>

                  <span
                    aria-hidden="true"
                    title={selectedQuizName}
                    className="pointer-events-none absolute inset-y-0 left-4 right-10 flex min-w-0 items-center"
                  >
                    <span className="block min-w-0 truncate">
                      {selectedQuizName}
                    </span>
                  </span>
                </div>
              </fieldset>

              {selectedQuiz && (
                <div className="text-sm text-base-content/60">
                  Status: {selectedQuiz.status}
                </div>
              )}
            </div>
          </section>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[430px_1fr]">
            <section className="card h-fit min-w-0 border border-base-300 bg-base-100 shadow">
              <div className="card-body min-w-0 p-4 sm:p-6">
                <h2 className="card-title">
                  {editingQuestion
                    ? 'Edit question'
                    : 'Add question'}
                </h2>

                {!selectedQuizId ? (
                  <p className="text-base-content/60">
                    Select a quiz before adding a
                    question.
                  </p>
                ) : (
                  <form
                    onSubmit={handleSubmit}
                    className="min-w-0 space-y-4"
                  >
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">
                        Question
                      </legend>

                      <textarea
                        value={questionText}
                        onChange={(event) =>
                          setQuestionText(
                            event.target.value,
                          )
                        }
                        required
                        rows={4}
                        className="textarea textarea-bordered w-full"
                        placeholder="Enter question text"
                      />
                    </fieldset>

                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">
                        Explanation
                      </legend>

                      <textarea
                        value={explanation}
                        onChange={(event) =>
                          setExplanation(
                            event.target.value,
                          )
                        }
                        rows={3}
                        className="textarea textarea-bordered w-full"
                        placeholder="Optional explanation"
                      />
                    </fieldset>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <fieldset className="fieldset min-w-0">
                        <legend className="fieldset-legend">
                          Score
                        </legend>

                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={score}
                          onChange={(event) =>
                            setScore(
                              event.target.value,
                            )
                          }
                          required
                          className="input input-bordered w-full"
                        />
                      </fieldset>

                      <fieldset className="fieldset min-w-0">
                        <legend className="fieldset-legend">
                          Sort order
                        </legend>

                        <input
                          type="number"
                          min={0}
                          value={sortOrder}
                          onChange={(event) =>
                            setSortOrder(
                              event.target.value,
                            )
                          }
                          required
                          className="input input-bordered w-full"
                        />
                      </fieldset>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-bold">
                          Choices
                        </h3>

                        <button
                          type="button"
                          onClick={handleAddChoice}
                          className="btn btn-outline btn-xs"
                        >
                          Add choice
                        </button>
                      </div>

                      <div className="space-y-3">
                        {choices.map(
                          (choice, index) => (
                            <div
                              key={index}
                              className="rounded-box border border-base-300 p-3"
                            >
                              <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                                <input
                                  type="radio"
                                  name="correct-choice"
                                  checked={
                                    choice.isCorrect
                                  }
                                  onChange={() =>
                                    handleCorrectChoice(
                                      index,
                                    )
                                  }
                                  className="radio radio-success"
                                />

                                <input
                                  type="text"
                                  value={
                                    choice.choiceText
                                  }
                                  onChange={(event) =>
                                    handleChoiceTextChange(
                                      index,
                                      event.target
                                        .value,
                                    )
                                  }
                                  required
                                  className="input input-bordered min-w-0 flex-[1_1_10rem]"
                                  placeholder={`Choice ${index + 1}`}
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveChoice(
                                      index,
                                    )
                                  }
                                  className="btn btn-error btn-outline btn-sm w-full sm:w-auto"
                                >
                                  Remove
                                </button>
                              </div>

                              {choice.isCorrect && (
                                <p className="mt-2 text-xs text-success">
                                  Correct answer
                                </p>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="btn btn-primary flex-1"
                      >
                        {isSaving && (
                          <span className="loading loading-spinner loading-sm" />
                        )}

                        {editingQuestion
                          ? 'Update'
                          : 'Create'}
                      </button>

                      {editingQuestion && (
                        <button
                          type="button"
                          onClick={resetForm}
                          disabled={isSaving}
                          className="btn btn-ghost"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </section>

            <section className="min-w-0 space-y-4">
              {isLoading ? (
                <div className="card border border-base-300 bg-base-100 shadow">
                  <div className="card-body min-h-52 items-center justify-center">
                    <span className="loading loading-spinner loading-lg" />
                  </div>
                </div>
              ) : !selectedQuizId ? (
                <div className="card border border-base-300 bg-base-100 shadow">
                  <div className="card-body text-center text-base-content/60">
                    Select a quiz to view its questions.
                  </div>
                </div>
              ) : questions.length === 0 ? (
                <div className="card border border-base-300 bg-base-100 shadow">
                  <div className="card-body text-center text-base-content/60">
                    No questions found for this quiz.
                  </div>
                </div>
              ) : (
                questions.map((question, index) => (
                  <article
                    key={question.id}
                    className="card border border-base-300 bg-base-100 shadow"
                  >
                    <div className="card-body min-w-0 p-4 sm:p-6">
                      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                        <div className="flex min-w-0 gap-3">
                          <span className="badge badge-primary badge-lg">
                            {index + 1}
                          </span>

                          <div className="min-w-0">
                            <h2 className="break-words font-bold">
                              {question.questionText}
                            </h2>

                            <p className="mt-1 text-sm text-base-content/60">
                              Score:{' '}
                              {Number(question.score)} |
                              Order:{' '}
                              {question.sortOrder}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(question)
                            }
                            className="btn btn-outline btn-sm"
                          >
                            Edit
                          </button>

                          {question.isActive && (
                            <button
                              type="button"
                              onClick={() =>
                                handleDeactivate(
                                  question,
                                )
                              }
                              className="btn btn-error btn-outline btn-sm"
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {question.choices.map(
                          (choice, choiceIndex) => (
                            <div
                              key={
                                choice.id ??
                                choiceIndex
                              }
                              className={`break-words rounded-box border p-3 ${
                                choice.isCorrect
                                  ? 'border-success bg-success/10'
                                  : 'border-base-300'
                              }`}
                            >
                              <span className="mr-2 font-semibold">
                                {String.fromCharCode(
                                  65 + choiceIndex,
                                )}
                                .
                              </span>

                              {choice.choiceText}

                              {choice.isCorrect && (
                                <span className="badge badge-success badge-sm ml-2">
                                  Correct
                                </span>
                              )}
                            </div>
                          ),
                        )}
                      </div>

                      {question.explanation && (
                        <div className="mt-3 break-words rounded-box bg-base-200 p-3 text-sm">
                          <strong>Explanation:</strong>{' '}
                          {question.explanation}
                        </div>
                      )}
                    </div>
                  </article>
                ))
              )}
            </section>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
