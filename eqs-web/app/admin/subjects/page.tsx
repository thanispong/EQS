'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import AuthGuard from '@/components/auth-guard';
import AppNavbar from '@/components/app-navbar';
import { apiFetch } from '@/lib/api';
import type {
  CreateSubjectPayload,
  Subject,
  UpdateSubjectPayload,
} from '@/types/subject';

export default function AdminSubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [editingSubject, setEditingSubject] =
    useState<Subject | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] =
    useState('');

  async function loadSubjects() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const result =
        await apiFetch<Subject[]>('/subjects');

      setSubjects(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load subjects',
      );
    } finally {
      setIsLoading(false);
    }
  }

    useEffect(() => {
    async function initializeSubjects() {
        try {
        const result =
            await apiFetch<Subject[]>('/subjects');

        setSubjects(result);
        } catch (error) {
        setErrorMessage(
            error instanceof Error
            ? error.message
            : 'Unable to load subjects',
        );
        } finally {
        setIsLoading(false);
        }
    }

    void initializeSubjects();
    }, []);

  function resetForm() {
    setEditingSubject(null);
    setName('');
    setDescription('');
  }

  function handleEdit(subject: Subject) {
    setEditingSubject(subject);
    setName(subject.name);
    setDescription(subject.description ?? '');
    setErrorMessage('');
    setSuccessMessage('');
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrorMessage('Subject name is required');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (editingSubject) {
        const payload: UpdateSubjectPayload = {
          name: trimmedName,
          description:
            description.trim() || undefined,
        };

        await apiFetch(
          `/subjects/${editingSubject.id}`,
          {
            method: 'PATCH',
            body: JSON.stringify(payload),
          },
        );

        setSuccessMessage(
          'Subject updated successfully',
        );
      } else {
        const payload: CreateSubjectPayload = {
          name: trimmedName,
          description:
            description.trim() || undefined,
        };

        await apiFetch('/subjects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        setSuccessMessage(
          'Subject created successfully',
        );
      }

      resetForm();
      await loadSubjects();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save subject',
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeactivate(subject: Subject) {
    const confirmed = window.confirm(
      `Deactivate "${subject.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      await apiFetch(`/subjects/${subject.id}`, {
        method: 'DELETE',
      });

      setSuccessMessage(
        'Subject deactivated successfully',
      );

      await loadSubjects();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to deactivate subject',
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
                Subject Management
              </h1>

              <p className="mt-2 text-base-content/70">
                Create and manage quiz subjects.
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
            <section className="card h-fit border border-base-300 bg-base-100 shadow">
              <div className="card-body">
                <h2 className="card-title">
                  {editingSubject
                    ? 'Edit subject'
                    : 'Add subject'}
                </h2>

                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">
                      Subject name
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
                    //   placeholder="Mathematics"
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
                    //   placeholder="Subject description"
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

                      {editingSubject
                        ? 'Update'
                        : 'Create'}
                    </button>

                    {editingSubject && (
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
                  Subjects
                </h2>

                {isLoading ? (
                  <div className="flex min-h-52 items-center justify-center">
                    <span className="loading loading-spinner loading-lg" />
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="py-12 text-center text-base-content/60">
                    No subjects found
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th className="text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {subjects.map((subject) => (
                          <tr key={subject.id}>
                            <td className="font-semibold">
                              {subject.name}
                            </td>

                            <td>
                              {subject.description ||
                                '-'}
                            </td>

                            <td>
                              <span
                                className={`badge ${
                                  subject.isActive
                                    ? 'badge-success'
                                    : 'badge-ghost'
                                }`}
                              >
                                {subject.isActive
                                  ? 'Active'
                                  : 'Inactive'}
                              </span>
                            </td>

                            <td>
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEdit(subject)
                                  }
                                  className="btn btn-outline btn-sm"
                                >
                                  Edit
                                </button>

                                {subject.isActive && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeactivate(
                                        subject,
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