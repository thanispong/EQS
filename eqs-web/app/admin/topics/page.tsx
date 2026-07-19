'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth-guard';
import AppNavbar from '@/components/app-navbar';
import { apiFetch } from '@/lib/api';
import type { Subject } from '@/types/subject';
import type {
  CreateTopicPayload,
  Topic,
  UpdateTopicPayload,
} from '@/types/topic';
import { getErrorMessage } from '@/lib/get-error-message';

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>(
    [],
  );

  const [editingTopic, setEditingTopic] =
    useState<Topic | null>(null);

  const [subjectId, setSubjectId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] =
    useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] =
    useState('');
  const [successMessage, setSuccessMessage] =
    useState('');

  const selectedSubjectName =
    subjects.find(
      (subject) => String(subject.id) === subjectId,
    )?.name ?? 'Select subject';

  async function loadTopics() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result =
        await apiFetch<Topic[]>('/topics');

      setTopics(result);
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Unable to load topics',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function initializePage() {
      try {
        const [topicResult, subjectResult] =
          await Promise.all([
            apiFetch<Topic[]>('/topics'),
            apiFetch<Subject[]>('/subjects'),
          ]);

        setTopics(topicResult);
        setSubjects(subjectResult);
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
    setEditingTopic(null);
    setSubjectId('');
    setName('');
    setDescription('');
  }

  function handleEdit(topic: Topic) {
    setEditingTopic(topic);
    setSubjectId(String(topic.subjectId));
    setName(topic.name);
    setDescription(topic.description ?? '');
    setErrorMessage('');
    setSuccessMessage('');
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const parsedSubjectId = Number(subjectId);
    const trimmedName = name.trim();

    if (!parsedSubjectId) {
      setErrorMessage('Subject is required');
      return;
    }

    if (!trimmedName) {
      setErrorMessage('Topic name is required');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (editingTopic) {
        const payload: UpdateTopicPayload = {
          subjectId: parsedSubjectId,
          name: trimmedName,
          description:
            description.trim() || undefined,
        };

        await apiFetch(
          `/topics/${editingTopic.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(payload),
          },
        );

        setSuccessMessage(
          'Topic updated successfully',
        );
      } else {
        const payload: CreateTopicPayload = {
          subjectId: parsedSubjectId,
          name: trimmedName,
          description:
            description.trim() || undefined,
        };

        await apiFetch('/topics', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setSuccessMessage(
          'Topic created successfully',
        );
      }

      resetForm();
      await loadTopics();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Unable to save topic',
        ),
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(topic: Topic) {
    const confirmed = window.confirm(
      `Deactivate "${topic.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await apiFetch(`/topics/${topic.id}`, {
        method: 'DELETE',
      });

      setSuccessMessage(
        'Topic deactivated successfully',
      );

      await loadTopics();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          'Unable to deactivate topic',
        ),
      );
    }
  }

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="min-h-screen bg-base-200">
        <AppNavbar title="EQS Admin" />

        <main className="mx-auto max-w-7xl p-6">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">
                Topic Management
              </h1>

              <p className="mt-2 text-base-content/70">
                Create and manage topics under each
                subject.
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

          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <section className="card min-w-0 h-fit border border-base-300 bg-base-100 shadow">
              <div className="card-body min-w-0">
                <h2 className="card-title">
                  {editingTopic
                    ? 'Edit topic'
                    : 'Add topic'}
                </h2>

                <form
                  onSubmit={handleSubmit}
                  className="min-w-0 space-y-4"
                >
                  <fieldset className="fieldset min-w-0">
                    <legend className="fieldset-legend">
                      Subject
                    </legend>

                    <div className="relative min-w-0 max-w-full">
                      <select
                        value={subjectId}
                        onChange={(event) =>
                          setSubjectId(
                            event.target.value,
                          )
                        }
                        required
                        aria-label="Subject"
                        className="select select-bordered w-full min-w-0 max-w-full text-transparent [&>option]:text-base-content"
                      >
                        <option value="">
                          Select subject
                        </option>

                        {subjects.map((subject) => (
                          <option
                            key={subject.id}
                            value={subject.id}
                          >
                            {subject.name}
                          </option>
                        ))}
                      </select>

                      <span
                        aria-hidden="true"
                        title={selectedSubjectName}
                        className="pointer-events-none absolute inset-y-0 left-4 right-10 flex min-w-0 items-center"
                      >
                        <span className="block min-w-0 truncate">
                          {selectedSubjectName}
                        </span>
                      </span>
                    </div>
                  </fieldset>

                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                      Topic name
                    </legend>

                    <input
                      type="text"
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      required
                      maxLength={150}
                      className="input input-bordered w-full"
                    //   placeholder="Algebra"
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
                      rows={4}
                      className="textarea textarea-bordered w-full"
                    //   placeholder="Topic description"
                    />
                  </fieldset>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="btn btn-primary flex-1"
                    >
                      {isSaving && (
                        <span className="loading loading-spinner loading-sm" />
                      )}

                      {editingTopic
                        ? 'Update'
                        : 'Create'}
                    </button>

                    {editingTopic && (
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

            <section className="card border border-base-300 bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">
                  Topics
                </h2>

                {isLoading ? (
                  <div className="flex min-h-52 items-center justify-center">
                    <span className="loading loading-spinner loading-lg" />
                  </div>
                ) : topics.length === 0 ? (
                  <div className="py-12 text-center text-base-content/60">
                    No topics found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Topic</th>
                          <th>Subject</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th className="text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {topics.map((topic) => (
                          <tr key={topic.id}>
                            <td className="font-semibold">
                              {topic.name}
                            </td>

                            <td>
                              {topic.subject.name}
                            </td>

                            <td>
                              {topic.description || '-'}
                            </td>

                            <td>
                              <span
                                className={`badge ${
                                  topic.isActive
                                    ? 'badge-success'
                                    : 'badge-ghost'
                                }`}
                              >
                                {topic.isActive
                                  ? 'Active'
                                  : 'Inactive'}
                              </span>
                            </td>

                            <td>
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEdit(topic)
                                  }
                                  className="btn btn-outline btn-sm"
                                >
                                  Edit
                                </button>

                                {topic.isActive && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeactivate(
                                        topic,
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
