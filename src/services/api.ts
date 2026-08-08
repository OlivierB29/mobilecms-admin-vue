type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  headers: Headers;
}

const baseURL = 'http://localhost:8888/mobilecmsapi/v50';

function getStoredToken() {
  if (typeof window === 'undefined') {
    return '';
  }

  const stored = window.localStorage.getItem('currentUser');
  if (!stored) {
    return '';
  }

  try {
    const parsed = JSON.parse(stored) as { token?: string };
    return parsed.token || '';
  } catch {
    return '';
  }
}

function buildUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseURL}${normalizedPath}`;
}

async function request<T = unknown>(method: HttpMethod, path: string, body?: unknown): Promise<ApiResponse<T>> {
  const headers = new Headers();
  headers.set('Accept', 'application/json');

  const token = getStoredToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const hasBody = body !== undefined;
  if (hasBody) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined
  });

  const rawText = await response.text();
  let data: T | null = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText) as T;
    } catch {
      data = rawText as T;
    }
  }

  if (!response.ok) {
    const message = typeof data === 'string' ? data : (data as { message?: string } | null)?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return {
    data: data as T,
    status: response.status,
    headers: response.headers
  };
}

const api = {
  get<T = unknown>(path: string) {
    return request<T>('GET', path);
  },
  post<T = unknown>(path: string, body?: unknown) {
    return request<T>('POST', path, body);
  },
  put<T = unknown>(path: string, body?: unknown) {
    return request<T>('PUT', path, body);
  },
  patch<T = unknown>(path: string, body?: unknown) {
    return request<T>('PATCH', path, body);
  },
  delete<T = unknown>(path: string) {
    return request<T>('DELETE', path);
  }
};

export default api;
