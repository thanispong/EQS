'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';
import Link from 'next/link';
import AppNavbar from '@/components/app-navbar';
import AuthGuard from '@/components/auth-guard';
import { apiFetch } from '@/lib/api';
import type { Topic } from '@/types/topic';
import type {
  AdminQuiz,
  CreateQuizPayload,
  UpdateQuizPayload,
} from '@/types/admin-quiz';
import { getErrorMessage } from '@/lib/get-error-message';

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<AdminQuiz[]>(
    [],
  );

  const [topics, setTopics] = useState<Topic[]>([]);

  const [editingQuiz, setEditingQuiz] =
    useState<AdminQuiz | null>(null);

  const [topicId, setTopicId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] =
    useState('');
  const [passingPercentage, setPassingPercentage] =
    useState('60');
  const [timeLimitMinutes, setTimeLimitMinutes] =
    useState('');
  // const [isShowAnswer, setIsShowAnswer] =
  //   useState(true);
  const isShowAnswer = false;
  const [status, setStatus] = useState<
    'draft' | 'published'
  >('draft');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState('');
  const [successMessage, setSuccessMessage] =
    useState('');

  const selectedTopic = topics.find(
    (topic) => String(topic.id) === topicId,
  );
  const selectedTopicName = selectedTopic
    ? `${selectedTopic.subject.name} — ${selectedTopic.name}`
    : 'Select topic';

  async function loadQuizzes() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result =
        await apiFetch<AdminQuiz[]>('/quizzes');

      setQuizzes(result);
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

  useEffect(() => {
    async function initializePage() {
      try {
        const [quizResult, topicResult] =
          await Promise.all([
            apiFetch<AdminQuiz[]>('/quizzes'),
            apiFetch<Topic[]>('/topics'),
          ]);

        setQuizzes(quizResult);
        setTopics(topicResult);
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
    setEditingQuiz(null);
    setTopicId('');
    setTitle('');
    setDescription('');
    setPassingPercentage('60');
    setTimeLimitMinutes('');
    // setIsShowAnswer(true);
    setStatus('draft');
  }

  function handleEdit(quiz: AdminQuiz) {
    setEditingQuiz(quiz);
    setTopicId(String(quiz.topicId));
    setTitle(quiz.title);
    setDescription(quiz.description ?? '');
    setPassingPercentage(
      String(quiz.passingPercentage),
    );
    setTimeLimitMinutes(
      quiz.timeLimitMinutes
        ? String(quiz.timeLimitMinutes)
        : '',
    );
    // setIsShowAnswer(quiz.isShowAnswer);
    setStatus(quiz.status);
    setErrorMessage('');
    setSuccessMessage('');
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const parsedTopicId = Number(topicId);
    const parsedPassingPercentage = Number(
      passingPercentage,
    );

    const parsedTimeLimit = timeLimitMinutes
      ? Number(timeLimitMinutes)
      : undefined;

    if (!parsedTopicId) {
      setErrorMessage('Topic is required');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Quiz title is required');
      return;
    }

    if (
      parsedPassingPercentage < 0 ||
      parsedPassingPercentage > 100
    ) {
      setErrorMessage(
        'Passing percentage must be between 0 and 100',
      );
      return;
    }

    if (
      parsedTimeLimit !== undefined &&
      parsedTimeLimit < 1
    ) {
      setErrorMessage(
        'Time limit must be at least 1 minute',
      );
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (editingQuiz) {
        const payload: UpdateQuizPayload = {
          topicId: parsedTopicId,
          title: title.trim(),
          description:
            description.trim() || undefined,
          passingPercentage:
            parsedPassingPercentage,
          timeLimitMinutes:
            parsedTimeLimit ?? null,
          isShowAnswer,
          status,
        };

        await apiFetch(
          `/quizzes/${editingQuiz.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(payload),
          },
        );

        setSuccessMessage(
          'Quiz updated successfully',
        );
      } else {
        const payload: CreateQuizPayload = {
          topicId: parsedTopicId,
          title: title.trim(),
          description:
            description.trim() || undefined,
          passingPercentage:
            parsedPassingPercentage,
          timeLimitMinutes: parsedTimeLimit,
          isShowAnswer,
          status,
        };

        await apiFetch('/quizzes', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setSuccessMessage(
          'Quiz created successfully',
        );
      }

      resetForm();
      await loadQuizzes();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Unable to save quiz',
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(quiz: AdminQuiz) {
    const confirmed = window.confirm(
      `Deactivate "${quiz.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await apiFetch(`/quizzes/${quiz.id}`, {
        method: 'DELETE',
      });

      setSuccessMessage(
        'Quiz deactivated successfully',
      );

      await loadQuizzes();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Unable to deactivate quiz',
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
                Quiz Management
              </h1>

              <p className="mt-2 text-base-content/70">
                Create and manage quizzes.
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
            <div className="alert alert-error mb-6">
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert alert-success mb-6">
              <span>{successMessage}</span>
            </div>
          )}

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[400px_1fr]">
            <section className="card min-w-0 h-fit border border-base-300 bg-base-100 shadow">
              <div className="card-body min-w-0 p-4 sm:p-6">
                <h2 className="card-title">
                  {editingQuiz
                    ? 'Edit quiz'
                    : 'Add quiz'}
                </h2>

                <form
                  onSubmit={handleSubmit}
                  className="min-w-0 space-y-4"
                >
                  <fieldset className="fieldset min-w-0">
                    <legend className="fieldset-legend">
                      Topic
                    </legend>

                    <div className="relative min-w-0 max-w-full">
                      <select
                        value={topicId}
                        onChange={(event) =>
                          setTopicId(event.target.value)
                        }
                        required
                        aria-label="Topic"
                        className="select select-bordered w-full min-w-0 max-w-full text-transparent [&>option]:text-base-content"
                      >
                        <option value="">
                          Select topic
                        </option>

                        {topics.map((topic) => (
                          <option
                            key={topic.id}
                            value={topic.id}
                          >
                            {topic.subject.name} —{' '}
                            {topic.name}
                          </option>
                        ))}
                      </select>

                      <span
                        aria-hidden="true"
                        title={selectedTopicName}
                        className="pointer-events-none absolute inset-y-0 left-4 right-10 flex min-w-0 items-center"
                      >
                        <span className="block min-w-0 truncate">
                          {selectedTopicName}
                        </span>
                      </span>
                    </div>
                  </fieldset>

                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                      Quiz title
                    </legend>

                    <input
                      type="text"
                      value={title}
                      onChange={(event) =>
                        setTitle(event.target.value)
                      }
                      required
                      maxLength={200}
                      className="input input-bordered w-full"
                      placeholder="Basic Algebra Quiz"
                    />
                  </fieldset>

                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                      Description
                    </legend>

                    <textarea
                      value={description}
                      onChange={(event) =>
                        setDescription(
                          event.target.value,
                        )
                      }
                      rows={3}
                      className="textarea textarea-bordered w-full"
                    />
                  </fieldset>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">
                        Passing %
                      </legend>

                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={passingPercentage}
                        onChange={(event) =>
                          setPassingPercentage(
                            event.target.value,
                          )
                        }
                        required
                        className="input input-bordered w-full"
                      />
                    </fieldset>

                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">
                        Time limit
                      </legend>

                      <input
                        type="number"
                        min={1}
                        value={timeLimitMinutes}
                        onChange={(event) =>
                          setTimeLimitMinutes(
                            event.target.value,
                          )
                        }
                        className="input input-bordered w-full"
                        placeholder="Minutes"
                      />
                    </fieldset>
                  </div>

                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                      Status
                    </legend>

                    <select
                      value={status}
                      onChange={(event) =>
                        setStatus(
                          event.target.value as
                            | 'draft'
                            | 'published',
                        )
                      }
                      className="select select-bordered w-full"
                    >
                      <option value="draft">
                        Draft
                      </option>
                      <option value="published">
                        Published
                      </option>
                    </select>
                  </fieldset>

                  {/* <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      checked={isShowAnswer}
                      onChange={(event) =>
                        setIsShowAnswer(
                          event.target.checked,
                        )
                      }
                      className="checkbox checkbox-primary"
                    />

                    <span className="label-text">
                      Show answers after submission
                    </span>
                  </label> */}

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="btn btn-primary flex-1"
                    >
                      {isSaving && (
                        <span className="loading loading-spinner loading-sm" />
                      )}

                      {editingQuiz
                        ? 'Update'
                        : 'Create'}
                    </button>

                    {editingQuiz && (
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
              </div>
            </section>

            <section className="card min-w-0 border border-base-300 bg-base-100 shadow">
              <div className="card-body min-w-0 p-4 sm:p-6">
                <h2 className="card-title">
                  Quizzes
                </h2>

                {isLoading ? (
                  <div className="flex min-h-52 items-center justify-center">
                    <span className="loading loading-spinner loading-lg" />
                  </div>
                ) : quizzes.length === 0 ? (
                  <div className="py-12 text-center text-base-content/60">
                    No quizzes found
                  </div>
                ) : (
                  <div className="max-w-full overflow-x-auto">
                    <table className="table min-w-[760px]">
                      <thead>
                        <tr>
                          <th>Quiz</th>
                          <th>Subject / Topic</th>
                          <th>Pass</th>
                          <th>Status</th>
                          <th className="text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {quizzes.map((quiz) => (
                          <tr key={quiz.id}>
                            <td>
                              <div className="font-semibold">
                                {quiz.title}
                              </div>

                              <div className="text-xs text-base-content/60">
                                {quiz.timeLimitMinutes
                                  ? `${quiz.timeLimitMinutes} minutes`
                                  : 'No time limit'}
                              </div>
                            </td>

                            <td>
                              <div>
                                {quiz.topic.subject.name}
                              </div>

                              <div className="text-xs text-base-content/60">
                                {quiz.topic.name}
                              </div>
                            </td>

                            <td>
                              {Number(
                                quiz.passingPercentage,
                              )}
                              %
                            </td>

                            <td>
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`badge ${
                                    quiz.status ===
                                    'published'
                                      ? 'badge-success'
                                      : 'badge-warning'
                                  }`}
                                >
                                  {quiz.status}
                                </span>

                                {!quiz.isActive && (
                                  <span className="badge badge-ghost">
                                    inactive
                                  </span>
                                )}
                              </div>
                            </td>

                            <td>
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEdit(quiz)
                                  }
                                  className="btn btn-outline btn-sm"
                                >
                                  Edit
                                </button>

                                {quiz.isActive && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeactivate(
                                        quiz,
                                      )
                                    }
                                    className="btn btn-error btn-outline btn-sm"
                                  >
                                    Deactivate
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
