export type ApiFieldError = { field: string; code: string; message: string };
type ApiErrorBody = { code?: string; message?: string; errors?: ApiFieldError[] };
type RequestOptions = RequestInit & { auth?: boolean; retryAfterReissue?: boolean };

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public errors: ApiFieldError[] = []) {
    super(message);
    this.name = "ApiError";
  }
}

let accessToken: string | null = null;
let reissueRequest: Promise<string> | null = null;

export const setAccessToken = (token: string | null) => { accessToken = token; };
export const getAccessToken = () => accessToken;

const parseError = async (response: Response) => {
  const body = await response.json().catch(() => ({})) as ApiErrorBody;
  return new ApiError(response.status, body.code ?? "UNKNOWN_ERROR", body.message ?? "요청을 처리하지 못했습니다.", Array.isArray(body.errors) ? body.errors : []);
};

const reissue = async () => {
  if (!reissueRequest) {
    reissueRequest = fetch("/auth/reissue", { method: "POST", credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw await parseError(response);
        const body = await response.json() as { accessToken: string };
        accessToken = body.accessToken;
        return body.accessToken;
      })
      .catch((error) => {
        accessToken = null;
        throw error;
      })
      .finally(() => { reissueRequest = null; });
  }
  return reissueRequest;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, retryAfterReissue = true, headers, ...init } = options;
  let token = accessToken;
  if (auth && !token) token = await reissue();

  const requestHeaders = new Headers(headers);
  if (init.body && !requestHeaders.has("Content-Type")) requestHeaders.set("Content-Type", "application/json");
  if (auth && token) requestHeaders.set("Authorization", `Bearer ${token}`);

  const response = await fetch(path, { ...init, headers: requestHeaders, credentials: "include" });
  if (!response.ok) {
    const error = await parseError(response);
    if (auth && retryAfterReissue && response.status === 401 && error.code === "EXPIRED_TOKEN") {
      await reissue();
      return apiFetch<T>(path, { ...options, retryAfterReissue: false });
    }
    throw error;
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
