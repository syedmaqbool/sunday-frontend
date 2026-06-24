import type { ErrorResponse } from "@/types/response.type";
import ky, { BeforeErrorState, HTTPError } from "ky";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

async function normalizeError({ request, options, error }: BeforeErrorState) {
  if (error instanceof HTTPError) {
    const body = await error.response.json<ErrorResponse>().catch(() => null);
    error.message = body?.message ?? `Request failed: ${error.response.status}`;
  }

  return error;
}

const base = ky.create({
  hooks: {
    beforeError: [normalizeError],
  },
  timeout: 90_000,
});

export default base;
