'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { LoginResponse } from '@/types/auth';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await apiFetch<LoginResponse>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email,
            password,
          }),
        },
      );

      if (result.user.role.name === 'admin') {
        router.push('/admin');
      } else {
        router.push('/quizzes');
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to login',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="hero min-h-screen bg-base-200 px-4">
      <div className="hero-content w-full max-w-md">
        <div className="card w-full border-2 border-base-300 bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="mb-4 text-center">
              <h1 className="text-3xl font-bold">
                Education Quiz System
              </h1>

              <p className="mt-2 text-base-content/70">
                Sign in to continue
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  Email
                </legend>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  autoComplete="email"
                  placeholder="student@example.com"
                  className="input input-bordered w-full"
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  Password
                </legend>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="input input-bordered w-full"
                />
              </fieldset>

              {errorMessage && (
                <div role="alert" className="alert alert-error">
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading && (
                  <span className="loading loading-spinner loading-sm" />
                )}

                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}