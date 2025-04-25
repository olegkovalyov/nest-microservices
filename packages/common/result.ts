export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export function success<T>(value: T): Result<T> {
  return { success: true, value };
}

export function failure<E extends Error>(error: E): Result<never, E> {
  return { success: false, error };
}

export function hasError<T, E>(result: Result<T, E>): boolean {
  return !result.success;
}

export function value<T, E>(result: Result<T, E>): T {
  if (!result.success) {
    throw new Error(`Result is an error: ${result.error}`);
  }
  return result.value;
}
