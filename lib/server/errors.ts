export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string | string[]) {
    super(Array.isArray(message) ? message.join(", ") : message);
    this.status = status;
  }
}

export function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: string }).code === "P2002"
  );
}
