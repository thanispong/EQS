const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3000';

interface ApiErrorResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}

function getApiErrorMessage(
  errorData: ApiErrorResponse | null,
  fallbackMessage: string,
) {
  if (!errorData?.message) {
    return fallbackMessage;
  }

  if (Array.isArray(errorData.message)) {
    return errorData.message.join(', ');
  }

  return errorData.message;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;

    try {
      errorData =
        (await response.json()) as ApiErrorResponse;
    } catch {
      // Response อาจไม่มี JSON body
    }

    const fallbackMessage = `Request failed with status ${response.status}`;

    throw new Error(
      getApiErrorMessage(
        errorData,
        fallbackMessage,
      ),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}