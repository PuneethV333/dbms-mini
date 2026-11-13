import { ApiError } from "./errors";
import { fail } from "./http";

export async function apiHandler(work: () => Promise<Response>): Promise<Response> {
  try {
    return await work();
  } catch (error) {
    if (error instanceof ApiError) return fail(error.status, error.message);
    console.error("[api]", error);
    return fail(500, "Internal server error.");
  }
}
