import axios from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = (error.response?.data as { message?: string | string[] } | undefined)?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (message) return message;
    if (error.response?.status === 429) return "Too many requests — try again shortly.";
    return error.message || "Request failed.";
  }
  if (error instanceof Error) return error.message;
  return "Request failed.";
}
