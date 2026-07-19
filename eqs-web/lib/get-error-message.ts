export function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
) {
  return error instanceof Error &&
    error.message.trim()
    ? error.message
    : fallbackMessage;
}