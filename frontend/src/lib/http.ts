const BASE = import.meta.env.VITE_AUTH_URL;

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function httpClient<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  const body = await res.json();

  if (!res.ok) {
    throw new HttpError(res.status, body.message || "Request failed");
  }

  return body.data as T;
}
