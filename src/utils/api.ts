/**
 * Centralized API base URL resolver and HTTP helpers for MediMitra.
 * 
 * Supports:
 * - Direct cross-port local development (Frontend http://localhost:5173 -> Backend http://localhost:5000)
 * - Environment variable override: import.meta.env.VITE_API_BASE_URL
 * - Containerized / Same-origin full-stack deployments (relative /api path)
 */

export function getApiBaseUrl(): string {
  const isBrowser = typeof window !== 'undefined' && Boolean(window.location);
  const hostname = isBrowser ? window.location.hostname : '';
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

  // 1. Check explicit environment variable (VITE_API_BASE_URL)
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (envUrl && envUrl.length > 0) {
    // Crucial safeguard: If deployed on a live domain, do NOT call localhost:5000 even if envUrl was accidentally set
    if (!isLocalhost && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
      console.warn(
        `[MediMitra] Deployed on '${window.location.origin}' — ignoring localhost VITE_API_BASE_URL ('${envUrl}'). Calling deployed backend on same origin.`
      );
      return '';
    }
    return envUrl.replace(/\/+$/, '');
  }

  // 2. Local development on Vite dev server (e.g. port 5173) -> Route to local Express backend on port 5000
  if (isBrowser && isLocalhost && window.location.port === '5173') {
    return 'http://localhost:5000';
  }

  // 3. Deployed application (Google AI Studio Cloud Run, production domain, or same-origin container on port 3000):
  // Return empty string so all /api/* requests hit the deployed Express backend on the same origin.
  return '';
}

export function getApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
}

/**
 * Robust fetch wrapper that safely extracts backend JSON or human-readable HTTP errors.
 */
export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ ok: boolean; status: number; data: T }> {
  const url = getApiUrl(endpoint);

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  let res: Response;
  try {
    res = await fetch(url, config);
  } catch (netErr: any) {
    const errorMsg =
      netErr?.message?.includes('Failed to fetch') || netErr?.name === 'TypeError'
        ? `Unable to connect to server at ${url}. Please ensure the backend is running and CORS is configured.`
        : (netErr?.message || 'Network communication error.');
    throw new Error(errorMsg);
  }

  const contentType = res.headers.get('content-type') || '';
  let data: any;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = { message: `Invalid JSON response from server (HTTP ${res.status}).` };
    }
  } else {
    const rawText = await res.text().catch(() => '');
    data = {
      message: `Server returned non-JSON response (HTTP ${res.status} ${res.statusText}).`,
      details: rawText.slice(0, 300),
    };
  }

  return {
    ok: res.ok,
    status: res.status,
    data,
  };
}
