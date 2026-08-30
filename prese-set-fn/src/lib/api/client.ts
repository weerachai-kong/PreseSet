import { ApiError } from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

export function getApiUrl() {
  return API_URL;
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      `เชื่อม API ไม่ได้ (${API_URL}) — เปิด Backend ก่อน: cd prese-set-bn && npm run start:dev`,
      0,
    );
  }

  const data = (await res.json().catch(() => null)) as
    | T
    | { message?: string | string[]; error?: string };

  if (!res.ok) {
    const errBody = data as { message?: string | string[] } | null;
    const msg = errBody?.message ?? res.statusText;
    const text = Array.isArray(msg) ? msg.join(", ") : (msg ?? "Request failed");
    throw new ApiError(text, res.status);
  }

  return data as T;
}
