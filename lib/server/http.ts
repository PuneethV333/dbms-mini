import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

/** Consistent error envelope: { message: string | string[] }. */
export function fail(status: number, message: string | string[], headers?: HeadersInit) {
  return NextResponse.json({ message }, { status, headers });
}

export function json<T>(data: T, status = 200, headers?: HeadersInit) {
  return NextResponse.json(data, { status, headers });
}

export function zodMessage(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join(".");
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

type ParseResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

export async function parseBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<ParseResult<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { ok: false, response: fail(400, "Invalid JSON body.") };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return { ok: false, response: fail(400, zodMessage(result.error)) };
  }
  return { ok: true, data: result.data };
}

export function parseQuery<T>(url: URL, schema: ZodType<T>): ParseResult<T> {
  const raw = Object.fromEntries(url.searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, response: fail(400, zodMessage(result.error)) };
  }
  return { ok: true, data: result.data };
}
